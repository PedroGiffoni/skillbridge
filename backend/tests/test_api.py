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
from app.schemas import Assessment, AssessmentRequest, Competency, Guidance, Questionnaire, QuestionnaireContent
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


@pytest.mark.parametrize('change', ['missing', 'count', 'duplicate_value', 'order', 'boolean', 'short', 'long', 'duplicate_label'])
def test_invalid_contextual_options_rejected(change):
    row = competencies()[0].model_dump()
    if change == 'missing':
        del row['options']
    elif change == 'count':
        row['options'].pop()
    elif change == 'duplicate_value':
        row['options'][1]['value'] = 0
    elif change == 'order':
        row['options'].reverse()
    elif change == 'boolean':
        row['options'][1]['value'] = True
    elif change == 'short':
        row['options'][1]['label'] = 'x'
    elif change == 'long':
        row['options'][1]['label'] = 'x' * 221
    else:
        row['options'][1]['label'] = '  ' + row['options'][0]['label'].upper() + '  '
    with pytest.raises(ValidationError):
        Competency.model_validate(row)


def test_selected_option_is_resolved_from_signed_questionnaire():
    fake = Fake()
    with TestClient(create_app(settings(), fake)) as client:
        q = questionnaire(client).json()
        assert [o['value'] for o in q['competencies'][0]['options']] == [0, 1, 2, 3, 4]
        assert q['competencies'][0]['options'] != q['competencies'][1]['options']
        payload = assessment_payload(q)
        payload['answers'][0]['self_level'] = 4
        result = client.post('/api/assessment', json=payload)
        assert result.status_code == 200
        assert fake.inputs[-1]['answers'][0]['option_label'] == q['competencies'][0]['options'][4]['label']
        assert result.json()['gaps'][0]['gap'] == 0
        payload['answers'][0]['option_label'] = 'Uma descrição inventada pelo cliente'
        assert client.post('/api/assessment', json=payload).status_code == 422


def test_demo_option_catalog_matches_frontend():
    import json
    from pathlib import Path
    from app.demo_options import DEMO_OPTIONS
    source = (Path(__file__).resolve().parents[2] / 'frontend/src/demo-options.ts').read_text(encoding='utf-8')
    rows = json.loads(source.split(' = ', 1)[1].removesuffix(' as const\n'))
    assert rows == DEMO_OPTIONS


@pytest.mark.asyncio
async def test_invalid_ai_options_are_rejected_by_adapter():
    data = QuestionnaireContent(competencies=competencies()).model_dump()
    data['competencies'][0]['options'][1]['value'] = 0
    import json
    context = AsyncMock()
    context.__aenter__.return_value = SimpleNamespace(models=SimpleNamespace(
        generate_content=AsyncMock(return_value=SimpleNamespace(text=json.dumps(data)))))
    with patch('app.gemini.genai.Client', return_value=SimpleNamespace(aio=context)):
        with pytest.raises(GenerationFailure) as failure:
            await Gemini(settings()).generate('Teste', {}, QuestionnaireContent)
        assert failure.value.reason == 'invalid_response'


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


@pytest.mark.parametrize('reason,status', [
    ('timeout', 504), ('quota', 429), ('invalid_response', 502),
    ('unavailable', 503), ('not_configured', 503),
])
def test_ai_failures_return_retryable_errors_without_demo(reason, status):
    fake = Fake()
    with TestClient(create_app(settings(), fake)) as client:
        q = questionnaire(client).json()
        fake.reason = reason
        for response in [client.post('/api/assessment', json=assessment_payload(q)), questionnaire(client)]:
            assert response.status_code == status
            assert response.json() == {
                'detail': response.json()['detail'], 'code': f'gemini_{reason}', 'retryable': True,
            }
            assert response.json()['detail']
            assert 'demonstra' not in response.text.lower()
            assert not {'source_mode', 'token', 'competencies', 'summary', 'gaps', 'weeks'} & response.json().keys()
            if reason == 'quota':
                assert response.headers['retry-after'] == '60'
        # A failure does not consume/invalidate the signed questionnaire or its answers.
        fake.reason = None
        retry = client.post('/api/assessment', json=assessment_payload(q))
        assert retry.status_code == 200
        assert retry.json()['source_mode'] == 'gemini'
        assert retry.json()['gaps'][0]['self_level'] == 1
        assert questionnaire(client).status_code == 200


def test_absent_configuration_never_calls_sdk():
    app = create_app(Settings(_env_file=None, gemini_api_key='', gemini_model='', gemini_free_tier_confirmed=False))
    with TestClient(app) as client, patch('app.gemini.genai.Client') as sdk:
        assert client.get('/api/config').json() == {'gemini_enabled': False}
        response = questionnaire(client)
        assert response.status_code == 503
        assert response.json()['code'] == 'gemini_not_configured'
        assert response.json()['retryable'] is True
        assert 'source_mode' not in response.json()
        sdk.assert_not_called()


@pytest.mark.parametrize('value', [True, False])
def test_removed_demo_request_field_is_rejected(value):
    fake = Fake()
    with TestClient(create_app(settings(), fake)) as client:
        q = questionnaire(client).json()
        count = len(fake.inputs)
        assert questionnaire(client, demo=value).status_code == 422
        assert client.post('/api/assessment', json=assessment_payload(q, demo=value)).status_code == 422
        assert len(fake.inputs) == count


def test_public_contract_only_accepts_gemini_source():
    for mode in ['demo', 'local', '']:
        with pytest.raises(ValidationError):
            Questionnaire(profession='Designer', competencies=competencies(), source_mode=mode, notice='Teste')
        with pytest.raises(ValidationError):
            Assessment(**guidance([]).model_dump(), gaps=[], source_mode=mode, notice='Teste')


def test_oversized_signed_questionnaire_returns_error_instead_of_generic_questions(monkeypatch):
    def cannot_sign(_self, _questionnaire):
        raise ValueError('private token detail')
    monkeypatch.setattr(Tokens, 'sign', cannot_sign)
    with TestClient(create_app(settings(), Fake())) as client:
        response = questionnaire(client)
        assert response.status_code == 502
        assert response.json()['code'] == 'gemini_invalid_response'
        assert 'private' not in response.text
        assert 'competencies' not in response.json()


def test_questionnaire_with_wrong_count_returns_error():
    fake = Fake()
    fake.generate = AsyncMock(return_value=QuestionnaireContent(competencies=competencies()[:5]))
    with TestClient(create_app(settings(), fake)) as client:
        response = questionnaire(client)
        assert response.status_code == 502
        assert response.json()['code'] == 'gemini_invalid_response'


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
        assert response.json()['code'] == 'gemini_quota'
        assert response.json()['retryable'] is True
        assert questionnaire(client, demo=True).status_code == 422
        assert client.get('/health', headers={'Origin': 'https://unknown.test'}).headers.get('access-control-allow-origin') is None
        assert client.get('/health', headers={'Origin': 'http://localhost:5173'}).headers['access-control-allow-origin'] == 'http://localhost:5173'


def test_duplicate_ai_competencies_and_bad_weeks_rejected():
    rows = [c.model_dump() for c in competencies()]
    rows[1]['id'] = rows[0]['id']
    with pytest.raises(ValidationError):
        QuestionnaireContent(competencies=rows)
    q = Questionnaire(profession='Designer', source_mode='gemini', notice='Fixture offline', competencies=competencies())
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
