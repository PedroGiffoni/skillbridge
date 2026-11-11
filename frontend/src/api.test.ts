import { afterEach, expect, test, vi } from 'vitest'
import { requestQuestionnaire, validateAssessment, validateQuestionnaire } from './api'
import { localAssessment, localQuestionnaire } from './local-demo'

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

test('valida contratos e rejeita questionário vazio/duplicado e trilha incompleta', () => {
  const q = localQuestionnaire('Designer')
  expect(validateQuestionnaire(q)).toEqual(q)
  expect(() => validateQuestionnaire({ ...q, competencies: [] })).toThrow()
  expect(() => validateQuestionnaire({ ...q, competencies: q.competencies.map(() => q.competencies[0]) })).toThrow()
  const result = localAssessment(q, [0, 1, 2, 3, 4])
  expect(validateAssessment(result)).toEqual(result)
  expect(() => validateAssessment({ ...result, weeks: result.weeks.slice(1) })).toThrow()
  expect(() => validateAssessment({ ...result, gaps: result.gaps.map(g => ({ ...g, gap: 4 })) })).toThrow()
})

test('traduz 429 e falha de rede sem exibir dados internos do servidor', async () => {
  const payload = { profession: 'Designer', course: '', semester: null, consent: true, demo: false }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }))
  await expect(requestQuestionnaire(payload, new AbortController().signal)).rejects.toThrow('Aguarde um minuto')
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('private server error')))
  await expect(requestQuestionnaire(payload, new AbortController().signal)).rejects.toThrow('Não foi possível conectar')
})

test('produção envia à origem HTTPS configurada e impede configuração ausente ou insegura', async () => {
  const payload = { profession: 'Designer', course: '', semester: null, consent: true, demo: false }
  const mock = vi.fn().mockResolvedValue({ ok: true, json: async () => localQuestionnaire('Designer') })
  vi.stubGlobal('fetch', mock)
  vi.stubEnv('PROD', true)
  vi.stubEnv('VITE_API_BASE_URL', '')
  await expect(requestQuestionnaire(payload, new AbortController().signal)).rejects.toThrow('API hospedada ainda não está configurada')
  vi.stubEnv('VITE_API_BASE_URL', 'http://insecure.example')
  await expect(requestQuestionnaire(payload, new AbortController().signal)).rejects.toThrow('Endereço da API inválido')
  expect(mock).not.toHaveBeenCalled()
  vi.stubEnv('VITE_API_BASE_URL', 'https://skillbridge-api.example/')
  await requestQuestionnaire(payload, new AbortController().signal)
  expect(mock.mock.calls[0][0]).toBe('https://skillbridge-api.example/api/questionnaire')
})
