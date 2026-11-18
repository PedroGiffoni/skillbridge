import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { mockAssessment, mockQuestionnaire } from './test-fixtures'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

async function fillProfile() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /Explorar minha jornada/ }))
  await user.type(screen.getByLabelText(/Profissão desejada/), 'Designer')
  await user.click(screen.getByRole('checkbox'))
  return user
}

test('fluxo API preserva respostas após falha da IA e repete diagnóstico sem fallback', async () => {
  const q = { ...mockQuestionnaire('Designer'), source_mode: 'gemini' as const, token: 'signed-token', notice: 'Questionário de teste via API.' }
  q.competencies[0] = { ...q.competencies[0], name: 'Pesquisa de interfaces', expected_level: 2 }
  q.competencies[0].options[1].label = 'Sigo um exemplo de pesquisa e preciso de ajuda para interpretar o que observei.'
  const result = { ...mockAssessment(q, Array(8).fill(1)), source_mode: 'gemini' as const, summary: 'Resumo de teste recebido do servidor.', notice: 'Orientação de teste via API.' }
  result.weeks[0].title = 'Investigar necessidades de usuários'
  const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => q })
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({ ok: true, json: async () => result })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  const user = await fillProfile()
  expect(fetchMock).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: /Começar autoavaliação/ }))
  expect(await screen.findByRole('heading', { name: 'Pesquisa de interfaces' })).toBeVisible()
  expect(screen.getByRole('radio', { name: '1 · ' + q.competencies[0].options[1].label })).toBeVisible()
  expect(screen.queryByText('Preciso de bastante apoio')).not.toBeInTheDocument()
  await user.type(screen.getByLabelText(/Um exemplo/), 'Exercício acadêmico')
  for (let i = 0; i < 8; i++) {
    expect(screen.getByRole('radio', { name: '1 · ' + q.competencies[i].options[1].label })).toBeVisible()
    await user.click(screen.getByRole('radio', { name: /^1 ·/ }))
    await user.click(screen.getByRole('button', { name: i === 7 ? /^Continuar para contexto$/ : /Próxima pergunta/ }))
  }
  expect(screen.getByText('Pergunta 9 de 20')).toBeVisible()
  await user.type(screen.getByLabelText(/Sua resposta/), 'Quero construir um projeto introdutório')
  await user.click(screen.getByRole('button', { name: 'Próxima pergunta' }))
  await user.click(screen.getByRole('button', { name: 'Voltar' }))
  expect(screen.getByLabelText(/Sua resposta/)).toHaveValue('Quero construir um projeto introdutório')
  await user.click(screen.getByRole('button', { name: 'Próxima pergunta' }))
  for (let i = 1; i < 12; i++) {
    if (i === 11) await user.type(screen.getByLabelText(/Sua resposta/), 'Posso estudar duas horas por semana')
    await user.click(screen.getByRole('button', { name: i === 11 ? /^Ver diagnóstico$/ : 'Pular pergunta' }))
  }
  expect(await screen.findByRole('alert')).toHaveTextContent('A IA está indisponível')
  expect(screen.getByLabelText(/Sua resposta/)).toHaveValue('Posso estudar duas horas por semana')
  expect(screen.getByText('Pergunta 20 de 20')).toBeVisible()
  expect(screen.queryByText(result.summary)).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /demonstração/i })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Tentar diagnóstico novamente' }))
  expect(await screen.findByText(result.summary)).toBeVisible()
  expect(screen.getByText('Seu nível: 1/4 · Referência: 2/4 · Lacuna: 1')).toBeVisible()
  expect(JSON.parse(fetchMock.mock.calls[1][1].body).answers[0].example).toBe('Exercício acadêmico')
  expect(JSON.parse(fetchMock.mock.calls[1][1].body).answers[0].self_level).toBe(1)
  expect(JSON.parse(fetchMock.mock.calls[1][1].body).context.motivation).toBe('Quero construir um projeto introdutório')
  expect(JSON.parse(fetchMock.mock.calls[0][1].body).consent).toBe(true)
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('demo')
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).not.toHaveProperty('demo')
  expect(fetchMock.mock.calls[2][1].body).toBe(fetchMock.mock.calls[1][1].body)
  await user.click(screen.getByRole('button', { name: /Explorar trilha/ }))
  expect(screen.getByRole('heading', { name: result.weeks[0].title })).toBeVisible()
})

test('falha de conexão mantém perfil e permite tentar com IA novamente', async () => {
  const fetchMock = vi.fn().mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ ok: true, json: async () => mockQuestionnaire('Designer') })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  const user = await fillProfile()
  await user.click(screen.getByRole('button', { name: /Começar autoavaliação/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar')
  expect(screen.getByLabelText(/Profissão desejada/)).toHaveValue('Designer')
  expect(screen.getByRole('checkbox')).toBeChecked()
  expect(screen.queryByText(/demonstração/i)).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('heading', { name: 'Comunicação' })).toBeVisible()
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(fetchMock.mock.calls[1][1].body).toBe(fetchMock.mock.calls[0][1].body)
})

test('profissão ambígua solicita esclarecimento e cancelamento ignora resposta tardia', async () => {
  let resolve: (v: unknown) => void = () => {}
  const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockQuestionnaire('Designer'), clarification: 'Qual área do design?', competencies: [], token: '' }) })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  const user = await fillProfile()
  await user.click(screen.getByRole('button', { name: /Começar autoavaliação/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Qual área do design?')
  fetchMock.mockImplementationOnce(() => new Promise(r => { resolve = r }))
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(screen.getByText('Preparando suas perguntas…')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))
  resolve({ ok: true, json: async () => mockQuestionnaire('Designer') })
  await waitFor(() => expect(screen.getByRole('heading', { name: /Qual direção/ })).toBeVisible())
})
