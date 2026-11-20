from concurrent.futures import ThreadPoolExecutor
from threading import Event
import asyncio

from fastapi.testclient import TestClient

from app.schemas import Guidance

from app.main import create_app
from test_api import Fake, assessment_payload, questionnaire, settings


def sign_in(client, outbox, email):
    assert client.post('/api/auth/email/request', json={'email': email}).status_code == 204
    response = client.post('/api/auth/email/verify', json={'email': email, 'code': outbox[email]})
    assert response.status_code == 200
    return response


def test_guest_can_answer_but_cannot_generate_a_diagnosis():
    fake = Fake()
    with TestClient(create_app(settings(), fake)) as guest:
        q = questionnaire(guest)
        assert q.status_code == 200
        assert guest.post('/api/assessment', json=assessment_payload(q.json())).status_code == 401
        assert guest.get('/api/history').status_code == 401
        assert len(fake.inputs) == 1


def test_saved_history_is_private_reopenable_and_deletable(tmp_path):
    fake = Fake()
    outbox = {}
    config = settings(auth_db_path=tmp_path / 'private.sqlite3')
    app = create_app(config, fake, email_sender=outbox.__setitem__)
    with TestClient(app) as alice, TestClient(app) as bob:
        q = questionnaire(alice).json()
        sign_in(alice, outbox, 'alice@example.com')
        sign_in(bob, outbox, 'bob@example.com')
        payload = assessment_payload(q)
        response = alice.post('/api/assessment', json=payload)
        assert response.status_code == 200
        equivalent = {**payload, 'answers': list(reversed(payload['answers'])), 'context': {'goal': ''}}
        assert alice.post('/api/assessment', json=equivalent).json() == response.json()
        assert len(fake.inputs) == 2
        items = alice.get('/api/history').json()['items']
        assert len(items) == 1
        assert items[0]['profession'] == 'Designer'
        assert items[0]['created_at']
        path = '/api/history/' + items[0]['id']
        assert bob.get('/api/history').json()['items'] == []
        assert bob.get(path).status_code == 404
        assert bob.delete(path).status_code == 404
        assert alice.get(path).json()['assessment'] == response.json()
        assert len(fake.inputs) == 2
        with TestClient(create_app(config, Fake())) as restarted:
            restarted.cookies.update(alice.cookies)
            assert restarted.get(path).json()['assessment'] == response.json()
        assert alice.delete(path).status_code == 204
        assert alice.get(path).status_code == 404
        assert alice.get('/api/history').json()['items'] == []


class BlockingDiagnosis(Fake):
    def __init__(self):
        super().__init__()
        self.started = Event()
        self.resume = Event()

    async def generate(self, instruction, data, schema):
        if schema is Guidance:
            self.started.set()
            await asyncio.to_thread(self.resume.wait, 8)
        return await super().generate(instruction, data, schema)


def test_simultaneous_submit_generates_only_one_diagnosis(tmp_path):
    fake = BlockingDiagnosis()
    outbox = {}
    config = settings(auth_db_path=tmp_path / 'private.sqlite3')
    app = create_app(config, fake, email_sender=outbox.__setitem__)
    with TestClient(app) as first, TestClient(app) as duplicate, ThreadPoolExecutor(1) as tasks:
        payload = assessment_payload(questionnaire(first).json())
        sign_in(first, outbox, 'student@example.com')
        duplicate.cookies.update(first.cookies)
        request = tasks.submit(first.post, '/api/assessment', json=payload)
        try:
            assert fake.started.wait(4)
            assert duplicate.post('/api/assessment', json=payload).status_code == 409
            assert duplicate.get('/api/history').json()['items'] == []
        finally:
            fake.resume.set()
        assert request.result(timeout=5).status_code == 200
        assert len(first.get('/api/history').json()['items']) == 1
        assert len(fake.inputs) == 2
