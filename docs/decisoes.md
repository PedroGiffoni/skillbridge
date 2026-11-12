# Registro de decisões

- 10/11/2026 — Público: universitários buscando primeiro emprego.
- 10/11/2026 — Profissões: campo livre, com critérios gerados pela IA e apresentados como estimativas.
- 10/11/2026 — Entrada: questionário, sem upload de currículo.
- 10/11/2026 — Provedor principal: Gemini API em modalidade gratuita, conforme disponibilidade real.
- 10/11/2026 — Visual: híbrido profissional/tecnológico.
- Pendente — hospedagem, escolha do modelo Gemini elegível, integrantes, pesquisa com usuários, evidências reais.

- 10/11/2026 — Fases 0 e 1 autorizadas juntas. Protótipo em memória, competências e trilha genéricas rotuladas; sem API, Gemini ou deploy. SQLite condicionado a necessidade real. Referência demo fixa 3/4, backend será autoritativo na Fase 2. Ver docs/11-auditoria-plano.md.

- 10/11/2026 — Usuário aprovou o protótipo e solicitou Gemini; implementadas base FastAPI (Fase 2) e integração preparada (Fase 3) com testes mockados. SQLite dispensado por ausência de necessidade. Modelo e cota da conta ainda pendentes, chamadas reais desativadas. Sem deploy. Ver docs/13-integracao-gemini.md.
- 10/11/2026 — Questionário protegido por token HMAC efêmero, prazo 1h, sem banco. Sem retries automáticos SDK; nova tentativa manual limitada globalmente por processo. Consentimento informa envio ao Google e termos do serviço gratuito.

- 10/11/2026 — Usuário solicitou criar repositório e subir o projeto. Criado PedroGiffoni/skillbridge privado por padrão. Versionamento inclui código, testes e documentação; .env e artefatos locais excluídos. Não constitui deploy nem avanço de fase. Ver docs/14-repositorio-github.md.

- 10/11/2026 — Usuário autorizou publicar no Render e Vercel (Fase 4). Backend Python no Render Free e interface Vite na Vercel Hobby; sem recursos pagos. Frontend terá URL pública configurável e CORS restrito no backend. Gemini hospedado seguirá desativado até confirmar modelo/cota gratuita. Status real em docs/15-publicacao.md.

- 11/11/2026 — Publicação efetiva em https://skillbridge-two-rosy.vercel.app (frontend) e https://skillbridge-api-pedrogiffoni.onrender.com (backend Free), ambos verificados. CORS restrito ao domínio estável Vercel; API URL configurada no build de produção. Gemini permanece desativado, sem upload da chave local. Dados sintéticos usados somente para teste técnico.

- 11/11/2026 — Cota gratuita conferida no projeto SKILLBRIDGE; escolhido gemini-3.5-flash-lite (15 RPM/500 RPD observados). Duas chamadas reais locais aprovadas com dados sintéticos. Configuração não secreta enviada ao Render; chave e teste online ainda pendentes. Preferência permanente de README registrada no Segundo Cérebro. Ver docs/16-ativacao-gemini.md.

- 11/11/2026 — Titular adicionou chave no Render; deploy dep-dbq5qhoae00c73ddhiag live e gemini_enabled=true. Fluxo real no navegador aprovado (6 competências, diagnóstico orientativo e 4 semanas). Capturas reais e resultados em docs/16-ativacao-gemini.md.

- 11/11/2026 — A pedido do usuário, aprofundar avaliação para 20 perguntas: 8 competências práticas (5 técnicas, 3 transversais no contexto profissional) + 12 perguntas contextuais opcionais. Contexto não pontua nem altera lacunas; orienta planejamento de 4 semanas. Mesmas duas chamadas Gemini e estado somente em memória. Ver docs/17-questionario-aprofundado.md.

- 11/11/2026 — Questionário aprofundado publicado e verificado no navegador: 20 perguntas, diagnóstico contextualizado e trilha em blocos de 1h respeitando 2h/semana informadas no cenário sintético. Não equivale a comprovar melhoria com usuários reais. Evidências no registro 17.

- 11/11/2026 — A pedido do usuário, interface pública revisada com linguagem de produto: removidas menções ao trabalho acadêmico, F108, Unifor, ODS e pendências de pesquisa na tela de conclusão. Preservados público universitário, consentimento, limites da autoavaliação e identificação de demonstração. Documentação acadêmica permanece nos arquivos internos.
