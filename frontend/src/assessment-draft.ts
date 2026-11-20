import { validateQuestionnaire } from './api'
import type { Questionnaire } from './api'

const storageKey = 'skillbridge-draft-v1'

export type Draft = {
  expiresAt: number
  questionnaire: Questionnaire
  profession: string
  course: string
  semester: string
  answers: (number | null)[]
  examples: string[]
  context: Record<string, string>
  consent: boolean
}

export function clearDraft() {
  try { sessionStorage.removeItem(storageKey) } catch { /* The current tab still keeps its React state. */ }
}

export function readDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return null
    const saved = JSON.parse(raw) as Draft
    const q = validateQuestionnaire(saved.questionnaire)
    if (!Number.isFinite(saved.expiresAt) || saved.expiresAt <= Date.now() || saved.consent !== true ||
        saved.profession !== q.profession || typeof saved.course !== 'string' || typeof saved.semester !== 'string' ||
        !Array.isArray(saved.answers) || saved.answers.length !== q.competencies.length ||
        !saved.answers.every(value => Number.isInteger(value) && value !== null && value >= 0 && value <= 4) ||
        !Array.isArray(saved.examples) || saved.examples.length !== q.competencies.length ||
        !saved.examples.every(value => typeof value === 'string' && value.length <= 300) ||
        !saved.context || typeof saved.context !== 'object' || Array.isArray(saved.context) ||
        !Object.values(saved.context).every(value => typeof value === 'string' && value.length <= 500)) {
      clearDraft()
      return null
    }
    return saved
  } catch {
    clearDraft()
    return null
  }
}

export function saveDraft(draft: Draft) {
  try { sessionStorage.setItem(storageKey, JSON.stringify(draft)) } catch { /* Use the active tab's state if unavailable. */ }
}
