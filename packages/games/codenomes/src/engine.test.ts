import { describe, expect, it } from 'vitest'
import { type GameContext, type Player, type ShipId, seeded } from '@arena/platform'
import { PALAVRAS } from '@arena/words'
import { codenomes, canStart } from './index'
import { defaultConfig, gridFor, updateConfig } from './config'
import { validateClue } from './clue'
import { type CodenomesAction, type CodenomesState, CAPTAIN_WAIT_MS, tick, treasuresLeft } from './engine'

function player(id: string, shipId: ShipId | null, now = 0): Player {
  return { id, name: id, avatar: 'papagaio', shipId, connected: true, lastSeen: now, joinedAt: now }
}

function table(ships: ShipId[], perShip = 3) {
  const players: Record<string, Player> = {}
  for (const s of ships) for (let i = 0; i < perShip; i++) players[`${s}${i}`] = player(`${s}${i}`, s)
  return players
}

function start(shipCount = 2, perShip = 3, seed = 1, patch = {}) {
  const config = updateConfig(defaultConfig(), { shipCount, ...patch })
  const ships = (['rubi', 'safira', 'esmeralda', 'ouro'] as ShipId[]).slice(0, shipCount)
  const players = table(ships, perShip)
  const rng = seeded(seed)
  const ctx: GameContext = { now: 1000, rng, players }
  const { state } = codenomes.setup(config, Object.values(players), ctx, undefined, {})
  return { state, ctx, players, config }
}

function crewOf(state: CodenomesState, ctx: GameContext) {
  const ship = state.ships.find((s) => s.id === state.turn.shipId)!
  return Object.values(ctx.players).filter((p) => p.shipId === ship.id && p.id !== ship.captainId)
}

function act(state: CodenomesState, ctx: GameContext, id: string, action: CodenomesAction): CodenomesState {
  expect(codenomes.validate(state, id, action, ctx)).toBeNull()
  return codenomes.apply(state, id, action, ctx).state
}

/** Um Marujo marca as cartas e todos confirmam (ou todos pedem para encerrar). */
function voteAll(state: CodenomesState, ctx: GameContext, target: number | number[] | 'end'): CodenomesState {
  const crew = crewOf(state, ctx)
  if (target === 'end') {
    for (const p of crew) state = act(state, ctx, p.id, { type: 'end', value: true })
    return state
  }
  for (const c of Array.isArray(target) ? target : [target]) state = act(state, ctx, crew[0].id, { type: 'select', card: c })
  for (const p of crew) state = act(state, ctx, p.id, { type: 'confirm', value: true })
  return state
}

function clue(state: CodenomesState, ctx: GameContext, word: string, count: number) {
  const cap = state.ships.find((s) => s.id === state.turn.shipId)!.captainId!
  expect(codenomes.validate(state, cap, { type: 'giveClue', word, count }, ctx)).toBeNull()
  return codenomes.apply(state, cap, { type: 'giveClue', word, count }, ctx).state
}

const own = (s: CodenomesState) => s.cards.findIndex((c) => c.owner === s.turn.shipId && !c.revealed)
const ofType = (s: CodenomesState, o: string) => s.cards.findIndex((c) => c.owner === o && !c.revealed)

describe('banco de palavras', () => {
  it('tem pelo menos 400 gerais e 100 temáticas', () => {
    expect(PALAVRAS.geral.length).toBeGreaterThanOrEqual(400)
    expect(PALAVRAS.mar.length).toBeGreaterThanOrEqual(100)
  })
})

