import {
  type GameContext,
  type GameEvent,
  type Player,
  type ShipId,
  type StepResult,
  SHIP_IDS,
  SHIP_INFO,
  pick,
  shuffle,
} from '@arena/platform'
import { type Card, type Owner, generateBoard } from './board'
import { validateClue } from './clue'
import { type CodenomesConfig, shipName } from './config'

/** Contagem antes de revelar a palavra votada pela maioria (3.4). */
export const REVEAL_DELAY_MS = 3000
/** Quanto o relógio espera um Capitão que caiu antes de sortear outro (6.5). */
export const CAPTAIN_WAIT_MS = 60_000
/** Uma queda curta (recarregar a página) não tira o jogador da contagem. */
export const PRESENCE_GRACE_MS = 15_000

export type Vote = number | 'end'
export type TurnPhase = 'clue' | 'guessing' | 'cannon'

export type ShipState = {
  id: ShipId
  name: string
  captainId: string | null
  captainName: string
  eliminated: boolean
  total: number
  /** ex-Capitães que voltaram depois de substituídos: Marujos sem voto */
  benched: string[]
}

export type Turn = {
  number: number
  shipId: ShipId
  phase: TurnPhase
  clue: { word: string; count: number } | null
  guessesLeft: number
  correct: number
  guesses: number
  votes: Record<string, Vote>
  pending: { target: Vote; at: number } | null
  deadline: number | null
  /** tempo que faltava quando o relógio parou porque o Capitão caiu */
  frozen: number | null
  captainAwaySince: number | null
}

export type EndReason =
  | 'mar'
  | 'outro'
  | 'eliminado'
  | 'kraken'
  | 'encerrou'
  | 'tempo'
  | 'tempoCapitao'
  | 'todos'
  | 'canhao'
  | 'semCanhao'
  | 'semMarujos'
  | 'vitoria'
  | 'encerrada'

export type Pick = { word: string; card: number; owner: Owner; cannon: boolean }

export type LogEntry = {
  number: number
  shipId: ShipId
  captainId: string | null
  captainName: string
  clue: { word: string; count: number } | null
  picks: Pick[]
  end: EndReason | null
  notes: string[]
}

export type CodenomesState = {
  cols: number
  rows: number
  cards: Card[]
  ships: ShipState[]
  turnOrder: ShipId[]
  firstShip: ShipId
  turn: Turn
  log: LogEntry[]
  winner: ShipId | null
  finishReason: 'tesouros' | 'sobrevivencia' | 'encerrada' | null
  paused: number | null
  startedAt: number
  finishedAt: number | null
  settings: { cannon: boolean; captainTime: number | null; crewTime: number | null }
}

export type CodenomesAction = { type: 'giveClue'; word: string; count: number } | { type: 'vote'; target: Vote | null }

export type CodenomesMemory = {
  recentWords: string[][]
  lastCaptains: Partial<Record<ShipId, string>>
}

// ---------------------------------------------------------------- ajudantes

export function shipOf(state: CodenomesState, id: ShipId): ShipState {
  return state.ships.find((s) => s.id === id)!
}

export function treasuresLeft(state: CodenomesState, id: ShipId): number {
  return state.cards.filter((c) => c.owner === id && !c.revealed).length
}

function members(ctx: GameContext, id: ShipId): Player[] {
  return Object.values(ctx.players).filter((p) => p.shipId === id)
}

function present(p: Player | undefined, now: number): boolean {
  return !!p && (p.connected || now - p.lastSeen < PRESENCE_GRACE_MS)
}

/** Marujos que podem votar: do navio, sem ser o Capitão nem ex-Capitão. */
export function eligibleVoters(state: CodenomesState, ctx: GameContext, id: ShipId): Player[] {
  const ship = shipOf(state, id)
  return members(ctx, id).filter((p) => p.id !== ship.captainId && !ship.benched.includes(p.id))
}

function presentVoters(state: CodenomesState, ctx: GameContext, id: ShipId): Player[] {
  return eligibleVoters(state, ctx, id).filter((p) => present(p, ctx.now))
}

