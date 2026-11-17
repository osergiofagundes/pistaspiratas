import type { Categoria } from '@arena/words'
import type { ShipId } from '@arena/platform'

export type Preset = 'classico' | 'rapido' | 'caotico' | 'tranquilo' | 'personalizado'
export type Tempo = number | null // segundos; null = sem limite

export type CodenomesConfig = {
  preset: Preset
  shipCount: number // 2 a 4
  treasuresPerShip: number // 4 a 10 (Personalizado)
  krakenCount: number // 1 ou 2 (Personalizado)
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
    krakenCount: 1,
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
  if (c.preset === 'personalizado') {
    if (patch.treasuresPerShip !== undefined) c.treasuresPerShip = clamp(patch.treasuresPerShip, 4, 10)
    if (patch.krakenCount !== undefined) c.krakenCount = clamp(patch.krakenCount, 1, 2)
  }
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
}

/**
 * Tamanho do tabuleiro. Escolhe a menor grade de 5 a 7 colunas (quase quadrada)
 * que comporte os Tesouros e Krakens deixando a fração mínima de Mar Aberto do preset.
 * Com 8 tesouros e Mar mínimo de 20%, reproduz o Clássico: 5×5, 6×6 e 7×7.
 */
export function gridFor(config: CodenomesConfig): GridInfo {
  const ships = config.shipCount
  let treasures: number, kraken: number, seaMin: number
  if (config.preset === 'personalizado') {
    treasures = config.treasuresPerShip
    kraken = config.krakenCount
    seaMin = 0
  } else {
    const v = VALORES[config.preset]
    treasures = v.treasures
    kraken = v.kraken(ships)
    seaMin = v.seaMin
  }
  const needed = treasures * ships + 1 + kraken
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
    first: treasures + 1,
    kraken,
    sea,
    seaWarning: sea / total < 0.2,
  }
}

export function shipName(config: CodenomesConfig, id: ShipId, fallback: string): string {
  return config.shipNames[id] || fallback
}