describe('tabuleiro', () => {
  it('reproduz o preset Clássico', () => {
    const g2 = gridFor(updateConfig(defaultConfig(), { shipCount: 2 }))
    const g3 = gridFor(updateConfig(defaultConfig(), { shipCount: 3 }))
    const g4 = gridFor(updateConfig(defaultConfig(), { shipCount: 4 }))
    expect([g2.cols, g2.rows, g2.sea, g2.kraken]).toEqual([5, 5, 7, 1])
    expect([g3.cols, g3.rows, g3.sea, g3.kraken]).toEqual([6, 6, 9, 2])
    expect([g4.cols, g4.rows, g4.sea, g4.kraken]).toEqual([7, 7, 14, 2])
  })

  it('distribui os tesouros com 1 a mais para quem começa', () => {
    const { state } = start(3)
    expect(state.cards).toHaveLength(36)
    for (const s of state.ships) expect(s.total).toBe(s.id === state.firstShip ? 9 : 8)
    expect(state.cards.filter((c) => c.owner === 'kraken')).toHaveLength(2)
    expect(new Set(state.cards.map((c) => c.word)).size).toBe(36)
    expect(state.turn.shipId).toBe(state.firstShip)
  })

  it('exige 2 jogadores por navio', () => {
    const config = defaultConfig()
    expect(canStart(config, [player('a', 'rubi'), player('b', 'rubi'), player('c', 'safira')])).toMatch(/Safira/)
    expect(canStart(config, [player('a', 'rubi'), player('b', 'rubi'), player('c', 'safira'), player('d', 'safira')])).toBeNull()
  })

  it('tamanho fixo: tesouros proporcionais ao tabuleiro', () => {
    const fixo = (shipCount: number, boardSize: 5 | 10) => gridFor(updateConfig(defaultConfig(), { shipCount, boardSize }))
    expect(fixo(2, 5)).toMatchObject({ cols: 5, rows: 5, treasures: 8, first: 9, sea: 7 })
    expect(fixo(4, 5)).toMatchObject({ cols: 5, rows: 5, treasures: 3, first: 4 })
    expect(fixo(2, 10)).toMatchObject({ cols: 10, rows: 10, treasures: 36 })
    const pers = gridFor(updateConfig(defaultConfig(), { boardSize: 'custom', boardCols: 8, boardRows: 4 }))
    expect([pers.cols, pers.rows, pers.total]).toEqual([8, 4, 32])
    for (const g of [fixo(2, 5), fixo(4, 5), fixo(2, 10), pers]) expect(g.sea).toBeGreaterThan(0)
  })

  it('sem bônus, quem começa tem os mesmos tesouros', () => {
    const { state } = start(2, 3, 1, { firstBonus: false })
    for (const s of state.ships) expect(s.total).toBe(8)
    const g = gridFor(updateConfig(defaultConfig(), { firstBonus: false }))
    expect(g.first).toBe(g.treasures)
  })

  it('personalizado avisa quando há pouco Mar Aberto', () => {
    const c = updateConfig(updateConfig(defaultConfig(), { preset: 'personalizado', shipCount: 4 }), { treasuresPerShip: 10, krakenCount: 2 })
    const g = gridFor(c)
    expect(g.total).toBeGreaterThanOrEqual(43)
    expect(g.seaWarning).toBe(true)
  })
})

describe('validação da dica', () => {
  const board = ['Mar', 'Navio', 'Marinha', 'Ponte']
  it('aplica as regras da seção 9.3', () => {
    expect(validateClue('barco velho', 1, board, 5)).toMatch(/uma palavra/)
    expect(validateClue('r2d2', 1, board, 5)).toMatch(/letras/)
    expect(validateClue('guarda-chuva', 1, board, 5)).toBeNull()
    expect(validateClue('MAR', 1, board, 5)).toMatch(/tabuleiro/)
    expect(validateClue('MAR', 1, ['Navio'], 5)).toBeNull()
    expect(validateClue('NAVIOS', 1, board, 5)).toMatch(/plural/)
    expect(validateClue('MARINHEIRO', 1, board, 5)).toMatch(/parecida|contida/)
    expect(validateClue('MAREJAR', 1, board, 5)).toBeNull()
    expect(validateClue('ilha', 0, board, 5)).toMatch(/pelo menos 1/)
    expect(validateClue('ilha', 5, board, 4)).toMatch(/até 4/)
    expect(validateClue('ilha', 3, board, 4)).toBeNull()
  })
})