export function majority(n: number): number {
  return Math.floor(n / 2) + 1
}

function current(state: CodenomesState): LogEntry {
  return state.log[state.log.length - 1]
}

function deadlineFor(seconds: number | null, now: number): number | null {
  return seconds ? now + seconds * 1000 : null
}

// ---------------------------------------------------------------- preparação

export function setup(
  config: CodenomesConfig,
  players: Player[],
  ctx: GameContext,
  memory: CodenomesMemory | undefined,
  claims: Partial<Record<ShipId, string>>,
): { state: CodenomesState; memory: CodenomesMemory } {
  const shipIds = SHIP_IDS.slice(0, config.shipCount)
  const first = pick(shipIds, ctx.rng)!
  const idx = shipIds.indexOf(first)
  const turnOrder = [...shipIds.slice(idx), ...shipIds.slice(0, idx)]
  const recent = (memory?.recentWords ?? []).flat()
  const { cards, cols, rows } = generateBoard(config, shipIds, first, recent, ctx.rng)
  const lastCaptains = memory?.lastCaptains ?? {}

  const ships: ShipState[] = shipIds.map((id) => {
    const crew = players.filter((p) => p.shipId === id)
    let captain: Player | undefined
    const claimed = claims[id] ? crew.find((p) => p.id === claims[id]) : undefined
    if (config.captainMode === 'escolha' && claimed) captain = claimed
    else if (config.captainRotation === 'manter' && lastCaptains[id])
      captain = crew.find((p) => p.id === lastCaptains[id])
    if (!captain) {
      const others = crew.filter((p) => p.id !== lastCaptains[id])
      const pool = config.captainRotation === 'trocar' && others.length > 0 ? others : crew
      captain = pick(shuffle(pool, ctx.rng), ctx.rng)
    }
    return {
      id,
      name: shipName(config, id, SHIP_INFO[id].nome),
      captainId: captain?.id ?? null,
      captainName: captain?.name ?? '',
      eliminated: false,
      total: cards.filter((c) => c.owner === id).length,
      benched: [],
    }
  })

  const firstShip = ships.find((s) => s.id === first)!
  const state: CodenomesState = {
    cols,
    rows,
    cards,
    ships,
    turnOrder,
    firstShip: first,
    turn: newTurn(1, first, config.captainTime, ctx.now),
    log: [newEntry(1, firstShip)],
    winner: null,
    finishReason: null,
    paused: null,
    startedAt: ctx.now,
    finishedAt: null,
    settings: { cannon: config.cannon, captainTime: config.captainTime, crewTime: config.crewTime },
  }
  const newMemory: CodenomesMemory = {
    recentWords: [...(memory?.recentWords ?? []), cards.map((c) => c.word)].slice(-3),
    lastCaptains: Object.fromEntries(ships.map((s) => [s.id, s.captainId ?? undefined])),
  }
  return { state, memory: newMemory }
}

function newTurn(number: number, shipId: ShipId, captainTime: number | null, now: number): Turn {
  return {
    number,
    shipId,
    phase: 'clue',
    clue: null,
    guessesLeft: 0,
    correct: 0,
    guesses: 0,
    votes: {},
    pending: null,
    deadline: deadlineFor(captainTime, now),
    frozen: null,
    captainAwaySince: null,
  }
}

function newEntry(number: number, ship: ShipState): LogEntry {
  return {
    number,
    shipId: ship.id,
    captainId: ship.captainId,
    captainName: ship.captainName,
    clue: null,
    picks: [],
    end: null,
    notes: [],
  }
}

// ---------------------------------------------------------------- validação

