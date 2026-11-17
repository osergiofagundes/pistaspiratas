import { describe, expect, it } from 'vitest'
import { codenomes } from '../../games/codenomes/src/index'
import { applyRoomAction, createRoom, joinRoom, setConnected, tickRoom, DISCONNECT_GRACE_MS, isExpired, ROOM_EXPIRY_MS } from './room'
import { MemoryStore, RoomService } from './service'
import { seeded, uniqueName, validateName, isValidCode, roomCode } from './util'

const ctx = (now = 1000) => ({ now, rng: seeded(7) })

function sala() {
  const room = createRoom('K7PX2M', codenomes, 0)
  for (const [i, n] of ['Ana', 'Léo', 'Rafa', 'Duda'].entries()) {
    joinRoom(room, `id${i}`, `token-${i}-xxxxxxxxxxxx`, { name: n, avatar: 'papagaio' }, i)
    setConnected(room, `id${i}`, true, i)
  }
  return room
}

describe('utilidades', () => {
  it('código de sala sem letras ambíguas', () => {
    const rng = seeded(1)
    for (let i = 0; i < 200; i++) {
      const c = roomCode(rng)
      expect(isValidCode(c)).toBe(true)
      expect(c).not.toMatch(/[01OI]/)
    }
  })
  it('nome único e validação', () => {
    expect(uniqueName('Ana', ['ana', 'Léo'])).toBe('Ana 2')
    expect(uniqueName('Ana', ['Ana', 'Ana 2'])).toBe('Ana 3')
    expect(validateName('A')).toMatch(/2 letras/)
    expect(validateName('Um nome muito comprido')).toMatch(/16/)
    expect(validateName('Porra')).toMatch(/outro nome/)
    expect(validateName('Marujo Zé')).toBeNull()
  })
})