describe('turno', () => {
  it('Tesouro próprio continua, Mar Aberto encerra', () => {
    let { state, ctx } = start()
    const first = state.turn.shipId
    state = clue(state, ctx, 'TESTE', 2)
    expect(state.turn.phase).toBe('guessing')
    state = voteAll(state, ctx, own(state))
    expect(state.turn.shipId).toBe(first)
    expect(state.turn.guessesLeft).toBe(1)
    state = voteAll(state, ctx, ofType(state, 'mar'))
    expect(state.turn.shipId).not.toBe(first)
    expect(state.log[0].end).toBe('mar')
    expect(state.log[0].picks).toHaveLength(2)
  })

  it('acertar tudo libera o Tiro de Canhão, que encerra a vez', () => {
    let { state, ctx } = start()
    const first = state.turn.shipId
    state = clue(state, ctx, 'TESTE', 1)
    state = voteAll(state, ctx, own(state))
    expect(state.turn.phase).toBe('cannon')
    state = voteAll(state, ctx, own(state))
    expect(state.turn.shipId).not.toBe(first)
    expect(state.log[0].picks[1].cannon).toBe(true)
    expect(state.log[0].end).toBe('canhao')
  })

  it('sem canhão, acertar tudo encerra a vez', () => {
    let { state, ctx } = start(2, 3, 1, { cannon: false })
    state = clue(state, ctx, 'TESTE', 1)
    state = voteAll(state, ctx, own(state))
    expect(state.log[0].end).toBe('todos')
  })

  it('só encerra a vez depois do primeiro palpite', () => {
    let { state, ctx } = start()
    state = clue(state, ctx, 'TESTE', 2)
    const ship = state.ships.find((s) => s.id === state.turn.shipId)!
    const marujo = Object.values(ctx.players).find((p) => p.shipId === ship.id && p.id !== ship.captainId)!
    expect(codenomes.validate(state, marujo.id, { type: 'end', value: true }, ctx)).toMatch(/pelo menos uma/)
    expect(codenomes.validate(state, ship.captainId!, { type: 'select', card: 0 }, ctx)).toMatch(/Marujos/)
    expect(codenomes.validate(state, marujo.id, { type: 'confirm', value: true }, ctx)).toMatch(/Marquem/)
  })

  it('marcar uma carta não abre nada: precisa da confirmação de todos', () => {
    let { state, ctx } = start(2, 4)
    state = clue(state, ctx, 'TESTE', 2)
    const crew = crewOf(state, ctx)
    const t = own(state)
    state = act(state, ctx, crew[1].id, { type: 'select', card: t })
    expect(state.turn.selection).toEqual([t])
    state = act(state, ctx, crew[0].id, { type: 'confirm', value: true })
    state = act(state, ctx, crew[1].id, { type: 'confirm', value: true })
    ctx.now += 60_000
    state = tick(state, ctx).state
    expect(state.cards[t].revealed).toBe(false)
    state = act(state, ctx, crew[2].id, { type: 'confirm', value: true })
    expect(state.cards[t].revealed).toBe(true)
  })

  it('mexer na seleção zera as confirmações', () => {
    let { state, ctx } = start(2, 3)
    state = clue(state, ctx, 'TESTE', 2)
    const crew = crewOf(state, ctx)
    state = act(state, ctx, crew[0].id, { type: 'select', card: own(state) })
    state = act(state, ctx, crew[0].id, { type: 'confirm', value: true })
    expect(state.turn.confirms).toEqual([crew[0].id])
    state = act(state, ctx, crew[1].id, { type: 'select', card: ofType(state, 'mar') })
    expect(state.turn.confirms).toEqual([])
    expect(state.turn.selection).toHaveLength(2)
  })

  it('o limite de marcas é o número da ordem', () => {
    let { state, ctx } = start(2, 3)
    state = clue(state, ctx, 'TESTE', 2)
    const crew = crewOf(state, ctx)
    const livres = state.cards.map((_, i) => i)
    state = act(state, ctx, crew[0].id, { type: 'select', card: livres[0] })
    state = act(state, ctx, crew[0].id, { type: 'select', card: livres[1] })
    expect(codenomes.validate(state, crew[0].id, { type: 'select', card: livres[2] }, ctx)).toMatch(/2 palavras/)
    // desmarcar libera
    state = act(state, ctx, crew[0].id, { type: 'select', card: livres[1] })
    expect(state.turn.selection).toEqual([livres[0]])
  })

  it('abre na ordem marcada e para no primeiro erro', () => {
    let { state, ctx } = start()
    const first = state.turn.shipId
    state = clue(state, ctx, 'TESTE', 3)
    const a = own(state)
    const mar = ofType(state, 'mar')
    const b = state.cards.findIndex((c, i) => c.owner === first && !c.revealed && i !== a)
    state = voteAll(state, ctx, [a, mar, b])
    expect(state.cards[a].revealed).toBe(true)
    expect(state.cards[mar].revealed).toBe(true)
    expect(state.cards[b].revealed).toBe(false)
    expect(state.turn.shipId).not.toBe(first)
    expect(state.log[0].picks.map((p) => p.card)).toEqual([a, mar])
  })

  it('confirmar 1 de 3 e acertar mantém a vez com 2 palpites', () => {
    let { state, ctx } = start()
    const first = state.turn.shipId
    state = clue(state, ctx, 'TESTE', 3)
    state = voteAll(state, ctx, own(state))
    expect(state.turn.shipId).toBe(first)
    expect(state.turn.guessesLeft).toBe(2)
    expect(state.turn.selection).toEqual([])
    expect(state.turn.confirms).toEqual([])
  })

  it('encerrar a vez precisa de todos', () => {
    let { state, ctx } = start(2, 3)
    const first = state.turn.shipId
    state = clue(state, ctx, 'TESTE', 3)
    state = voteAll(state, ctx, own(state))
    const crew = crewOf(state, ctx)
    state = act(state, ctx, crew[0].id, { type: 'end', value: true })
    expect(state.turn.shipId).toBe(first)
    state = act(state, ctx, crew[1].id, { type: 'end', value: true })
    expect(state.turn.shipId).not.toBe(first)
    expect(state.log[0].end).toBe('encerrou')
  })

  it('quem caiu deixa de contar e os outros completam a confirmação', () => {
    let { state, ctx, players } = start(2, 4)
    state = clue(state, ctx, 'TESTE', 2)
    const crew = crewOf(state, ctx)
    const t = own(state)
    state = act(state, ctx, crew[0].id, { type: 'select', card: t })
    state = act(state, ctx, crew[0].id, { type: 'confirm', value: true })
    state = act(state, ctx, crew[1].id, { type: 'confirm', value: true })
    players[crew[2].id].connected = false
    players[crew[2].id].lastSeen = ctx.now
    ctx.now += 16_000
    state = tick(state, ctx).state
    expect(state.cards[t].revealed).toBe(true)
  })

  it('Tesouro de outro navio conta para ele e encerra', () => {
    let { state, ctx } = start()
    const first = state.turn.shipId
    const other = state.ships.find((s) => s.id !== first)!.id
    state = clue(state, ctx, 'TESTE', 3)
    const before = treasuresLeft(state, other)
    state = voteAll(state, ctx, ofType(state, other))
    expect(treasuresLeft(state, other)).toBe(before - 1)
    expect(state.turn.shipId).toBe(other)
    expect(state.log[0].end).toBe('outro')
  })
})

