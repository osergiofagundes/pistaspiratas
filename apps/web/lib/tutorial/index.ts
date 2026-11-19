'use client'
import { create } from 'zustand'
import { applyRoomAction, viewRoom, type Personagem, type RoomAction } from '@arena/platform'
import {
  type CodenomesAction,
  type SalaTutorial,
  type TabuleiroTutorial,
  TABULEIROS_TUTORIAL,
  TUTORIAL_IDS as I,
  codenomes,
  montarTutorial,
  virarCapitao,
} from '@arena/codenomes'
import type { Idioma } from '@arena/words'
import { desconectar, empurrarEventos, useSala } from '@/lib/sala'
import { salvarEstadoTutorial } from '@/lib/identidade'
import { type AlvoId, type Passo, ROTEIRO } from './roteiro'

export { ROTEIRO, REALCES, type AlvoId, type Passo } from './roteiro'

export type Rect = { x: number; y: number; w: number; h: number }

type Estado = {
  ativo: boolean
  passo: number
  /** muda a cada (re)começo: a tela da partida remonta do zero */
  rodada: number
  tab: TabuleiroTutorial | null
  /** retângulos das áreas marcadas com <Alvo>, em unidades do palco */
  alvos: Partial<Record<AlvoId, Rect>>
}

export const useTutorial = create<Estado>(() => ({ ativo: false, passo: 0, rodada: 0, tab: null, alvos: {} }))

/** intervalo padrão entre as ações dos navios simulados */
const ATRASO_BOT = 900

let sala: SalaTutorial | null = null
let timers: ReturnType<typeof setTimeout>[] = []
/** quando a última ação na fila dos navios simulados acontece (relógio do navegador) */
let fimDaFila = 0
let textoSiga = ''

/** Texto do aviso quando o jogador sai do roteiro (no idioma atual). */
export function definirTextoSiga(texto: string) {
  textoSiga = texto
}

function limparTimers() {
  for (const id of timers) clearTimeout(id)
  timers = []
  fimDaFila = 0
}

/** Começa (ou recomeça) o tutorial: sala local, partida montada e primeiro passo. */
export function iniciarTutorial(idioma: Idioma, perfil: { name: string; avatar: Personagem }) {
  limparTimers()
  sala = montarTutorial(idioma, perfil, Date.now())
  useTutorial.setState((s) => ({ ativo: true, passo: 0, rodada: s.rodada + 1, tab: TABULEIROS_TUTORIAL[idioma] ?? TABULEIROS_TUTORIAL.pt }))
  useSala.setState({ code: 'TUTORIAL', eventos: [], fechado: null, conectado: true, offset: 0, local: enviarLocal })
  publicar()
  entrar(ROTEIRO[0])
}

/** Sai do tutorial: para os navios simulados e limpa o store da partida. */
export function encerrarTutorial() {
  limparTimers()
  sala = null
  useTutorial.setState({ ativo: false, alvos: {} })
  useSala.setState({ local: null })
  desconectar()
}

/** "Continuar" do balão. */
export function avancar() {
  const { passo } = useTutorial.getState()
  const p = ROTEIRO[passo]
  if (!p || p.ate || p.final) return
  irPara(passo + 1)
}

function irPara(n: number) {
  const p = ROTEIRO[n]
  if (!p) return
  useTutorial.setState({ passo: n })
  if (p.final) salvarEstadoTutorial('feito')
  entrar(p)
}

function entrar(p: Passo) {
  p.aoEntrar?.({
    bot: (id, action, atraso = ATRASO_BOT) => {
      // cada ação espera a anterior; a fila não acumula o tempo dos passos que já passaram
      fimDaFila = Math.max(Date.now(), fimDaFila) + atraso
      timers.push(setTimeout(() => agir(id, trocarDicas(action)), fimDaFila - Date.now()))
    },
    virarCapitao: () => {
      if (!sala) return
      virarCapitao(sala, I.voce)
      publicar()
    },
    estado: () => sala!.game!,
  })
}

/** "$fruta" e "$metal" viram as dicas no idioma do tabuleiro. */
function trocarDicas(a: CodenomesAction): CodenomesAction {
  const tab = useTutorial.getState().tab
  if (a.type !== 'giveClue' || !a.word.startsWith('$') || !tab) return a
  return { ...a, word: tab.dicas[a.word.slice(1) as keyof TabuleiroTutorial['dicas']] }
}

function publicar() {
  if (!sala) return
  useSala.setState({ view: viewRoom(sala, codenomes, I.voce, Date.now()) })
  const { passo } = useTutorial.getState()
  const p = ROTEIRO[passo]
  if (p?.ate && sala.game && p.ate(sala.game)) irPara(passo + 1)
}

function agir(id: string, action: CodenomesAction): string | null {
  if (!sala) return null
  const r = applyRoomAction(sala, codenomes, id, { type: 'game', action } as RoomAction<never, CodenomesAction>, { now: Date.now(), rng: Math.random })
  if (r.error) return r.error
  empurrarEventos(r.events)
  publicar()
  return null
}

/** Ações do jogador: só passam as que o passo atual permite. */
async function enviarLocal(action: Record<string, unknown>): Promise<boolean> {
  if (!sala) return false
  // "Sair": a tela leva para o início
  if (action.type === 'leave') return true
  const p = ROTEIRO[useTutorial.getState().passo]
  const jogo = action.type === 'game' ? (action.action as CodenomesAction) : null
  if (!jogo || !p?.permite?.(jogo)) {
    useSala.getState().mostrarErro(textoSiga)
    return false
  }
  const erro = agir(I.voce, jogo)
  if (erro) {
    useSala.getState().mostrarErro(erro)
    return false
  }
  return true
}

/** Para os testes de ponta a ponta. */
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  ;(window as unknown as { __tutorial: typeof useTutorial }).__tutorial = useTutorial
}
