export type Competency = { id: string; name: string; description: string; question: string; expected_level: number }
export type Questionnaire = { profession: string; competencies: Competency[]; clarification: string; source_mode: 'demo' | 'gemini'; notice: string; token: string }
export type Answer = { competency_id: string; self_level: number; example: string }
export type Gap = { competency_id: string; name: string; expected_level: number; self_level: number; gap: number }
export type Week = { week: number; title: string; objective: string; actions: string[]; deliverable: string }
export type Assessment = { gaps: Gap[]; summary: string; strengths: string[]; priorities: string[]; weeks: Week[]; limitations: string[]; source_mode: 'demo' | 'gemini'; notice: string }
export type Profile = { profession: string; course: string; semester: number | null; consent: boolean; demo: boolean }

const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const text = (v: unknown): v is string => typeof v === 'string' && v.length <= 24000
const texts = (v: unknown): v is string[] => Array.isArray(v) && v.length <= 8 && v.every(text)
const level = (v: unknown): v is number => Number.isInteger(v) && Number(v) >= 0 && Number(v) <= 4
const source = (v: unknown) => v === 'demo' || v === 'gemini'
const competency = (v: unknown): v is Competency => object(v) && text(v.id) && text(v.name) && text(v.description) && text(v.question) && level(v.expected_level)

export function validateQuestionnaire(v: unknown): Questionnaire {
  if (!object(v) || !text(v.profession) || !text(v.clarification) || !text(v.notice) || !text(v.token) || !source(v.source_mode) || !Array.isArray(v.competencies) || !v.competencies.every(competency)) throw new Error('Questionário inválido recebido da API.')
  const count = v.competencies.length
  if (v.clarification ? count !== 0 : count < 5 || count > 8 || !v.token) throw new Error('Questionário incompleto recebido da API.')
  if (new Set(v.competencies.map(c => c.id)).size !== count) throw new Error('Questionário contém competências repetidas.')
  return v as Questionnaire
}

export function validateAssessment(v: unknown): Assessment {
  if (!object(v) || !text(v.summary) || !texts(v.strengths) || !texts(v.priorities) || !texts(v.limitations) || !text(v.notice) || !source(v.source_mode) || !Array.isArray(v.gaps) || !Array.isArray(v.weeks) || v.weeks.length !== 4) throw new Error('Diagnóstico inválido recebido da API.')
  if (v.gaps.length < 5 || v.gaps.length > 8 || !v.gaps.every(g => object(g) && text(g.competency_id) && text(g.name) && level(g.expected_level) && level(g.self_level) && level(g.gap) && g.gap === Math.max(0, g.expected_level - g.self_level))) throw new Error('Lacunas inválidas recebidas da API.')
  if (!v.weeks.every((w, i) => object(w) && w.week === i + 1 && text(w.title) && text(w.objective) && texts(w.actions) && w.actions.length > 0 && text(w.deliverable))) throw new Error('Trilha inválida recebida da API.')
  return v as Assessment
}

async function post(path: string, data: unknown, signal: AbortSignal): Promise<unknown> {
  const base = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '')
  if (import.meta.env.PROD && !base) throw new Error('A API hospedada ainda não está configurada. Use demonstração enquanto a publicação é concluída.')
  if (base) {
    try {
      const url = new URL(base)
      if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw new Error()
    } catch { throw new Error('Endereço da API inválido. Use demonstração e avise a equipe.') }
  }
  // A free Render service can need extra time to wake up before the API timeout begins.
  const timeout = AbortSignal.timeout(120000)
  let response: Response
  try {
    response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.any([signal, timeout]) })
  } catch {
    if (signal.aborted) throw new Error('Solicitação cancelada.')
    throw new Error(timeout.aborted ? 'O servidor demorou para responder. Tente novamente ou use demonstração.' : 'Não foi possível conectar à API. Confira se o backend está iniciado ou use demonstração.')
  }
  if (!response.ok) {
    const messages: Record<number, string> = { 409: 'Avaliação expirada. Volte ao perfil para gerar um novo questionário.', 413: 'Dados muito extensos. Reduza os exemplos.', 422: 'Dados inválidos. Revise profissão, consentimento e respostas.', 429: 'Limite de solicitações atingido. Aguarde um minuto ou use demonstração.' }
    throw new Error(messages[response.status] ?? 'O servidor não conseguiu concluir a solicitação. Tente novamente ou use demonstração.')
  }
  try { return await response.json() } catch { throw new Error('Resposta inválida da API. Tente novamente ou use demonstração.') }
}

export async function requestQuestionnaire(profile: Profile, signal: AbortSignal) {
  return validateQuestionnaire(await post('/api/questionnaire', profile, signal))
}
export async function requestAssessment(data: { token: string; answers: Answer[]; context?: Record<string, string>; consent: boolean; demo: boolean }, signal: AbortSignal) {
  return validateAssessment(await post('/api/assessment', data, signal))
}
