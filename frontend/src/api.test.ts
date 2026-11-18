import { afterEach, expect, test, vi } from 'vitest'
import { requestQuestionnaire, validateAssessment, validateQuestionnaire } from './api'
import { mockAssessment, mockQuestionnaire } from './test-fixtures'

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

test.each(['missing', 'count', 'duplicate_value', 'order', 'short', 'long', 'duplicate_label'])('rejeita alternativas inválidas: %s', change => {
  const q = mockQuestionnaire('Designer')
  if (change === 'missing') return expect(() => validateQuestionnaire({ ...q, competencies: q.competencies.map(c => ({ ...c, options: undefined })) })).toThrow()
  const options = q.competencies[0].options
  if (change === 'count') options.pop()
  else if (change === 'duplicate_value') options[1].value = 0
  else if (change === 'order') options.reverse()
  else if (change === 'short') options[1].label = 'x'
  else if (change === 'long') options[1].label = 'x'.repeat(221)
  else options[1].label = '  ' + options[0].label.toUpperCase() + '  '
  expect(() => validateQuestionnaire(q)).toThrow()
})

test('valida contratos e rejeita questionário vazio/duplicado e trilha incompleta', () => {
  const q = mockQuestionnaire('Designer')
  expect(validateQuestionnaire(q)).toEqual(q)
  expect(() => validateQuestionnaire({ ...q, competencies: [] })).toThrow()
  expect(() => validateQuestionnaire({ ...q, competencies: q.competencies.map(() => q.competencies[0]) })).toThrow()
  const result = mockAssessment(q, [0, 1, 2, 3, 4])
  expect(validateAssessment(result)).toEqual(result)
  expect(() => validateAssessment({ ...result, weeks: result.weeks.slice(1) })).toThrow()
  expect(() => validateAssessment({ ...result, gaps: result.gaps.map(g => ({ ...g, gap: 4 })) })).toThrow()
})

test('rejeita respostas demonstrativas de APIs antigas', () => {
  const q = mockQuestionnaire('Designer')
  expect(() => validateQuestionnaire({ ...q, source_mode: 'demo' })).toThrow('Questionário inválido')
  expect(() => validateAssessment({ ...mockAssessment(q, Array(8).fill(2)), source_mode: 'demo' })).toThrow('Diagnóstico inválido')
})

test.each([
  [502, 'A IA retornou uma resposta inválida'],
  [503, 'A IA está indisponível'],
  [504, 'A IA demorou para responder'],
])('falha %s orienta nova tentativa sem oferecer demonstração', async (status, message) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }))
  const promise = requestQuestionnaire({ profession: 'Designer', course: '', semester: null, consent: true }, new AbortController().signal)
  await expect(promise).rejects.toThrow(message)
  await expect(promise).rejects.toThrow('Suas respostas foram mantidas')
  await expect(promise).rejects.not.toThrow(/demonstração/i)
})

test('traduz 429 e falha de rede sem exibir dados internos do servidor', async () => {
  const payload = { profession: 'Designer', course: '', semester: null, consent: true }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }))
  await expect(requestQuestionnaire(payload, new AbortController().signal)).rejects.toThrow('Aguarde um minuto')
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('private server error')))
  await expect(requestQuestionnaire(payload, new AbortController().signal)).rejects.toThrow('Não foi possível conectar')
})

test('produção envia à origem HTTPS configurada e impede configuração ausente ou insegura', async () => {
  const payload = { profession: 'Designer', course: '', semester: null, consent: true }
  const mock = vi.fn().mockResolvedValue({ ok: true, json: async () => mockQuestionnaire('Designer') })
  vi.stubGlobal('fetch', mock)
  vi.stubEnv('PROD', true)
  vi.stubEnv('VITE_API_BASE_URL', '')
  await expect(requestQuestionnaire(payload, new AbortController().signal)).rejects.toThrow('avaliação está indisponível')
  vi.stubEnv('VITE_API_BASE_URL', 'http://insecure.example')
  await expect(requestQuestionnaire(payload, new AbortController().signal)).rejects.toThrow('Não foi possível acessar a avaliação')
  expect(mock).not.toHaveBeenCalled()
  vi.stubEnv('VITE_API_BASE_URL', 'https://skillbridge-api.example/')
  await requestQuestionnaire(payload, new AbortController().signal)
  expect(mock.mock.calls[0][0]).toBe('https://skillbridge-api.example/api/questionnaire')
})