export function validate(state: CodenomesState, playerId: string, action: CodenomesAction, ctx: GameContext): string | null {
  if (state.finishReason) return 'A partida já acabou.'
  if (state.paused) return 'A partida está pausada.'
  const turn = state.turn
  const ship = shipOf(state, turn.shipId)
  switch (action.type) {
    case 'giveClue': {
      if (ship.captainId !== playerId) return 'Só o Capitão da vez dá a ordem.'
      if (turn.phase !== 'clue') return 'A ordem já foi dada.'
      const hidden = state.cards.filter((c) => !c.revealed).map((c) => c.word)
      return validateClue(String(action.word ?? ''), Number(action.count), hidden, treasuresLeft(state, ship.id))
    }
    case 'vote': {
      if (turn.phase === 'clue') return 'Esperem a ordem do Capitão.'
      const voter = eligibleVoters(state, ctx, ship.id).some((p) => p.id === playerId)
      if (!voter) return 'Só os Marujos do navio da vez votam.'
      const t = action.target
      if (t === null) return null
      if (t === 'end') {
        if (turn.phase === 'guessing' && turn.guesses < 1) return 'Escolham pelo menos uma palavra antes de encerrar.'
        return null
      }
      if (typeof t !== 'number' || !Number.isInteger(t) || t < 0 || t >= state.cards.length) return 'Carta inválida.'
      if (state.cards[t].revealed) return 'Essa carta já foi revelada.'
      return null
    }
  }
  return 'Ação desconhecida.'
}

// ---------------------------------------------------------------- jogadas

type Draft = { s: CodenomesState; ctx: GameContext; events: GameEvent[] }

export function apply(state: CodenomesState, playerId: string, action: CodenomesAction, ctx: GameContext): StepResult<CodenomesState> {
  const d: Draft = { s: structuredClone(state), ctx, events: [] }
  const { s } = d
  if (action.type === 'giveClue') {
    const word = action.word.trim().toUpperCase()
    s.turn.clue = { word, count: action.count }
    s.turn.phase = 'guessing'
    s.turn.guessesLeft = action.count
    s.turn.deadline = deadlineFor(s.settings.crewTime, ctx.now)
    s.turn.frozen = null
    s.turn.captainAwaySince = null
    current(s).clue = { word, count: action.count }
  } else if (action.type === 'vote') {
    if (action.target === null) delete s.turn.votes[playerId]
    else s.turn.votes[playerId] = action.target
    recomputePending(d)
    // navio com um Marujo só também espera os 3 s; a revelação acontece no tick
  }
  return { state: s, events: d.events, changed: true }
}

