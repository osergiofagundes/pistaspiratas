'use client'
import { create } from 'zustand'
import type { GameEvent, RoomView } from '@arena/platform'
import type { CodenomesConfig, CodenomesView } from '@arena/codenomes'
import { acao } from './api'
import { identidade, preferencias, PREFS_PADRAO, salvarPreferencias, type Preferencias } from './identidade'
import { aplicarVolumes, audio, destravarAudio, tocar, volumesAtuais } from './sons'
import { musicaAtual } from './musica'

export type Visao = RoomView<CodenomesConfig, CodenomesView>
export type Fechamento = 'kicked' | 'expired' | 'left' | 'not-found' | 'not-member'

type Estado = {
  code: string | null
  view: Visao | null
  conectado: boolean
  fechado: Fechamento | null
  /** diferença entre o relógio do servidor e o do navegador */
  offset: number
  eventos: (GameEvent & { at: number; seq: number })[]
  erro: { texto: string; seq: number } | null
  prefs: Preferencias
  setPrefs: (p: Partial<Preferencias>) => void
  carregarPrefs: () => void
  enviar: (action: Record<string, unknown>) => Promise<boolean>
  mostrarErro: (texto: string) => void
}

let seq = 0

export const useSala = create<Estado>((set, get) => ({
  code: null,
  view: null,
  conectado: false,
  fechado: null,
  offset: 0,
  eventos: [],
  erro: null,
  // as preferências do localStorage são lidas depois da hidratação (carregarPrefs)
  prefs: PREFS_PADRAO,
  carregarPrefs: () => {
    const prefs = preferencias()
    aplicarVolumes(prefs, 0)
    destravarAudio()
    set({ prefs })
  },
  setPrefs: (p) => {
    const prefs = { ...get().prefs, ...p }
    salvarPreferencias(prefs)
    aplicarVolumes(prefs)
    set({ prefs })
  },
  enviar: async (action) => {
    const code = get().code
    if (!code) return false
    const r = await acao(code, action)
    if (!r.ok && r.error) get().mostrarErro(r.error)
    return r.ok
  },
  mostrarErro: (texto) => set({ erro: { texto, seq: ++seq } }),
}))

/** Hora atual no relógio do servidor. */
export function agora(): number {
  return Date.now() + useSala.getState().offset
}

let fonte: EventSource | null = null

/** Abre o canal de tempo real da sala (SSE). O navegador reconecta sozinho. */
export function conectar(code: string) {
  desconectar()
  const { id, token } = identidade()
  useSala.setState({ code, fechado: null, view: null, eventos: [] })
  const es = new EventSource(`/api/salas/${code}/eventos?id=${id}&token=${token}`)
  fonte = es
  es.onopen = () => useSala.setState({ conectado: true })
  es.onerror = () => useSala.setState({ conectado: false })
  es.onmessage = (e) => {
    let msg: any
    try {
      msg = JSON.parse(e.data)
    } catch {
      return
    }
    if (msg.type === 'state') {
      const view = msg.state as Visao
      useSala.setState({ view, conectado: true, offset: view.now - Date.now() })
    } else if (msg.type === 'event') {
      const ev = { ...(msg.event as GameEvent), at: Date.now(), seq: ++seq }
      useSala.setState((s) => ({ eventos: [...s.eventos.slice(-20), ev] }))
      somDoEvento(ev)
    } else if (msg.type === 'closed' || msg.type === 'error') {
      const motivo = (msg.reason ?? msg.message) as Fechamento
      useSala.setState({ fechado: motivo, conectado: false })
      es.close()
      if (fonte === es) fonte = null
    }
  }
}

/** Fecha o canal e esquece a sala atual (as preferências ficam). */
export function desconectar() {
  fonte?.close()
  fonte = null
  useSala.setState({ code: null, view: null, fechado: null, conectado: false, eventos: [] })
}

function somDoEvento(ev: GameEvent) {
  if (ev.type === 'reveal') {
    if (ev.owner === 'mar') tocar('ondas')
    else if (ev.owner === 'kraken') tocar('rugido')
    else tocar('moedas')
  } else if (ev.type === 'victory') tocar('vitoria')
  else if (ev.type === 'turn') tocar('sino')
}

// acesso para os testes de ponta a ponta (Playwright) em desenvolvimento
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  ;(window as unknown as { __sala: typeof useSala }).__sala = useSala
  ;(window as unknown as { __audio: unknown }).__audio = { volumes: volumesAtuais, musica: musicaAtual, estado: () => audio()?.ctx.state, canais: audio, aplicar: aplicarVolumes }
}
