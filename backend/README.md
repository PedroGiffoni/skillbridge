# Backend SkillBridge

FastAPI, Pydantic, Gemini e SQLite. Consulte [execução local](../README.md#executar-localmente) e [configuração de login](../docs/30-login-historico-perfil.md).

| Rota | Acesso e comportamento |
| --- | --- |
| `GET /health`, `GET /api/config` | Público. Saúde e disponibilidade do Gemini. |
| `POST /api/questionnaire` | Público. Gera oito competências ou solicita esclarecimento. Assina o questionário por uma hora. |
| `GET /api/auth/config`, `GET /api/auth/google/nonce` | Público. Disponibilidade dos métodos e desafio temporário para o Google. |
| `POST /api/auth/email/request`, `POST /api/auth/email/verify` | Solicita e verifica código por e-mail. |
| `POST /api/auth/google`, `POST /api/auth/logout` | Autentica pelo Google ou encerra a sessão. |
| `GET /api/account`, `POST /api/account/profile` | Requer sessão. Consulta e altera o perfil privado. |
| `POST /api/assessment` | Requer sessão, questionário assinado e consentimento. Calcula as lacunas, valida o resultado do Gemini e salva no histórico da conta. |
| `GET /api/history`, `GET/DELETE /api/history/{id}` | Requer sessão. Lista, abre e exclui avaliações da própria conta. |

Solicitações POST são limitadas a 64 KiB. As saídas do Gemini são limitadas e validadas antes de salvar. Os diagnósticos usam autoavaliação orientativa. Falhas de geração permitem nova tentativa, com o rascunho temporário da interface.

Mantenha segredos no backend. Use `--no-access-log` e um worker na configuração atual. Em produção, use HTTPS, `AUTH_COOKIE_SECURE=true`, origens autorizadas explícitas e SQLite em disco durável. Os testes usam armazenamento temporário e substituem somente os serviços externos.
