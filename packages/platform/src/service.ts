import type { GameDefinition, GameEvent, Personagem, Rng } from './types'
import {
  type BaseConfig,
  type JoinError,
  type Room,
  type RoomAction,
  type RoomView,
  applyRoomAction,
  authorize,
  createRoom,
  isExpired,
  joinRoom,
  setConnected,
  tickRoom,
  viewRoom,
} from './room'
import { roomCode } from './util'

/**
 * Onde as salas ficam guardadas. Localmente é a memória do processo; em produção
 * (Vercel) a mesma interface é implementada sobre o Redis.
 */
export interface RoomStore<R> {
  get(code: string): Promise<R | undefined>
  set(room: R): Promise<void>
  delete(code: string): Promise<void>
  codes(): Promise<string[]>
}

export class MemoryStore<R extends { code: string }> implements RoomStore<R> {
  private rooms = new Map<string, R>()
  async get(code: string) {
    return this.rooms.get(code)
  }
  async set(room: R) {
    this.rooms.set(room.code, room)
  }
  async delete(code: string) {
    this.rooms.delete(code)
  }
  async codes() {
    return [...this.rooms.keys()]
  }
}

export type ServerMessage<V> =
  | { type: 'state'; state: V }
  | { type: 'event'; event: GameEvent }
  | { type: 'error'; message: string }
  | { type: 'closed'; reason: 'kicked' | 'expired' | 'left' }

type Listener<V> = { playerId: string; send: (msg: ServerMessage<V>) => void }

export class RoomService<C extends BaseConfig, S, A, V, M> {
  private listeners = new Map<string, Set<Listener<RoomView<C, V>>>>()
  private locks = new Map<string, Promise<unknown>>()

  constructor(
    private store: RoomStore<Room<C, S, M>>,
    private game: GameDefinition<C, S, A, V, M>,
    private clock: () => number = Date.now,
    private rng: Rng = Math.random,
  ) {}

  /** Executa uma alteração na sala com trava, para duas ações não se sobrescreverem. */
  private async withRoom<T>(code: string, fn: (room: Room<C, S, M>) => T | Promise<T>): Promise<T | undefined> {
    const prev = this.locks.get(code) ?? Promise.resolve()
    let release!: () => void
    const next = new Promise<void>((r) => (release = r))
    const chained = prev.then(() => next)
    this.locks.set(code, chained)
    await prev
    try {
      const room = await this.store.get(code)
      if (!room) return undefined
      const before = room.version
      const out = await fn(room)
      if (room.version !== before) await this.store.set(room)
      return out
    } finally {
      release()
      if (this.locks.get(code) === chained) this.locks.delete(code)
    }
  }

  async create(): Promise<string> {
    let code = roomCode(this.rng)
    while (await this.store.get(code)) code = roomCode(this.rng)
    await this.store.set(createRoom(code, this.game, this.clock()) as Room<C, S, M>)
    return code
  }

  async exists(code: string) {
    return !!(await this.store.get(code))
  }

  async info(code: string) {
    const room = await this.store.get(code)
    if (!room) return null
    return {
      phase: room.phase,
      players: Object.keys(room.players).length,
      maxPlayers: room.config.maxPlayers,
    }
  }

  async join(
    code: string,
    id: string,
    token: string,
    profile: { name: string; avatar: Personagem },
  ): Promise<{ ok: true; name: string; renamed: boolean; phase: string } | { ok: false; error: JoinError | 'not-found' }> {
    const res = await this.withRoom(code, (room) => {
      const r = joinRoom(room, id, token, profile, this.clock())
      if (!r.ok) return r
      return { ok: true as const, name: room.players[id].name, renamed: r.renamed, phase: room.phase }
    })
    if (!res) return { ok: false, error: 'not-found' }
    if (res.ok) this.broadcast(code)
    return res
  }

  async act(code: string, id: string, token: string, action: RoomAction<C, A>): Promise<{ ok: boolean; error?: string }> {
    let kicked: string | null = null
    let events: GameEvent[] | null = null
    const res = await this.withRoom(code, (room) => {
      if (!authorize(room, id, token)) return { ok: false, error: 'Sessão inválida. Recarregue a página.' }
      if (action.type === 'kick') kicked = action.playerId
      const step = applyRoomAction(room, this.game, id, action, { now: this.clock(), rng: this.rng })
      if (step.error) return { ok: false, error: step.error }
      if (step.changed) events = step.events
      return { ok: true }
    })
    if (!res) return { ok: false, error: 'Esta sala não existe mais.' }
    if (events) await this.broadcast(code, events)
    if (res.ok && kicked) this.close(code, kicked, 'kicked')
    if (res.ok && action.type === 'leave') this.close(code, id, 'left')
    return res
  }

  /** Abre a conexão de um jogador: marca como conectado e envia o estado. */
  async connect(
    code: string,
    id: string,
    token: string,
    send: (msg: ServerMessage<RoomView<C, V>>) => void,
  ): Promise<null | (() => void)> {
    const ok = await this.withRoom(code, (room) => {
      if (!authorize(room, id, token)) return false
      setConnected(room, id, true, this.clock())
      return true
    })
    if (!ok) return null
    const listener: Listener<RoomView<C, V>> = { playerId: id, send }
    if (!this.listeners.has(code)) this.listeners.set(code, new Set())
    this.listeners.get(code)!.add(listener)
    await this.broadcast(code)
    return () => {
      const set = this.listeners.get(code)
      set?.delete(listener)
      const stillOpen = [...(set ?? [])].some((l) => l.playerId === id)
      if (!stillOpen) {
        void this.withRoom(code, (room) => setConnected(room, id, false, this.clock())).then(() =>
          this.broadcast(code),
        )
      }
    }
  }

  private close(code: string, playerId: string, reason: 'kicked' | 'left' | 'expired') {
    const set = this.listeners.get(code)
    if (!set) return
    for (const l of [...set]) {
      if (l.playerId === playerId) {
        l.send({ type: 'closed', reason })
        set.delete(l)
      }
    }
  }

  async broadcast(code: string, events: GameEvent[] = []) {
    const set = this.listeners.get(code)
    if (!set || set.size === 0) return
    const room = await this.store.get(code)
    if (!room) return
    const now = this.clock()
    for (const l of set) {
      if (!room.players[l.playerId]) continue
      for (const event of events) l.send({ type: 'event', event })
      l.send({ type: 'state', state: viewRoom(room, this.game, l.playerId, now) })
    }
  }

  /** Relógios das partidas, limpeza de jogadores e de salas vazias. */
  async tick() {
    const now = this.clock()
    for (const code of await this.store.codes()) {
      const room = await this.store.get(code)
      if (!room) continue
      if (isExpired(room, now)) {
        for (const l of this.listeners.get(code) ?? []) l.send({ type: 'closed', reason: 'expired' })
        this.listeners.delete(code)
        await this.store.delete(code)
        continue
      }
      const events = await this.withRoom(code, (r) => {
        const step = tickRoom(r, this.game, { now, rng: this.rng })
        return step.changed ? step.events : null
      })
      if (events) await this.broadcast(code, events)
    }
  }
}
