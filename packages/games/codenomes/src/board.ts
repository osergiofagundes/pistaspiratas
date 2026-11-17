import { PALAVRAS, normalizar, raiz } from '@arena/words'
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

/** Banco de palavras da sala: categorias escolhidas mais as personalizadas. */
export function wordPool(config: CodenomesConfig): string[] {
  const custom = config.customWords
  if (config.onlyCustom) return dedupe(custom)
  const cats = config.categories.length ? config.categories : ['geral' as const]
  return dedupe([...cats.flatMap((c) => PALAVRAS[c] ?? []), ...custom])
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
 * Sorteia as palavras evitando a mesma raiz (Navio e Navios) e, quando dá,
 * as palavras usadas nas últimas partidas da sala.
 */
export function drawWords(pool: string[], count: number, recent: string[], rng: Rng): string[] {
  const recentSet = new Set(recent.map(normalizar))
  const fresh = pool.filter((w) => !recentSet.has(normalizar(w)))
  const source = fresh.length >= count ? fresh : pool
  const out: string[] = []
  const roots = new Set<string>()
  for (const w of shuffle(source, rng)) {
    const r = raiz(w)
    if (roots.has(r)) continue
    roots.add(r)
    out.push(w)
    if (out.length === count) break
  }
  if (out.length < count) {
    // banco pequeno (palavras personalizadas): completa sem a regra da raiz
    for (const w of shuffle(pool, rng)) {
      if (!out.includes(w)) out.push(w)
      if (out.length === count) break
    }
  }
  return out
}

export function generateBoard(
  config: CodenomesConfig,
  ships: ShipId[],
  first: ShipId,
  recent: string[],
  rng: Rng,
): { cards: Card[]; cols: number; rows: number } {
  const g = gridFor(config)
  const words = drawWords(wordPool(config), g.total, recent, rng)
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
