import { describe, expect, it } from 'vitest'
import { type Player, type ShipId, seeded } from '@arena/platform'
import { PALAVRAS, normalizar, raiz } from '@arena/words'
import { canStart } from './index'
import { defaultConfig, gridFor, updateConfig } from './config'
import { drawWordsMixed, generateBoard, wordGroups, wordPool } from './board'

const grupo = (letra: string, n: number) => Array.from({ length: n }, (_, i) => `${letra}${String.fromCharCode(97 + (i % 26))}${Math.floor(i / 26)}x`)

function jogadores(ships: ShipId[]): Player[] {
  return ships.flatMap((s) =>
    [0, 1].map((i) => ({ id: `${s}${i}`, name: `${s}${i}`, avatar: 'papagaio' as const, shipId: s, connected: true, lastSeen: 0, joinedAt: 0 })),
  )
}

describe('sorteio em partes iguais', () => {
  it('cada grupo entra com a mesma quantidade de palavras', () => {
    const grupos = [grupo('a', 200), grupo('b', 50), grupo('c', 1000)]
    for (let seed = 1; seed <= 20; seed++) {
      const out = drawWordsMixed(grupos, 36, [], seeded(seed))
      expect(out).toHaveLength(36)
      for (const letra of ['a', 'b', 'c']) expect(out.filter((w) => w.startsWith(letra))).toHaveLength(12)
    }
  })

  it('a sobra vai para alguns grupos (no máximo 1 a mais)', () => {
    const out = drawWordsMixed([grupo('a', 100), grupo('b', 100), grupo('c', 100)], 25, [], seeded(3))
    const n = ['a', 'b', 'c'].map((l) => out.filter((w) => w.startsWith(l)).length).sort()
    expect(n).toEqual([8, 8, 9])
  })

  it('um grupo pequeno entra inteiro e os outros completam', () => {
    const custom = ['Alfa', 'Bravo', 'Charlie', 'Delta', 'Eco']
    const out = drawWordsMixed([grupo('a', 300), custom], 36, [], seeded(7))
    expect(out).toHaveLength(36)
    for (const w of custom) expect(out).toContain(w)
  })

  it('não repete palavra nem raiz, mesmo quando está em dois grupos', () => {
    const out = drawWordsMixed([['Navio', 'Mapa', 'Ilha'], ['Navios', 'Mapa', 'Ponte']], 4, [], seeded(1), 'pt')
    expect(out).toHaveLength(4)
    expect(new Set(out.map((w) => raiz(normalizar(w), 'pt'))).size).toBe(4)
  })

  it('evita as palavras recentes quando dá', () => {
    const a = grupo('a', 60)
    const recentes = a.slice(0, 40)
    const out = drawWordsMixed([a], 20, recentes, seeded(2))
    expect(out.every((w) => !recentes.includes(w))).toBe(true)
  })

  it('banco pequeno completa o tabuleiro sem a regra da raiz', () => {
    const out = drawWordsMixed([['Gato', 'Gatos', 'Cão']], 3, [], seeded(1), 'pt')
    expect(out.sort()).toEqual(['Cão', 'Gato', 'Gatos'])
  })
})

describe('grupos da sala', () => {
  it('um grupo por categoria escolhida mais as personalizadas', () => {
    const c = updateConfig(defaultConfig(), { categories: ['filmes', 'infantil', 'brasil'], customWords: ['Alfa', 'Bravo'] })
    const g = wordGroups(c)
    expect(g).toHaveLength(4)
    expect(g[0]).toBe(PALAVRAS.pt.filmes)
    expect(g[3]).toEqual(['Alfa', 'Bravo'])
    expect(wordGroups({ ...c, onlyCustom: true })).toEqual([['Alfa', 'Bravo']])
    expect(wordGroups({ ...c, categories: [], customWords: [] })).toEqual([PALAVRAS.pt.geral])
  })

  it('o tabuleiro mistura as categorias escolhidas', () => {
    const cats = ['animais', 'esportes', 'lugares'] as const
    const c = updateConfig(defaultConfig(), { categories: [...cats] })
    const { cards } = generateBoard(c, ['rubi', 'safira'], 'rubi', [], seeded(5))
    expect(cards).toHaveLength(gridFor(c).total)
    for (const cat of cats) {
      const daCategoria = new Set(PALAVRAS.pt[cat].map(normalizar))
      // ~1/3 de cada (uma palavra pode estar em duas listas)
      expect(cards.filter((k) => daCategoria.has(normalizar(k.word))).length).toBeGreaterThanOrEqual(Math.floor(cards.length / 3))
    }
  })

  it('updateConfig aceita só categorias conhecidas', () => {
    const c = updateConfig(defaultConfig(), { categories: ['filmes', 'xx' as never, 'filmes', 'ciencia'] })
    expect(c.categories).toEqual(['filmes', 'ciencia'])
  })

  it('canStart pede categoria ou palavras personalizadas', () => {
    const p = jogadores(['rubi', 'safira'])
    expect(canStart(updateConfig(defaultConfig(), { categories: ['games'] }), p)).toBeNull()
    const vazio = { ...defaultConfig(), categories: [], onlyCustom: true }
    expect(canStart(vazio, p)).toMatch(/personalizadas/)
    expect(wordPool(updateConfig(defaultConfig(), { categories: ['geral', 'animais'] })).length).toBeGreaterThan(PALAVRAS.pt.geral.length)
  })
})
