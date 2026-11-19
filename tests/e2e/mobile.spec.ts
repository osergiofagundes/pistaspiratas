import { type Browser, expect, test } from '@playwright/test'
import { type Jogador, imagensQuebradas, jogarTutorial, view } from './ajuda'

/** Celular e tablet deitados usam o palco compacto; o iPad Air (1180×820) já cai no desktop. */
const APARELHOS = [
  { nome: 'celular', w: 844, h: 390 },
  { nome: 'celular pequeno', w: 667, h: 375 },
  { nome: 'tablet', w: 1024, h: 768 },
]

async function jogadorMovel(browser: Browser, nome: string, avatar: string, w: number, h: number): Promise<Jogador> {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, locale: 'pt-BR' })
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

/** nenhum botão ou campo do palco pode ficar fora da tela */
async function cabeNaTela(p: Jogador) {
  const fora = await p.evaluate(() => {
    const { innerWidth: w, innerHeight: h } = window
    return [...document.querySelectorAll('.palco button, .palco input')]
      .filter((el) => !el.closest('.rolagem, .rolagem-modal'))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && (r.left < -1 || r.top < -1 || r.right > w + 1 || r.bottom > h + 1))
      .map(({ el }) => (el.textContent || el.getAttribute('aria-label') || '').trim())
  })
  expect(fora).toEqual([])
}

