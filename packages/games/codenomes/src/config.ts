import { ehCategoria, ehIdioma, type Categoria, type Idioma } from '@arena/words'
import type { ShipId } from '@arena/platform'

export type Tempo = number | null // segundos; null = sem limite
/** 'auto' escolhe pela quantidade de tesouros; número = grade quadrada; 'custom' = boardCols × boardRows */
export type BoardSize = 'auto' | 5 | 6 | 7 | 8 | 9 | 10 | 'custom'

export const BOARD_SIZES: BoardSize[] = ['auto', 5, 6, 7, 8, 9, 10, 'custom']
export const BOARD_MIN = 4
export const BOARD_MAX = 10
/** fração do tabuleiro que vira tesouro quando o tamanho é fixo (o resto é Mar Aberto e Kraken) */
const TESOUROS_NO_TABULEIRO = 0.75

export type CodenomesConfig = {
  shipCount: number // 2 a 4
  treasuresPerShip: number // grade automática (4 a 10) ou ajuste à mão no tabuleiro fixo
  /** tabuleiro fixo: true = usa treasuresPerShip; false = proporcional ao tabuleiro */
  treasuresManual: boolean
  krakenCount: number // 1 ou 2 (segue os navios até o Almirante mudar)
  boardSize: BoardSize
  boardCols: number // 4 a 10 (boardSize 'custom')
  boardRows: number // 4 a 10 (boardSize 'custom')
  /** quem começa leva 1 tesouro a mais */
  firstBonus: boolean
  cannon: boolean
  captainMode: 'sorteio' | 'escolha'
  captainRotation: 'manter' | 'trocar'
  captainTime: Tempo
  crewTime: Tempo
  categories: Categoria[]
  /** idioma das palavras do tabuleiro (e da regra de plural das dicas) */
  wordLanguage: Idioma
  customWords: string[]
  onlyCustom: boolean
  allowSpectators: boolean
  maxPlayers: number // 4 a 24
  /** série: 1 = avulsa; 3 ou 5 = melhor de 3 ou de 5 (placar por navio, guardado na sala) */
  bestOf: 1 | 3 | 5
  shipNames: Partial<Record<ShipId, string>>
}

export const TEMPOS: Tempo[] = [null, 60, 90, 120, 180]

/** Mar Aberto mínimo da grade automática */
const MAR_MINIMO = 0.2

/** Kraken sugerido: 1 com 2 navios, 2 com 3 ou 4. */
export function krakenSugerido(navios: number): number {
  return navios <= 2 ? 1 : 2
}

export function defaultConfig(wordLanguage: Idioma = 'pt'): CodenomesConfig {
  return {
    shipCount: 2,
    treasuresPerShip: 8,
    treasuresManual: false,
    krakenCount: krakenSugerido(2),
    boardSize: 'auto',
    boardCols: 6,
    boardRows: 6,
    firstBonus: true,
    cannon: true,
    captainMode: 'sorteio',
    captainRotation: 'trocar',
    captainTime: 90,
    crewTime: 120,
    categories: ['geral'],
    wordLanguage,
    customWords: [],
    onlyCustom: false,
    allowSpectators: true,
    maxPlayers: 16,
    bestOf: 1,
    shipNames: {},
  }
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, Math.round(n)))

/** Aplica uma alteração do Almirante, respeitando os limites. */
export function updateConfig(current: CodenomesConfig, patch: Partial<CodenomesConfig>): CodenomesConfig {
  const c: CodenomesConfig = { ...current }
  // campo de versões antigas (presets): ignorado
  delete (c as Partial<CodenomesConfig> & { preset?: unknown }).preset
  if (patch.shipCount !== undefined) {
    c.shipCount = clamp(patch.shipCount, 2, 4)
    // mudou o número de navios: o Kraken volta à sugestão (a não ser que venha junto)
    if (c.shipCount !== current.shipCount && patch.krakenCount === undefined) c.krakenCount = krakenSugerido(c.shipCount)
  }
  // tesouros: o gridFor aplica o limite de cada modo (grade automática ou tamanho fixo)
  if (patch.treasuresPerShip !== undefined) c.treasuresPerShip = clamp(patch.treasuresPerShip, 2, 60)
  if (patch.treasuresManual !== undefined) c.treasuresManual = !!patch.treasuresManual
  if (patch.krakenCount !== undefined) c.krakenCount = clamp(patch.krakenCount, 1, 2)
  if (patch.boardSize !== undefined && BOARD_SIZES.includes(patch.boardSize)) c.boardSize = patch.boardSize
  if (patch.boardCols !== undefined) c.boardCols = clamp(patch.boardCols, BOARD_MIN, BOARD_MAX)
  if (patch.boardRows !== undefined) c.boardRows = clamp(patch.boardRows, BOARD_MIN, BOARD_MAX)
  if (patch.firstBonus !== undefined) c.firstBonus = !!patch.firstBonus
  if (patch.cannon !== undefined) c.cannon = !!patch.cannon
  if (patch.captainMode === 'sorteio' || patch.captainMode === 'escolha') c.captainMode = patch.captainMode
  if (patch.captainRotation === 'manter' || patch.captainRotation === 'trocar') c.captainRotation = patch.captainRotation
  if (patch.captainTime !== undefined && TEMPOS.includes(patch.captainTime)) c.captainTime = patch.captainTime
  if (patch.crewTime !== undefined && TEMPOS.includes(patch.crewTime)) c.crewTime = patch.crewTime
  if (patch.categories) {
    const cats = patch.categories.filter(ehCategoria)
    c.categories = [...new Set(cats)]
  }
  if (ehIdioma(patch.wordLanguage)) c.wordLanguage = patch.wordLanguage
  if (patch.customWords) c.customWords = patch.customWords.slice(0, 300).map((w) => String(w).slice(0, 20))
  if (patch.onlyCustom !== undefined) c.onlyCustom = !!patch.onlyCustom
  if (patch.allowSpectators !== undefined) c.allowSpectators = !!patch.allowSpectators
  if (patch.maxPlayers !== undefined) c.maxPlayers = clamp(patch.maxPlayers, 4, 24)
  if (patch.bestOf === 1 || patch.bestOf === 3 || patch.bestOf === 5) c.bestOf = patch.bestOf
  if (patch.shipNames) {
    const names: Partial<Record<ShipId, string>> = { ...c.shipNames }
    for (const [k, v] of Object.entries(patch.shipNames)) {
      const n = String(v ?? '').trim().slice(0, 14)
      if (n) names[k as ShipId] = n
      else delete names[k as ShipId]
    }
    c.shipNames = names
  }
  return c
}