describe('sala', () => {
  it('o primeiro a entrar vira Almirante; nomes repetidos ganham número', () => {
    const room = sala()
    expect(room.adminId).toBe('id0')
    const r = joinRoom(room, 'id9', 'token-9-xxxxxxxxxxxx', { name: 'Ana', avatar: 'tubarao' }, 10)
    expect(r.ok && r.renamed).toBe(true)
    expect(room.players.id9.name).toBe('Ana 2')
  })

  it('reentrada exige o mesmo token; expulso não volta', () => {
    const room = sala()
    expect(joinRoom(room, 'id1', 'outro-token-xxxxxxxx', { name: 'X', avatar: 'papagaio' }, 5)).toEqual({ ok: false, error: 'bad-token' })
    applyRoomAction(room, codenomes, 'id0', { type: 'kick', playerId: 'id1' }, ctx())
    expect(room.players.id1).toBeUndefined()
    expect(joinRoom(room, 'id1', 'token-1-xxxxxxxxxxxx', { name: 'Léo', avatar: 'papagaio' }, 6)).toEqual({ ok: false, error: 'banned' })
  })

  it('sala cheia recusa', () => {
    const room = sala()
    room.config = codenomes.updateConfig(room.config, { maxPlayers: 4 })
    expect(joinRoom(room, 'id8', 'token-8-xxxxxxxxxxxx', { name: 'Gui', avatar: 'papagaio' }, 9)).toEqual({ ok: false, error: 'full' })
  })

  it('só o Almirante configura, move, expulsa e zarpa', () => {
    const room = sala()
    expect(applyRoomAction(room, codenomes, 'id1', { type: 'updateConfig', patch: { shipCount: 3 } }, ctx()).error).toBeTruthy()
    expect(applyRoomAction(room, codenomes, 'id1', { type: 'start' }, ctx()).error).toBeTruthy()
    expect(applyRoomAction(room, codenomes, 'id0', { type: 'start' }, ctx()).error).toMatch(/precisa de pelo menos 2/)
    for (const [id, s] of [['id0', 'rubi'], ['id1', 'rubi'], ['id2', 'safira'], ['id3', 'safira']] as const)
      applyRoomAction(room, codenomes, id, { type: 'chooseShip', shipId: s }, ctx())
    expect(applyRoomAction(room, codenomes, 'id0', { type: 'start' }, ctx()).error).toBeUndefined()
    expect(room.phase).toBe('playing')
    expect(applyRoomAction(room, codenomes, 'id1', { type: 'chooseShip', shipId: 'safira' }, ctx()).error).toBeTruthy()
  })

  it('reduzir o número de navios manda os jogadores para Assistindo', () => {
    const room = sala()
    applyRoomAction(room, codenomes, 'id0', { type: 'updateConfig', patch: { shipCount: 3 } }, ctx())
    applyRoomAction(room, codenomes, 'id3', { type: 'chooseShip', shipId: 'esmeralda' }, ctx())
    applyRoomAction(room, codenomes, 'id0', { type: 'updateConfig', patch: { shipCount: 2 } }, ctx())
    expect(room.players.id3.shipId).toBeNull()
  })

  it('embaralhar distribui de forma equilibrada', () => {
    const room = sala()
    for (const id of ['id0', 'id1', 'id2', 'id3']) applyRoomAction(room, codenomes, id, { type: 'chooseShip', shipId: 'rubi' }, ctx())
    applyRoomAction(room, codenomes, 'id0', { type: 'shuffleShips' }, ctx())
    const rubi = Object.values(room.players).filter((p) => p.shipId === 'rubi').length
    expect(rubi).toBe(2)
  })

  it('Almirante que sai passa o cargo; desconectado por 5 min sai da sala', () => {
    const room = sala()
    applyRoomAction(room, codenomes, 'id0', { type: 'leave' }, ctx())
    expect(room.adminId).toBe('id1')
    setConnected(room, 'id3', false, 100)
    tickRoom(room, codenomes, { now: 100 + DISCONNECT_GRACE_MS + 1, rng: seeded(1) })
    expect(room.players.id3).toBeUndefined()
  })

  it('sala vazia expira em 30 minutos', () => {
    const room = sala()
    for (const id of Object.keys(room.players)) setConnected(room, id, false, 500)
    expect(isExpired(room, 500 + ROOM_EXPIRY_MS - 1)).toBe(false)
    expect(isExpired(room, 500 + ROOM_EXPIRY_MS + 1)).toBe(true)
  })
})

describe('serviço', () => {
  it('cria sala, entra, conecta e transmite a visão filtrada', async () => {
    let now = 1000
    const svc = new RoomService(new MemoryStore<any>(), codenomes, () => now, seeded(3))
    const code = await svc.create()
    const ids = ['a', 'b', 'c', 'd'].map((x) => `${x}aaaaaaaaaa`)
    const recebidos: Record<string, any> = {}
    for (const [i, id] of ids.entries()) {
      const r = await svc.join(code, id, `tok-${id}-xxxxxxxxxx`, { name: `P${i}`, avatar: 'macaco' })
      expect(r.ok).toBe(true)
      await svc.connect(code, id, `tok-${id}-xxxxxxxxxx`, (m) => {
        if (m.type === 'state') recebidos[id] = m.state
      })
    }
    expect(recebidos[ids[0]].players).toHaveLength(4)
    expect(await svc.connect(code, ids[0], 'errado', () => {})).toBeNull()
    for (const [i, id] of ids.entries())
      await svc.act(code, id, `tok-${id}-xxxxxxxxxx`, { type: 'chooseShip', shipId: i < 2 ? 'rubi' : 'safira' })
    const r = await svc.act(code, ids[0], `tok-${ids[0]}-xxxxxxxxxx`, { type: 'start' })
    expect(r.ok).toBe(true)
    const capitaes = recebidos[ids[0]].game.ships.map((s: any) => s.captainId)
    for (const id of ids) {
      const g = recebidos[id].game
      expect(g.cards.every((c: any) => c.owner !== null)).toBe(capitaes.includes(id))
    }
    now += 91_000
    await svc.tick()
    expect(recebidos[ids[0]].game.turn.number).toBe(2)
  })
})
