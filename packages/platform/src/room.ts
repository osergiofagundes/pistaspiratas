import type { GameContext, GameDefinition, GameEvent, Personagem, Player, ShipId } from './types'
import { PERSONAGENS, SHIP_IDS } from './types'
import { cleanName, pick, shuffle, uniqueName, validateName } from './util'

export const MAX_PLAYERS_HARD = 24
/** Quanto tempo um jogador desconectado fica na sala (6.5). */
export const DISCONNECT_GRACE_MS = 5 * 60_000
/** A sala expira 30 minutos depois que o último jogador sai (6.1). */
export const ROOM_EXPIRY_MS = 30 * 60_000

export type RoomPhase = 'lobby' | 'playing' | 'finished'

export interface BaseConfig {
  shipCount: number
  maxPlayers: number
  allowSpectators: boolean
}

export type Room<C extends BaseConfig = BaseConfig, S = unknown, M = unknown> = {
  code: string
  createdAt: number
  adminId: string | null
  players: Record<string, Player>
  /** token secreto de cada jogador (nunca vai para o cliente) */
  tokens: Record<string, string>
  /** jogadores expulsos: não voltam com o mesmo navegador */
  banned: string[]
  gameId: string
  phase: RoomPhase
  config: C
  game: S | null
  memory: M | undefined
  captainClaims: Partial<Record<ShipId, string>>
  paused: { since: number; by: string } | null
  version: number
  emptySince: number | null
  notice: { id: number; text: string } | null
}

export type RoomAction<C = unknown, A = unknown> =
  | { type: 'profile'; name: string; avatar: Personagem }
  | { type: 'chooseShip'; shipId: ShipId | null }
  | { type: 'updateConfig'; patch: Partial<C> }
  | { type: 'claimCaptain' }
  | { type: 'setCaptain'; shipId: ShipId; playerId: string }
  | { type: 'start' }
  | { type: 'kick'; playerId: string }
  | { type: 'movePlayer'; playerId: string; shipId: ShipId | null }
  | { type: 'transferAdmin'; playerId: string }
  | { type: 'shuffleShips' }
  | { type: 'backToLobby' }
  | { type: 'leave' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'endGame' }
  | { type: 'game'; action: A }

export type RoomStep<R> = { room: R; events: GameEvent[]; changed: boolean; error?: string }

type AnyGame = GameDefinition<any, any, any, any, any>

export function createRoom<C extends BaseConfig>(code: string, game: GameDefinition<C, any, any, any>, now: number): Room<C> {
  return {
    code,
    createdAt: now,
    adminId: null,
    players: {},
    tokens: {},
    banned: [],
    gameId: game.id,
    phase: 'lobby',
    config: game.defaultConfig(),
    game: null,
    memory: undefined,
    captainClaims: {},
    paused: null,
    version: 1,
    emptySince: now,
    notice: null,
  }
}

export function activeShips(config: BaseConfig): ShipId[] {
  return SHIP_IDS.slice(0, config.shipCount)
}

function playersSorted(room: Room<any, any, any>): Player[] {
  return Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt)
}

export function connectedCount(room: Room<any, any, any>): number {
  return Object.values(room.players).filter((p) => p.connected).length
}

export type JoinResult = { ok: true; playerId: string; renamed: boolean } | { ok: false; error: JoinError }
export type JoinError = 'banned' | 'full' | 'invalid-name' | 'bad-token' | 'no-spectators'

/**
 * Entrada (ou reentrada) na sala. Quem já está na sala volta para o mesmo lugar.
 * Quem chega com a partida em andamento entra como Gaivota (6.4).
 */
