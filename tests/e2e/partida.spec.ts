import { test, expect } from '@playwright/test'
import { act, entrar, fecharModais, imagensQuebradas, jogador, mesa, porId, view } from './ajuda'

test.afterAll(() => {
  expect([...imagensQuebradas]).toEqual([])
})

test('partida completa: salão, ordem, votação, canhão, Kraken, fim e volta ao salão', async ({ browser }) => {
  const { ps, code } = await mesa(browser)
  const [ana, leo, rafa, duda] = ps
  // escolher navios pela interface
  await ana.getByRole('button', { name: 'Entrar neste navio' }).first().click()
  await expect(ana.getByRole('button', { name: 'Você está aqui' })).toBeVisible()
  await leo.getByRole('button', { name: 'Entrar neste navio' }).first().click()
  await rafa.getByRole('button', { name: 'Entrar neste navio' }).nth(1).click()
  await expect(ana.getByText('O Navio Safira precisa de pelo menos 2 jogadores')).toBeVisible()
  await duda.getByRole('button', { name: 'Entrar neste navio' }).nth(1).click()
  await expect(ana.getByRole('button', { name: 'Zarpar!' })).toBeEnabled()
  await expect(leo.getByRole('button', { name: 'Zarpar!' })).toBeDisabled()
  await ana.getByRole('button', { name: 'Zarpar!' }).click()
  for (const p of ps) await expect(p.getByText('Capitães sorteados')).toBeVisible()
  for (const p of ps) await fecharModais(p)

  const byId = await porId(ps)
  let v = await view(ana)
  const ship = v.game.ships.find((s: any) => s.id === v.game.turn.shipId)
  const cap = byId[ship.captainId]
  const marujo = byId[v.players.find((p: any) => p.shipId === ship.id && p.id !== ship.captainId).id]

  // o Capitão vê o mapa, o Marujo não
  const vCap = (await view(cap)).game
  expect(vCap.cards.every((c: any) => c.owner)).toBe(true)
  expect((await view(marujo)).game.cards.every((c: any) => c.owner === null)).toBe(true)

  // dica inválida é recusada na hora
  const palavra = vCap.cards[0].word
  await cap.getByPlaceholder('Digite a dica (uma palavra)').fill(palavra)
  await cap.getByRole('button', { name: 'Dar ordem' }).click()
  await expect(cap.getByText(/está no tabuleiro/)).toBeVisible()
  await cap.getByPlaceholder('Digite a dica (uma palavra)').fill('Zarabatana')
  await cap.getByRole('button', { name: 'Dar ordem' }).click()
  await expect(marujo.getByText('ZARABATANA · 1').first()).toBeVisible()

  // o Marujo clica num tesouro do navio: contagem de 3 s e revelação
  const alvo = vCap.cards.findIndex((c: any) => c.owner === ship.id)
  await marujo.getByRole('button', { name: vCap.cards[alvo].word, exact: true }).click()
  await expect.poll(async () => (await view(ana)).game.cards[alvo].revealed, { timeout: 8000 }).toBe(true)

  // Tiro de Canhão liberado; o tiro no Kraken afunda o navio e, com 2 navios, o outro vence
  await expect(marujo.getByText('Vocês acertaram todas as palavras da ordem!')).toBeVisible()
  await marujo.getByRole('button', { name: 'Disparar canhão' }).last().click()
  const kraken = vCap.cards.findIndex((c: any) => c.owner === 'kraken')
  await marujo.getByRole('button', { name: vCap.cards[kraken].word, exact: true }).click()
  await expect.poll(async () => (await view(ana)).phase, { timeout: 8000 }).toBe('finished')
  await expect(ana.getByText(/Vitória do Navio/)).toBeVisible()
  await expect(ana.getByText('Diário completo')).toBeVisible()

  // copiar resumo e voltar ao salão
  await ana.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await ana.getByRole('button', { name: 'Copiar resumo' }).click()
  await expect(ana.getByText('Resumo copiado! Cole no Discord.')).toBeVisible()
  await expect(leo.getByRole('button', { name: 'Esperando o Almirante' })).toBeDisabled()
  await ana.getByRole('button', { name: 'Voltar ao salão' }).click()
  for (const p of ps) await expect(p.getByText('Salão de espera')).toBeVisible()
  v = await view(leo)
  expect(v.code).toBe(code)
  expect(v.players.filter((p: any) => p.shipId).length).toBe(4)
})

