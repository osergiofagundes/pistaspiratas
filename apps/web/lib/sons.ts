'use client'
/**
 * Áudio do jogo, todo sintetizado com Web Audio (sem arquivos).
 * Um AudioContext único com dois canais de volume:
 *   efeitos ─┐
 *            ├─> mestre ─> saída
 *   música ──┘
 * Efeitos: moedas para Tesouro, ondas para Mar Aberto, rugido para o Kraken, sino na troca
 * de vez, fanfarra na vitória e clique dos botões. As músicas ficam em ./musica.ts.
 */
type Canais = { ctx: AudioContext; mestre: GainNode; efeitos: GainNode; musica: GainNode }

let canais: Canais | null = null
let volumes = { efeitos: 0.8, musica: 0.5, mudo: false }
const aoDestravar: (() => void)[] = []

export function audio(): Canais | null {
  if (typeof window === 'undefined') return null
  if (!canais) {
    const AC = window.AudioContext ?? (window as any).webkitAudioContext
    if (!AC) return null
    const ctx: AudioContext = new AC()
    const mestre = ctx.createGain()
    const efeitos = ctx.createGain()
    const musica = ctx.createGain()
    efeitos.connect(mestre)
    musica.connect(mestre)
    mestre.connect(ctx.destination)
    canais = { ctx, mestre, efeitos, musica }
    aplicarVolumes(volumes, 0)
  }
  return canais
}

/** O navegador só libera o som depois de um gesto do jogador (clique ou tecla). */
export function destravarAudio() {
  if (typeof window === 'undefined') return
  const destravar = () => {
    const a = audio()
    if (!a) return
    void a.ctx.resume().then(() => {
      while (aoDestravar.length) aoDestravar.shift()!()
    })
    window.removeEventListener('pointerdown', destravar)
    window.removeEventListener('keydown', destravar)
  }
  window.addEventListener('pointerdown', destravar)
  window.addEventListener('keydown', destravar)
}

export function audioLiberado(): boolean {
  return canais?.ctx.state === 'running'
}

/** Executa assim que o áudio estiver liberado (na hora, se já estiver). */
export function quandoLiberado(fn: () => void) {
  if (audioLiberado()) fn()
  else aoDestravar.push(fn)
}

/** Volumes de 0 a 1; aplica com uma rampa curta para não estalar. */
export function aplicarVolumes(v: { efeitos: number; musica: number; mudo: boolean }, rampa = 0.1) {
  volumes = { efeitos: v.efeitos, musica: v.musica, mudo: v.mudo }
  if (!canais) return
  const t = canais.ctx.currentTime
  const set = (g: GainNode, valor: number) => {
    g.gain.cancelScheduledValues(t)
    g.gain.setValueAtTime(g.gain.value, t)
    g.gain.linearRampToValueAtTime(valor, t + rampa)
  }
  set(canais.mestre, v.mudo ? 0 : 1)
  // curva quadrática: o controle fica mais natural ao ouvido
  set(canais.efeitos, v.efeitos * v.efeitos)
  set(canais.musica, v.musica * v.musica * 0.6)
}

export function volumesAtuais() {
  return { ...volumes, ganhoEfeitos: canais?.efeitos.gain.value, ganhoMusica: canais?.musica.gain.value, ganhoMestre: canais?.mestre.gain.value }
}

function tom(a: Canais, freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18) {
  const o = a.ctx.createOscillator()
  const g = a.ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, start)
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(vol, start + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  o.connect(g).connect(a.efeitos)
  o.start(start)
  o.stop(start + dur + 0.05)
}

let bufferRuido: AudioBuffer | null = null
export function ruidoBranco(ctx: AudioContext): AudioBuffer {
  if (!bufferRuido) {
    const len = ctx.sampleRate * 2
    bufferRuido = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = bufferRuido.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  }
  return bufferRuido
}

function ruido(a: Canais, start: number, dur: number, from: number, to: number, vol = 0.25) {
  const src = a.ctx.createBufferSource()
  src.buffer = ruidoBranco(a.ctx)
  const f = a.ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.setValueAtTime(from, start)
  f.frequency.exponentialRampToValueAtTime(to, start + dur)
  const g = a.ctx.createGain()
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(vol, start + dur * 0.35)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  src.connect(f).connect(g).connect(a.efeitos)
  src.start(start)
  src.stop(start + dur + 0.05)
}

export type Som = 'moedas' | 'ondas' | 'rugido' | 'sino' | 'vitoria' | 'clique'

export function tocar(som: Som) {
  const a = audio()
  if (!a || a.ctx.state !== 'running' || volumes.mudo || volumes.efeitos === 0) return
  const t = a.ctx.currentTime + 0.02
  switch (som) {
    case 'moedas':
      tom(a, 1318, t, 0.12, 'triangle')
      tom(a, 1760, t + 0.08, 0.18, 'triangle')
      tom(a, 2093, t + 0.16, 0.25, 'triangle', 0.12)
      break
    case 'ondas':
      ruido(a, t, 1.1, 400, 1800, 0.22)
      ruido(a, t + 0.5, 1.2, 1500, 300, 0.16)
      break
    case 'rugido': {
      const o = a.ctx.createOscillator()
      const g = a.ctx.createGain()
      const lfo = a.ctx.createOscillator()
      const lg = a.ctx.createGain()
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(110, t)
      o.frequency.exponentialRampToValueAtTime(45, t + 1.2)
      lfo.frequency.value = 18
      lg.gain.value = 20
      lfo.connect(lg).connect(o.frequency)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.08)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3)
      o.connect(g).connect(a.efeitos)
      o.start(t)
      lfo.start(t)
      o.stop(t + 1.4)
      lfo.stop(t + 1.4)
      ruido(a, t, 1.0, 300, 80, 0.15)
      break
    }
    case 'sino':
      tom(a, 880, t, 0.6, 'sine', 0.1)
      tom(a, 1320, t, 0.4, 'sine', 0.05)
      break
    case 'vitoria':
      ;[523, 659, 784, 1046].forEach((f, i) => tom(a, f, t + i * 0.14, 0.35, 'triangle', 0.15))
      tom(a, 1046, t + 0.6, 0.8, 'triangle', 0.12)
      break
    case 'clique':
      tom(a, 600, t, 0.05, 'square', 0.04)
      break
  }
}
