import { LazyMotion, domAnimation, MotionConfig, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { ThemeToggle } from './ThemeToggle'
import { JourneyScene } from './JourneyScene'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, BookOpen, Check, Compass, GraduationCap, Layers, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'
import { contextQuestions } from './context'
import { ApiError, requestAssessment, requestQuestionnaire } from './api'
import { AccessPanel, HistoryPanel, ProfilePanel } from './AccountPanels'
import { logout } from './account-api'
import type { AccountProfile, SavedAssessment } from './account-api'
import { clearDraft, readDraft, saveDraft } from './assessment-draft'
import type { Assessment, Questionnaire } from './api'

type Screen = 'home' | 'profile' | 'questions' | 'context' | 'results' | 'plan' | 'feedback' | 'login' | 'history' | 'account'
type Destination = 'assessment' | 'history' | 'account'
const steps = ['Seu objetivo', 'Autoavaliação', 'Diagnóstico', 'Sua trilha']
export default function App() {
  const reducedMotion = useReducedMotion()
  const [draft] = useState(readDraft)
  const [screen, setScreen] = useState<Screen>(draft ? 'login' : 'home')
  const [destination, setDestination] = useState<Destination>(draft ? 'assessment' : 'history')
  const [account, setAccount] = useState<AccountProfile | null>(null)
  const [profession, setProfession] = useState(draft?.profession ?? '')
  const [course, setCourse] = useState(draft?.course ?? '')
  const [semester, setSemester] = useState(draft?.semester ?? '')
  const [consent, setConsent] = useState(draft?.consent ?? false)
  const [index, setIndex] = useState(draft ? contextQuestions.length - 1 : 0)
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(draft?.questionnaire ?? null)
  const questionnaireExpiry = useRef(draft?.expiresAt ?? 0)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const controller = useRef<AbortController | null>(null)
  const competencies = (questionnaire?.competencies ?? []).map(c => ({ ...c, expected: c.expected_level }))
  const [answers, setAnswers] = useState<(number | null)[]>(draft?.answers ?? [])
  const [context, setContext] = useState<Record<string, string>>(draft?.context ?? {})
  const [examples, setExamples] = useState<string[]>(draft?.examples ?? [])
  const [error, setError] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [screen, index])
  const go = (next: Screen) => { setError(''); setScreen(next) }
  useEffect(() => () => controller.current?.abort(), [])
  const cancel = () => { controller.current?.abort(); controller.current = null; setLoading('') }
  const reset = () => {
    clearDraft(); cancel(); setProfession(''); setCourse(''); setSemester(''); setConsent(false);
    setIndex(0); setContext({}); setAnswers([]); setExamples([]); setQuestionnaire(null); setAssessment(null); go('home')
  }
  const acceptQuestionnaire = (next: Questionnaire) => {
    if (next.clarification) { setError(next.clarification); return }
    clearDraft(); questionnaireExpiry.current = Date.now() + 60 * 60 * 1000
    setProfession(next.profession); setQuestionnaire(next); setAssessment(null); setContext({}); setIndex(0);
    setAnswers(next.competencies.map(() => null)); setExamples(next.competencies.map(() => ''));
    go('questions')
  }
  const start = async () => {
    const normalized = profession.trim().replace(/\s+/g, ' ')
    if (normalized.length < 3 || !consent) { setError('Informe uma profissão com pelo menos 3 caracteres e confirme o consentimento.'); return }
    if (semester && (!Number.isInteger(Number(semester)) || Number(semester) < 1 || Number(semester) > 20)) { setError('Informe um semestre inteiro entre 1 e 20.'); return }
    setProfession(normalized); setError('')
    cancel(); setAssessment(null); setQuestionnaire(null); const current = new AbortController(); controller.current = current; setLoading('Preparando suas perguntas…')
    try {
      const next = await requestQuestionnaire({ profession: normalized, course: course.trim(), semester: semester ? Number(semester) : null, consent }, current.signal)
      if (controller.current === current) acceptQuestionnaire(next)
    } catch (err) { if (controller.current === current) setError(err instanceof Error ? err.message : 'Não foi possível preparar o questionário.') }
    finally { if (controller.current === current) { setLoading(''); controller.current = null } }
  }
  const generateAssessment = async () => {
    if (!questionnaire) return
    setError('')
    cancel()
    const current = new AbortController()
    controller.current = current
    setLoading('Preparando seu diagnóstico e sua trilha…')
    try {
      const next = await requestAssessment({ token: questionnaire.token, context, consent,
        answers: questionnaire.competencies.map((c, i) => ({ competency_id: c.id, self_level: answers[i]!, example: examples[i] })) }, current.signal)
      if (controller.current === current) { clearDraft(); setAssessment(next); go('results') }
    } catch (err) {
      if (controller.current !== current) return
      if (err instanceof ApiError && err.status === 401) {
        setAccount(null); setDestination('assessment'); go('login')
      } else setError(err instanceof Error ? err.message : 'Não foi possível preparar o diagnóstico.')
    } finally {
      if (controller.current === current) { setLoading(''); controller.current = null }
    }
  }
  const finish = () => {
    if (!questionnaire || loading) return
    if (answers.some(answer => answer === null)) { setError('Selecione um nível antes de continuar.'); return }
    saveDraft({ expiresAt: questionnaireExpiry.current, questionnaire, profession, course, semester, consent, answers, examples, context })
    if (account) void generateAssessment()
    else { setDestination('assessment'); go('login') }
  }
  const openPrivate = (page: 'history' | 'account') => {
    cancel(); setDestination(page)
    go(account ? page : 'login')
  }
  const acceptAccount = (profile: AccountProfile) => {
    setAccount(profile)
    if (destination === 'assessment') {
      setIndex(contextQuestions.length - 1); go('context'); void generateAssessment()
    } else go(destination)
  }
  const sessionExpired = () => {
    setAccount(null); setDestination(screen === 'account' ? 'account' : 'history'); go('login')
  }
  const viewSaved = (entry: SavedAssessment) => {
    setProfession(entry.profession); setQuestionnaire(null); setAssessment(entry.assessment); go('results')
  }
  const signOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try { await logout(); setAccount(null); reset() }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível sair. Tente novamente.') }
    finally { setSigningOut(false) }
  }
  const ranked = (assessment?.gaps ?? []).map(g => ({ name: g.name, self: g.self_level, expected: g.expected_level, gap: g.gap })).sort((a, b) => b.gap - a.gap)
  const sourceMode = assessment?.source_mode ?? questionnaire?.source_mode
  const notice = assessment?.notice ?? questionnaire?.notice ?? 'Conheça seu ponto de partida e transforme sua autoavaliação em um plano de desenvolvimento.'
  const journeyScreen = screen !== 'login' && screen !== 'history' && screen !== 'account'
  const step = screen === 'profile' ? 0 : (screen === 'questions' || screen === 'context') ? 1 : screen === 'results' ? 2 : 3
  return <LazyMotion features={domAnimation}><MotionConfig reducedMotion="user"><div className="app-shell">
    <a className="skip" href="#main">Pular para o conteúdo</a>
    <header className="header"><button className="brand" onClick={() => { cancel(); go('home') }} aria-label="SkillBridge, início"><span className="brand-icon"><Layers size={22}/></span>Skill<span>Bridge</span></button><span className="header-note">Da universidade ao próximo passo.</span>{(screen === 'home' || screen === 'results' || screen === 'plan' || screen === 'feedback') && <button className="secondary account-link" onClick={() => openPrivate('history')}>Minhas avaliações</button>}<ThemeToggle/></header>
    <div className="demo-banner" role="status"><ShieldCheck size={16}/><span><strong>{sourceMode === 'gemini' ? 'CONTEÚDO GERADO POR GEMINI · ' : 'AUTOAVALIAÇÃO ORIENTATIVA · '}</strong>{notice}</span></div>
    <main id="main" aria-busy={Boolean(loading)}>{loading && <div className="loading-status" role="status">{loading}<button className="secondary" onClick={cancel}>Cancelar</button></div>}
    {screen === 'home' ? <>
      <section className="hero grid lg:grid-cols-2 gap-12">
        <m.div className="hero-copy" initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}><span className="eyebrow"><span className="dot"/> SEU FUTURO COMEÇA COM CLAREZA</span><h1 ref={heading} tabIndex={-1}>Entre onde você está<br/>e onde <span>quer chegar.</span></h1><p className="intro">Conheça suas competências, descubra o que desenvolver e transforme seu próximo passo em um plano possível.</p><button className="primary" onClick={() => go('profile')}>Explorar minha jornada <ArrowRight size={18}/></button><p className="micro"><Check size={15}/> Questionário aberto <span>·</span> 20 perguntas · competências e contexto <span>·</span> No seu ritmo</p><div className="audience"><GraduationCap size={23}/><p>Para universitários que estão construindo<br/><strong>o caminho para o primeiro emprego.</strong></p></div></m.div>
        <m.div initial={reducedMotion ? false : { opacity: 0, y: 24, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: -1 }} transition={{ duration: .65, delay: .12 }} className="preview" aria-label="Prévia ilustrativa da jornada"><JourneyScene/><div className="preview-top"><span className="small-icon"><Compass size={22}/></span><div><span className="eyebrow">UM CAMINHO POSSÍVEL</span><h2>Seu próximo capítulo</h2></div><span className="preview-tag">EXEMPLO</span></div><div className="preview-career"><span>PROFISSÃO QUE VOCÊ QUER EXPLORAR</span><strong>O futuro tem a sua direção <ArrowUpRight size={20}/></strong></div><div className="preview-chart"><div><strong>Seu mapa de competências</strong><span>Autoavaliação ilustrativa</span></div>{[['Comunicação', 75], ['Organização', 50], ['Colaboração', 90]].map(([name, value]) => <div className="preview-bar" key={name}><span>{name}</span><div><i style={{ width: `${value}%` }}/></div></div>)}</div><div className="preview-bottom"><span className="small-icon"><BookOpen size={22}/></span><div><strong>Pequenos passos. Novas possibilidades.</strong><p>Uma trilha de desenvolvimento em 4 semanas</p></div><ArrowRight size={18}/></div><span className="floating-label"><Sparkles size={16}/> Clareza para começar</span></m.div>
      </section><section className="how"><div className="section-heading"><span className="eyebrow">DO OBJETIVO À AÇÃO</span><h2>Um próximo passo de cada vez.</h2><p>Uma pausa para se conhecer. Um plano para seguir em frente.</p></div><div className="grid md:grid-cols-3 gap-5">{[['01', 'Escolha sua direção', 'Conte qual profissão você quer explorar. O ponto de partida é seu.'], ['02', 'Olhe para suas competências', 'Reflita sobre o que você já pratica e o que deseja desenvolver.'], ['03', 'Construa seu próximo passo', 'Explore um diagnóstico orientativo e uma trilha de quatro semanas.']].map(([n, title, text]) => <m.article className="how-card" key={n} initial={reducedMotion ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} whileHover={{ y: -5 }} transition={{ duration: .3 }}><span>{n}</span><h3>{title}</h3><p>{text}</p></m.article>)}</div></section><div className="journey-note"><span><Compass size={24}/></span><p><strong>Clareza para escolher. Um plano para começar.</strong><br/>Reconheça suas competências e avance com ações que cabem na sua rotina.</p></div>
    </> : <m.section key={screen} className="workspace" initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .25 }}>{journeyScreen && <nav className="steps" aria-label="Etapas da avaliação">{steps.map((s, i) => <span key={s} aria-current={i === step ? 'step' : undefined} className={i <= step ? 'active' : ''}><b>{i < step ? <Check size={14}/> : i + 1}</b>{s}</span>)}</nav>}
      {(screen === 'history' || screen === 'account') && <nav className="account-navigation" aria-label="Minha conta">
        <button className="secondary" aria-current={screen === 'history' ? 'page' : undefined} onClick={() => openPrivate('history')}>Meu histórico</button>
        <button className="secondary" aria-current={screen === 'account' ? 'page' : undefined} onClick={() => openPrivate('account')}>Meu perfil</button>
        <button className="secondary" disabled={signingOut} onClick={() => void signOut()}>{signingOut ? 'Saindo…' : 'Sair da conta'}</button>
      </nav>}
      {!journeyScreen && screen !== 'login' && error && <p className="error" role="alert">{error}</p>}
      {screen === 'login' && <AccessPanel assessment={destination === 'assessment'} heading={heading}
        onLogin={acceptAccount} onBack={() => go(destination === 'assessment' ? 'context' : 'home')} />}
      {screen === 'history' && account && <HistoryPanel heading={heading} onOpen={viewSaved} onExpired={sessionExpired} />}
      {screen === 'account' && account && <ProfilePanel profile={account} heading={heading} onChange={setAccount} onExpired={sessionExpired} />}
      {screen === 'profile' && <div className="form-card"><span className="eyebrow">01 / SEU OBJETIVO</span><h1 ref={heading} tabIndex={-1}>Qual direção você quer explorar?</h1><p>Não precisa ter tudo decidido. Comece por uma profissão que desperta sua curiosidade.</p><div className="notice">São 8 perguntas de competências e 12 de contexto para orientar uma trilha mais viável. O contexto é opcional: você pode pular o que não quiser responder. O Gemini gera as perguntas e a orientação considerando sua profissão. Os níveis sugeridos são estimativas educacionais. Não informe nomes ou dados sensíveis.</div><form onSubmit={e => { e.preventDefault(); void start() }}><label htmlFor="profession">Profissão desejada <span>(obrigatório)</span></label><input disabled={Boolean(loading)} id="profession" maxLength={100} required minLength={3} value={profession} onChange={e => setProfession(e.target.value)} placeholder="Ex.: designer, enfermeiro, analista de dados"/><div className="grid md:grid-cols-2 gap-5"><div><label htmlFor="course">Curso <span>(opcional)</span></label><input disabled={Boolean(loading)} id="course" maxLength={100} value={course} onChange={e => setCourse(e.target.value)} placeholder="Seu curso universitário"/></div><div><label htmlFor="semester">Semestre <span>(opcional)</span></label><input disabled={Boolean(loading)} id="semester" type="number" min={1} max={20} value={semester} onChange={e => setSemester(e.target.value)} placeholder="Ex.: 4"/></div></div><label className="checkbox"><input disabled={Boolean(loading)} type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required/><span>Autorizo o processamento da profissão, contexto opcional e respostas para esta avaliação. Esses dados serão enviados ao Google Gemini para gerar o questionário, o diagnóstico e a trilha. No uso gratuito, o Google pode usar entradas e respostas para melhorar seus produtos e permitir revisão humana. Não informarei dados pessoais ou sensíveis nas respostas.</span></label><p className="privacy-note">Uso com IA destinado a maiores de 18 anos. Consulte os <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">termos do Gemini</a>. A exclusão local não apaga eventuais dados já processados pelo provedor.</p>{error && <p role="alert" className="error">{error}</p>}<div className="actions"><button type="button" className="secondary" disabled={Boolean(loading)} onClick={() => go('home')}>Voltar</button><button className="primary" disabled={Boolean(loading)}>{error ? 'Tentar novamente' : 'Começar autoavaliação'} <ArrowRight size={18}/></button></div></form></div>}
      {screen === 'questions' && <div className="form-card"><span className="eyebrow">02 / AUTOAVALIAÇÃO · {profession}</span><div className="progress-label"><span>Pergunta {index + 1} de {competencies.length + contextQuestions.length}</span><span>{Math.round((index + 1) / (competencies.length + contextQuestions.length) * 100)}%</span></div><progress value={index + 1} max={competencies.length + contextQuestions.length} aria-label="Progresso das perguntas"/><h1 ref={heading} tabIndex={-1}>{competencies[index].name}</h1><p>{competencies[index].question}</p><fieldset aria-describedby="answer-help"><legend>Qual alternativa mais se aproxima do que você faz hoje?</legend><p id="answer-help" className="answer-help">Considere o que já praticou, inclusive em estudos e projetos. Escolha a descrição mais próxima da sua experiência.</p>{competencies[index].options.map(option => <label className={`level ${answers[index] === option.value ? 'selected' : ''}`} key={option.value}><input disabled={Boolean(loading)} type="radio" name={`level-${index}`} value={option.value} checked={answers[index] === option.value} onChange={() => { setAnswers(answers.map((a, i) => i === index ? option.value : a)); setError('') }}/><span className="answer-label">{option.value} · {option.label}</span></label>)}</fieldset><label htmlFor="example">Um exemplo da sua prática <span>(opcional, até 300 caracteres)</span></label><textarea disabled={Boolean(loading)} id="example" maxLength={300} value={examples[index]} onChange={e => setExamples(examples.map((a, i) => i === index ? e.target.value : a))} placeholder="Conte a situação, o que fez, com quanto apoio e o resultado. Evite nomes e dados pessoais."/>{error && <p role="alert" className="error">{error}</p>}<div className="actions"><button className="secondary" disabled={Boolean(loading)} onClick={() => { setError(''); if (index) setIndex(index - 1); else go('profile') }}>Voltar</button><button className="primary" disabled={Boolean(loading)} onClick={() => { if (answers[index] === null) { setError('Selecione um nível antes de continuar.'); return } if (index < competencies.length - 1) { setError(''); setIndex(index + 1) } else { setError(''); setIndex(0); go('context') } }}>{index === competencies.length - 1 ? 'Continuar para contexto' : 'Próxima pergunta'}<ArrowRight size={18}/></button></div></div>}
      {screen === 'context' && <div className="form-card"><span className="eyebrow">02 / SEU CONTEXTO · {profession}</span><div className="progress-label"><span>Pergunta {competencies.length + index + 1} de {competencies.length + contextQuestions.length}</span><span>{Math.round((competencies.length + index + 1) / (competencies.length + contextQuestions.length) * 100)}%</span></div><progress value={competencies.length + index + 1} max={competencies.length + contextQuestions.length} aria-label="Progresso das perguntas"/><h1 ref={heading} tabIndex={-1}>{contextQuestions[index].question}</h1><p>Conte apenas o que se sentir confortável em compartilhar. Projetos de estudo e experiências de aprendizagem também contam; não é necessário já ter trabalhado.</p><label htmlFor="context-answer">Sua resposta <span>(opcional, até 500 caracteres)</span></label><textarea id="context-answer" disabled={Boolean(loading)} maxLength={500} value={context[contextQuestions[index].id] ?? ''} onChange={e => setContext({ ...context, [contextQuestions[index].id]: e.target.value })} placeholder="Não inclua nomes, contatos, empresas identificáveis ou dados sensíveis."/><p className="privacy-note">{(context[contextQuestions[index].id] ?? '').length}/500 caracteres. Estas respostas contextualizam a orientação; não entram na pontuação das lacunas. Resposta em branco significa não informado.</p>{error && <p role="alert" className="error">{error}</p>}<div className="actions"><button className="secondary" disabled={Boolean(loading)} onClick={() => { setError(''); if (index) setIndex(index - 1); else { setIndex(competencies.length - 1); go('questions') } }}>Voltar</button><button className="primary" disabled={Boolean(loading)} onClick={() => { setError(''); if (index < contextQuestions.length - 1) setIndex(index + 1); else void finish() }}>{index === contextQuestions.length - 1 ? (error ? 'Tentar diagnóstico novamente' : 'Ver diagnóstico') : (context[contextQuestions[index].id] ?? '').trim() ? 'Próxima pergunta' : 'Pular pergunta'}<ArrowRight size={18}/></button></div></div>}
      {screen === 'results' && assessment && <><span className="eyebrow">03 / DIAGNÓSTICO ORIENTATIVO</span><h1 ref={heading} tabIndex={-1}>Seu ponto de partida, com clareza.</h1><p>Objetivo informado: <strong>{profession}</strong>. Este mapa reflete apenas sua autoavaliação.</p><div className="notice">Referências sugeridas pelo Gemini, por competência. Não é um padrão verificado da profissão. Lacuna = máximo entre 0 e (referência − nível autodeclarado). Não mede aptidão nem certifica habilidades.</div><div className="grid lg:grid-cols-3 gap-6"><div className="result-card lg:col-span-2"><h2>Seu mapa de competências</h2><p>Escala de 0 a 4 · referência estimativa por competência</p>{ranked.map(c => <div className="result-row" key={c.name}><div><strong>{c.name}</strong><span>Seu nível: {c.self}/4 · Referência: {c.expected}/4 · Lacuna: {c.gap}</span></div><meter min={0} max={4} value={c.self} aria-label={`${c.name}: nível ${c.self} de 4`}/></div>)}</div><aside className="result-card priority"><span className="small-icon"><Compass/></span><h2>{ranked[0].gap > 0 ? 'Uma prioridade para explorar' : 'Continue praticando'}</h2><strong>{ranked[0].gap > 0 ? ranked[0].name : 'Aprofunde suas experiências'}</strong><p>{ranked[0].gap > 0 ? 'Esta é a maior diferença em relação à referência didática. Em caso de empate, usamos a ordem do questionário.' : 'Suas respostas atingem a referência didática. Isso não comprova domínio: experimente aplicar e buscar feedback.'}</p><p className="micro">Prioridade baseada na diferença entre seu nível autodeclarado e a referência estimativa, sem julgamento de aptidão.</p></aside></div><div className="result-card guidance"><h2>Um olhar sobre sua autoavaliação</h2><p>{assessment.summary}</p><h3>Pontos fortes autodeclarados</h3>{assessment.strengths.length ? <ul>{assessment.strengths.map(s => <li key={s}>{s}</li>)}</ul> : <p>Continue explorando e praticando suas competências.</p>}<h3>Prioridades para desenvolver</h3>{assessment.priorities.length ? <ul>{assessment.priorities.map(s => <li key={s}>{s}</li>)}</ul> : <p>Experimente aprofundar suas práticas atuais.</p>}<h3>Limites desta orientação</h3><ul>{assessment.limitations.map(s => <li key={s}>{s}</li>)}</ul></div><div className="actions">{questionnaire && <button className="secondary" onClick={() => { setAssessment(null); setIndex(0); go('questions') }}>Revisar respostas</button>}<button className="primary" onClick={() => go('plan')}>Explorar trilha de 4 semanas <ArrowRight size={18}/></button></div></>}
      {screen === 'plan' && assessment && <><span className="eyebrow">04 / SUA TRILHA ORIENTATIVA</span><h1 ref={heading} tabIndex={-1}>Pequenas ações. Um caminho possível.</h1><p>Um roteiro gerado pelo Gemini de quatro semanas para explorar {ranked[0].gap > 0 ? ranked[0].name.toLocaleLowerCase('pt-BR') : 'uma competência de sua escolha'}. Adapte ao seu tempo e contexto.</p><div className="grid md:grid-cols-2 gap-5">{assessment.weeks.map(w => <article className="week" key={w.week}><span className="eyebrow">SEMANA 0{w.week}</span><h2>{w.title}</h2><p>{w.objective}</p><ul>{w.actions.map(a => <li key={a}>{a}</li>)}</ul><div><BookOpen size={16}/>{w.deliverable}</div></article>)}</div><p className="notice">Plano orientativo para explorar {profession}; adapte as ações ao seu contexto e verifique os materiais escolhidos. Não garante certificação ou emprego.</p><div className="actions"><button className="secondary" onClick={() => go('results')}>Voltar ao diagnóstico</button><button className="primary" onClick={() => go('feedback')}>Concluir exploração <Check size={18}/></button></div></>}
      {screen === 'feedback' && <div className="form-card finish"><span className="small-icon"><Check/></span><h1 ref={heading} tabIndex={-1}>Seu próximo passo começa agora.</h1><p>Escolha uma ação da primeira semana, reserve um momento na sua rotina e comece no seu ritmo.</p><div className="notice">Seu diagnóstico e sua trilha estão no histórico da sua conta. Volte quando quiser para rever o resultado.</div><button className="secondary" onClick={() => go('plan')}>Rever trilha</button></div>}
      {(journeyScreen || destination === 'assessment' && screen === 'login') && <button className="reset" onClick={reset}><RotateCcw size={15}/> Reiniciar e apagar respostas da sessão</button>}
    </m.section>}
    </main><footer><span className="brand footer-brand">SkillBridge<span> / </span><small>Conhecer. Desenvolver. Avançar.</small></span><p>Seu desenvolvimento, no seu ritmo.<span>Orientação por autoavaliação, não certificação.</span></p></footer>
  </div></MotionConfig></LazyMotion>
}
