import { type CodenomesAction, type CodenomesState, type PecaTutorial, TUTORIAL_IDS as I, cartaTutorial } from '@arena/codenomes'
import type { Dicionario } from '@/lib/i18n'

/** Áreas da partida que o holofote do tutorial ilumina (marcadas com <Alvo> nas telas). */
export type AlvoId = 'navios' | 'tabuleiro' | 'diario' | 'barra' | 'ordem' | 'confirmar' | 'campoDica'

/** Onde fica o balão: no computador e no palco compacto. */
export type Lugar = { d: 'centro' | 'direita' | 'esquerda'; c: 'centro' | 'topo' | 'baixo' | 'direita' }

export type ChavePasso = keyof Dicionario['tutorial']['passos']

/** O que o passo pode fazer com a partida simulada. */
export type Acoes = {
  /** ação de um navio simulado, com atraso (em fila, uma depois da outra) */
  bot: (id: string, action: CodenomesAction, atraso?: number) => void
  virarCapitao: () => void
  estado: () => CodenomesState
}

export type Passo = {
  id: ChavePasso
  lugar: Lugar
  alvo?: AlvoId
  realce?: PecaTutorial[]
  /** ações do jogador aceitas neste passo (sem isso, nenhuma) */
  permite?: (a: CodenomesAction) => boolean
  /** avança sozinho quando o estado bate; sem isso, avança no "Continuar" */
  ate?: (s: CodenomesState) => boolean
  aoEntrar?: (a: Acoes) => void
  /** o cartão final */
  final?: boolean
}

const c = cartaTutorial
const seleciona = (...pecas: PecaTutorial[]) => (a: CodenomesAction) => a.type === 'select' && pecas.map(c).includes(a.card)
const confirma = (a: CodenomesAction) => a.type === 'confirm' && a.value
const marcadas = (s: CodenomesState, ...pecas: PecaTutorial[]) => pecas.every((p) => s.turn.selection.includes(c(p)))
const revelada = (s: CodenomesState, p: PecaTutorial) => s.cards[c(p)].revealed

export const ROTEIRO: Passo[] = [
  { id: 'boasVindas', lugar: { d: 'centro', c: 'centro' } },
  { id: 'navios', alvo: 'navios', lugar: { d: 'centro', c: 'centro' } },
  { id: 'tabuleiro', alvo: 'tabuleiro', lugar: { d: 'direita', c: 'direita' } },
  { id: 'diario', alvo: 'diario', lugar: { d: 'centro', c: 'centro' } },
  { id: 'barra', alvo: 'barra', lugar: { d: 'centro', c: 'centro' } },
  {
    id: 'ordem',
    alvo: 'ordem',
    lugar: { d: 'direita', c: 'baixo' },
    aoEntrar: (a) => a.bot(I.capitaoRubi, { type: 'giveClue', word: '$fruta', count: 2 }, 1800),
    ate: (s) => !!s.turn.clue,
  },
  { id: 'ordemDada', alvo: 'ordem', lugar: { d: 'direita', c: 'baixo' } },
  { id: 'marcar1', realce: ['banana'], lugar: { d: 'direita', c: 'baixo' }, permite: seleciona('banana'), ate: (s) => marcadas(s, 'banana') },
  { id: 'marcar2', realce: ['uva'], lugar: { d: 'direita', c: 'baixo' }, permite: seleciona('uva'), ate: (s) => marcadas(s, 'banana', 'uva') },
  {
    id: 'confirmar',
    alvo: 'confirmar',
    lugar: { d: 'direita', c: 'baixo' },
    aoEntrar: (a) => a.bot(I.colega, { type: 'confirm', value: true }, 1200),
    permite: confirma,
    ate: (s) => s.turn.phase === 'cannon',
  },
  { id: 'canhao', realce: ['maca'], lugar: { d: 'direita', c: 'baixo' }, permite: seleciona('maca'), ate: (s) => marcadas(s, 'maca') },
  {
    id: 'canhaoConfirmar',
    alvo: 'confirmar',
    lugar: { d: 'direita', c: 'baixo' },
    aoEntrar: (a) => a.bot(I.colega, { type: 'confirm', value: true }, 1000),
    permite: confirma,
    ate: (s) => revelada(s, 'maca'),
  },
  { id: 'agua', lugar: { d: 'direita', c: 'baixo' } },
  {
    id: 'vezSafira',
    lugar: { d: 'direita', c: 'direita' },
    aoEntrar: (a) => {
      a.bot(I.capitaSafira, { type: 'giveClue', word: '$metal', count: 2 }, 2400)
      a.bot(I.marujaSafira, { type: 'select', card: c('espada') }, 1600)
      a.bot(I.marujoSafira, { type: 'select', card: c('ancora') }, 1300)
      a.bot(I.marujaSafira, { type: 'confirm', value: true }, 1000)
      a.bot(I.marujoSafira, { type: 'confirm', value: true }, 900)
    },
    ate: (s) => s.turn.shipId === 'rubi' && s.turn.number === 3,
  },
  { id: 'outroNavio', alvo: 'diario', lugar: { d: 'esquerda', c: 'baixo' } },
  { id: 'viraCapitao', alvo: 'tabuleiro', lugar: { d: 'direita', c: 'direita' }, aoEntrar: (a) => a.virarCapitao() },
  { id: 'kraken', realce: ['vulcao'], lugar: { d: 'direita', c: 'topo' } },
  {
    id: 'marcas',
    realce: ['cavalo', 'vaca'],
    lugar: { d: 'direita', c: 'direita' },
    permite: (a) => a.type === 'mark' && [c('cavalo'), c('vaca')].includes(a.card),
    ate: (s) => [c('cavalo'), c('vaca')].every((k) => (s.marks.rubi ?? []).includes(k)),
  },
  {
    id: 'dica',
    alvo: 'campoDica',
    lugar: { d: 'direita', c: 'baixo' },
    permite: (a) => a.type === 'giveClue' || a.type === 'mark',
    ate: (s) => !!s.turn.clue,
  },
  {
    id: 'marujosEscolhem',
    lugar: { d: 'direita', c: 'direita' },
    aoEntrar: (a) => {
      const n = a.estado().turn.clue?.count ?? 2
      a.bot(I.capitaoRubi, { type: 'select', card: c('cavalo') }, 1500)
      if (n >= 2) {
        a.bot(I.colega, { type: 'select', card: c('vaca') }, 1200)
        a.bot(I.capitaoRubi, { type: 'confirm', value: true }, 1000)
        a.bot(I.colega, { type: 'confirm', value: true }, 900)
      } else {
        // com 1, o tiro de canhão acha o último tesouro
        a.bot(I.capitaoRubi, { type: 'confirm', value: true }, 1000)
        a.bot(I.colega, { type: 'confirm', value: true }, 900)
        a.bot(I.colega, { type: 'select', card: c('vaca') }, 1800)
        a.bot(I.capitaoRubi, { type: 'confirm', value: true }, 1000)
        a.bot(I.colega, { type: 'confirm', value: true }, 900)
      }
    },
    ate: (s) => !!s.finishReason,
  },
  { id: 'vitoria', lugar: { d: 'centro', c: 'centro' }, final: true },
]

/** Cartas realçadas de cada passo (índices no tabuleiro). */
export const REALCES: number[][] = ROTEIRO.map((p) => (p.realce ?? []).map(c))
