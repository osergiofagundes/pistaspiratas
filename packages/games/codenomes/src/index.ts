import { type GameDefinition, type Player, SHIP_IDS, SHIP_INFO } from '@arena/platform'
import { wordPool } from './board'
import { type CodenomesConfig, defaultConfig, gridFor, shipName, updateConfig } from './config'
import {
  type CodenomesAction,
  type CodenomesMemory,
  type CodenomesState,
  apply,
  endGame,
  pause,
  setup,
  tick,
  validate,
} from './engine'
import { type CodenomesView, viewFor } from './view'

export * from './config'
export * from './board'
export * from './clue'
export * from './engine'
export * from './view'
export * from './tutorial'

/** Por que ainda não dá para zarpar (null = pode começar). */
export function canStart(config: CodenomesConfig, players: Player[]): string | null {
  for (const id of SHIP_IDS.slice(0, config.shipCount)) {
    const n = players.filter((p) => p.shipId === id).length
    if (n < 2) return `O Navio ${shipName(config, id, SHIP_INFO[id].nome)} precisa de pelo menos 2 jogadores`
  }
  const g = gridFor(config)
  const pool = wordPool(config)
  if (pool.length < g.total)
    return config.onlyCustom
      ? `Faltam palavras personalizadas: são ${pool.length}, o tabuleiro tem ${g.total} casas`
      : 'Escolha pelo menos uma categoria de palavras'
  return null
}

export const codenomes: GameDefinition<CodenomesConfig, CodenomesState, CodenomesAction, CodenomesView, CodenomesMemory> = {
  id: 'codenomes',
  defaultConfig,
  updateConfig,
  canStart,
  setup,
  validate,
  apply,
  tick,
  pause,
  end: endGame,
  viewFor,
  result: (s) => (s.finishReason ? { winner: s.winner, reason: s.finishReason } : null),
}
