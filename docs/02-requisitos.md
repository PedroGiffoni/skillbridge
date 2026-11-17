# Requisitos

## Funcionais
- RF01: informar profissão desejada em campo livre com limites e sanitização.
- RF02: informar curso e semestre opcionais e consentimento para processamento da avaliação.
- RF03: solicitar à API geração de 8 competências/perguntas práticas e distintas, complementadas por 12 perguntas de contexto pertinentes à profissão, em português, sem dados sensíveis.
- RF04: exibir questionário por etapas, com progresso, opção de voltar e validação de campos obrigatórios.
- RF05: coletar autoavaliação 0 a 4 para cada competência e breve exemplo opcional; coletar 12 respostas contextuais opcionais, até 500 caracteres cada, para adaptar a trilha.
- RF06: calcular lacunas com escala de referência declarada, mostrando origem estimativa dos níveis esperados.
- RF07: solicitar diagnóstico e trilha ao Gemini, recebendo JSON validado.
- RF08: apresentar resultados em linguagem simples, gráfico acessível e plano de quatro semanas.
- RF09: permitir reiniciar avaliação e apagar sessão local.
- RF10: exibir claramente modo demonstração quando Gemini indisponível.
- RF11: coletar respostas de usabilidade de forma anônima, preferencialmente em formulário separado, com consentimento.

## Não funcionais
- RNF01: responsivo a 360px e desktop.
- RNF02: navegação por teclado, labels, foco visível, contraste e `prefers-reduced-motion`.
- RNF03: segredo API só no servidor; CORS restrito por ambiente; rate limiting básico.
- RNF04: validação de entrada e saída, timeouts, erros úteis sem expor stack trace.
- RNF05: não persistir nome, e-mail ou currículo no MVP; guardar apenas o mínimo e por prazo definido.
- RNF06: testes automatizados para regras de negócio, contratos e fluxos essenciais.
- RNF07: rastreabilidade requisitos → telas → endpoints → testes → evidências.

## Critérios de aceitação
1. Um estudante consegue selecionar profissão livre e concluir a avaliação em fluxo completo.
2. A saída inválida da IA não quebra a interface; há aviso e recuperação.
3. O diagnóstico distingue autoavaliação, critérios sugeridos e orientação gerada por IA.
4. Usuário consegue revisar competências e refazer avaliação.
5. Testes de backend e frontend executam localmente com instruções no README.

## Implementação de contratos (10/11/2026)
Profissão normalizada 3–100 caracteres; curso até 100; semestre inteiro 1–20; consentimento obrigatório. Cinco a oito competências com IDs únicos, níveis inteiros 0–4; exemplos até 300 caracteres. Questionário assinado para integridade de referências. Diagnóstico tem quatro semanas e limitações orientativas. Ver docs/13-integracao-gemini.md; IA real ainda não validada.

## Evolução — questionário aprofundado (11/11/2026)
RF03–05/RF07 ampliados para 20 perguntas: 8 competências e 12 contextuais, revisáveis e puláveis. Contexto validado por chaves conhecidas e normalizado; não altera lacunas. Contratos aceitam questionários antigos de 5–8 competências durante atualização. Evidências em docs/17-questionario-aprofundado.md.

## Alternativas contextualizadas — 17/11/2026
RF03/RF05: cada competência inclui options com exatamente cinco itens value/label, valores 0–4 em ordem, rótulos distintos de 12–220 caracteres. Descrições em primeira pessoa ligadas à situação da pergunta. RF07: texto escolhido recuperado do questionário assinado e considerado como autorrelato no diagnóstico. Critério: opções ausentes, repetidas, fora de ordem ou com limites inválidos geram rejeição/fallback explícito.
