import type { GameContext, ShipId } from '@arena/platform'
import type { Owner } from './board'
import {
  type CodenomesState,
  type LogEntry,
  type Turn,
  eligibleVoters,
  presentVoters,
  selectionLimit,
  treasuresLeft,
} from './engine'

export type Role = 'capitao' | 'marujo' | 'exCapitao' | 'gaivota'

export type CardView = {
  word: string
  /** null = escondido para quem vê (Marujos e Gaivotas não veem o mapa) */
  owner: Owner | null
  revealed: boolean
  revealedBy: ShipId | null
  turn: number | null
}

export type ShipView = {
  id: ShipId
  name: string
  captainId: string | null
  captainName: string
  eliminated: boolean
  total: number
  left: number
  benched: string[]
}

export type CodenomesView = {
  cols: number
  rows: number
  cards: CardView[]
  ships: ShipView[]
  turnOrder: ShipId[]
  firstShip: ShipId
  turn: Omit<Turn, 'frozen'> & {
    voters: string[]
    /** Marujos presentes: todos precisam confirmar */
    present: string[]
    /** quantas cartas dá para marcar agora */
    limit: number
    frozen: number | null
  }
  log: LogEntry[]
  winner: ShipId | null
  finishReason: CodenomesState['finishReason']
  paused: number | null
  startedAt: number
  finishedAt: number | null
  settings: CodenomesState['settings']
  me: { role: Role; shipId: ShipId | null; seesMap: boolean }
}

export function roleOf(state: CodenomesState, playerId: string | null, ctx: GameContext): { role: Role; shipId: ShipId | null } {
  const p = playerId ? ctx.players[playerId] : undefined
  const ship = p?.shipId ? state.ships.find((s) => s.id === p.shipId) : undefined
  if (!p || !ship || ship.eliminated) return { role: 'gaivota', shipId: ship?.id ?? null }
  if (ship.captainId === p.id) return { role: 'capitao', shipId: ship.id }
  if (ship.benched.includes(p.id)) return { role: 'exCapitao', shipId: ship.id }
  return { role: 'marujo', shipId: ship.id }
}

/** Visão filtrada: o mapa secreto só vai para os Capitães (10.4). */
export function viewFor(state: CodenomesState, playerId: string | null, ctx: GameContext): CodenomesView {
  const { role, shipId } = roleOf(state, playerId, ctx)
  const finished = !!state.finishReason
  const seesMap = role === 'capitao' || finished
  const voters = finished ? [] : eligibleVoters(state, ctx, state.turn.shipId)
  const present = finished ? [] : presentVoters(state, ctx, state.turn.shipId)
  return {
    cols: state.cols,
    rows: state.rows,
    cards: state.cards.map((c) => ({
      word: c.word,
      owner: c.revealed || seesMap ? c.owner : null,
      revealed: c.revealed,
      revealedBy: c.revealedBy,
      turn: c.turn,
    })),
    ships: state.ships.map((s) => ({
      id: s.id,
      name: s.name,
      captainId: s.captainId,
      captainName: s.captainName,
      eliminated: s.eliminated,
      total: s.total,
      left: treasuresLeft(state, s.id),
      benched: s.benched,
    })),
    turnOrder: state.turnOrder,
    firstShip: state.firstShip,
    turn: { ...state.turn, voters: voters.map((v) => v.id), present: present.map((v) => v.id), limit: selectionLimit(state) },
    log: state.log,
    winner: state.winner,
    finishReason: state.finishReason,
    paused: state.paused,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    settings: state.settings,
    me: { role, shipId, seesMap },
  }
}
