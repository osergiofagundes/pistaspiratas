import type { Categoria } from '@arena/words'
import type { ShipId } from '@arena/platform'

export type Preset = 'classico' | 'rapido' | 'caotico' | 'tranquilo' | 'personalizado'
export type Tempo = number | null // segundos; null = sem limite
/** 'auto' escolhe pela quantidade de tesouros; número = grade quadrada; 'custom' = boardCols × boardRows */
export type BoardSize = 'auto' | 5 | 6 | 7 | 8 | 9 | 10 | 'custom'

export const BOARD_SIZES: BoardSize[] = ['auto', 5, 6, 7, 8, 9, 10, 'custom']
export const BOARD_MIN = 4
export const BOARD_MAX = 10
/** fração do tabuleiro que vira tesouro quando o tamanho é fixo (o resto é Mar Aberto e Kraken) */
const TESOUROS_NO_TABULEIRO = 0.75

export type CodenomesConfig = {
  preset: Preset
  shipCount: number // 2 a 4
  treasuresPerShip: number // Personalizado (4 a 10) ou ajuste à mão no tabuleiro fixo
  /** tabuleiro fixo: true = usa treasuresPerShip; false = proporcional ao tabuleiro */
  treasuresManual: boolean
  krakenCount: number // 1 ou 2 (Personalizado)
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
  customWords: string[]
  onlyCustom: boolean
  allowSpectators: boolean
  maxPlayers: number // 4 a 24
  shipNames: Partial<Record<ShipId, string>>
}

export const PRESETS: { id: Preset; nome: string; descricao: string }[] = [
  { id: 'classico', nome: 'Clássico', descricao: '8 tesouros por navio, 90 s / 120 s' },
  { id: 'rapido', nome: 'Rápido', descricao: '6 tesouros, grade menor, 60 s / 60 s' },
  { id: 'caotico', nome: 'Caótico', descricao: 'Menos Mar Aberto e 2 Krakens' },
  { id: 'tranquilo', nome: 'Tranquilo', descricao: 'Sem relógio, para iniciantes' },
  { id: 'personalizado', nome: 'Personalizado', descricao: 'Ajuste tudo' },
]

export const TEMPOS: Tempo[] = [null, 60, 90, 120, 180]

type PresetValues = { treasures: number; kraken: (ships: number) => number; captainTime: Tempo; crewTime: Tempo; seaMin: number }

const VALORES: Record<Exclude<Preset, 'personalizado'>, PresetValues> = {
  classico: { treasures: 8, kraken: (n) => (n === 2 ? 1 : 2), captainTime: 90, crewTime: 120, seaMin: 0.2 },
  rapido: { treasures: 6, kraken: () => 1, captainTime: 60, crewTime: 60, seaMin: 0.2 },
  caotico: { treasures: 8, kraken: () => 2, captainTime: 60, crewTime: 90, seaMin: 0.1 },
  tranquilo: { treasures: 8, kraken: () => 1, captainTime: null, crewTime: null, seaMin: 0.2 },
}

export function defaultConfig(): CodenomesConfig {
  return {
    preset: 'classico',
    shipCount: 2,
    treasuresPerShip: 8,
    treasuresManual: false,
    krakenCount: 1,
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
    customWords: [],
    onlyCustom: false,
    allowSpectators: true,
    maxPlayers: 16,
    shipNames: {},
  }
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, Math.round(n)))

/** Aplica uma alteração do Almirante, respeitando limites e presets. */
export function updateConfig(current: CodenomesConfig, patch: Partial<CodenomesConfig>): CodenomesConfig {
  const c: CodenomesConfig = { ...current }
  if (patch.preset && patch.preset !== current.preset && PRESETS.some((p) => p.id === patch.preset)) {
    c.preset = patch.preset
    if (patch.preset !== 'personalizado') {
      const v = VALORES[patch.preset]
      c.captainTime = v.captainTime
      c.crewTime = v.crewTime
      c.cannon = true
    }
  }
  if (patch.shipCount !== undefined) c.shipCount = clamp(patch.shipCount, 2, 4)
  // tesouros: aceitos em qualquer preset (o gridFor aplica o limite de cada modo)
  if (patch.treasuresPerShip !== undefined) c.treasuresPerShip = clamp(patch.treasuresPerShip, 2, 60)
  if (patch.treasuresManual !== undefined) c.treasuresManual = !!patch.treasuresManual
  if (c.preset === 'personalizado') {
    if (patch.krakenCount !== undefined) c.krakenCount = clamp(patch.krakenCount, 1, 2)
  }
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
    const cats = patch.categories.filter((x) => x === 'geral' || x === 'mar')
    c.categories = [...new Set(cats)]
  }
  if (patch.customWords) c.customWords = patch.customWords.slice(0, 300).map((w) => String(w).slice(0, 20))
  if (patch.onlyCustom !== undefined) c.onlyCustom = !!patch.onlyCustom
  if (patch.allowSpectators !== undefined) c.allowSpectators = !!patch.allowSpectators
  if (patch.maxPlayers !== undefined) c.maxPlayers = clamp(patch.maxPlayers, 4, 24)
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
 *   Tesouros e Krakens deixando a fração mínima de Mar Aberto do preset. Com 8 tesouros e
 *   Mar mínimo de 20%, reproduz o Clássico: 5×5, 6×6 e 7×7.
 * - Tamanho fixo: os tesouros são proporcionais ao tabuleiro (cerca de 75% das casas,
 *   divididos entre os navios); o resto é Mar Aberto e Kraken.
 */
export function gridFor(config: CodenomesConfig): GridInfo {
  const ships = config.shipCount
  const bonus = config.firstBonus === false ? 0 : 1
  let treasures: number, kraken: number, seaMin: number
  if (config.preset === 'personalizado') {
    treasures = clamp(config.treasuresPerShip, 4, 10)
    kraken = config.krakenCount
    // como nos outros presets, a grade automática deixa pelo menos 20% de Mar Aberto
    seaMin = 0.2
  } else {
    const v = VALORES[config.preset]
    treasures = v.treasures
    kraken = v.kraken(ships)
    seaMin = v.seaMin
  }
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
