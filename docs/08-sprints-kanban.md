# Planejamento de sprints — janela curta até 27/11/2026

## Sprint 1 — 11 a 14/11
Problema ODS 8, brainstorming real, requisitos, escopo MVP, critérios de aceitação, protótipos de baixa fidelidade. Evidências: atas e prints do quadro.

## Sprint 2 — 15 a 19/11
Front-end, API, Gemini, fluxo completo, estados de erro e testes técnicos. Evidências: commits, capturas, quadro.

## Sprint 3 — 20 a 24/11
Testes com ≥10 usuários, coleta anônima, correções priorizadas, gráficos e interpretação. Evidências: formulários, logs de sessão anônimos, quadro.

## Finalização — 25 a 26/11
Relatório, anexos, revisão e preenchimento Dream Shape. Entrega em 27/11.

## Kanban
Backlog | A fazer | Em andamento | Em revisão | Concluído. Cada cartão: ID, descrição, responsável, sprint, critério de aceite, link da evidência. Fotografar/exportar quadro em cada sprint; não criar retrospectivas fictícias.

## Registro real — 10/11/2026
Preparação antecipada das Fases 0 e 1: auditoria, backlog SB01–SB11 e protótipo técnico. SB01–SB05 em revisão; SB06 parcial; SB07–SB10 no backlog; SB11 em andamento. Responsável técnico: Codex; validação: equipe. Ver docs/11-auditoria-plano.md e docs/12-verificacao-fase-1.md. Não houve reunião, retrospectiva ou teste com usuários registrado. Datas das sprints acima permanecem planejamento.

## Registro real — integração solicitada em 10/11/2026
Usuário aprovou visual do protótipo e pediu Gemini. SB07 (base API) pronto para revisão, SB08 (adaptador e frontend) preparado com mocks; ativação real pendente de modelo/cota confirmados. SB04/SB05 verificados por testes adicionais; SB06 permanece parcial. SB11 atualizado. Evidência técnica: docs/13-integracao-gemini.md. Nenhuma coleta real com usuários, reunião, retrospectiva ou publicação nesta rodada.

## Versionamento — 10/11/2026
A pedido do usuário, repositório privado PedroGiffoni/skillbridge criado e preparado para o primeiro envio em main. SB11: documentação e versionamento técnico em revisão. Evidências do envio: docs/14-repositorio-github.md e histórico real do GitHub. Testes com usuários e publicação da aplicação continuam pendentes.

## Publicação autorizada — 10/11/2026
SB09 em andamento: preparação Render/Vercel, 36 testes backend + 8 frontend aprovados, lint/build aprovados. Acesso Render pendente de login no registro inicial; não afirmar deploy concluído. SB11 atualizado em docs/15-publicacao.md. Sem testes de usabilidade ou métricas acadêmicas nesta rodada.

SB09 — tentativa de publicação: configurações enviadas no commit 70b8fec. Vercel solicitou passkey e Render não confirmou login. Nenhum deploy declarado concluído; pendência de acesso do titular registrada em docs/15-publicacao.md.

## Publicação verificada — 11/11/2026
SB09: frontend Vercel Ready e backend Render Free live; fluxo publicado de demonstração verificado por HTTP e no navegador. CORS, consentimento, lacunas e quatro semanas conferidos com dados sintéticos. SB08 continua pendente de modelo/cota e teste Gemini real. SB06 revisão completa de acessibilidade e SB10 pesquisa real permanecem pendentes. Evidências e IDs reais: docs/15-publicacao.md.

## Ativação técnica Gemini — 11/11/2026
SB08: modelo/cota confirmados e teste real local aprovado (6 competências, 4 semanas, lacunas determinísticas). Ativação hospedada em andamento: variáveis não secretas configuradas; chave Render e teste real online pendentes. SB11: README enriquecido e registro docs/16-ativacao-gemini.md. SB10 continua pendente; nenhuma validação com usuários alegada.

SB08 — atualização final 11/11: Gemini ativado no Render e fluxo publicado verificado com dados sintéticos. SB09: backend live com Gemini. 36 testes backend e 8 frontend aprovados; lint/build/pip check aprovados. SB11: README com capturas reais e documentação atualizada. SB06 auditoria completa e SB10 usuários reais continuam pendentes.

