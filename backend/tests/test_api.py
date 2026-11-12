from unittest.mock import AsyncMock, patch
from types import SimpleNamespace
import asyncio

import pytest
from fastapi.testclient import TestClient
from google.genai import errors
from pydantic import SecretStr, ValidationError

from app.config import Settings
from app.demo import competencies, guidance
from app.gemini import Gemini, GenerationFailure
from app.main import calculate, create_app
from app.schemas import AssessmentRequest, Guidance, Questionnaire, QuestionnaireContent
from app.tokens import Tokens


def settings(**kwargs):
    return Settings(_env_file=None, gemini_api_key=SecretStr('test-secret-never-log'),
                    gemini_model='configured-by-test', gemini_free_tier_confirmed=True,
                    gemini_max_requests_per_minute=60, **kwargs)


class Fake:
    def __init__(self, reason=None):
        self.reason = reason
        self.inputs = []

    async def generate(self, instruction, data, schema):
        self.inputs.append(data)
        if self.reason:
            raise GenerationFailure(self.reason)
        if schema is QuestionnaireContent:
            return QuestionnaireContent(competencies=competencies())
        return guidance([SimpleNamespace(**g) for g in data['gaps']])


@pytest.fixture
def client():
    with TestClient(create_app(settings(), Fake())) as client:
        yield client


def questionnaire(client, **kwargs):
    return client.post('/api/questionnaire', json={'profession': 'Designer', 'consent': True, **kwargs})


def assessment_payload(q, **kwargs):
    return {'token': q['token'], 'consent': True,
            'answers': [{'competency_id': c['id'], 'self_level': 1, 'example': ''} for c in q['competencies']], **kwargs}


def test_context_reaches_generator_without_changing_gaps():
    fake = Fake()
    with TestClient(create_app(settings(), fake)) as client:
        q = questionnaire(client).json()
        payload = assessment_payload(q)
        original = client.post('/api/assessment', json=payload).json()
        payload['context'] = {'availability': '  2 horas\n por semana ', 'goal': 'Criar um projeto simples'}
        response = client.post('/api/assessment', json=payload)
        assert response.status_code == 200
        assert response.json()['gaps'] == original['gaps']
        contexts = {row['id']: row for row in fake.inputs[-1]['context']}
        assert len(contexts) == 12
        assert contexts['availability']['answer'] == '2 horas por semana'
        assert contexts['goal']['answer'] == 'Criar um projeto simples'
        assert contexts['experience']['answer'] == ''
        assert contexts['availability']['question']


@pytest.mark.parametrize('context', [{'unknown': 'x'}, {'goal': 'x' * 501}, {'goal': 12}])
def test_rejects_invalid_context(client, context):
    q = questionnaire(client).json()
    response = client.post('/api/assessment', json=assessment_payload(q, context=context))
    assert response.status_code == 422


def test_context_catalog_matches_frontend():
    import json
    from pathlib import Path
    from app.context import CONTEXT_QUESTIONS
    source = (Path(__file__).resolve().parents[2] / 'frontend/src/context.ts').read_text(encoding='utf-8')
    rows = json.loads(source.split(' = ', 1)[1].removesuffix(' as const\n'))
    assert {row['id']: row['question'] for row in rows} == CONTEXT_QUESTIONS


