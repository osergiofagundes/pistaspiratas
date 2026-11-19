import { test, expect } from '@playwright/test'
import { balao, carta, continuar, criarSala, imagensQuebradas, jogador, jogarTutorial, passo } from './ajuda'

test.afterAll(() => {
  expect([...imagensQuebradas]).toEqual([])
})

test('tutorial: abre pelo Como jogar e vai do Marujo ao Capitão até a vitória', async ({ browser }) => {
  const p = await jogador(browser, 'Ana')
  await p.goto('/')
  await p.getByRole('button', { name: 'Como jogar' }).click()
  await p.getByRole('button', { name: '▶ Ver tutorial' }).click()
  await p.waitForURL(/\/tutorial$/)
  await jogarTutorial(p)
  expect(await p.evaluate(() => localStorage.getItem('arena.tutorial'))).toBe('"feito"')

  // repetir volta ao começo, com o tabuleiro novo
  await p.getByRole('button', { name: 'Repetir tutorial' }).click()
  await passo(p, 'boasVindas')
  await expect.poll(() => p.evaluate(() => (window as any).__sala.getState().view.game.cards.some((c: any) => c.revealed))).toBe(false)
})

test('tutorial guiado: carta fora do roteiro avisa e não marca; pular volta ao início', async ({ browser }) => {
  const p = await jogador(browser, 'Ana')
  await p.goto('/tutorial')
  for (const id of ['boasVindas', 'navios', 'tabuleiro', 'diario', 'barra']) {
    await passo(p, id)
    await continuar(p)
  }
  await passo(p, 'ordemDada')
  await continuar(p)
  await passo(p, 'marcar1')
  await carta(p, 'LIVRO').click()
  await expect(p.getByText('Siga o José: faça o que o balão pede.')).toBeVisible()
  expect(await p.evaluate(() => (window as any).__sala.getState().view.game.turn.selection)).toEqual([])
  await balao(p).getByRole('button', { name: 'Pular tutorial' }).click()
  await p.getByRole('button', { name: 'Sair', exact: true }).click()
  await p.waitForURL((u) => u.pathname === '/')
})

test('convite do tutorial na primeira visita, uma vez só', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'pt-BR' })
  const p = await ctx.newPage()
  await p.goto('/')
  await expect(p.getByText('Primeira vez a bordo?')).toBeVisible()
  await p.getByRole('button', { name: 'Agora não' }).click()
  await expect(p.getByText('Primeira vez a bordo?')).toHaveCount(0)
  await p.reload()
  await expect(p.getByRole('button', { name: 'Criar Sala' })).toBeVisible()
  await p.waitForTimeout(500)
  await expect(p.getByText('Primeira vez a bordo?')).toHaveCount(0)

  // aceitar o convite em outro navegador leva ao tutorial
  const ctx2 = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'pt-BR' })
  const q = await ctx2.newPage()
  await q.goto('/')
  await q.getByRole('button', { name: 'Fazer o tutorial' }).click()
  await q.waitForURL(/\/tutorial$/)
  await passo(q, 'boasVindas')
})

test('dentro de uma sala, o tutorial abre em outra aba e a sala continua', async ({ browser }) => {
  const p = await jogador(browser, 'Ana')
  const code = await criarSala(p)
  await p.getByRole('button', { name: 'Como jogar' }).first().click()
  const [aba] = await Promise.all([p.context().waitForEvent('page'), p.getByRole('button', { name: '▶ Ver tutorial' }).click()])
  await aba.waitForLoadState()
  expect(new URL(aba.url()).pathname).toBe('/tutorial')
  await passo(aba, 'boasVindas')
  expect(p.url()).toContain(`/sala/${code}`)
  await expect(p.getByText('Salão de espera')).toBeVisible()
})
