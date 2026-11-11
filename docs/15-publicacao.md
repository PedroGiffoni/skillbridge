# Fase 4 — publicação Render + Vercel (10/11/2026)

Solicitação expressa do usuário: publicar backend no Render e frontend na Vercel. Sem contratação de plano pago. Gemini permanece desativado: modelo e cota gratuita da conta ainda não confirmados. Validação com participantes reais continua pendente.

## Configuração preparada

- Render: web service Python, raiz backend, build pip install -r requirements.txt; start sh start.sh (0.0.0.0, porta PORT, um worker, sem access log). Python 3.13.5 em .python-version; saúde /health. Plano Free sujeito às limitações vigentes e disponibilidade na conta. Sem banco, disco pago ou outros serviços.
- Vercel: projeto na conta Hobby PedroGiffoni's projects, repositório PedroGiffoni/skillbridge, branch main, raiz frontend, preset Vite, build npm run build, saída dist. Só a interface na Vercel.
- VITE_API_BASE_URL: origem HTTPS pública efetiva do backend, sem chave ou caminho. Valor injetado durante build na Vercel; mudar exige redeploy. No desenvolvimento local, vazio preserva proxy Vite. Produção sem URL oferece demo explícita, sem tentar endpoint fictício.
- CORS_ORIGINS: lista JSON com origem efetiva publicada na Vercel, sem wildcard; atualizar no Render após conhecer a URL. Não colocar segredos no frontend.
- GEMINI_FREE_TIER_CONFIRMED=false e ausência de modelo/chave no serviço hospedado mantêm fallback visível, sem chamadas Google. Chave local não deve ser copiada ao frontend, ao Git ou aos registros.
- Timeout do cliente ampliado de 65 para 120 segundos para acomodar início a frio; timeout Gemini no servidor permanece 30 segundos. Cancelamento disponível. Não usar monitor artificial para impedir hibernação do plano gratuito.
- Cabeçalhos da API: Cache-Control: no-store e X-Content-Type-Options: nosniff. Frontend: nosniff, Referrer-Policy e X-Frame-Options: DENY.

## Testes antes de publicar

- Backend: .venv/Scripts/python.exe -m pytest -q: 36 passed, um aviso de depreciação Starlette/httpx.
- Frontend: npm test: 8 passed (inclui endereço HTTPS, produção sem API e URL inválida); npm run lint e npm run build aprovados.
- O build com VITE_API_BASE_URL vazio é intencionalmente capaz de servir demo local e informar que a API hospedada ainda não está configurada.

## Situação de acesso

Consultas de contas via conectores Render/Vercel não responderam e foram encerradas sem mutações. Fallback para painéis web. Vercel autenticada, plano Hobby visível. Login Render inicialmente retornou à tela de acesso; solicitada conclusão do login pelo usuário enquanto a preparação continua. Nenhum deploy será declarado concluído apenas por ter sido iniciado.

## Verificação necessária após deploy

Confirmar status live no Render e Ready na Vercel, commit efetivo, GET /health e /api/config, CORS da URL efetiva, fluxo HTTP demo completo e navegação no navegador. Registrar URLs e resultados reais nesta seção ao obtê-los. Ainda não há URL publicada confirmada neste registro inicial.

## Fontes oficiais verificadas

https://render.com/docs/free.md — plano gratuito tem hibernação, limites e disco efêmero.
https://render.com/docs/compute-plans.md — web service free consta no catálogo atual.
https://render.com/docs/deploys.md e https://render.com/docs/health-checks.md — deploy assíncrono e saúde HTTP.
https://render.com/docs/configure-environment-variables.md — variáveis no serviço, segredos fora do repositório.
https://vercel.com/docs/plans/hobby — conta Hobby; plano observado no painel.

## Arquivos desta rodada

backend/start.sh, backend/.python-version, backend/app/main.py; frontend/.env.example, frontend/vercel.json, frontend/src/vite-env.d.ts, frontend/src/api.ts e api.test.ts; README.md, docs/08-sprints-kanban.md, docs/decisoes.md e este registro. Novos resultados de deploy serão acrescentados sem fabricar evidências.

## Situação após tentativa de publicação

- Configuração revisada enviada ao GitHub no commit 70b8fec (main). 36 testes backend + 8 frontend, lint e build aprovados. npm audit --omit=dev retornou zero vulnerabilidades nas dependências de produção; alertas de ferramentas registrados anteriormente continuam separados.
- Vercel: importação configurada para frontend/Vite no workspace Hobby PedroGiffoni's projects. Ao clicar Deploy, o painel exibiu “Verify Your Identity” e “Use Passkey”. Não houve confirmação de Ready, URL pública ou deploy concluído. Verificação de identidade depende do titular; não foi tentado contorná-la.
- Render: login existente via GitHub chegou à etapa “Signing you in”, sem acesso confirmado ao workspace. Nova navegação voltou ao login; nova tentativa ainda não comprovou sessão autenticada. Não foi criado serviço nem recurso pago.
- Usuário informou estar pelo celular. Publicação fica pendente do acesso às contas; as configurações concretas estão prontas no repositório. Não divulgar URLs estimadas como se estivessem ativas. Continuação: concluir autenticação, criar Render Free com a configuração acima, obter URL real, configurar VITE_API_BASE_URL na Vercel e CORS_ORIGINS no Render, concluir deploy e executar o fluxo HTTP/navegador.
