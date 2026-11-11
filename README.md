# SkillBridge

MVP acadêmico F108/Unifor, prazo 27/11/2026. Frontend React/TypeScript/Vite/Tailwind e backend FastAPI com SDK oficial google-genai. Sem autenticação, banco, analytics ou deploy. Pesquisa com usuários reais ainda não realizada.

## Executar localmente

Requisitos: Python 3.13 e Node 22.12+ com npm (testados: Python 3.13.5, Node 24.11.0). Abra dois terminais a partir da raiz do projeto.

Terminal 1 — API:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
# Execute apenas se .env ainda não existir; não sobrescreva sua chave:
if (!(Test-Path .env)) { Copy-Item .env.example .env }
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log
```

Terminal 2 — interface:

```powershell
cd frontend
npm ci
npm run dev -- --port 5173 --strictPort
```

Abra http://127.0.0.1:5173. Saúde local: http://127.0.0.1:8000/health; contratos OpenAPI: http://127.0.0.1:8000/docs. Ctrl+C encerra cada servidor. O proxy Vite envia /api ao backend local; o navegador nunca chama Gemini diretamente. O build é frontend estático; npm run preview não configura este proxy e não é uma publicação integrada.

## Ativar Gemini

Edite somente backend/.env. Não compartilhe a chave, não use VITE_* para segredos, não versione .env. Sua chave existente não será sobrescrita pelos passos acima.

1. Confirme no projeto correto do Google AI Studio o nível Free e os limites ativos do modelo desejado: https://aistudio.google.com/rate-limit?timeRange=last-28-days. O modelo selecionado no Playground não comprova cota gratuita da API.
2. Preencha GEMINI_API_KEY e GEMINI_MODEL com o identificador exato confirmado. Nenhum modelo padrão foi escolhido pelo projeto.
3. Somente depois de verificar a cota, altere GEMINI_FREE_TIER_CONFIRMED=true. Essa variável registra confirmação do operador; não verifica cobrança automaticamente. Não vincule faturamento para este MVP sem aprovação.
4. Reinicie a API depois de alterar .env (Ctrl+C e comando uvicorn novamente).

GET /api/config informa apenas gemini_enabled, sem revelar chave ou modelo. Se faltar configuração/confirmacão, a API retorna demonstração rotulada e não chama Google. Para usar sem IA e sem depender da API, escolha “Usar demonstração sem IA” no perfil. Cota gratuita e acesso real ainda não confirmados nesta entrega; nenhuma chamada real foi feita.

Variáveis: GEMINI_TIMEOUT_SECONDS (1–60, padrão 30), GEMINI_MAX_REQUESTS_PER_MINUTE (1–60, padrão conservador local 5, não é cota Google), CORS_ORIGINS (lista JSON de origens permitidas). A chave jamais deve ir para frontend/.env.

## Comportamento e privacidade

Perfil e consentimento → 5–8 competências → autoavaliação 0–4 → diagnóstico e trilha de quatro semanas. A API faz duas chamadas Gemini quando habilitada. Referências sugeridas não são padrões verificados de mercado. Lacuna = max(0, esperado - autodeclarado), calculada no backend. Narrativa/trilha são JSON validados por Pydantic; erros, timeout e 429 geram fallback demonstrativo visível. Sem retries automáticos; nova tentativa depende de ação do usuário, limitada pelo backend. Profissão ambígua pode gerar pedido de esclarecimento.

Resultados são orientação educacional por autoavaliação, não certificação, teste de aptidão ou promessa de emprego. IA pode errar; revise recomendações. Demonstração usa competências e plano genéricos; ela nunca é apresentada como análise real do Gemini. Se somente o diagnóstico falhar, as lacunas conservam as referências do questionário anterior e a narrativa/plano passam a demonstração.

Respostas permanecem apenas em memória durante o processamento. O questionário volta ao navegador em token assinado (não criptografado), expira em uma hora e perde validade quando a API reinicia. Não é token de autenticação. Reiniciar avaliação ou recarregar apaga o estado da interface; não há perfil salvo. O token evita alteração de referências/IDs pelo cliente; use uma única instância/worker nesta etapa. Rate limit global por processo guarda só instantes de chamadas, sem IP. Não há necessidade de SQLite agora.

Com IA ativa, profissão, contexto acadêmico opcional, exemplos e níveis autodeclarados são enviados ao Google. Não informe dados pessoais, confidenciais ou sensíveis. No serviço gratuito, entradas/saídas podem ser usadas para melhoria e revisão humana, conforme https://ai.google.dev/gemini-api/terms. A exclusão local não apaga dados já processados pelo provedor. Uso com IA destinado a adultos; pesquisa real deve recrutar participantes maiores de 18 anos. O protótipo não coleta feedback de pesquisa.

## Verificar

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m pip check
```

```powershell
cd frontend
npm test
npm run lint
npm run build
```

Testes usam mocks, sem consumir Gemini ou depender de chave. Os testes backend usam Settings sem .env para impedir chamadas reais. Um teste real exige modelo/cota confirmados e consentimento; não foi executado nesta entrega.

## Estrutura e situação

- backend/app: configurações, schemas, tokens, cálculo, demo, adaptador Gemini e endpoints.
- backend/tests: contratos, segurança de entrada, cálculo e falhas com mocks.
- frontend/src: fluxo, cliente API validado e fallback local explícito.
- docs/13-integracao-gemini.md: alterações, rastreabilidade, testes e pendências desta rodada.
- docs/08-sprints-kanban.md e docs/09-relatorio-f108.md: registros acadêmicos e planejamento.

Fases 2/3 preparadas a pedido de integração; ativação real pendente de confirmar modelo/cota. Sem avanço para publicação/Fase 4. Equipe, brainstorming, ≥10 participantes reais, ≥5 evidências e relatório final permanecem pendentes.

## Publicação Render + Vercel
Configuração e evidências em docs/15-publicacao.md. Backend: raiz backend, Python 3.13.5, build pip install -r requirements.txt, start sh start.sh, health /health. Frontend: raiz frontend, Vite, npm run build, dist. Configure VITE_API_BASE_URL na Vercel com a origem HTTPS efetiva do Render e CORS_ORIGINS no backend com a origem efetiva do frontend. Nenhuma chave no frontend. Após mudar VITE_API_BASE_URL, faça novo build/deploy. Sem URL configurada em produção, a interface orienta usar demo local. Publicação inicialmente em modo demonstração, aguardando modelo/cota Gemini.

## Aplicação publicada — 11/11/2026
Frontend: https://skillbridge-two-rosy.vercel.app
Backend/saúde: https://skillbridge-api-pedrogiffoni.onrender.com/health
Ambos publicados e fluxo completo de demonstração verificado. Use o domínio estável do frontend acima (CORS autorizado). Gemini real ainda desativado; confirmar modelo/cota antes de configurar o segredo somente no backend Render. Evidências, versões e limites em docs/15-publicacao.md. Render Free pode levar mais tempo após inatividade; se a avaliação expirar após reinício da API, gere outro questionário.
