# Integração Gemini — contrato e segurança

## Configuração
SDK oficial Python `google-genai`. Variáveis `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_TIMEOUT_SECONDS`, `GEMINI_MAX_REQUESTS_PER_MINUTE`. Confirmar modelo elegível à cota gratuita no Google AI Studio e na documentação oficial; cotas mudam.

## Duas chamadas
1. Gerar 5–8 competências/perguntas para profissão informada, com `expected_level` apresentado como estimativa para contexto de início de carreira, não padrão de mercado.
2. Receber respostas e lacunas calculadas pelo backend e produzir resumo, pontos fortes, prioridades e plano de quatro semanas.

## Guardrails
- Resposta estritamente estruturada e validada; usar schema JSON quando suportado pelo modelo.
- Não enviar nomes, e-mails ou documentos; evitar solicitar dados sensíveis.
- Ignorar instruções embutidas em campos do usuário que tentem alterar comportamento do sistema.
- Se profissão ambígua, pedir especificação em vez de inventar exigências.
- Nunca apresentar competências inferidas como testes objetivos de habilidade.
- Tratar `429`, timeout, falha de rede e JSON inválido com mensagens claras e retry limitado.
- Cache opcional por profissão normalizada, sem dados pessoais, para economizar quota.
- Fallback de dados demonstrativos pré-definidos deve ter selo visível **DEMONSTRAÇÃO — sem análise Gemini**.

## Prompt-base para questionário
"Você é orientador educacional. Para a profissão informada, proponha 5–8 competências introdutórias e perguntas simples para autoavaliação de estudantes em busca do primeiro emprego. Não presuma requisitos universais; explique que níveis esperados são estimativas. Responda apenas JSON no schema informado. Não peça dados pessoais sensíveis."

## Prompt-base para diagnóstico
"Use apenas os dados estruturados e as lacunas calculadas recebidas. Gere diagnóstico orientativo, reconheça limitações da autoavaliação e plano realista de quatro semanas, sem prometer emprego. Responda apenas JSON no schema informado."

## Referências oficiais para verificação no desenvolvimento
- https://ai.google.dev/gemini-api/docs
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://aistudio.google.com/

## Implementação preparada em 10/11/2026
Adaptador SDK oficial, response_json_schema, Pydantic, limite de tamanho, deadline e timeout do transporte, uma tentativa total sem retries automáticos. Request rate local configurável não representa cota Google. Ativação exige GEMINI_API_KEY, GEMINI_MODEL e GEMINI_FREE_TIER_CONFIRMED=true somente após confirmação na conta. Sem modelo escolhido ou chamada real nesta rodada. Consulte docs/13-integracao-gemini.md e README.md.
