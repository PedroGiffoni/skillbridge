# Backend SkillBridge

Python 3.13 / FastAPI / Pydantic / google-genai. Instruções completas na raiz README.md.

- GET /health: saúde, sem segredo.
- GET /api/config: booleano gemini_enabled.
- POST /api/questionnaire: profissão 3–100 caracteres, curso opcional até 100, semestre inteiro 1–20, consent=true, demo opcional. Retorna 5–8 competências ou clarification, source_mode, aviso e token assinado.
- POST /api/assessment: token, consent=true, respostas únicas com competency_id, self_level inteiro 0–4 e example opcional até 300; demo opcional. Valida IDs contra questionário assinado, calcula lacunas e obtém narrativa/plano estruturados ou fallback explícito.

Entrada limitada a 32 KiB; resposta Gemini limitada a 24 KiB antes de validação. Arrays e textos limitados, quatro semanas obrigatórias. Erros 409 (token inválido/expirado), 413, 422 e 429 com mensagens sem dados originais. Cliente SDK sem retries automáticos; limite global conservador por minuto, sem guardar IP. Timeout configurável, falha do provedor sem expor mensagem interna.

Sem persistência: nenhuma necessidade atual de SQLite. Segredo e modelo só backend/.env, chave secreta Pydantic SecretStr. A ativação exige também GEMINI_FREE_TIER_CONFIRMED=true. Nenhum nome de modelo ou cota assumido. Não logar requests/prompts/respostas ou habilitar logs HTTP detalhados. Execução recomendada: --no-access-log e uma instância/worker local. Tokens não são criptografados, só assinados, com validade de uma hora; a chave de assinatura é efêmera e reiniciar invalida tokens.

requirements.in lista dependências diretas e faixas; requirements.txt congela o ambiente testado. pytest usa mocks sem chave real ou env do operador. Sem deploy nesta rodada.
