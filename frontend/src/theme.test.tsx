import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { ThemeToggle } from './ThemeToggle'

afterEach(() => { cleanup(); localStorage.clear(); delete document.documentElement.dataset.theme; vi.restoreAllMocks() })

test('troca tema sem perder o formulário e grava apenas a preferência', async () => {
  const user = userEvent.setup()
  render(<App/>)
  await user.click(screen.getByRole('button', { name: /Explorar minha jornada/ }))
  await user.type(screen.getByLabelText(/Profissão desejada/), 'Designer')
  await user.click(screen.getByRole('button', { name: 'Ativar modo escuro' }))
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem('skillbridge-theme')).toBe('dark')
  expect(screen.getByLabelText(/Profissão desejada/)).toHaveValue('Designer')
  await user.click(screen.getByRole('button', { name: 'Ativar modo claro' }))
  expect(document.documentElement.dataset.theme).toBe('light')
  expect(localStorage.length).toBe(1)
})

test('usa tema inicial e funciona com armazenamento indisponível', async () => {
  document.documentElement.dataset.theme = 'dark'
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Bloqueado') })
  render(<ThemeToggle/>)
  await userEvent.click(screen.getByRole('button', { name: 'Ativar modo claro' }))
  expect(document.documentElement.dataset.theme).toBe('light')
})
