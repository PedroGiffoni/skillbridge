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

- 11/11/2026 — Apresentação em PPTX editável e HTML independente, com animações adaptadas a cada formato. Identidade visual do SkillBridge, capturas reais e notas de fonte. Nenhuma entrevista ou validação alegada. Entregas locais; sem publicar o material externamente.

- 11/11/2026 — Versão HTML da apresentação para celular com layout vertical próprio, em vez de reduzir o slide 16:9. Publicar em /apresentacao.html no mesmo frontend Vercel, sem backend adicional ou custo. Arquivo independente também disponível para download.

- 11/11/2026 — Usuário pediu manter a apresentação horizontal também no celular. Rota /apresentacao.html passa a usar slides 16:9 com escala proporcional, navegação por toque e orientação para girar o aparelho. Aplicativo principal preservado.

- 17/11/2026 — Substituir a escala textual genérica por cinco alternativas contextualizadas por competência (0–4), geradas na mesma chamada Gemini. A opção descreve prática autodeclarada, sem gabarito. Nível 4 não exige ensinar terceiros. Pydantic e frontend validam cobertura, ordem, limites e duplicatas; diagnóstico recupera o rótulo assinado. Lacuna determinística preservada. Ver docs/20-alternativas-contextualizadas.md.

## 17/11/2026 — Temas e movimento
Adotar tokens claro/escuro com preferência local exclusiva de aparência. Usar Motion respeitando movimento reduzido e Three.js dinâmico para ornamento de quatro segundos; nenhuma animação contínua no questionário. Preservar aplicação e apresentação em rotas distintas. Ver registro 21.

## 17/11/2026 - Registro visual em PDF
Organizar as 25 capturas fornecidas em documento de 27 páginas, com imagens integrais, títulos, legendas e índice. Não apresentar capturas como validação com usuários. Registro 22 e artefato em output/pdf.

## 17/11/2026 - Primeiros personagens 3D
Produzir dois GLB originais com modelagem procedural e articulações rígidas, quatro clips e prévia própria em /personagens.html. Aguardar revisão do acabamento antes de inserir nas telas da jornada. Aplicação e apresentação preservadas. Ver registro 23.