## Aprofundamento solicitado — 11/11/2026
SB03/SB08/RF03–05/RF07: 8 competências + 12 contextuais implementadas; revisão e pulo preservam respostas. 41 testes backend e 8 frontend aprovados, lint/build aprovados. SB11: requisitos, README e registro 17 atualizados. Verificação publicada em andamento. SB10 pesquisa com usuários permanece pendente.

SB03/SB08/SB09 — verificação publicada concluída: commit 128f3b1, Render live/Vercel READY. Fluxo real com 20 perguntas e contexto sintético gerou diagnóstico e quatro semanas ajustadas à disponibilidade de 2h/semana. Duas chamadas Gemini. Capturas novas e limites no registro 17. SB10 continua pendente.

## Revisão editorial da interface — 11/11/2026
SB06/SB11: cabeçalho, rodapé, destaque da landing, conclusão e erros com linguagem voltada ao usuário final. Removidas referências à entrega da faculdade. 41 testes backend e 8 frontend aprovados; lint/build aprovados. Sem alteração no questionário ou na lógica de diagnóstico. Ver docs/18-textos-interface.md.

Revisão editorial publicada: cc43615, Vercel READY e Render live. Início e conclusão conferidos no navegador em demonstração local, sem consumir Gemini. Evidências no registro 18.

## Material de apresentação — 11/11/2026
SB11: apresentação de 12 slides em PowerPoint e HTML animado produzida a pedido do usuário. Capturas reais e dados sintéticos identificados, notas de fala e guia de uso. Ver docs/19-apresentacao.md. SB10: comunicação com beneficiários e validação real continuam pendentes.

SB11 — adaptação móvel: apresentação vertical de 12 seções, navegação por toque e capturas ampliáveis; testada em viewports 360/390px. Rota pública publicada e verificada na Vercel: /apresentacao.html. Registro em docs/19-apresentacao.md.

SB11 — ajuste solicitado: substituir apenas a apresentação vertical pelo formato horizontal 16:9, mantendo o mesmo endereço /apresentacao.html. Sem alteração na aplicação principal.

## Sprint 2 — alternativas contextualizadas (17/11/2026)
SB03/SB08/RF03–07: cinco opções específicas por pergunta, escala 0–4 preservada, rótulo assinado enviado ao diagnóstico, demo com opções próprias. 52 testes backend e 15 frontend aprovados; lint/build aprovados. SB11 atualizado no registro 20. Publicação e inspeção real em andamento. Nenhuma pesquisa com participantes nesta rodada.

SB03/SB08 — publicação verificada em 17/11: f315de3, Vercel READY e Render live; oito conjuntos de cinco opções, revisão preservada, diagnóstico Gemini e quatro semanas conferidos com dados sintéticos. Evidência e limitações no registro 20. SB10 pesquisa real segue pendente.

## Sprint 2 — temas e movimento (17/11/2026)
SB06/SB09: alternância claro/escuro, Motion e Three.js decorativo com fallback e movimento reduzido. SB11: README, decisão e registro 21 atualizados. 17 testes frontend, lint/build aprovados; viewport local 390px sem overflow na landing/primeira pergunta. Publicação em verificação. SB10 validação com beneficiários permanece pendente.

SB06/SB09: publicação 7fe98f5 verificada, Vercel READY; temas e canvas presentes na aplicação, apresentação horizontal preservada. Capturas reais no registro 21.

## Documentação visual - 17/11/2026
SB11: PDF com 25 prints fornecidos, 27 páginas, gerado e renderizado para revisão. Ver registro 22. SB10 validação real continua pendente; nenhuma pesquisa realizada nesta tarefa.

## Sprint 2 - personagens 3D (17/11/2026)
SB06/SB09/SB11: dois GLB, quatro animações por modelo, estúdio de prévia independente e documentação. Validador glTF sem erros/avisos; 17 testes frontend e lint/build aprovados. Acabamento em revisão; publicação em verificação. SB10 pesquisa real permanece pendente.

SB06/SB09: prévia 3D d832a6f publicada, Vercel READY; modelos carregados, animação e restauração da pose conferidas. Aplicação principal preservada. Captura real e pacote de entrega no registro 23.

## Revisão dos movimentos 3D - 17/11/2026
SB06/SB09: curvas suaves, coordenação de articulações e transições graduais. Validação glTF sem erros/avisos; testes de continuidade adicionados. Lint/build e 17 testes aprovados. Publicação em andamento; SB10 pesquisa real pendente.