export type GridInfo = {
  cols: number
  rows: number
  total: number
  treasures: number
  first: number
  kraken: number
  sea: number
  seaWarning: boolean
  /** maior número de tesouros por navio que o seletor aceita neste modo */
  maxTreasures: number
}

/** Colunas e linhas de um tamanho fixo (null no modo automático). */
export function fixedBoard(config: CodenomesConfig): [number, number] | null {
  const b = config.boardSize ?? 'auto'
  if (b === 'auto') return null
  if (b === 'custom') return [config.boardCols ?? 6, config.boardRows ?? 6]
  return [b, b]
}

/**
 * Tamanho do tabuleiro.
 * - Automático: escolhe a menor grade de 5 a 7 colunas (quase quadrada) que comporte os
 *   Tesouros (4 a 10 por navio) e Krakens deixando pelo menos 20% de Mar Aberto. Com os
 *   valores padrão (8 tesouros, Kraken sugerido), dá 5×5, 6×6 e 7×7.
 * - Tamanho fixo: os tesouros são proporcionais ao tabuleiro (cerca de 75% das casas,
 *   divididos entre os navios); o resto é Mar Aberto e Kraken.
 */
export function gridFor(config: CodenomesConfig): GridInfo {
  const ships = config.shipCount
  const bonus = config.firstBonus === false ? 0 : 1
  let treasures = clamp(config.treasuresPerShip, 4, 10)
  const kraken = clamp(config.krakenCount ?? krakenSugerido(ships), 1, 2)
  const seaMin = MAR_MINIMO
  const fixed = fixedBoard(config)
  if (fixed) {
    const [cols, rows] = fixed
    const total = cols * rows
    // sempre sobra pelo menos 1 casa de Mar Aberto
    const maxTreasures = Math.max(2, Math.floor((total - kraken - bonus - 1) / ships))
    treasures = config.treasuresManual
      ? clamp(config.treasuresPerShip, 2, maxTreasures)
      : Math.max(2, Math.floor((total * TESOUROS_NO_TABULEIRO - kraken - bonus) / ships))
    const sea = total - treasures * ships - bonus - kraken
    return { cols, rows, total, treasures, first: treasures + bonus, kraken, sea, seaWarning: sea / total < 0.2, maxTreasures }
  }
  const needed = treasures * ships + bonus + kraken
  const candidates: [number, number][] = []
  for (let c = 5; c <= 7; c++) for (const r of [c - 1, c]) candidates.push([c, r])
  candidates.sort((a, b) => a[0] * a[1] - b[0] * b[1] || a[0] - b[0])
  let chosen = candidates[candidates.length - 1]
  for (const [c, r] of candidates) {
    const total = c * r
    if (total >= needed && (total - needed) / total >= seaMin - 1e-9) {
      chosen = [c, r]
      break
    }
  }
  const [cols, rows] = chosen
  const total = cols * rows
  const sea = total - needed
  return {
    cols,
    rows,
    total,
    treasures,
    first: treasures + bonus,
    kraken,
    sea,
    seaWarning: sea / total < 0.2,
    maxTreasures: 10,
  }
}

export function shipName(config: CodenomesConfig, id: ShipId, fallback: string): string {
  return config.shipNames[id] || fallback
}

/**
 * "Restaurar padrão" das Configurações: tabuleiro, tesouros, Kraken, tempos e Canhão voltam
 * aos valores iniciais. Navios, regras de Capitão, palavras, idioma e nomes ficam como estão.
 */
export function restaurarPadrao(c: CodenomesConfig): CodenomesConfig {
  const d = defaultConfig(c.wordLanguage)
  return {
    ...c,
    boardSize: d.boardSize,
    boardCols: d.boardCols,
    boardRows: d.boardRows,
    treasuresPerShip: d.treasuresPerShip,
    treasuresManual: d.treasuresManual,
    krakenCount: krakenSugerido(c.shipCount),
    firstBonus: d.firstBonus,
    cannon: d.cannon,
    captainTime: d.captainTime,
    crewTime: d.crewTime,
  }
}
