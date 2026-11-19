import { describe, expect, it } from 'vitest'
import { applyRoomAction, type RoomAction } from '@arena/platform'
import { IDIOMAS_PALAVRAS, normalizar, type Idioma } from '@arena/words'
import { codenomes } from './index'
import { validateClue } from './clue'
import type { CodenomesAction } from './engine'
import { treasuresLeft } from './engine'
import {
  DONOS_TUTORIAL,
  LAYOUT_TUTORIAL,
  TABULEIROS_TUTORIAL,
  TUTORIAL_IDS as I,
  cartaTutorial,
  montarTutorial,
  virarCapitao,
  type SalaTutorial,
} from './tutorial'

const ctx = { now: 1000, rng: () => 0.5 }

function jogar(room: SalaTutorial, id: string, action: CodenomesAction) {
  const r = applyRoomAction(room, codenomes, id, { type: 'game', action } as RoomAction<never, CodenomesAction>, ctx)
  expect(r.error, `${id} ${JSON.stringify(action)}`).toBeUndefined()
}

function escondidas(room: SalaTutorial) {
  return room.game!.cards.filter((c) => !c.revealed).map((c) => c.word)
}

/** Joga o roteiro até o jogador virar Capitão (fim da vez do Safira). */
function ateCapitao(idioma: Idioma) {
  const tab = TABULEIROS_TUTORIAL[idioma]
  const room = montarTutorial(idioma, { name: 'Ana', avatar: 'grumete' }, 1000)
  const s = () => room.game!
  expect(s().turn.shipId).toBe('rubi')
  expect(s().ships.find((x) => x.id === 'rubi')!.captainId).toBe(I.capitaoRubi)

  // vez 1: o Capitão simulado dá FRUTA 2; o jogador e o colega acertam as duas
  expect(validateClue(tab.dicas.fruta, 2, escondidas(room), 5, idioma)).toBeNull()
  jogar(room, I.capitaoRubi, { type: 'giveClue', word: tab.dicas.fruta, count: 2 })
  jogar(room, I.voce, { type: 'select', card: cartaTutorial('banana') })
  jogar(room, I.voce, { type: 'select', card: cartaTutorial('uva') })
  jogar(room, I.colega, { type: 'confirm', value: true })
  jogar(room, I.voce, { type: 'confirm', value: true })
  expect(s().turn.phase).toBe('cannon')
  // tiro de canhão na MAÇÃ: mar, a vez passa
  jogar(room, I.voce, { type: 'select', card: cartaTutorial('maca') })
  jogar(room, I.colega, { type: 'confirm', value: true })
  jogar(room, I.voce, { type: 'confirm', value: true })
  expect(s().turn.shipId).toBe('safira')

  // vez 2: Safira acerta ESPADA e entrega a ÂNCORA ao Rubi
  expect(validateClue(tab.dicas.metal, 2, escondidas(room), 4, idioma)).toBeNull()
  jogar(room, I.capitaSafira, { type: 'giveClue', word: tab.dicas.metal, count: 2 })
  jogar(room, I.marujaSafira, { type: 'select', card: cartaTutorial('espada') })
  jogar(room, I.marujoSafira, { type: 'select', card: cartaTutorial('ancora') })
  jogar(room, I.marujaSafira, { type: 'confirm', value: true })
  jogar(room, I.marujoSafira, { type: 'confirm', value: true })
  expect(s().turn.shipId).toBe('rubi')
  expect(treasuresLeft(s(), 'rubi')).toBe(2)
  expect(s().log[1].end).toBe('outro')

  virarCapitao(room, I.voce)
  expect(s().ships.find((x) => x.id === 'rubi')!.captainId).toBe(I.voce)
  expect(s().log.at(-1)!.captainId).toBe(I.voce)
  jogar(room, I.voce, { type: 'mark', card: cartaTutorial('cavalo') })
  jogar(room, I.voce, { type: 'mark', card: cartaTutorial('vaca') })
  expect(validateClue(tab.dicas.fazenda, 2, escondidas(room), 2, idioma)).toBeNull()
  return room
}

describe('tutorial', () => {
  it('layout com 20 peças: 5 do Rubi, 4 do Safira, 1 Kraken e 10 de mar', () => {
    expect(LAYOUT_TUTORIAL).toHaveLength(20)
    expect(new Set(LAYOUT_TUTORIAL).size).toBe(20)
    const conta = (o: string) => LAYOUT_TUTORIAL.filter((p) => DONOS_TUTORIAL[p] === o).length
    expect([conta('rubi'), conta('safira'), conta('kraken'), conta('mar')]).toEqual([5, 4, 1, 10])
  })

  for (const idioma of IDIOMAS_PALAVRAS) {
    it(`${idioma}: palavras distintas e uma palavra só`, () => {
      const palavras = Object.values(TABULEIROS_TUTORIAL[idioma].palavras)
      expect(palavras).toHaveLength(20)
      expect(new Set(palavras.map(normalizar)).size).toBe(20)
      for (const p of palavras) expect(p).not.toMatch(/\s/)
    })

    it(`${idioma}: o roteiro termina com vitória do Rubi (dica com 2)`, () => {
      const room = ateCapitao(idioma)
      jogar(room, I.voce, { type: 'giveClue', word: TABULEIROS_TUTORIAL[idioma].dicas.fazenda, count: 2 })
      jogar(room, I.capitaoRubi, { type: 'select', card: cartaTutorial('cavalo') })
      jogar(room, I.colega, { type: 'select', card: cartaTutorial('vaca') })
      jogar(room, I.capitaoRubi, { type: 'confirm', value: true })
      jogar(room, I.colega, { type: 'confirm', value: true })
      expect(room.game!.winner).toBe('rubi')
      expect(room.phase).toBe('finished')
    })

    it(`${idioma}: com dica de 1, o tiro de canhão completa os tesouros`, () => {
      const room = ateCapitao(idioma)
      jogar(room, I.voce, { type: 'giveClue', word: TABULEIROS_TUTORIAL[idioma].dicas.fazenda, count: 1 })
      jogar(room, I.capitaoRubi, { type: 'select', card: cartaTutorial('cavalo') })
      jogar(room, I.capitaoRubi, { type: 'confirm', value: true })
      jogar(room, I.colega, { type: 'confirm', value: true })
      expect(room.game!.turn.phase).toBe('cannon')
      jogar(room, I.colega, { type: 'select', card: cartaTutorial('vaca') })
      jogar(room, I.capitaoRubi, { type: 'confirm', value: true })
      jogar(room, I.colega, { type: 'confirm', value: true })
      expect(room.game!.winner).toBe('rubi')
    })
  }
})
