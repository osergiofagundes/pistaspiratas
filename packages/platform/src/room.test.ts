import { describe, expect, it } from 'vitest'
import { codenomes } from '../../games/codenomes/src/index'
import { applyRoomAction, createRoom, joinRoom, metaDaSerie, registrarResultado, setConnected, tickRoom, viewRoom, DISCONNECT_GRACE_MS, isExpired, ROOM_EXPIRY_MS } from './room'
import type { GameDefinition, ShipId } from './types'
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

  describe('embaralhar tripulações', () => {
    /** sala com n jogadores (id0 é o Almirante) */
    function salaCom(n: number, navios = 2) {
      const room = createRoom('K7PX2M', codenomes, 0, { shipCount: navios } as never)
      for (let i = 0; i < n; i++) {
        joinRoom(room, `id${i}`, `token-${i}-xxxxxxxxxxxx`, { name: `J${i}`, avatar: 'papagaio' }, i)
        setConnected(room, `id${i}`, true, i)
      }
      return room
    }
    const times = (room: ReturnType<typeof salaCom>) => {
      const m: Record<string, string[]> = {}
      for (const p of Object.values(room.players)) if (p.shipId) (m[p.shipId] ??= []).push(p.id)
      return Object.values(m).map((t) => t.sort())
    }
    const repetidas = (room: ReturnType<typeof salaCom>, antes: string[][]) => {
      let n = 0
      for (const t of times(room))
        for (const a of t) for (const b of t) if (a < b && antes.some((x) => x.includes(a) && x.includes(b))) n++
      return n
    }
    const embaralhar = (room: ReturnType<typeof salaCom>, seed: number) =>
      applyRoomAction(room, codenomes, 'id0', { type: 'shuffleShips' }, { now: 1000, rng: seeded(seed) })

    it('mistura quem jogou junto na última partida', () => {
      for (let seed = 1; seed <= 20; seed++) {
        const room = salaCom(4)
        for (const p of Object.values(room.players)) p.shipId = 'rubi'
        room.lastCrews = [['id0', 'id1'], ['id2', 'id3']]
        embaralhar(room, seed)
        expect(times(room).map((t) => t.length)).toEqual([2, 2])
        expect(repetidas(room, room.lastCrews)).toBe(0)
      }
    })

    it('3 navios: nenhuma dupla se repete', () => {
      for (let seed = 1; seed <= 20; seed++) {
        const room = salaCom(6, 3)
        const antes = [['id0', 'id1'], ['id2', 'id3'], ['id4', 'id5']]
        antes.forEach((t, i) => t.forEach((id) => (room.players[id].shipId = (['rubi', 'safira', 'esmeralda'] as const)[i])))
        room.lastCrews = antes
        embaralhar(room, seed)
        expect(times(room).map((t) => t.length)).toEqual([2, 2, 2])
        expect(repetidas(room, antes)).toBe(0)
      }
    })

    it('sem solução perfeita, repete o mínimo possível', () => {
      for (let seed = 1; seed <= 20; seed++) {
        const room = salaCom(6)
        const antes = [['id0', 'id1', 'id2'], ['id3', 'id4', 'id5']]
        antes.forEach((t, i) => t.forEach((id) => (room.players[id].shipId = i ? 'safira' : 'rubi')))
        room.lastCrews = antes
        embaralhar(room, seed)
        expect(repetidas(room, antes)).toBe(2)
      }
    })

    it('sem histórico, tocar de novo sempre muda a divisão', () => {
      const room = salaCom(4)
      for (const p of Object.values(room.players)) p.shipId = 'rubi'
      let antes = JSON.stringify(times(room))
      for (let seed = 1; seed <= 10; seed++) {
        embaralhar(room, seed)
        const depois = JSON.stringify(times(room).sort())
        expect(depois).not.toBe(antes)
        antes = depois
      }
    })

    it('quem está assistindo continua assistindo; todos recebem o aviso', () => {
      const room = salaCom(5)
      for (const id of ['id0', 'id1', 'id2', 'id3']) room.players[id].shipId = 'rubi'
      const res = embaralhar(room, 3)
      expect(res.error).toBeUndefined()
      expect(room.players.id4.shipId).toBeNull()
      expect(room.notice?.text).toBe('J0 embaralhou as tripulações.')
      expect(applyRoomAction(room, codenomes, 'id1', { type: 'shuffleShips' }, ctx()).error).toMatch(/Almirante/)
    })

    it('zarpar guarda as tripulações da partida', () => {
      const room = salaCom(4)
      ;['rubi', 'rubi', 'safira', 'safira'].forEach((s, i) => (room.players[`id${i}`].shipId = s as never))
      expect(applyRoomAction(room, codenomes, 'id0', { type: 'start' }, ctx()).error).toBeUndefined()
      expect(room.lastCrews).toEqual([['id0', 'id1'], ['id2', 'id3']])
    })
  })

  describe('série de partidas', () => {
    type Estado = { done: boolean; winner: ShipId | null }
    type Acao = { type: 'fim'; winner: ShipId | null }
    /** jogo de mentira: termina na primeira ação, com o vencedor que ela disser */
    const falso: GameDefinition<any, Estado, Acao, Estado> = {
      id: 'falso',
      defaultConfig: () => ({ shipCount: 2, maxPlayers: 16, allowSpectators: true, bestOf: 3 }),
      updateConfig: (c, patch) => ({ ...c, ...patch }),
      canStart: () => null,
      setup: (_c, _p, _ctx, memory) => ({ state: { done: false, winner: null }, memory }),
      validate: () => null,
      apply: (_s, _id, a) => ({ state: { done: true, winner: a.winner }, events: [], changed: true }),
      tick: (s) => ({ state: s, events: [], changed: true }),
      pause: (s) => s,
      end: (s) => ({ ...s, done: true }),
      viewFor: (s) => s,
      result: (s) => (s.done ? { winner: s.winner, reason: 'teste' } : null),
    }
    function salaFalsa(bestOf = 3) {
      const room = createRoom('K7PX2M', falso, 0, { bestOf })
      for (const [i, n] of ['Ana', 'Léo', 'Rafa', 'Duda'].entries()) {
        joinRoom(room, `id${i}`, `token-${i}-xxxxxxxxxxxx`, { name: n, avatar: 'papagaio' }, i)
        setConnected(room, `id${i}`, true, i)
      }
      return room
    }
    const agir = (room: ReturnType<typeof salaFalsa>, id: string, action: any) => applyRoomAction(room, falso, id, action, ctx())
    /** uma partida inteira: zarpar, vencer e voltar ao salão */
    function partida(room: ReturnType<typeof salaFalsa>, winner: ShipId | null) {
      expect(agir(room, 'id0', { type: 'start' }).error).toBeUndefined()
      agir(room, 'id1', { type: 'game', action: { type: 'fim', winner } })
      expect(room.phase).toBe('finished')
      agir(room, 'id0', { type: 'backToLobby' })
    }

    it('melhor de 3: duas vitórias dão o campeão', () => {
      const room = salaFalsa()
      partida(room, 'rubi')
      expect(room.series).toEqual({ wins: { rubi: 1 }, games: 1, champion: null })
      partida(room, 'safira')
      partida(room, 'rubi')
      expect(room.series).toEqual({ wins: { rubi: 2, safira: 1 }, games: 3, champion: 'rubi' })
      expect(metaDaSerie(3)).toBe(2)
      expect(metaDaSerie(5)).toBe(3)
    })

    it('a mesma partida não conta duas vezes', () => {
      const room = salaFalsa()
      agir(room, 'id0', { type: 'start' })
      agir(room, 'id1', { type: 'game', action: { type: 'fim', winner: 'rubi' } })
      tickRoom(room, falso, { now: 2000, rng: seeded(1) })
      registrarResultado(room, null)
      expect(room.series.games).toBe(1)
    })

    it('partida encerrada pelo Almirante e partida avulsa não contam', () => {
      const room = salaFalsa()
      agir(room, 'id0', { type: 'start' })
      agir(room, 'id0', { type: 'endGame' })
      expect(room.series.games).toBe(0)
      const avulsa = salaFalsa(1)
      partida(avulsa, 'rubi')
      expect(avulsa.series.games).toBe(0)
    })

    it('zarpar depois do campeão começa outra série', () => {
      const room = salaFalsa()
      partida(room, 'rubi')
      partida(room, 'rubi')
      expect(room.series.champion).toBe('rubi')
      // o placar final fica no salão até zarpar de novo
      expect(room.series.wins.rubi).toBe(2)
      partida(room, 'safira')
      expect(room.series).toEqual({ wins: { safira: 1 }, games: 1, champion: null })
    })

    it('mudar o formato ou o número de navios zera; outras mudanças não', () => {
      const room = salaFalsa()
      partida(room, 'rubi')
      agir(room, 'id0', { type: 'updateConfig', patch: { maxPlayers: 10 } })
      expect(room.series.games).toBe(1)
      agir(room, 'id0', { type: 'updateConfig', patch: { bestOf: 5 } })
      expect(room.series.games).toBe(0)
      partida(room, 'rubi')
      agir(room, 'id0', { type: 'updateConfig', patch: { shipCount: 3 } })
      expect(room.series.games).toBe(0)
    })

    it('zerar o placar: só o Almirante, fora da partida, com aviso', () => {
      const room = salaFalsa()
      partida(room, 'rubi')
      expect(agir(room, 'id1', { type: 'resetSeries' }).error).toMatch(/Almirante/)
      expect(agir(room, 'id0', { type: 'resetSeries' }).error).toBeUndefined()
      expect(room.series.games).toBe(0)
      expect(room.notice?.text).toBe('Ana zerou o placar da série.')
      agir(room, 'id0', { type: 'start' })
      expect(agir(room, 'id0', { type: 'resetSeries' }).error).toMatch(/salão/)
    })

    it('a visão da sala leva o placar', () => {
      const room = salaFalsa()
      partida(room, 'safira')
      expect(viewRoom(room, falso, 'id1', 0).series.wins).toEqual({ safira: 1 })
    })
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
