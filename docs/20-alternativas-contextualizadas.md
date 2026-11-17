# Alternativas contextualizadas — 17/11/2026

## Problema observado e decisão

Usuário enviou captura de uma pergunta sobre planejar a lógica de um programa e investigar loop infinito. As cinco opções genéricas de autonomia não respondiam ao enunciado. Agora a primeira chamada Gemini deve produzir cinco descrições práticas para cada pergunta, em primeira pessoa e relacionadas à situação. Não é um teste de conhecimento com gabarito.

Progressão orientativa: 0 ainda não praticou; 1 segue exemplo com orientação próxima; 2 executa parte e busca ajuda pontual; 3 realiza e verifica situações habituais; 4 analisa situações menos previsíveis e ajusta a estratégia. Todos os níveis precisam descrever a tarefa específica. Ensinar terceiros não é requisito do nível 4. A qualidade e a progressão semântica ainda exigem revisão humana; validação estrutural não certifica a coerência da IA.

## Implementação

- `Competency.options`: cinco objetos value/label. Valores inteiros estritos 0–4 em ordem, sem duplicação. Rótulos normalizados, distintos e de 12–220 caracteres.
- Opções vinculadas ao questionário HMAC. A resposta do navegador continua enviando nível e exemplo; o backend recupera option_label do token, sem confiar em descrição enviada pelo cliente.
- Diagnóstico recebe rótulo, nível, exemplo e contexto como autorrelato. Fórmula de lacuna inalterada.
- UI mostra as alternativas próprias da pergunta, com rótulos clicáveis, teclado, texto com quebra de linha e escala identificada.
- Demonstração possui 8 conjuntos editoriais próprios. Catálogos Python/TypeScript conferidos por teste. Não há geração de frases genéricas silenciosa para substituir opções inválidas.
- Geração real ausente/inválida continua caindo em demonstração identificada. Sem alteração de timeout, 429, duas chamadas, modelo ou chave.
- Questionários anteriores à publicação devem ser gerados novamente após o reinício da API. O frontend valida o novo contrato; a apresentação HTML permanece independente.

## Arquivos

Backend: schemas.py, main.py, demo.py, demo_options.py e tests/test_api.py. Frontend: api.ts, App.tsx, styles.css, demo.ts, local-demo.ts, demo-options.ts e testes api/App/integration. README, requisitos, integração, decisões, Kanban e este registro atualizados.

## Testes executados

| Comando | Resultado |
| --- | --- |
| `.venv/Scripts/python.exe -m pytest -q` em backend | 52 aprovados, aviso preexistente Starlette/httpx |
| `npm test` em frontend | 15 aprovados |
| `npm run lint` em frontend | Aprovado |
| `npm run build` em frontend | Aprovado |

Verificados: ausência/quantidade/ordem/tipo/duplicatas/limites das opções, rejeição de resposta inválida da IA, rótulo escolhido recuperado do token, impossibilidade de substituir o rótulo pelo request, preservação das lacunas, alternativas da API diferentes entre perguntas, revisão de respostas e fluxo de 20 perguntas. A execução inicial de build no sandbox foi interrompida por demora; lint/build fora dele concluíram.

Teste real e publicação serão registrados depois de observados. Sem entrevistas ou validação com participantes nesta rodada.
