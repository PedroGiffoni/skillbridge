import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { localAssessment, localQuestionnaire } from './local-demo'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

async function fillProfile() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /Explorar minha jornada/ }))
  await user.type(screen.getByLabelText(/Profissão desejada/), 'Designer')
  await user.click(screen.getByRole('checkbox'))
  return user
}

test('fluxo API exibe perguntas e plano recebidos e envia exemplos somente após consentimento', async () => {
  const q = { ...localQuestionnaire('Designer'), source_mode: 'gemini' as const, token: 'signed-token', notice: 'Questionário de teste via API.' }
  q.competencies[0] = { ...q.competencies[0], name: 'Pesquisa de interfaces', expected_level: 2 }
  const result = { ...localAssessment(q, [1, 1, 1, 1, 1]), source_mode: 'gemini' as const, summary: 'Resumo de teste recebido do servidor.', notice: 'Orientação de teste via API.' }
  result.weeks[0].title = 'Investigar necessidades de usuários'
  const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => q }).mockResolvedValueOnce({ ok: true, json: async () => result })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  const user = await fillProfile()
  expect(fetchMock).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: /Começar autoavaliação/ }))
  expect(await screen.findByRole('heading', { name: 'Pesquisa de interfaces' })).toBeVisible()
  await user.type(screen.getByLabelText(/Um exemplo/), 'Exercício acadêmico')
  for (let i = 0; i < 5; i++) {
    await user.click(screen.getByLabelText('1 · Preciso de bastante apoio'))
    await user.click(screen.getByRole('button', { name: i === 4 ? /^Ver diagnóstico$/ : /Próxima pergunta/ }))
  }
  expect(await screen.findByText(result.summary)).toBeVisible()
  expect(screen.getByText('Seu nível: 1/4 · Referência: 2/4 · Lacuna: 1')).toBeVisible()
  expect(JSON.parse(fetchMock.mock.calls[1][1].body).answers[0].example).toBe('Exercício acadêmico')
  expect(JSON.parse(fetchMock.mock.calls[0][1].body).consent).toBe(true)
  await user.click(screen.getByRole('button', { name: /Explorar trilha/ }))
  expect(screen.getByRole('heading', { name: result.weeks[0].title })).toBeVisible()
})

test('falha de conexão mantém formulário e permite demonstração explícita', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  render(<App />)
  const user = await fillProfile()
  await user.click(screen.getByRole('button', { name: /Começar autoavaliação/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar')
  await user.click(screen.getByRole('button', { name: /Usar demonstração sem IA/ }))
  expect(screen.getByRole('heading', { name: 'Comunicação' })).toBeVisible()
  expect(screen.getByText(/DEMONSTRAÇÃO — sem análise Gemini\./, { selector: 'strong' })).toBeVisible()
})

test('profissão ambígua solicita esclarecimento e cancelamento ignora resposta tardia', async () => {
  let resolve: (v: unknown) => void = () => {}
  const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ ...localQuestionnaire('Designer'), clarification: 'Qual área do design?', competencies: [], token: '' }) })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  const user = await fillProfile()
  await user.click(screen.getByRole('button', { name: /Começar autoavaliação/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Qual área do design?')
  fetchMock.mockImplementationOnce(() => new Promise(r => { resolve = r }))
  await user.click(screen.getByRole('button', { name: /Começar autoavaliação/ }))
  expect(screen.getByText('Preparando suas perguntas…')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))
  resolve({ ok: true, json: async () => localQuestionnaire('Designer') })
  await waitFor(() => expect(screen.getByRole('heading', { name: /Qual direção/ })).toBeVisible())
})