export function joinRoom(
  room: Room<any, any, any>,
  id: string,
  token: string,
  profile: { name: string; avatar: Personagem },
  now: number,
): JoinResult {
  if (room.banned.includes(id)) return { ok: false, error: 'banned' }
  const existing = room.players[id]
  if (existing) {
    if (room.tokens[id] !== token) return { ok: false, error: 'bad-token' }
    return { ok: true, playerId: id, renamed: false }
  }
  const name = cleanName(profile.name)
  if (validateName(name)) return { ok: false, error: 'invalid-name' }
  const max = Math.min(room.config.maxPlayers ?? 16, MAX_PLAYERS_HARD)
  if (Object.keys(room.players).length >= max) return { ok: false, error: 'full' }
  if (room.phase !== 'lobby' && room.config.allowSpectators === false) return { ok: false, error: 'no-spectators' }
  const finalName = uniqueName(
    name,
    Object.values(room.players).map((p) => p.name),
  )
  const avatar = PERSONAGENS.some((p) => p.id === profile.avatar) ? profile.avatar : 'papagaio'
  room.players[id] = {
    id,
    name: finalName,
    avatar,
    shipId: null,
    connected: false,
    lastSeen: now,
    joinedAt: now,
  }
  room.tokens[id] = token
  if (!room.adminId) room.adminId = id
  room.emptySince = null
  room.version++
  return { ok: true, playerId: id, renamed: finalName !== name }
}

export function authorize(room: Room<any, any, any>, id: string, token: string): boolean {
  return !!room.players[id] && room.tokens[id] === token
}

export function setConnected(room: Room<any, any, any>, id: string, connected: boolean, now: number): boolean {
  const p = room.players[id]
  if (!p) return false
  p.lastSeen = now
  if (p.connected === connected) return false
  p.connected = connected
  if (connected) room.emptySince = null
  else if (connectedCount(room) === 0) room.emptySince = now
  room.version++
  return true
}

function removePlayer(room: Room<any, any, any>, id: string) {
  delete room.players[id]
  delete room.tokens[id]
  for (const s of SHIP_IDS) if (room.captainClaims[s] === id) delete room.captainClaims[s]
  if (room.adminId === id) {
    // o cargo passa para o jogador conectado há mais tempo
    const next = playersSorted(room).find((p) => p.connected) ?? playersSorted(room)[0]
    room.adminId = next ? next.id : null
  }
  if (Object.keys(room.players).length === 0) room.emptySince = room.emptySince ?? Date.now()
}

function notice(room: Room<any, any, any>, text: string) {
  room.notice = { id: (room.notice?.id ?? 0) + 1, text }
}

/** Distribui os jogadores dos navios de forma equilibrada (6.6). */
function shuffleShips(room: Room<any, any, any>, rng: () => number) {
  const ships = activeShips(room.config)
  const inShips = shuffle(
    Object.values(room.players).filter((p) => p.shipId !== null),
    rng,
  )
  inShips.forEach((p, i) => {
    p.shipId = ships[i % ships.length]
  })
  room.captainClaims = {}
}