describe('Kraken e vitória', () => {
  it('Kraken elimina o navio e, com 2 navios, o outro vence', () => {
    let { state, ctx } = start()
    const first = state.turn.shipId
    state = clue(state, ctx, 'TESTE', 1)
    state = voteAll(state, ctx, ofType(state, 'kraken'))
    expect(state.ships.find((s) => s.id === first)!.eliminated).toBe(true)
    expect(state.finishReason).toBe('sobrevivencia')
    expect(state.winner).not.toBe(first)
  })

  it('com 3 navios o jogo segue e o navio afundado é pulado', () => {
    let { state, ctx } = start(3)
    const first = state.turn.shipId
    state = clue(state, ctx, 'TESTE', 1)
    state = voteAll(state, ctx, ofType(state, 'kraken'))
    expect(state.finishReason).toBeNull()
    for (let i = 0; i < 4; i++) {
      expect(state.turn.shipId).not.toBe(first)
      state = clue(state, ctx, 'TESTE', 1)
      state = voteAll(state, ctx, ofType(state, 'mar'))
    }
  })

  it('o primeiro navio com todos os Tesouros revelados vence', () => {
    let { state, ctx } = start()
    const first = state.turn.shipId
    let guard = 0
    while (!state.finishReason && guard++ < 50) {
      const left = treasuresLeft(state, state.turn.shipId)
      state = clue(state, ctx, 'TESTE', left)
      while (state.turn.phase === 'guessing' && !state.finishReason) state = voteAll(state, ctx, own(state))
    }
    expect(state.finishReason).toBe('tesouros')
    expect(state.winner).toBe(first)
  })
})