test('poderes do Almirante: configurar, expulsar, pausar, passar o cargo e encerrar', async ({ browser }) => {
  const { ps } = await mesa(browser, ['Ana', 'Léo', 'Rafa', 'Duda', 'Bia'])
  const [ana, leo, rafa, duda, bia] = ps
  await act(ana, { type: 'chooseShip', shipId: 'rubi' })
  await act(leo, { type: 'chooseShip', shipId: 'rubi' })
  await act(rafa, { type: 'chooseShip', shipId: 'safira' })
  await act(duda, { type: 'chooseShip', shipId: 'safira' })

  // configurações (só o Almirante)
  await ana.getByRole('button', { name: 'Editar' }).click()
  await expect(ana.getByText('Configurações da sala')).toBeVisible()
  await ana.getByRole('button', { name: 'Rápido' }).click()
  await ana.getByRole('button', { name: 'Salvar' }).click()
  await expect.poll(async () => (await view(leo)).config.preset).toBe('rapido')
  expect(await act(leo, { type: 'updateConfig', patch: { preset: 'classico' } })).toBe(false)

  // expulsar a Bia pelo menu do jogador
  await ana.getByRole('button', { name: /^Bia/ }).click()
  await ana.getByRole('button', { name: 'Expulsar' }).click()
  await ana.getByRole('button', { name: 'Expulsar' }).last().click()
  await expect(bia.getByText('Removido da sala')).toBeVisible()
  await bia.reload()
  await expect(bia.getByText('Removido da sala')).toBeVisible()

  // zarpar, pausar e retomar
  await act(ana, { type: 'start' })
  for (const p of ps.slice(0, 4)) await fecharModais(p)
  await ana.getByRole('button', { name: 'Menu do Almirante' }).click()
  await ana.getByRole('button', { name: /Pausar partida/ }).click()
  await expect(leo.getByText('Partida pausada', { exact: true }).first()).toBeVisible()
  await ana.getByRole('button', { name: 'Retomar' }).click()
  await expect(leo.getByText('Partida pausada', { exact: true })).toHaveCount(0)

  // passar o cargo e conferir que o antigo Almirante perde o poder
  const leoId = (await view(leo)).you
  expect(await act(ana, { type: 'transferAdmin', playerId: leoId })).toBe(true)
  await expect.poll(async () => (await view(leo)).adminId).toBe(leoId)
  expect(await act(ana, { type: 'endGame' })).toBe(false)

  // o novo Almirante encerra a partida
  await leo.getByRole('button', { name: 'Menu do Almirante' }).click()
  await leo.getByRole('button', { name: /Encerrar partida/ }).click()
  await leo.getByRole('button', { name: 'Encerrar', exact: true }).click()
  await expect(ana.getByText('Partida encerrada', { exact: true }).first()).toBeVisible()
})

test('Gaivota no meio da partida e reconexão ao recarregar', async ({ browser }) => {
  const { ps, code } = await mesa(browser)
  const [ana, leo, rafa, duda] = ps
  const navios: [typeof ana, string][] = [
    [ana, 'rubi'],
    [leo, 'rubi'],
    [rafa, 'safira'],
    [duda, 'safira'],
  ]
  for (const [p, s] of navios) await act(p, { type: 'chooseShip', shipId: s })
  await act(ana, { type: 'start' })
  const caio = await jogador(browser, 'Caio', 'gaivota')
  await entrar(caio, code)
  await expect(caio.getByText('Partida em andamento')).toBeVisible()
  const vc = await view(caio)
  expect(vc.game.me.role).toBe('gaivota')
  expect(vc.game.cards.every((c: any) => c.owner === null)).toBe(true)

  // recarregar a página volta para o mesmo lugar e papel
  const antes = (await view(leo)).game.me
  await leo.reload()
  await expect.poll(async () => (await view(leo))?.game?.me?.role, { timeout: 15000 }).toBe(antes.role)
  expect((await view(leo)).game.me.shipId).toBe(antes.shipId)
})

test('início: código inválido e sala inexistente', async ({ browser }) => {
  const p = await jogador(browser, 'Zé')
  await p.goto('/')
  await p.getByPlaceholder('Código da sala').fill('ABC')
  await p.getByRole('button', { name: 'Entrar na Sala' }).click()
  await expect(p.getByText(/O código tem 6 letras/)).toBeVisible()
  await p.getByPlaceholder('Código da sala').fill('ZZZZ99')
  await p.getByRole('button', { name: 'Entrar na Sala' }).click()
  await expect(p.getByText(/Não achamos essa sala/)).toBeVisible()
  await p.goto('/sala/ZZZZ99')
  await expect(p.getByText('Sala encerrada')).toBeVisible()
})

test('música troca com a tela: porto no salão, alto-mar na partida, vinheta no fim', async ({ browser }) => {
  const { ps } = await mesa(browser)
  const [ana, leo, rafa, duda] = ps
  const musica = () => ana.evaluate(() => (window as any).__audio.musica())
  await ana.mouse.click(5, 5) // o navegador só libera o áudio depois de um gesto
  await expect.poll(musica).toBe('porto')
  const navios: [typeof ana, string][] = [[ana, 'rubi'], [leo, 'rubi'], [rafa, 'safira'], [duda, 'safira']]
  for (const [p, s] of navios) await act(p, { type: 'chooseShip', shipId: s })
  await act(ana, { type: 'start' })
  await expect.poll(musica).toBe('alto-mar')
  await act(ana, { type: 'endGame' })
  await expect.poll(musica).toMatch(/vitoria|derrota/)
})