export function applyRoomAction<C extends BaseConfig, S, A, V, M>(
  room: Room<C, S, M>,
  game: GameDefinition<C, S, A, V, M>,
  playerId: string,
  action: RoomAction<C, A>,
  ctxBase: { now: number; rng: () => number },
): RoomStep<Room<C, S, M>> {
  const me = room.players[playerId]
  const fail = (error: string): RoomStep<Room<C, S, M>> => ({ room, events: [], changed: false, error })
  if (!me) return fail('Você não está nesta sala.')
  const isAdmin = room.adminId === playerId
  const ctx: GameContext = { ...ctxBase, players: room.players }
  const ok = (events: GameEvent[] = []): RoomStep<Room<C, S, M>> => {
    room.version++
    return { room, events, changed: true }
  }

  switch (action.type) {
    case 'profile': {
      const name = cleanName(action.name)
      const err = validateName(name)
      if (err) return fail(err)
      const others = Object.values(room.players)
        .filter((p) => p.id !== playerId)
        .map((p) => p.name)
      me.name = uniqueName(name, others)
      if (PERSONAGENS.some((p) => p.id === action.avatar)) me.avatar = action.avatar
      return ok()
    }
    case 'chooseShip': {
      if (room.phase === 'playing') return fail('Espere a partida acabar para trocar de navio.')
      if (action.shipId && !activeShips(room.config).includes(action.shipId)) return fail('Esse navio não está no jogo.')
      if (me.shipId === action.shipId) return ok()
      if (me.shipId && room.captainClaims[me.shipId] === playerId) delete room.captainClaims[me.shipId]
      me.shipId = action.shipId
      return ok()
    }
    case 'updateConfig': {
      if (!isAdmin) return fail('Só o Almirante muda as configurações.')
      if (room.phase === 'playing') return fail('As configurações só mudam no salão.')
      const before = room.config.shipCount
      room.config = game.updateConfig(room.config, action.patch)
      if (room.config.shipCount < before) {
        const ships = activeShips(room.config)
        for (const p of Object.values(room.players)) if (p.shipId && !ships.includes(p.shipId)) p.shipId = null
        for (const s of SHIP_IDS) if (!ships.includes(s)) delete room.captainClaims[s]
      }
      return ok()
    }
    case 'claimCaptain': {
      if (room.phase === 'playing') return fail('A partida já começou.')
      if (!me.shipId) return fail('Entre num navio primeiro.')
      const current = room.captainClaims[me.shipId]
      if (current && current !== playerId && room.players[current]?.shipId === me.shipId)
        return fail('Esse navio já tem Capitão.')
      if (current === playerId) delete room.captainClaims[me.shipId]
      else room.captainClaims[me.shipId] = playerId
      return ok()
    }
    case 'setCaptain': {
      if (!isAdmin) return fail('Só o Almirante troca o Capitão.')
      const target = room.players[action.playerId]
      if (!target || target.shipId !== action.shipId) return fail('Esse jogador não está nesse navio.')
      room.captainClaims[action.shipId] = action.playerId
      return ok()
    }
    case 'start': {
      if (!isAdmin) return fail('Só o Almirante pode zarpar.')
      if (room.phase === 'playing') return fail('A partida já começou.')
      const players = Object.values(room.players)
      const err = game.canStart(room.config, players)
      if (err) return fail(err)
      const { state, memory } = game.setup(room.config, players, ctx, room.memory, room.captainClaims)
      room.game = state
      room.memory = memory
      room.phase = 'playing'
      room.paused = null
      return ok([{ type: 'turn', shipId: (state as any).turn?.shipId }])
    }
    case 'kick': {
      if (!isAdmin) return fail('Só o Almirante pode expulsar.')
      if (action.playerId === playerId) return fail('Você não pode se expulsar.')
      const target = room.players[action.playerId]
      if (!target) return fail('Jogador não encontrado.')
      room.banned.push(action.playerId)
      removePlayer(room, action.playerId)
      notice(room, `${target.name} foi removido da sala.`)
      return ok()
    }
    case 'movePlayer': {
      if (!isAdmin) return fail('Só o Almirante move jogadores.')
      const target = room.players[action.playerId]
      if (!target) return fail('Jogador não encontrado.')
      if (action.shipId && !activeShips(room.config).includes(action.shipId)) return fail('Esse navio não está no jogo.')
      if (target.shipId && room.captainClaims[target.shipId] === target.id) delete room.captainClaims[target.shipId]
      target.shipId = action.shipId
      return ok()
    }
    case 'transferAdmin': {
      if (!isAdmin) return fail('Só o Almirante pode passar o cargo.')
      if (!room.players[action.playerId]) return fail('Jogador não encontrado.')
      room.adminId = action.playerId
      notice(room, `${room.players[action.playerId].name} agora é o Almirante.`)
      return ok()
    }
    case 'shuffleShips': {
      if (!isAdmin) return fail('Só o Almirante embaralha os navios.')
      if (room.phase === 'playing') return fail('Só dá para embaralhar no salão.')
      shuffleShips(room, ctx.rng)
      return ok()
    }
    case 'backToLobby': {
      if (!isAdmin) return fail('Só o Almirante leva todos de volta ao salão.')
      if (room.phase !== 'finished') return fail('A partida ainda não acabou.')
      room.phase = 'lobby'
      room.game = null
      room.paused = null
      room.captainClaims = {}
      return ok()
    }
    case 'leave': {
      removePlayer(room, playerId)
      return ok()
    }
    case 'pause':
    case 'resume': {
      if (!isAdmin) return fail('Só o Almirante pausa a partida.')
      if (room.phase !== 'playing' || !room.game) return fail('Não há partida em andamento.')
      const pausing = action.type === 'pause'
      if (pausing === !!room.paused) return ok()
      room.game = game.pause(room.game, ctx, pausing, me.name)
      room.paused = pausing ? { since: ctx.now, by: playerId } : null
      return ok()
    }
    case 'endGame': {
      if (!isAdmin) return fail('Só o Almirante encerra a partida.')
      if (room.phase !== 'playing' || !room.game) return fail('Não há partida em andamento.')
      room.game = game.end(room.game, ctx)
      room.phase = 'finished'
      room.paused = null
      return ok([{ type: 'victory', shipId: null }])
    }
    case 'game': {
      if (room.phase !== 'playing' || !room.game) return fail('Não há partida em andamento.')
      if (room.paused) return fail('A partida está pausada.')
      const err = game.validate(room.game, playerId, action.action, ctx)
      if (err) return fail(err)
      const step = game.apply(room.game, playerId, action.action, ctx)
      room.game = step.state
      if (game.result(step.state)) room.phase = 'finished'
      if (!step.changed) return { room, events: step.events, changed: false }
      return ok(step.events)
    }
  }
  return fail('Ação desconhecida.')
}