def test_complete_flow_and_no_secret(client):
    assert client.get('/health').json() == {'status': 'ok'}
    assert client.get('/api/config').json() == {'gemini_enabled': True}
    q = questionnaire(client, profession='  Designer   de interfaces  ').json()
    assert q['profession'] == 'Designer de interfaces'
    assert q['source_mode'] == 'gemini'
    payload = assessment_payload(q)
    payload['answers'][0]['self_level'] = 4
    response = client.post('/api/assessment', json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data['gaps'][0]['gap'] == 0
    assert data['gaps'][1]['gap'] == 2
    assert [w['week'] for w in data['weeks']] == [1, 2, 3, 4]
    assert data['source_mode'] == 'gemini'
    assert 'não certificação' in data['limitations'][0]
    assert 'test-secret' not in response.text + str(client.get('/api/config').json())


@pytest.mark.parametrize('data', [
    {'profession': ''}, {'profession': '   '}, {'profession': 'a' * 101},
    {'consent': False}, {'consent': 'true'}, {'semester': 21}, {'semester': 1.2},
    {'course': 'x' * 101}, {'unknown': 'field'},
])
def test_invalid_profile(client, data):
    assert questionnaire(client, **data).status_code == 422


@pytest.mark.parametrize('change', ['duplicate', 'missing', 'unknown', 'scale', 'boolean', 'example', 'consent'])
def test_invalid_answers(client, change):
    q = questionnaire(client).json()
    payload = assessment_payload(q)
    if change == 'duplicate':
        payload['answers'][1] = payload['answers'][0]
    elif change == 'missing':
        payload['answers'].pop()
    elif change == 'unknown':
        payload['answers'][0]['competency_id'] = 'unknown'
    elif change == 'scale':
        payload['answers'][0]['self_level'] = 5
    elif change == 'boolean':
        payload['answers'][0]['self_level'] = True
    elif change == 'example':
        payload['answers'][0]['example'] = 'x' * 301
    else:
        payload['consent'] = False
    assert client.post('/api/assessment', json=payload).status_code == 422


def test_token_tampering_restart_and_expiry(client, monkeypatch):
    q = questionnaire(client).json()
    payload = assessment_payload(q)
    payload['token'] = 'tampered.' + q['token'].split('.')[1]
    assert client.post('/api/assessment', json=payload).status_code == 409
    other = TestClient(create_app(settings(), Fake()))
    assert other.post('/api/assessment', json=assessment_payload(q)).status_code == 409
    import app.tokens
    monkeypatch.setattr(app.tokens.time, 'time', lambda: 99999999999)
    assert client.post('/api/assessment', json=assessment_payload(q)).status_code == 409


@pytest.mark.parametrize('reason', ['timeout', 'quota', 'invalid_response', 'unavailable', 'not_configured'])
def test_explicit_fallback_for_questionnaire_and_diagnosis(reason):
    fake = Fake()
    with TestClient(create_app(settings(), fake)) as client:
        q = questionnaire(client).json()
        fake.reason = reason
        result = client.post('/api/assessment', json=assessment_payload(q)).json()
        assert result['source_mode'] == 'demo'
        assert 'DEMONSTRAÇÃO' in result['notice']
        q = questionnaire(client).json()
        assert q['source_mode'] == 'demo'
        assert 'DEMONSTRAÇÃO' in q['notice']
        count = len(fake.inputs)
        assert client.post('/api/assessment', json=assessment_payload(q)).json()['source_mode'] == 'demo'
        assert len(fake.inputs) == count  # demo questionnaire never becomes AI assessment


def test_absent_configuration_never_calls_sdk():
    app = create_app(Settings(_env_file=None, gemini_api_key='', gemini_model='', gemini_free_tier_confirmed=False))
    with TestClient(app) as client, patch('app.gemini.genai.Client') as sdk:
        assert client.get('/api/config').json() == {'gemini_enabled': False}
        q = questionnaire(client).json()
        assert q['source_mode'] == 'demo'
        assert client.post('/api/assessment', json=assessment_payload(q)).status_code == 200
        sdk.assert_not_called()


def test_explicit_demo_does_not_invoke_generator():
    fake = Fake()
    with TestClient(create_app(settings(), fake)) as client:
        q = questionnaire(client, demo=True).json()
        assert q['source_mode'] == 'demo'
        client.post('/api/assessment', json=assessment_payload(q))
    assert fake.inputs == []


def test_ambiguous_profession_requests_clarification():
    fake = Fake()
    fake.generate = AsyncMock(return_value=QuestionnaireContent(clarification='Qual área você deseja explorar?', competencies=[]))
    with TestClient(create_app(settings(), fake)) as client:
        q = questionnaire(client).json()
        assert q['clarification']
        assert q['competencies'] == []
        assert q['token'] == ''


def test_body_limit_cors_and_rate_limit():
    config = settings()
    config.gemini_max_requests_per_minute = 1
    with TestClient(create_app(config, Fake())) as client:
        assert client.post('/api/questionnaire', content=b'x' * 65537).status_code == 413
        assert questionnaire(client).status_code == 200
        response = questionnaire(client)
        assert response.status_code == 429
        assert response.headers['retry-after'] == '60'
        assert questionnaire(client, demo=True).status_code == 200
        assert client.get('/health', headers={'Origin': 'https://unknown.test'}).headers.get('access-control-allow-origin') is None
        assert client.get('/health', headers={'Origin': 'http://localhost:5173'}).headers['access-control-allow-origin'] == 'http://localhost:5173'


def test_duplicate_ai_competencies_and_bad_weeks_rejected():
    rows = [c.model_dump() for c in competencies()]
    rows[1]['id'] = rows[0]['id']
    with pytest.raises(ValidationError):
        QuestionnaireContent(competencies=rows)
    q = Questionnaire(profession='Designer', source_mode='demo', notice='Demo', competencies=competencies())
    gaps = calculate(q, AssessmentRequest(token='x', answers=[{'competency_id': c.id, 'self_level': 4} for c in q.competencies], consent=True))
    data = guidance(gaps).model_dump()
    data['weeks'][3]['week'] = 2
    with pytest.raises(ValidationError):
        Guidance.model_validate(data)


@pytest.mark.asyncio
@pytest.mark.parametrize('case', ['success', 'timeout', 'quota', 'invalid', 'oversized', 'empty', 'network', 'unexpected'])
async def test_sdk_adapter_without_network(case):
    valid = QuestionnaireContent(competencies=competencies())
    mocked = AsyncMock()
    if case == 'timeout': mocked.side_effect = TimeoutError()
    elif case == 'quota': mocked.side_effect = errors.ClientError(429, {'error': {'message': 'provider secret message'}})
    elif case == 'network': mocked.side_effect = OSError('private network info')
    elif case == 'unexpected': mocked.side_effect = RuntimeError('private info')
    else:
        text = valid.model_dump_json() if case == 'success' else ('x' * 24001 if case == 'oversized' else (None if case == 'empty' else '{}'))
        mocked.return_value = SimpleNamespace(text=text)
    async_client = SimpleNamespace(models=SimpleNamespace(generate_content=mocked))
    context = AsyncMock()
    context.__aenter__.return_value = async_client
    with patch('app.gemini.genai.Client', return_value=SimpleNamespace(aio=context)) as sdk:
        if case == 'success':
            assert await Gemini(settings()).generate('Test', {}, QuestionnaireContent) == valid
            options = sdk.call_args.kwargs['http_options']
            assert options.retry_options.attempts == 1
            assert options.timeout == 30000
        else:
            with pytest.raises(GenerationFailure) as exc:
                await Gemini(settings()).generate('Test', {}, QuestionnaireContent)
            assert exc.value.reason in {'timeout', 'quota', 'invalid_response', 'unavailable'}
            assert 'private' not in str(exc.value)
    assert mocked.await_count == 1