describe('relógio e reconexão', () => {
  it('tempo do Capitão esgotado: o navio perde a vez', () => {
    let { state, ctx } = start()
    const first = state.turn.shipId
    ctx.now += 91_000
    state = tick(state, ctx).state
    expect(state.turn.shipId).not.toBe(first)
    expect(state.log[0].end).toBe('tempoCapitao')
  })

  it('Capitão caiu: relógio pausa e, depois de 60 s, outro assume', () => {
    let { state, ctx, players } = start(2, 3)
    const ship = state.ships.find((s) => s.id === state.turn.shipId)!
    const cap = players[ship.captainId!]
    cap.connected = false
    cap.lastSeen = ctx.now
    state = tick(state, ctx).state
    expect(state.turn.deadline).toBeNull()
    expect(state.turn.frozen).toBeGreaterThan(0)
    ctx.now += CAPTAIN_WAIT_MS + 1
    state = tick(state, ctx).state
    const after = state.ships.find((s) => s.id === ship.id)!
    expect(after.captainId).not.toBe(cap.id)
    expect(after.benched).toContain(cap.id)
    expect(state.turn.deadline).not.toBeNull()
  })

  it('pausa congela o relógio', () => {
    let { state, ctx } = start()
    const deadline = state.turn.deadline!
    state = codenomes.pause(state, ctx, true, 'Ana')
    ctx.now += 200_000
    expect(tick(state, ctx).changed).toBe(false)
    state = codenomes.pause(state, ctx, false, 'Ana')
    expect(state.turn.deadline).toBe(deadline + 200_000)
  })
})

describe('visão filtrada', () => {
  it('Marujos não recebem o mapa; Capitães recebem', () => {
    const { state, ctx } = start()
    const ship = state.ships[0]
    const marujo = Object.values(ctx.players).find((p) => p.shipId === ship.id && p.id !== ship.captainId)!
    const vm = codenomes.viewFor(state, marujo.id, ctx)
    expect(vm.cards.every((c) => c.owner === null)).toBe(true)
    expect(vm.me.role).toBe('marujo')
    const vc = codenomes.viewFor(state, ship.captainId, ctx)
    expect(vc.cards.every((c) => c.owner !== null)).toBe(true)
    const vg = codenomes.viewFor(state, null, ctx)
    expect(vg.me.role).toBe('gaivota')
    expect(vg.cards.every((c) => c.owner === null)).toBe(true)
  })
})
