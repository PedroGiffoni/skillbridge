from collections import deque
from time import monotonic

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from .config import Settings
from .demo import ASSESSMENT_DEMO_NOTICE, DEMO_NOTICE, LIMITATION, competencies, guidance
from .gemini import FAILURES, Gemini, GenerationFailure
from .schemas import Assessment, AssessmentRequest, Gap, Guidance, Profile, Questionnaire, QuestionnaireContent
from .tokens import Tokens


class BodyLimit:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope['type'] != 'http' or scope['method'] != 'POST':
            return await self.app(scope, receive, send)
        body = bytearray()
        while True:
            message = await receive()
            if message['type'] == 'http.disconnect':
                return
            body.extend(message.get('body', b''))
            if len(body) > 32768:
                return await JSONResponse({'detail': 'Solicitação muito grande (máximo 32 KiB).'}, status_code=413)(scope, receive, send)
            if not message.get('more_body', False):
                break
        async def replay():
            return {'type': 'http.request', 'body': bytes(body), 'more_body': False}
        await self.app(scope, replay, send)


def calculate(questionnaire: Questionnaire, request: AssessmentRequest) -> list[Gap]:
    answers = {answer.competency_id: answer for answer in request.answers}
    if set(answers) != {c.id for c in questionnaire.competencies}:
        raise HTTPException(422, 'Responda exatamente uma vez a cada competência do questionário.')
    return [Gap(competency_id=c.id, name=c.name, expected_level=c.expected_level,
                self_level=answers[c.id].self_level,
                gap=max(0, c.expected_level - answers[c.id].self_level)) for c in questionnaire.competencies]


def create_app(settings: Settings | None = None, generator=None) -> FastAPI:
    settings = settings or Settings()
    app = FastAPI(title='SkillBridge API', version='0.3.0')
    app.add_middleware(BodyLimit)
    app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins,
                       allow_methods=['GET', 'POST'], allow_headers=['Content-Type'])
    tokens = Tokens()
    gemini = generator or Gemini(settings)
    calls: deque[float] = deque()

    def limit():
        # Global bound per process: no IP addresses or assessment data stored.
        now = monotonic()
        while calls and now - calls[0] >= 60:
            calls.popleft()
        if len(calls) >= settings.gemini_max_requests_per_minute:
            raise HTTPException(429, 'Limite local de solicitações. Aguarde um minuto ou escolha demonstração.', headers={'Retry-After': '60'})
        calls.append(now)

    @app.exception_handler(RequestValidationError)
    async def invalid_request(_request: Request, _exc: RequestValidationError):
        # Avoid echoing input (examples/profession) or validation internals.
        return JSONResponse({'detail': 'Dados inválidos. Confira profissão (3–100 caracteres), consentimento, limites e respostas (0–4).'}, status_code=422)

    @app.get('/health')
    async def health():
        return {'status': 'ok'}

    @app.get('/api/config')
    async def config():
        return {'gemini_enabled': settings.ready}

    @app.post('/api/questionnaire', response_model=Questionnaire)
    async def questionnaire(request: Profile):
        notice = DEMO_NOTICE
        mode = 'demo'
        content = QuestionnaireContent(competencies=competencies())
        if not request.demo:
            if settings.ready:
                limit()
            try:
                content = await gemini.generate(
                    'Proponha 5–8 competências introdutórias, descrições e perguntas para a profissão. '
                    'Use IDs únicos e níveis estimativos 0–4. Se a profissão estiver ambígua ou não for uma profissão, '
                    'preencha clarification com uma pergunta curta e competencies com lista vazia; caso contrário clarification deve ser vazio.',
                    request.model_dump(exclude={'consent', 'demo'}), QuestionnaireContent,
                )
                mode = 'gemini'
                notice = 'Questionário gerado pelo Gemini. Níveis esperados são estimativas educacionais, não padrões verificados de mercado.'
            except GenerationFailure as exc:
                notice = FAILURES[exc.reason] + ' ' + DEMO_NOTICE
        result = Questionnaire(**content.model_dump(), profession=request.profession, source_mode=mode, notice=notice)
        if not result.clarification:
            try:
                result.token = tokens.sign(result)
            except ValueError:
                result = Questionnaire(profession=request.profession, competencies=competencies(), source_mode='demo',
                                       notice=FAILURES['invalid_response'] + ' ' + DEMO_NOTICE)
                result.token = tokens.sign(result)
        return result

    @app.post('/api/assessment', response_model=Assessment)
    async def assessment(request: AssessmentRequest):
        try:
            questionnaire = tokens.verify(request.token)
        except ValueError as exc:
            raise HTTPException(409, str(exc)) from None
        gaps = calculate(questionnaire, request)
        content = guidance(gaps)
        mode = 'demo'
        notice = ASSESSMENT_DEMO_NOTICE
        if not request.demo and questionnaire.source_mode == 'gemini':
            if settings.ready:
                limit()
            try:
                content = await gemini.generate(
                    'Gere um diagnóstico orientativo baseado apenas na autoavaliação e nas lacunas recebidas. '
                    'Não recalcule nem altere lacunas. Escreva pontos fortes autodeclarados e prioridades, '
                    'e uma trilha realista de exatamente quatro semanas (1,2,3,4), com objetivos, ações e entregáveis. '
                    'Informe limitações da autoavaliação. Não invente experiência ou recursos externos.',
                    {'profession': questionnaire.profession, 'competencies': [c.model_dump() for c in questionnaire.competencies],
                     'answers': [a.model_dump() for a in request.answers], 'gaps': [g.model_dump() for g in gaps]}, Guidance,
                )
                mode = 'gemini'
                notice = 'Orientação gerada pelo Gemini com base na autoavaliação. Lacunas calculadas pelo servidor; níveis esperados são estimativas.'
            except GenerationFailure as exc:
                notice = FAILURES[exc.reason] + ' ' + ASSESSMENT_DEMO_NOTICE
        # Always display a server-owned limitation, even if a model omits it.
        limits = list(dict.fromkeys([LIMITATION, *content.limitations]))[:5]
        return Assessment(**content.model_dump(exclude={'limitations'}), limitations=limits,
                          gaps=gaps, source_mode=mode, notice=notice)

    return app


app = create_app()
