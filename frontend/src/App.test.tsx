import { afterEach, expect, test } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { gap } from './demo'
afterEach(cleanup)
test('lacuna não é negativa', () => { expect(gap(3,0)).toBe(3); expect(gap(3,4)).toBe(0) })
test('fluxo demo com validação, revisão, diagnóstico, trilha e reset', async () => {
 const user = userEvent.setup()
 render(<App />)
 expect(screen.getByText(/AUTOAVALIAÇÃO ORIENTATIVA/)).toBeVisible()
 await user.click(screen.getByRole('button', {name:/Explorar minha jornada/}))
 await user.type(screen.getByLabelText(/Profissão desejada/), 'Designer')
 await user.click(screen.getByRole('checkbox'))
 await user.click(screen.getByRole('button', {name:/Usar demonstração sem IA/}))
 await user.click(screen.getByRole('button', {name:/Próxima pergunta/}))
 expect(screen.getByRole('alert')).toHaveTextContent('Selecione um nível')
 await user.click(screen.getByLabelText('1 · Preciso de bastante apoio'))
 await user.click(screen.getByRole('button', {name:/Próxima pergunta/}))
 await user.click(screen.getByRole('button', {name:'Voltar'}))
 expect(screen.getByLabelText('1 · Preciso de bastante apoio')).toBeChecked()
 await user.click(screen.getByRole('button', {name:/Próxima pergunta/}))
 for(let i=1;i<5;i++) {
 await user.click(screen.getByLabelText('4 · Consigo apoiar outras pessoas'))
 await user.click(screen.getByRole('button', {name:i===4?/Ver diagnóstico$/:/Próxima pergunta/}))
 }
 expect(screen.getByText('Seu nível: 1/4 · Referência: 3/4 · Lacuna: 2')).toBeVisible()
 await user.click(screen.getByRole('button', {name:/Explorar trilha/}))
 expect(screen.getAllByText(/SEMANA 0/)).toHaveLength(4)
 await user.click(screen.getByRole('button', {name:/Concluir exploração/}))
 expect(screen.getByText(/Nenhum feedback foi coletado/)).toBeVisible()
 await user.click(screen.getByRole('button', {name:/Reiniciar e apagar/}))
 await user.click(screen.getByRole('button', {name:/Explorar minha jornada/}))
 expect(screen.getByLabelText(/Profissão desejada/)).toHaveValue('')
 expect(screen.getByRole('checkbox')).not.toBeChecked()
})
