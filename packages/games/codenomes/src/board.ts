import { PALAVRAS, normalizar, raiz, type Idioma } from '@arena/words'
import { type Rng, type ShipId, shuffle } from '@arena/platform'
import { type CodenomesConfig, gridFor } from './config'

export type Owner = ShipId | 'mar' | 'kraken'

export type Card = {
  word: string
  owner: Owner
  revealed: boolean
  revealedBy: ShipId | null
  turn: number | null
}

/**
 * Grupos de palavras da sala: um por categoria escolhida e um com as personalizadas.
 * O sorteio tira a mesma quantidade de cada grupo.
 */
export function wordGroups(config: CodenomesConfig): string[][] {
  const custom = dedupe(config.customWords)
  if (config.onlyCustom) return [custom]
  const cats = config.categories.length ? config.categories : ['geral' as const]
  const lista = PALAVRAS[config.wordLanguage ?? 'pt'] ?? PALAVRAS.pt
  const grupos = cats.map((c) => lista[c] ?? []).filter((g) => g.length > 0)
  if (custom.length) grupos.push(custom)
  return grupos
}

/** Banco de palavras da sala (todas as categorias escolhidas mais as personalizadas, sem repetidas). */
export function wordPool(config: CodenomesConfig): string[] {
  return dedupe(wordGroups(config).flat())
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>()
  return list.filter((w) => {
    const n = normalizar(w)
    if (!n || seen.has(n)) return false
    seen.add(n)
    return true
  })
}

/**
 * Sorteia as palavras em partes iguais entre os grupos: tira uma de cada grupo, em
 * rodízio, até encher o tabuleiro. Evita a mesma palavra e a mesma raiz (Navio e
 * Navios) e, quando dá, as palavras usadas nas últimas partidas da sala. Um grupo
 * que acaba (poucas personalizadas) sai do rodízio e os outros completam.
 */
export function drawWordsMixed(groups: string[][], count: number, recent: string[], rng: Rng, idioma: Idioma = 'pt'): string[] {
  const recentSet = new Set(recent.map(normalizar))
  // em cada grupo, as palavras que não saíram há pouco vêm primeiro
  const filas = shuffle(
    groups.map((g) => {
      const sorteado = shuffle(g, rng)
      return [...sorteado.filter((w) => !recentSet.has(normalizar(w))), ...sorteado.filter((w) => recentSet.has(normalizar(w)))]
    }),
    rng,
  )
  const out: string[] = []
  const seen = new Set<string>()
  const roots = new Set<string>()
  const pos = filas.map(() => 0)
  let ativos = filas.length
  while (out.length < count && ativos > 0) {
    ativos = 0
    for (let i = 0; i < filas.length && out.length < count; i++) {
      const fila = filas[i]
      // avança até a próxima palavra que ainda não está na mesa (nem a raiz dela)
      while (pos[i] < fila.length) {
        const w = fila[pos[i]++]
        const n = normalizar(w)
        const r = raiz(w, idioma)
        if (!n || seen.has(n) || roots.has(r)) continue
        seen.add(n)
        roots.add(r)
        out.push(w)
        break
      }
      if (pos[i] < fila.length) ativos++
    }
  }
  if (out.length < count) {
    // banco pequeno (palavras personalizadas): completa sem a regra da raiz
    for (const w of shuffle(groups.flat(), rng)) {
      const n = normalizar(w)
      if (!n || seen.has(n)) continue
      seen.add(n)
      out.push(w)
      if (out.length === count) break
    }
  }
  return out
}

/** Sorteio de um banco só (um grupo). */
export function drawWords(pool: string[], count: number, recent: string[], rng: Rng, idioma: Idioma = 'pt'): string[] {
  return drawWordsMixed([pool], count, recent, rng, idioma)
}

export function generateBoard(
  config: CodenomesConfig,
  ships: ShipId[],
  first: ShipId,
  recent: string[],
  rng: Rng,
): { cards: Card[]; cols: number; rows: number } {
  const g = gridFor(config)
  const words = drawWordsMixed(wordGroups(config), g.total, recent, rng, config.wordLanguage ?? 'pt')
  const owners: Owner[] = []
  for (const s of ships) for (let i = 0; i < (s === first ? g.first : g.treasures); i++) owners.push(s)
  for (let i = 0; i < g.kraken; i++) owners.push('kraken')
  while (owners.length < g.total) owners.push('mar')
  const mixed = shuffle(owners, rng)
  const cards = words.map((word, i) => ({
    word,
    owner: mixed[i],
    revealed: false,
    revealedBy: null,
    turn: null,
  }))
  return { cards, cols: g.cols, rows: g.rows }
}
