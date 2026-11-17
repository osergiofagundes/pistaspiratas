export type ShipId = 'rubi' | 'safira' | 'esmeralda' | 'ouro'
export const SHIP_IDS: ShipId[] = ['rubi', 'safira', 'esmeralda', 'ouro']

export const SHIP_INFO: Record<ShipId, { nome: string; cor: string; corClara: string; corEscura: string }> = {
  rubi: { nome: 'Rubi', cor: '#C2362B', corClara: '#FF7A68', corEscura: '#7E1F18' },
  safira: { nome: 'Safira', cor: '#2A5FC4', corClara: '#7FA8FF', corEscura: '#173A7E' },
  esmeralda: { nome: 'Esmeralda', cor: '#2A8A3A', corClara: '#7BD88A', corEscura: '#175522' },
  ouro: { nome: 'Ouro', cor: '#C98A12', corClara: '#FFD24A', corEscura: '#7A5208' },
}

export type Personagem = 'capitao' | 'papagaio' | 'tubarao' | 'gaivota' | 'grumete' | 'macaco'
export const PERSONAGENS: { id: Personagem; nome: string }[] = [
  { id: 'capitao', nome: 'Capitão' },
  { id: 'papagaio', nome: 'Papagaio' },
  { id: 'tubarao', nome: 'Tubarão' },
  { id: 'gaivota', nome: 'Gaivota' },
  { id: 'grumete', nome: 'Grumete' },
  { id: 'macaco', nome: 'Macaco' },
]

export type Player = {
  id: string
  name: string
  avatar: Personagem
  shipId: ShipId | null
  connected: boolean
  lastSeen: number
  joinedAt: number
}

/** Dados públicos de um jogador (o que todos podem ver). */
export type PublicPlayer = Player

export type Rng = () => number

export interface GameContext {
  now: number
  rng: Rng
  players: Record<string, Player>
}

export type GameEvent =
  | { type: 'reveal'; card: number; owner: string; shipId: string }
  | { type: 'eliminated'; shipId: ShipId }
  | { type: 'victory'; shipId: ShipId | null }
  | { type: 'turn'; shipId: ShipId }
  | { type: 'captainChanged'; shipId: ShipId; playerId: string }
  | { type: 'timeout'; shipId: ShipId; phase: string }

export type StepResult<State> = { state: State; events: GameEvent[]; changed: boolean }

export type GameResult = { winner: ShipId | null; reason: string }

/**
 * Cada jogo implementa esta interface; a plataforma cuida de sala, conexão e jogadores.
 * `memory` guarda o que o jogo quer lembrar entre partidas da mesma sala.
 */
export interface GameDefinition<Config, State, Action, View, Memory = unknown> {
  id: string
  defaultConfig(): Config
  updateConfig(current: Config, patch: Partial<Config>): Config
  canStart(config: Config, players: Player[]): string | null
  setup(
    config: Config,
    players: Player[],
    ctx: GameContext,
    memory: Memory | undefined,
    captainClaims: Partial<Record<ShipId, string>>,
  ): { state: State; memory: Memory }
  validate(state: State, playerId: string, action: Action, ctx: GameContext): string | null
  apply(state: State, playerId: string, action: Action, ctx: GameContext): StepResult<State>
  tick(state: State, ctx: GameContext): StepResult<State>
  pause(state: State, ctx: GameContext, paused: boolean, byName: string): State
  end(state: State, ctx: GameContext): State
  viewFor(state: State, playerId: string | null, ctx: GameContext): View
  result(state: State): GameResult | null
}
