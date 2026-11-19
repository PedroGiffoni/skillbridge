<p align="center"><img src="docs/assets/skillbridge-cover.svg" alt="SkillBridge: profissão, autoavaliação, diagnóstico e trilha de quatro semanas" width="100%"></p>

<p align="center"><em>Ilustração editorial do projeto; não é uma captura da aplicação.</em></p>

# SkillBridge

[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Status](https://img.shields.io/badge/status-MVP_acadêmico-6D28D9)](docs/08-sprints-kanban.md)

> Orientação de competências para universitários buscando o primeiro emprego. Resultados derivados de autoavaliação, sem certificação ou promessa de contratação.

**[🌐 Abrir aplicação](https://skillbridge-two-rosy.vercel.app)** · **[🩺 Saúde da API](https://skillbridge-api-pedrogiffoni.onrender.com/health)** · **[📋 Documentação acadêmica](docs/09-relatorio-f108.md)**

## Sumário

[Proposta e recursos](#proposta-e-recursos) · [Arquitetura](#arquitetura) · [Execução local](#executar-localmente) · [Gemini](#ativar-gemini) · [Privacidade](#comportamento-e-privacidade) · [Testes](#verificar) · [Estrutura](#estrutura-e-situação) · [Publicação](#publicação-render--vercel)

## Proposta e recursos

| Etapa | O que a aplicação oferece |
| --- | --- |
| 🎯 Profissão livre | Objetivo profissional e consentimento informado |
| 🧭 Questionário | 8 competências geradas pelo Gemini + 12 perguntas contextuais opcionais |
| 📊 Autoavaliação | Escala de 0–4 e cálculo determinístico das lacunas |
| 🗓️ Trilha | Diagnóstico orientativo e plano de quatro semanas |
| 🤖 IA obrigatória | Questionário, diagnóstico e trilha dependem do Gemini; falhas permitem nova tentativa |
| 🌗 Aparência | Tema claro/escuro no topo, preferência local e animações com Three.js + Motion |
| ♿ Interface | Layout responsivo, rótulos e suporte a movimento reduzido; auditoria completa ainda pendente |

## Capturas reais

Fluxo publicado com Gemini em 11/11/2026, usando profissão e respostas sintéticas. São evidências técnicas, não testes com participantes reais.

| Diagnóstico orientativo | Trilha de quatro semanas |
| --- | --- |
| [![Diagnóstico real com indicação de conteúdo Gemini](docs/assets/gemini-diagnostico-real.jpg)](docs/assets/gemini-diagnostico-real.jpg) | [![Trilha real de quatro semanas gerada pelo Gemini](docs/assets/gemini-trilha-real.jpg)](docs/assets/gemini-trilha-real.jpg) |

## Arquitetura

```mermaid
flowchart LR
    U[Universitário] --> F[React + TypeScript + Vite + Tailwind]
    F -->|HTTPS / consentimento| B[FastAPI + Pydantic]
    B --> D[Cálculo determinístico de lacunas]
    B -->|google-genai / chave no servidor| G[Gemini API]
    G -->|JSON validado| B
    B -->|Resultado validado ou erro recuperável| F
```

| Camada | Tecnologia / hospedagem |
| --- | --- |
| Interface | React 19, TypeScript, Vite 7, Tailwind 4, Three.js 0.187 e Motion 14 / Vercel |
| API | Python 3.13, FastAPI, Pydantic / Render Free |
| IA | SDK oficial `google-genai`; modelo configurável por ambiente |
| Estado | Memória e token assinado; sem banco ou autenticação nesta etapa |
| Qualidade | pytest, Vitest, Testing Library, ESLint e build TypeScript |


MVP acadêmico F108/Unifor, prazo 27/11/2026. Frontend React/TypeScript/Vite/Tailwind e backend FastAPI com SDK oficial google-genai. Sem autenticação, banco ou analytics. Aplicação publicada no Render/Vercel. Pesquisa com usuários reais ainda não realizada.

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
2. Preencha GEMINI_API_KEY e GEMINI_MODEL com o identificador exato confirmado. O código não fixa um modelo padrão; a configuração atual verificada usa `gemini-3.5-flash-lite`.
3. Somente depois de verificar a cota, altere GEMINI_FREE_TIER_CONFIRMED=true. Essa variável registra confirmação do operador; não verifica cobrança automaticamente. Não vincule faturamento para este MVP sem aprovação.
4. Reinicie a API depois de alterar .env (Ctrl+C e comando uvicorn novamente).

GET /api/config informa apenas gemini_enabled, sem revelar chave ou modelo. Se faltar configuração/confirmação, a API retorna 503 e não chama Google. Não há opção de demonstração sem IA; configure o backend para iniciar uma avaliação. Em 11/11/2026, a cota gratuita do projeto SKILLBRIDGE foi conferida e o modelo `gemini-3.5-flash-lite` passou no teste real local. Chave configurada exclusivamente no Render e fluxo real online verificado. [Registro de ativação](docs/16-ativacao-gemini.md).

Variáveis: GEMINI_TIMEOUT_SECONDS (1–60, padrão 30), GEMINI_MAX_REQUESTS_PER_MINUTE (1–60, padrão conservador local de 5 gerações, cada uma com até duas tentativas; não é cota Google), CORS_ORIGINS (lista JSON de origens permitidas). A chave jamais deve ir para frontend/.env.

## Comportamento e privacidade

Perfil e consentimento → 8 competências com alternativas específicas por pergunta, em uma autoavaliação 0–4 → 12 perguntas de contexto → diagnóstico e trilha de quatro semanas. Contexto inclui experiências, projetos, dificuldades, tempo, recursos e objetivos; respostas opcionais, até 500 caracteres, revisáveis. Respostas vazias significam não informado e não afetam as lacunas. A avaliação completa envolve duas gerações Gemini: questionário e diagnóstico/trilha. Cada geração pode fazer até duas tentativas, somente em falhas temporárias 500/502/503/504 e dentro do mesmo prazo total configurado. Referências sugeridas não são padrões verificados de mercado. Lacuna = max(0, esperado - autodeclarado), calculada no backend. Narrativa/trilha são JSON validados por Pydantic; erros, timeout e 429 interrompem a geração com mensagem recuperável; as respostas são mantidas para nova tentativa. Erros 400/401/403/404, cota 429, prazo esgotado e saída inválida não recebem repetição automática. Após falha persistente, nova solicitação depende da pessoa e está sujeita ao limite local. Profissão ambígua pode gerar pedido de esclarecimento.

Resultados são orientação educacional por autoavaliação, não certificação, teste de aptidão ou promessa de emprego. IA pode errar; revise recomendações. Não são gerados resultados sem IA. Se o diagnóstico falhar, o formulário conserva níveis, exemplos e contexto, e permite tentar novamente com o mesmo questionário enquanto seu token for válido.

As 12 respostas contextuais só são enviadas com o diagnóstico; pular não dispara chamadas extras. Respostas permanecem apenas em memória durante o processamento. O questionário volta ao navegador em token assinado (não criptografado), expira em uma hora e perde validade quando a API reinicia. Não é token de autenticação. Reiniciar avaliação ou recarregar apaga o estado da interface; não há perfil salvo. O token evita alteração de referências/IDs pelo cliente; use uma única instância/worker nesta etapa. Rate limit global por processo guarda só instantes de chamadas, sem IP. Não há necessidade de SQLite agora. Somente a preferência claro/escuro é salva no `localStorage` (`skillbridge-theme`); isso não salva respostas nem resultados. O tema inicial segue o dispositivo quando não há preferência salva.

Com IA ativa, profissão, contexto acadêmico opcional, respostas contextuais, exemplos e níveis autodeclarados são enviados ao Google. Não informe dados pessoais, confidenciais ou sensíveis. No serviço gratuito, entradas/saídas podem ser usadas para melhoria e revisão humana, conforme https://ai.google.dev/gemini-api/terms. A exclusão local não apaga dados já processados pelo provedor. Uso com IA destinado a adultos; pesquisa real deve recrutar participantes maiores de 18 anos. O protótipo não coleta feedback de pesquisa.

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

Testes usam mocks, sem consumir Gemini ou depender de chave. Os testes backend usam Settings sem .env para impedir chamadas reais. O teste real local executou duas chamadas Gemini com dados sintéticos: questionário e diagnóstico HTTP 200, seis competências e quatro semanas. Evidências em [ativação Gemini](docs/16-ativacao-gemini.md). A suíte com mocks continua independente de rede e segredo.

## Estrutura e situação

- backend/app: configurações, schemas, tokens, cálculo, adaptador Gemini e endpoints; dados genéricos antigos permanecem apenas como fixtures de testes offline.
- backend/tests: contratos, segurança de entrada, cálculo e falhas com mocks.
- frontend/src: fluxo, cliente API validado e erros com nova tentativa; fixtures sintéticas importadas somente por testes.
- docs/13-integracao-gemini.md: alterações, rastreabilidade, testes e pendências desta rodada.
- docs/08-sprints-kanban.md e docs/09-relatorio-f108.md: registros acadêmicos e planejamento.

Fases 2/3 implementadas; Gemini real verificado localmente. Fase 4: publicação de demonstração verificada, Gemini hospedado ativado e fluxo real online verificado. Equipe, brainstorming, ≥10 participantes reais, ≥5 evidências e relatório final permanecem pendentes.

## Publicação Render + Vercel
Configuração e evidências em docs/15-publicacao.md. Backend: raiz backend, Python 3.13.5, build pip install -r requirements.txt, start sh start.sh, health /health. Frontend: raiz frontend, Vite, npm run build, dist. Configure VITE_API_BASE_URL na Vercel com a origem HTTPS efetiva do Render e CORS_ORIGINS no backend com a origem efetiva do frontend. Nenhuma chave no frontend. Após mudar VITE_API_BASE_URL, faça novo build/deploy. Sem URL configurada em produção, a interface informa indisponibilidade. Publicação inicialmente demonstrativa; Gemini ativado e verificado em 11/11/2026.

## Aplicação publicada — 11/11/2026
Frontend: https://skillbridge-two-rosy.vercel.app
Backend/saúde: https://skillbridge-api-pedrogiffoni.onrender.com/health
Ambos publicados e fluxo completo de demonstração verificado. Use o domínio estável do frontend acima (CORS autorizado). Gemini real local aprovado com modelo/cota confirmados; na publicação, a chave está configurada somente no backend Render e o fluxo real foi verificado. Evidências, versões e limites em docs/15-publicacao.md. Render Free pode levar mais tempo após inatividade; se a avaliação expirar após reinício da API, gere outro questionário.

## Status e próximos passos

| Item | Situação atualizada em 18/11/2026 |
| --- | --- |
| Frontend e API publicados | Avaliação exclusivamente com IA; perfil e contrato publicados verificados |
| Gemini local | Teste real aprovado; `gemini-3.5-flash-lite` |
| Gemini no Render | Configurado; em 19/11, erros 503 do Google impedem concluir o fluxo. [Situação real](docs/28-resiliencia-gemini.md) |
| Testes automatizados | Disponibilidade Gemini: 70 backend aprovados em 19/11; frontend sem mudanças (20 testes, lint/build aprovados em 18/11) |
| Pesquisa com participantes | Não realizada; recrutamento e consentimento pendentes |
| Entrega F108 | Prazo 27/11/2026; relatório final pendente |

<details>
<summary>📚 Documentação e rastreabilidade</summary>

- [Auditoria e backlog](docs/11-auditoria-plano.md)
- [Integração e contratos](docs/13-integracao-gemini.md)
- [Publicação e evidências](docs/15-publicacao.md)
- [Ativação real Gemini](docs/16-ativacao-gemini.md)
- [Decisões](docs/decisoes.md)
- [Sprints e Kanban](docs/08-sprints-kanban.md)
- [Relatório F108](docs/09-relatorio-f108.md)

</details>

### Limitações atuais

Sem contas, histórico persistente ou acompanhamento de progresso. Render Free pode hibernar e reiniciar, invalidando questionários em andamento. Uma única instância/worker é necessária para os tokens e o limite por processo. Cotas do provedor podem mudar; a confirmação de gratuidade não é um bloqueio automático de cobrança. Links e recomendações gerados precisam de revisão humana. Testes técnicos com dados sintéticos não substituem validação com usuários reais.

### Questionário aprofundado
Atualização de 11/11/2026: oito perguntas práticas de competências e doze de contexto, com exemplos opcionais, navegação e progresso até vinte perguntas. O diagnóstico deve considerar disponibilidade, recursos e objetivo concreto, reconhecendo informação ausente. Não há garantia de melhoria da orientação sem pesquisa real. [Decisões, arquivos e testes](docs/17-questionario-aprofundado.md). As capturas acima documentam a versão anterior, de seis perguntas. O novo fluxo de vinte perguntas foi verificado na aplicação publicada com duas chamadas reais e respostas sintéticas: a trilha considerou a disponibilidade de duas horas semanais e a dificuldade relatada em JavaScript.

[![Pergunta 20 de 20 no questionário aprofundado](docs/assets/questionario-20-contexto.jpg)](docs/assets/questionario-20-contexto.jpg)

[Ver diagnóstico contextualizado desta versão](docs/assets/questionario-20-diagnostico.jpg).

### Linguagem da interface
Textos públicos revisados em 11/11/2026: apresentação de produto, sem menções à entrega F108/Unifor, ao protótipo ou a pendências acadêmicas. Privacidade e limites da autoavaliação seguem explícitos. A opção de demonstração foi removida em 18/11/2026. Documentação F108 preservada em docs/. [Registro editorial](docs/18-textos-interface.md).

[![Apresentação pública com textos de produto](docs/assets/interface-produto-inicio.jpg)](docs/assets/interface-produto-inicio.jpg)

Captura real da apresentação revisada; [tela de conclusão](docs/assets/interface-produto-conclusao.jpg) verificada em demonstração local.

### Apresentação para celular
Versão horizontal 16:9 com 12 slides, animações e navegação por toque. No celular, gire a tela para melhor leitura: [abrir apresentação](https://skillbridge-two-rosy.vercel.app/apresentacao.html). Arquivo estático independente em frontend/public/apresentacao.html, publicado junto ao frontend. [Registro e limites da verificação](docs/19-apresentacao.md).

### Alternativas que respondem à pergunta
Cada pergunta de competência apresenta cinco descrições práticas próprias, geradas junto ao enunciado pelo Gemini e vinculadas à escala de 0 a 4. As alternativas descrevem a experiência do usuário, sem gabarito ou exigência de ensinar outras pessoas. O diagnóstico recebe a descrição escolhida, recuperada do questionário assinado. As alternativas editoriais genéricas antigas permanecem apenas como fixtures de testes offline; não há fluxo demonstrativo disponível na aplicação. [Contrato e verificações](docs/20-alternativas-contextualizadas.md).

Verificado em 17/11/2026 no aplicativo publicado: oito conjuntos de alternativas específicas, seleção preservada ao revisar, diagnóstico Gemini e quatro semanas, com dados sintéticos. [Exemplo real das novas opções](docs/assets/alternativas-contextualizadas-exemplo.jpg). Após a atualização, recarregue a página e gere um novo questionário.

## 🌗 Temas e movimento

Capturas reais da landing publicada em 17/11/2026:

| Claro | Escuro |
| --- | --- |
| ![SkillBridge no modo claro](docs/assets/tema-claro-publicado.jpg) | ![SkillBridge no modo escuro](docs/assets/tema-escuro-publicado.jpg) |


Use o botão de sol/lua no cabeçalho para alternar a aparência sem perder a avaliação em andamento. No celular, o controle exibe somente o ícone com nome acessível.

- **Motion:** entradas suaves, transições entre etapas e cartões com reação ao ponteiro.
- **Three.js:** caminho abstrato decorativo na prévia inicial; animação de até quatro segundos, resolução limitada e descarte dos recursos ao sair.
- **Acessibilidade:** preferência de movimento reduzido desativa entradas animadas e a cena WebGL; um ornamento estático permanece disponível.
- **Carregamento:** Three.js separado do pacote inicial; o build ainda informa um aviso de tamanho para esse arquivo (~753 kB, ~193 kB gzip).

Implementação e verificações: [registro de temas e movimento](docs/21-temas-movimento.md). Documentação das bibliotecas: [Motion](https://motion.dev/docs/react-accessibility) e [Three.js](https://threejs.org/manual/pages/cleanup.html).

## 🧑‍💼 Personagens 3D

Dois modelos GLB originais, de blazer e de camisa, inspirados nas referências fornecidas. Possuem materiais incorporados, articulações rígidas e quatro animações: acenar, respirar, celebrar e passos no lugar.

**[Abrir estúdio interativo](https://skillbridge-two-rosy.vercel.app/personagens.html)** · [Arquivos e instruções de uso](frontend/public/models/README.md)

| Modelo | GLB | Animações |
| --- | --- | --- |
| Profissional de blazer | [Baixar](frontend/public/models/profissional-blazer.glb) | 4 |
| Profissional de camisa | [Baixar](frontend/public/models/profissional-camisa.glb) | 4 |

Primeira versão para revisão visual, em página independente. Zero erros e zero avisos na validação glTF; articulação animada e restauração da pose verificadas em código. Não possui skinning ou rig facial. [Detalhes e limites](docs/23-personagens-3d.md).

![Primeira versão real dos personagens no visualizador Three.js](docs/assets/personagens-3d-primeira-versao.jpg)

Movimentos revisados na versão 2: curvas contínuas, aceno de braço/punho/cabeça, respiração do tronco e transições graduais entre gestos e ao parar. [Registro da revisão](docs/24-movimentos-fluidos.md).

## 🤖 Avaliação exclusivamente com IA — 18/11/2026

Removidos a opção de demonstração e os resultados genéricos de contingência. Falhas de conexão, timeout, cota e resposta inválida exibem erro e permitem nova tentativa, preservando as respostas em memória. Os contratos públicos aceitam apenas `source_mode: gemini` e não recebem mais o campo `demo`. Após esta atualização, recarregue a página para usar o cliente novo. [Contrato, arquivos e verificações](docs/27-avaliacao-somente-ia.md).

Publicação verificada: Vercel READY e Render live no commit funcional `21743c1`; perfil e contrato inspecionados, sem chamadas reais Gemini nesta rodada.

![Perfil real da aplicação publicada, sem opção de demonstração](docs/assets/avaliacao-somente-ia-perfil.jpg)

### Recuperação de falhas temporárias do Gemini

Em 19/11/2026, foi reproduzido HTTP 503 do Google enquanto outra solicitação gerou oito perguntas com sucesso. O adaptador passa a permitir uma única nova tentativa para erros transitórios, sem ultrapassar o prazo total; erros de acesso/configuração recebem categoria própria. Nenhum resultado é substituído por demonstração. [Diagnóstico, testes e situação da correção](docs/28-resiliencia-gemini.md).

> [!IMPORTANT]
> **Disponibilidade em 19/11/2026:** a melhoria de retentativa está publicada, mas o teste real ainda recebeu 503 do Google nas duas tentativas. Alternativas gratuitas testadas também falharam; modelo, chave e cobrança foram preservados. O fluxo completo continua pendente de recuperação externa. [Evidências e limites](docs/28-resiliencia-gemini.md).