function recomputePending(d: Draft): boolean {
  const { s, ctx } = d
  const turn = s.turn
  if (turn.phase === 'clue') {
    const had = turn.pending !== null
    turn.pending = null
    return had
  }
  const voters = presentVoters(s, ctx, turn.shipId)
  const need = majority(voters.length)
  const counts = new Map<Vote, number>()
  for (const v of voters) {
    const t = turn.votes[v.id]
    if (t === undefined) continue
    counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  let winner: Vote | null = null
  if (voters.length > 0) for (const [t, n] of counts) if (n >= need) winner = t
  const before = JSON.stringify(turn.pending)
  if (winner === null) turn.pending = null
  else if (!turn.pending || turn.pending.target !== winner) turn.pending = { target: winner, at: ctx.now + REVEAL_DELAY_MS }
  return JSON.stringify(turn.pending) !== before
}

function executePending(d: Draft) {
  const { s } = d
  const target = s.turn.pending!.target
  s.turn.pending = null
  s.turn.votes = {}
  if (target === 'end') endTurn(d, s.turn.phase === 'cannon' ? 'semCanhao' : 'encerrou')
  else reveal(d, target)
}

function reveal(d: Draft, index: number) {
  const { s, ctx, events } = d
  const turn = s.turn
  const card = s.cards[index]
  if (card.revealed) return
  const cannon = turn.phase === 'cannon'
  card.revealed = true
  card.revealedBy = turn.shipId
  card.turn = turn.number
  turn.guesses++
  current(s).picks.push({ word: card.word, card: index, owner: card.owner, cannon })
  events.push({ type: 'reveal', card: index, owner: card.owner, shipId: turn.shipId })

  if (card.owner === 'mar') return endTurn(d, cannon ? 'canhao' : 'mar')
  if (card.owner === 'kraken') {
    const ship = shipOf(s, turn.shipId)
    ship.eliminated = true
    current(s).notes.push(`O Navio ${ship.name} afundou`)
    events.push({ type: 'eliminated', shipId: ship.id })
    const alive = s.ships.filter((x) => !x.eliminated)
    if (alive.length === 1) return finish(d, alive[0].id, 'sobrevivencia')
    return endTurn(d, 'kraken')
  }
  const owner = shipOf(s, card.owner)
  if (owner.eliminated) return endTurn(d, cannon ? 'canhao' : 'eliminado')
  if (treasuresLeft(s, owner.id) === 0) return finish(d, owner.id, 'tesouros')
  if (owner.id !== turn.shipId) return endTurn(d, cannon ? 'canhao' : 'outro')
  if (cannon) return endTurn(d, 'canhao')
  turn.correct++
  turn.guessesLeft--
  if (turn.guessesLeft <= 0) {
    if (s.settings.cannon) {
      turn.phase = 'cannon'
      turn.votes = {}
      turn.pending = null
    } else endTurn(d, 'todos')
  }
}

function finish(d: Draft, winner: ShipId | null, reason: 'tesouros' | 'sobrevivencia' | 'encerrada') {
  const { s, ctx, events } = d
  s.winner = winner
  s.finishReason = reason
  s.finishedAt = ctx.now
  s.turn.deadline = null
  s.turn.pending = null
  s.turn.votes = {}
  const entry = current(s)
  if (!entry.end) entry.end = reason === 'encerrada' ? 'encerrada' : 'vitoria'
  if (winner) entry.notes.push(`O Navio ${shipOf(s, winner).name} venceu!`)
  else if (reason === 'encerrada') entry.notes.push('Partida encerrada pelo Almirante')
  events.push({ type: 'victory', shipId: winner })
}

function endTurn(d: Draft, reason: EndReason) {
  const { s, ctx, events } = d
  current(s).end = reason
  const alive = s.turnOrder.filter((id) => !shipOf(s, id).eliminated)
  if (alive.length === 0) return finish(d, null, 'encerrada')
  const start = s.turnOrder.indexOf(s.turn.shipId)
  const ordered: ShipId[] = []
  for (let i = 1; i <= s.turnOrder.length; i++) {
    const id = s.turnOrder[(start + i) % s.turnOrder.length]
    if (!shipOf(s, id).eliminated) ordered.push(id)
  }
  // pula navios sem Marujos conectados, se algum outro tiver (6.5)
  const next = ordered.find((id) => presentVoters(s, ctx, id).length > 0) ?? ordered[0]
  ensureCaptain(d, next)
  const ship = shipOf(s, next)
  s.turn = newTurn(s.turn.number + 1, next, s.settings.captainTime, ctx.now)
  s.log.push(newEntry(s.turn.number, ship))
  events.push({ type: 'turn', shipId: next })
}

/** Garante que o navio tem um Capitão que ainda está nele. */
function ensureCaptain(d: Draft, id: ShipId): boolean {
  const { s, ctx, events } = d
  const ship = shipOf(s, id)
  const cap = ship.captainId ? ctx.players[ship.captainId] : undefined
  if (cap && cap.shipId === id) return false
  const crew = members(ctx, id)
  const candidates = crew.filter((p) => !ship.benched.includes(p.id))
  const connected = candidates.filter((p) => present(p, ctx.now))
  const chosen = pick(connected.length ? connected : candidates, ctx.rng)
  const before = ship.captainId
  ship.captainId = chosen?.id ?? null
  ship.captainName = chosen?.name ?? ''
  if (chosen && chosen.id !== before) {
    events.push({ type: 'captainChanged', shipId: id, playerId: chosen.id })
    if (s.turn?.shipId === id) {
      const entry = current(s)
      entry.captainId = chosen.id
      entry.captainName = chosen.name
      entry.notes.push(`${chosen.name} assumiu como Capitão`)
    }
  }
  return ship.captainId !== before
}

// ---------------------------------------------------------------- relógio

export function tick(state: CodenomesState, ctx: GameContext): StepResult<CodenomesState> {
  if (state.finishReason || state.paused) return { state, events: [], changed: false }
  const d: Draft = { s: structuredClone(state), ctx, events: [] }
  const { s } = d
  let changed = false
  const now = ctx.now

  // Capitães que saíram do navio (expulsos, movidos ou que deixaram a sala)
  for (const ship of s.ships) if (!ship.eliminated && ensureCaptain(d, ship.id)) changed = true

  const turn = s.turn
  const ship = shipOf(s, turn.shipId)

  // Capitão caiu durante a fase da ordem: o relógio pausa por até 60 s
  if (turn.phase === 'clue') {
    const cap = ship.captainId ? ctx.players[ship.captainId] : undefined
    if (cap && !cap.connected) {
      if (turn.captainAwaySince === null) {
        turn.captainAwaySince = now
        turn.frozen = turn.deadline !== null ? Math.max(0, turn.deadline - now) : null
        turn.deadline = null
        changed = true
      } else if (now - turn.captainAwaySince >= CAPTAIN_WAIT_MS) {
        const candidates = presentVoters(s, ctx, ship.id)
        const chosen = pick(candidates, ctx.rng)
        if (chosen) {
          ship.benched.push(cap.id)
          ship.captainId = chosen.id
          ship.captainName = chosen.name
          const entry = current(s)
          entry.captainId = chosen.id
          entry.captainName = chosen.name
          entry.notes.push(`${cap.name} caiu; ${chosen.name} assumiu como Capitão`)
          d.events.push({ type: 'captainChanged', shipId: ship.id, playerId: chosen.id })
          turn.captainAwaySince = null
          turn.frozen = null
          turn.deadline = deadlineFor(s.settings.captainTime, now)
          changed = true
        }
      }
    } else if (turn.captainAwaySince !== null) {
      turn.deadline = turn.frozen !== null ? now + turn.frozen : null
      turn.captainAwaySince = null
      turn.frozen = null
      changed = true
    }
  }

  // navio da vez sem nenhum Marujo presente: a vez é pulada, se outro navio puder jogar
  if (presentVoters(s, ctx, ship.id).length === 0) {
    const others = s.ships.some((x) => !x.eliminated && x.id !== ship.id && presentVoters(s, ctx, x.id).length > 0)
    if (others) {
      current(s).notes.push('Sem Marujos conectados, a vez foi pulada')
      endTurn(d, 'semMarujos')
      return { state: s, events: d.events, changed: true }
    }
  }

  if (recomputePending(d)) changed = true
  if (s.turn.pending && now >= s.turn.pending.at) {
    executePending(d)
    changed = true
  }

  if (!s.finishReason && s.turn.deadline !== null && now >= s.turn.deadline) {
    const phase = s.turn.phase
    d.events.push({ type: 'timeout', shipId: s.turn.shipId, phase })
    endTurn(d, phase === 'clue' ? 'tempoCapitao' : 'tempo')
    changed = true
  }

  return changed ? { state: s, events: d.events, changed } : { state, events: [], changed: false }
}

export function pause(state: CodenomesState, ctx: GameContext, paused: boolean, byName: string): CodenomesState {
  const s = structuredClone(state)
  if (paused && s.paused === null) {
    s.paused = ctx.now
    s.turn.pending = null
    current(s).notes.push(`Partida pausada por ${byName}`)
  } else if (!paused && s.paused !== null) {
    const delta = ctx.now - s.paused
    if (s.turn.deadline !== null) s.turn.deadline += delta
    if (s.turn.captainAwaySince !== null) s.turn.captainAwaySince += delta
    s.paused = null
    current(s).notes.push('Partida retomada')
  }
  return s
}

export function endGame(state: CodenomesState, ctx: GameContext): CodenomesState {
  const d: Draft = { s: structuredClone(state), ctx, events: [] }
  d.s.paused = null
  finish(d, null, 'encerrada')
  return d.s
}
