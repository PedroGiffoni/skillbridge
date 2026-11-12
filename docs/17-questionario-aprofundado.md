# Questionário aprofundado — 11/11/2026

Pedido: cerca de 20 perguntas com mais contexto para a orientação. Implementação: 8 perguntas práticas geradas pelo Gemini e 12 perguntas contextuais fixas, relacionadas à profissão escolhida. Contextuais opcionais e puláveis, com até 500 caracteres cada. Sem afirmar eficácia superior antes de pesquisa real.

## Conteúdo e uso

Competências: cinco técnicas/práticas da área e três transversais em situações da profissão; escala 0–4, exemplo opcional sobre situação, ação, apoio e resultado. Contexto: motivação, experiência, projeto, ferramentas, resolução de problema, colaboração, feedback, dificuldade, estratégia de aprendizagem, disponibilidade semanal, recursos e objetivo concreto em quatro semanas. Não exige emprego anterior.

A segunda chamada recebe perguntas e respostas contextualizadas, competências, exemplos e lacunas. O prompt pede evidências autodeclaradas, reconhecimento de contradições/ausências, até três frentes prioritárias, carga ajustada ao tempo, ações compatíveis com recursos e entregáveis observáveis. Branco significa não informado; nenhuma resposta qualitativa entra no cálculo de lacunas. Continua sendo orientação educacional, sem certificação.

## Contratos, privacidade e compatibilidade

`AssessmentRequest.context`: mapa opcional de até 12 chaves conhecidas, valores normalizados, até 500 caracteres por resposta; chaves desconhecidas ou valores inválidos retornam 422. Catálogo backend/frontend conferido por teste. Corpo HTTP limitado a 64 KiB para acomodar contexto, token e exemplos; saída Gemini continua limitada a 24 KiB/6.000 tokens. Timeout/429/fallback e duas chamadas por avaliação preservados.

Geração nova exige oito competências; contratos de leitura mantêm 5–8 para compatibilidade durante atualização. Recarregar a interface pode ser necessário após publicação; questionários em andamento expiram quando a API reinicia. Demonstração tem oito competências genéricas e doze contextuais, sem análise IA das respostas. Contexto não é persistido e é apagado ao reiniciar. Consentimento já contempla respostas enviadas ao Google; avisos pedem não incluir dados pessoais/sensíveis.

## Rastreabilidade e arquivos

RF03–05/RF07 → SB03/SB08 → telas questions/context → `/api/questionnaire` e `/api/assessment` → testes de fluxo, revisão, contexto, limites e cálculo.

- Backend: `app/context.py`, `schemas.py`, `main.py`, `demo.py`, `tests/test_api.py`.
- Frontend: `src/context.ts`, `App.tsx`, `api.ts`, `demo.ts`, `App.test.tsx`, `integration.test.tsx`.
- Documentação: README, requisitos, escopo, integração Gemini, métricas, decisões, Kanban e este registro.

## Verificação técnica

- `.venv/Scripts/python.exe -m pytest -q` em backend: 41 aprovados; aviso preexistente Starlette/httpx.
- `npm test` em frontend: 8 aprovados, incluindo as vinte perguntas, revisão e contexto enviado após consentimento.
- `npm run lint` e `npm run build`: aprovados.
- Primeiro teste de catálogo revelou erro de codificação na exportação; corrigido com leitura UTF-8 explícita e suíte repetida com sucesso.

Publicação e verificação real desta versão serão registradas após observação, sem reutilizar evidências antigas como prova do novo fluxo. Sem participantes reais nesta rodada.