/**
 * Passo periódico da sala: relógios do jogo, jogadores que caíram há mais de 5 minutos
 * e passagem do cargo de Almirante.
 */
export function tickRoom<C extends BaseConfig, S, A, V, M>(
  room: Room<C, S, M>,
  game: GameDefinition<C, S, A, V, M>,
  ctxBase: { now: number; rng: () => number },
): RoomStep<Room<C, S, M>> {
  let changed = false
  let events: GameEvent[] = []
  const now = ctxBase.now

  // jogadores desconectados há mais de 5 minutos saem da sala (fora da partida)
  if (room.phase !== 'playing') {
    for (const p of Object.values(room.players)) {
      if (!p.connected && now - p.lastSeen > DISCONNECT_GRACE_MS) {
        removePlayer(room, p.id)
        changed = true
      }
    }
  }
  // Almirante desconectado há mais de 5 minutos passa o cargo
  const admin = room.adminId ? room.players[room.adminId] : undefined
  if (admin && !admin.connected && now - admin.lastSeen > DISCONNECT_GRACE_MS) {
    const next = playersSorted(room).find((p) => p.connected && p.id !== admin.id)
    if (next) {
      room.adminId = next.id
      notice(room, `${next.name} agora é o Almirante.`)
      changed = true
    }
  }
  if (room.adminId && !room.players[room.adminId]) {
    room.adminId = playersSorted(room)[0]?.id ?? null
    changed = true
  }

  if (room.phase === 'playing' && room.game && !room.paused) {
    const step = game.tick(room.game, { ...ctxBase, players: room.players })
    if (step.changed) {
      room.game = step.state
      events = step.events
      changed = true
      if (game.result(step.state)) room.phase = 'finished'
    }
  }
  if (changed) room.version++
  return { room, events, changed }
}

export function isExpired(room: Room<any, any, any>, now: number): boolean {
  return room.emptySince !== null && now - room.emptySince > ROOM_EXPIRY_MS
}

export type RoomView<C, V> = {
  code: string
  phase: RoomPhase
  adminId: string | null
  you: string | null
  players: Player[]
  config: C
  captainClaims: Partial<Record<ShipId, string>>
  paused: { since: number; by: string } | null
  game: V | null
  notice: { id: number; text: string } | null
  now: number
  version: number
}

export function viewRoom<C extends BaseConfig, S, A, V, M>(
  room: Room<C, S, M>,
  game: GameDefinition<C, S, A, V, M>,
  playerId: string | null,
  now: number,
): RoomView<C, V> {
  const ctx: GameContext = { now, rng: Math.random, players: room.players }
  return {
    code: room.code,
    phase: room.phase,
    adminId: room.adminId,
    you: playerId,
    players: playersSorted(room),
    config: room.config,
    captainClaims: room.captainClaims,
    paused: room.paused,
    game: room.game ? game.viewFor(room.game, playerId, ctx) : null,
    notice: room.notice,
    now,
    version: room.version,
  }
}

export { pick }
export type { AnyGame }