for (const a of APARELHOS) {
  test(`${a.nome} deitado (${a.w}×${a.h}): partida no formato compacto, por toque`, async ({ browser }) => {
    const nomes = ['Ana', 'Léo', 'Rafa', 'Duda']
    const avatares = ['capitao', 'papagaio', 'tubarao', 'macaco']
    const ps: Jogador[] = []
    for (let i = 0; i < nomes.length; i++) ps.push(await jogadorMovel(browser, nomes[i], avatares[i], a.w, a.h))
    const [ana, leo, rafa, duda] = ps

    // início compacto: o menu do topo tem idioma, preferências, ajuda
    await ana.goto('/')
    await cabeNaTela(ana)
    await ana.getByRole('button', { name: 'Menu' }).tap()
    await expect(ana.getByRole('menuitem', { name: /Preferências/ })).toBeVisible()
    await ana.getByRole('menuitem', { name: /Como jogar/ }).tap()
    await expect(ana.getByRole('navigation', { name: /Seções/i })).toBeVisible()
    await ana.getByRole('button', { name: 'Fechar' }).first().tap()

    // cria a sala e todos entram
    await ana.getByRole('button', { name: 'Criar Sala' }).tap()
    await ana.waitForURL(/\/sala\/[A-Z0-9]{6}$/)
    await expect(ana.getByText('Salão de espera')).toBeVisible()
    const code = ana.url().split('/sala/')[1]
    for (const p of [leo, rafa, duda]) {
      await p.goto(`/sala/${code}`)
      await expect.poll(async () => (await view(p))?.you ?? null, { timeout: 15_000 }).not.toBeNull()
    }
    await cabeNaTela(ana)

    // escolhem os navios tocando nos botões
    await ana.getByRole('button', { name: 'Entrar neste navio' }).first().tap()
    await leo.getByRole('button', { name: 'Entrar neste navio' }).first().tap()
    await rafa.getByRole('button', { name: 'Entrar neste navio' }).nth(1).tap()
    await duda.getByRole('button', { name: 'Entrar neste navio' }).nth(1).tap()
    await expect(ana.getByRole('button', { name: 'Zarpar!' })).toBeEnabled()

    // configurações: o modal rola por dentro e Salvar fica fixo no pé
    await ana.getByRole('button', { name: 'Editar', exact: true }).tap()
    await expect(ana.getByRole('button', { name: 'Salvar' })).toBeInViewport()
    await ana.getByRole('button', { name: 'Salvar' }).tap()
    await expect(ana.getByRole('button', { name: 'Salvar' })).toHaveCount(0)

    await ana.getByRole('button', { name: 'Zarpar!' }).tap()
    for (const p of ps) await expect(p.getByText('Capitães sorteados')).toBeVisible()
    for (const p of ps) await p.getByRole('button', { name: 'Fechar' }).first().tap()

    const byId: Record<string, Jogador> = {}
    for (const p of ps) byId[(await view(p)).you] = p
    const v = await view(ana)
    const ship = v.game.ships.find((s: { id: string }) => s.id === v.game.turn.shipId)
    const cap = byId[ship.captainId]
    const marujo = byId[v.players.find((p: { shipId: string; id: string }) => p.shipId === ship.id && p.id !== ship.captainId).id]
    await cabeNaTela(cap)
    await cabeNaTela(marujo)

    // o Capitão dá a ordem pela coluna da direita
    const vCap = (await view(cap)).game
    await cap.getByPlaceholder('Digite a dica (uma palavra)').fill('Zarabatana')
    await cap.getByRole('button', { name: 'Dar ordem' }).tap()
    await expect(marujo.getByText('ZARABATANA', { exact: true }).first()).toBeVisible()

    // tocar e segurar uma carta amplia a palavra (e não vale como voto)
    const alvo = vCap.cards.findIndex((c: { owner: string }) => c.owner === ship.id)
    const carta = marujo.getByRole('button', { name: vCap.cards[alvo].word, exact: true })
    await carta.dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true })
    await expect(marujo.locator('.zoom-carta')).toHaveText(vCap.cards[alvo].word.toUpperCase())
    await carta.dispatchEvent('pointerup', { pointerType: 'touch', isPrimary: true })
    await expect(marujo.locator('.zoom-carta')).toHaveCount(0)

    // o Marujo marca com um toque e confirma
    await carta.tap()
    await expect.poll(async () => (await view(ana)).game.turn.selection).toEqual([alvo])
    await marujo.getByRole('button', { name: 'Confirmar', exact: true }).tap()
    await expect.poll(async () => (await view(ana)).game.cards[alvo].revealed, { timeout: 8000 }).toBe(true)

    // o Diário abre numa gaveta e fecha
    await marujo.getByRole('button', { name: 'Diário', exact: true }).tap()
    await expect(marujo.getByText('Diário de Bordo')).toBeVisible()
    await expect(marujo.getByText('ZARABATANA · 1').first()).toBeVisible()
    await marujo.getByRole('button', { name: 'Fechar' }).first().tap()
    await expect(marujo.getByText('Diário de Bordo')).toHaveCount(0)

    // tripulação de um navio: um toque no cartão mostra os nomes
    await ana.getByRole('button', { name: /Safira · Tripulação/ }).tap()
    await expect(ana.getByRole('dialog', { name: 'Tripulação' })).toContainText('Rafa')
    await ana.getByRole('dialog', { name: 'Tripulação' }).tap()

    // o Almirante encerra pelo menu do topo
    await ana.getByRole('button', { name: 'Menu' }).tap()
    await ana.getByRole('menuitem', { name: /Encerrar partida/ }).tap()
    await ana.getByRole('button', { name: /^Encerrar/ }).last().tap()
    await expect.poll(async () => (await view(ana)).phase, { timeout: 8000 }).toBe('finished')
    await expect(ana.getByText('Placar')).toBeVisible()
    await cabeNaTela(ana)
    await ana.getByRole('button', { name: 'Ver mapa e diário' }).tap()
    await expect(ana.getByText('Diário completo')).toBeVisible()

    // em pé, o jogo pede para deitar o aparelho
    await ana.setViewportSize({ width: a.h, height: a.w })
    await expect(ana.getByRole('alertdialog', { name: 'Gire o aparelho' })).toBeVisible()
    await ana.setViewportSize({ width: a.w, height: a.h })
    await expect(ana.getByRole('alertdialog', { name: 'Gire o aparelho' })).toHaveCount(0)

    expect([...imagensQuebradas]).toEqual([])
  })
}

test('desktop com janela alta e estreita não pede para girar (só aparelhos de toque)', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 700, height: 1000 }, locale: 'pt-BR' })
  await ctx.addInitScript(() => localStorage.setItem('arena.tutorial', JSON.stringify('visto')))
  const p = await ctx.newPage()
  await p.goto('/')
  await expect(p.getByRole('button', { name: 'Criar Sala' })).toBeVisible()
  await expect(p.getByRole('alertdialog')).toHaveCount(0)
})

test('celular: o tutorial inteiro no palco compacto', async ({ browser }) => {
  const p = await jogadorMovel(browser, 'Ana', 'grumete', 844, 390)
  await p.goto('/')
  await p.getByRole('button', { name: 'Menu' }).click()
  await p.getByText('Como jogar').click()
  await p.getByRole('button', { name: '▶ Ver tutorial' }).click()
  await p.waitForURL(/\/tutorial$/)
  await jogarTutorial(p)
  await expect(p.getByRole('button', { name: 'Jogar com amigos' })).toBeInViewport()
})
