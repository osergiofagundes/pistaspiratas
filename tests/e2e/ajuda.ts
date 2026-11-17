import { type Browser, type Page, expect } from '@playwright/test'

export type Jogador = Page & { nome: string }

/** Imagens que não carregaram (404) durante os testes: tem que ficar vazio. */
export const imagensQuebradas = new Set<string>()

export async function jogador(browser: Browser, nome: string, avatar = 'papagaio'): Promise<Jogador> {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  await ctx.addInitScript(
    ([n, a]) => {
      localStorage.setItem('arena.perfil', JSON.stringify({ name: n, avatar: a }))
      localStorage.setItem('arena.preferencias', JSON.stringify({ mudo: true, animacoes: false, lembrete: false }))
    },
    [nome, avatar],
  )
  const page = (await ctx.newPage()) as Jogador
  page.on('response', (r) => {
    if (r.url().includes('/img/') && r.status() >= 400) imagensQuebradas.add(r.url())
  })
  page.nome = nome
  return page
}

export const view = (p: Page) => p.evaluate(() => (window as any).__sala?.getState().view ?? null)
export const act = (p: Page, action: Record<string, unknown>) =>
  p.evaluate((a) => (window as any).__sala.getState().enviar(a), action)

export async function criarSala(p: Page): Promise<string> {
  await p.goto('/')
  await p.getByRole('button', { name: 'Criar Sala' }).click()
  await p.waitForURL(/\/sala\/[A-Z0-9]{6}$/)
  await expect(p.getByText('Salão de espera')).toBeVisible()
  return p.url().split('/sala/')[1]
}

export async function entrar(p: Page, code: string) {
  await p.goto(`/sala/${code}`)
  await expect.poll(async () => (await view(p))?.you ?? null, { timeout: 15_000 }).not.toBeNull()
}

export async function fecharModais(p: Page) {
  for (let i = 0; i < 3; i++) {
    const b = p.getByRole('button', { name: 'Fechar' })
    if ((await b.count()) === 0) break
    await b.first().click({ timeout: 2000 }).catch(() => {})
  }
}

/** Sala com vários jogadores: o primeiro é o Almirante. */
export async function mesa(browser: Browser, nomes = ['Ana', 'Léo', 'Rafa', 'Duda']) {
  const avatares = ['capitao', 'papagaio', 'tubarao', 'macaco', 'grumete', 'gaivota']
  const ps: Jogador[] = []
  for (let i = 0; i < nomes.length; i++) ps.push(await jogador(browser, nomes[i], avatares[i % avatares.length]))
  const code = await criarSala(ps[0])
  for (const p of ps.slice(1)) await entrar(p, code)
  return { ps, code }
}

export async function porId(ps: Jogador[]) {
  const m: Record<string, Jogador> = {}
  for (const p of ps) m[(await view(p)).you] = p
  return m
}
