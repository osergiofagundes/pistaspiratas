import { type Browser, type Page, expect } from '@playwright/test'

export type Jogador = Page & { nome: string }

/** Imagens que não carregaram (404) durante os testes: tem que ficar vazio. */
export const imagensQuebradas = new Set<string>()

export async function jogador(browser: Browser, nome: string, avatar = 'papagaio'): Promise<Jogador> {
  // contexto criado à mão não herda o "use" da config: o idioma do navegador vai aqui
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'pt-BR' })
  await ctx.addInitScript(
    ([n, a]) => {
      localStorage.setItem('arena.perfil', JSON.stringify({ name: n, avatar: a }))
      localStorage.setItem('arena.preferencias', JSON.stringify({ mudo: true, animacoes: false }))
      // o convite do tutorial (primeira visita) fica para o teste dele
      localStorage.setItem('arena.tutorial', JSON.stringify('visto'))
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

// ---------------------------------------------------------------- tutorial

export const balao = (p: Page) => p.locator('.balao-guia')
export const passo = (p: Page, id: string) => expect(balao(p)).toHaveAttribute('data-passo', id, { timeout: 20_000 })
export const continuar = (p: Page) => balao(p).getByRole('button', { name: 'Continuar' }).click()
export const carta = (p: Page, palavra: string) => p.getByRole('button', { name: palavra, exact: true })

/** Joga o tutorial inteiro (já aberto na página) até o cartão final. */
export async function jogarTutorial(p: Page) {
  for (const id of ['boasVindas', 'navios', 'tabuleiro', 'diario', 'barra']) {
    await passo(p, id)
    await continuar(p)
  }
  // o Capitão simulado pensa e dá a ordem sozinho
  await passo(p, 'ordem')
  await passo(p, 'ordemDada')
  await expect(p.getByText('FRUTA', { exact: true }).first()).toBeVisible()
  await continuar(p)

  await passo(p, 'marcar1')
  await carta(p, 'BANANA').click()
  await passo(p, 'marcar2')
  await carta(p, 'UVA').click()
  await passo(p, 'confirmar')
  await p.getByRole('button', { name: 'Confirmar 2' }).click()

  await passo(p, 'canhao')
  await carta(p, 'MAÇÃ').click()
  await passo(p, 'canhaoConfirmar')
  await p.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await passo(p, 'agua')
  await continuar(p)

  // vez do Safira: só os navios simulados jogam
  await passo(p, 'vezSafira')
  await passo(p, 'outroNavio')
  await continuar(p)

  await passo(p, 'viraCapitao')
  await continuar(p)
  await passo(p, 'kraken')
  await expect(p.locator('[data-realce]')).toHaveAttribute('aria-label', 'VULCÃO')
  await continuar(p)
  await passo(p, 'marcas')
  await carta(p, 'CAVALO').click()
  await carta(p, 'VACA').click()

  await passo(p, 'dica')
  // a validação é a de verdade
  await p.getByPlaceholder('Digite a dica (uma palavra)').fill('Cavalo')
  await p.getByRole('button', { name: 'Dar ordem' }).click()
  await expect(p.getByText(/está no tabuleiro/)).toBeVisible()
  await p.getByPlaceholder('Digite a dica (uma palavra)').fill('Fazenda')
  await p.getByRole('button', { name: 'Dar ordem' }).click()

  await passo(p, 'marujosEscolhem')
  await expect(p.getByText('Tutorial concluído!')).toBeVisible({ timeout: 20_000 })
}

