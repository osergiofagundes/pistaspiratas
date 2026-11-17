'use client'
/**
 * Músicas originais do jogo, sintetizadas com Web Audio (sem arquivos).
 *
 *   porto     Início e Salão: valsa de taverna em ré dórico, 6/8
 *   alto-mar  Partida: lá menor, 4/4, mais tensa, com percussão
 *   vitoria   vinheta de fanfarra no fim da partida e depois o porto, festivo
 *   derrota   vinheta lenta e grave e depois o porto, mais devagar
 *
 * Um agendador olha ~0,15 s à frente no relógio do AudioContext, então o ritmo não
 * depende da precisão do setInterval. Tudo sai pelo canal de música (volume próprio).
 */
import { audio, quandoLiberado, ruidoBranco } from './sons'

export type FaixaNome = 'porto' | 'alto-mar' | 'vitoria' | 'derrota'

/**
 * Para trocar uma faixa por um arquivo (ex.: gerado em outro programa), coloque o MP3 em
 * public/audio/ e registre aqui, por exemplo: { porto: '/audio/porto.mp3' }.
 */
const ARQUIVOS: Partial<Record<FaixaNome, string>> = {}

const freq = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

// ---------------------------------------------------------------- instrumentos

type Saida = AudioNode

function envelope(ctx: AudioContext, t: number, dur: number, vol: number, ataque = 0.02, solta = 0.08) {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + ataque)
  g.gain.setValueAtTime(vol, Math.max(t + ataque, t + dur - solta))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + solta)
  return g
}

function vibrato(ctx: AudioContext, t: number, dur: number, alvo: AudioParam, cents = 6, hz = 5.5) {
  const lfo = ctx.createOscillator()
  const g = ctx.createGain()
  lfo.frequency.value = hz
  g.gain.value = cents
  lfo.connect(g).connect(alvo)
  lfo.start(t)
  lfo.stop(t + dur + 0.2)
}

/** Acordeão: duas dente-de-serra desafinadas e uma quadrada uma oitava abaixo, com filtro. */
function acordeao(ctx: AudioContext, out: Saida, m: number, t: number, dur: number, vol = 0.07) {
  const filtro = ctx.createBiquadFilter()
  filtro.type = 'lowpass'
  filtro.frequency.value = 2000
  filtro.Q.value = 0.7
  const env = envelope(ctx, t, dur, vol, 0.03, 0.07)
  filtro.connect(env).connect(out)
  for (const [tipo, det, mult, v] of [
    ['sawtooth', -7, 1, 1],
    ['sawtooth', 7, 1, 1],
    ['square', 0, 0.5, 0.35],
  ] as const) {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = tipo
    o.frequency.value = freq(m) * mult
    o.detune.value = det
    vibrato(ctx, t, dur, o.detune, 5)
    g.gain.value = v
    o.connect(g).connect(filtro)
    o.start(t)
    o.stop(t + dur + 0.15)
  }
}

/** Flauta: seno com vibrato e um sopro de ruído no começo. */
function flauta(ctx: AudioContext, out: Saida, m: number, t: number, dur: number, vol = 0.09) {
  const o = ctx.createOscillator()
  o.type = 'sine'
  o.frequency.value = freq(m)
  vibrato(ctx, t + 0.12, dur, o.detune, 9, 5.2)
  const env = envelope(ctx, t, dur, vol, 0.05, 0.1)
  o.connect(env).connect(out)
  o.start(t)
  o.stop(t + dur + 0.2)
  const s = ctx.createBufferSource()
  s.buffer = ruidoBranco(ctx)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = freq(m) * 2
  const gs = envelope(ctx, t, 0.06, vol * 0.25, 0.01, 0.04)
  s.connect(bp).connect(gs).connect(out)
  s.start(t, Math.random())
  s.stop(t + 0.15)
}

function baixo(ctx: AudioContext, out: Saida, m: number, t: number, dur: number, vol = 0.16) {
  const o = ctx.createOscillator()
  o.type = 'triangle'
  o.frequency.value = freq(m)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(vol * 0.5, t + dur * 0.6)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05)
  o.connect(g).connect(out)
  o.start(t)
  o.stop(t + dur + 0.1)
}

/** Violão dedilhado: notas curtas com filtro que fecha rápido. */
function violao(ctx: AudioContext, out: Saida, notas: number[], t: number, vol = 0.045) {
  notas.forEach((m, i) => {
    const ti = t + i * 0.012
    const o = ctx.createOscillator()
    o.type = 'square'
    o.frequency.value = freq(m)
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(3200, ti)
    f.frequency.exponentialRampToValueAtTime(500, ti + 0.18)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, ti)
    g.gain.exponentialRampToValueAtTime(vol, ti + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, ti + 0.28)
    o.connect(f).connect(g).connect(out)
    o.start(ti)
    o.stop(ti + 0.3)
  })
}

function bumbo(ctx: AudioContext, out: Saida, t: number, vol = 0.35) {
  const o = ctx.createOscillator()
  o.frequency.setValueAtTime(130, t)
  o.frequency.exponentialRampToValueAtTime(42, t + 0.14)
  const g = ctx.createGain()
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
  o.connect(g).connect(out)
  o.start(t)
  o.stop(t + 0.25)
}

function ruidoCurto(ctx: AudioContext, out: Saida, t: number, tipo: BiquadFilterType, hz: number, dur: number, vol: number) {
  const s = ctx.createBufferSource()
  s.buffer = ruidoBranco(ctx)
  const f = ctx.createBiquadFilter()
  f.type = tipo
  f.frequency.value = hz
  const g = ctx.createGain()
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  s.connect(f).connect(g).connect(out)
  s.start(t, Math.random() * 1.5)
  s.stop(t + dur + 0.02)
}
const caixa = (ctx: AudioContext, out: Saida, t: number, vol = 0.12) => ruidoCurto(ctx, out, t, 'bandpass', 1800, 0.13, vol)
const chocalho = (ctx: AudioContext, out: Saida, t: number, vol = 0.04) => ruidoCurto(ctx, out, t, 'highpass', 7000, 0.05, vol)

// ---------------------------------------------------------------- faixas

type Nota = [passo: number, midi: number, duracao: number]
type Ctx = { ctx: AudioContext; out: Saida; t: number; passo: number; dp: number; volta: number; intensidade: number }
type Faixa = { passosPorCompasso: number; compassos: number; segundosPorPasso: number; tocar: (c: Ctx) => void }

const ACORDES: Record<string, number[]> = {
  Dm: [62, 65, 69],
  C: [60, 64, 67],
  Am: [57, 60, 64],
  G: [55, 59, 62],
  F: [53, 57, 60],
  Em: [52, 55, 59],
  E: [52, 56, 59],
}

// Porto: valsa de taverna em ré dórico, 6/8 (6 colcheias por compasso)
const PORTO_ACORDES = ['Dm', 'C', 'Dm', 'Am', 'Dm', 'G', 'C', 'Dm', 'F', 'C', 'G', 'Dm', 'F', 'C', 'Am', 'Dm']
const PORTO_MELODIA: Nota[][] = [
  [[0, 69, 2], [2, 74, 1], [3, 74, 2], [5, 76, 1]],
  [[0, 77, 2], [2, 76, 1], [3, 74, 2], [5, 72, 1]],
  [[0, 69, 3], [3, 65, 2], [5, 69, 1]],
  [[0, 76, 3], [3, 72, 3]],
  [[0, 69, 2], [2, 74, 1], [3, 74, 2], [5, 77, 1]],
  [[0, 79, 2], [2, 77, 1], [3, 76, 2], [5, 74, 1]],
  [[0, 76, 2], [2, 72, 1], [3, 67, 2], [5, 72, 1]],
  [[0, 74, 6]],
  [[0, 72, 2], [2, 69, 1], [3, 65, 2], [5, 69, 1]],
  [[0, 67, 2], [2, 72, 1], [3, 76, 3]],
  [[0, 74, 2], [2, 71, 1], [3, 67, 2], [5, 71, 1]],
  [[0, 69, 3], [3, 74, 3]],
  [[0, 77, 2], [2, 76, 1], [3, 77, 2], [5, 81, 1]],
  [[0, 79, 2], [2, 76, 1], [3, 72, 3]],
  [[0, 76, 2], [2, 74, 1], [3, 72, 2], [5, 71, 1]],
  [[0, 74, 3], [3, 69, 1], [4, 74, 2]],
]

function porto(segundos: number): Faixa {
  return {
    passosPorCompasso: 6,
    compassos: 16,
    segundosPorPasso: segundos,
    tocar: ({ ctx, out, t, passo, dp, volta }) => {
      const comp = Math.floor(passo / 6)
      const p = passo % 6
      const acorde = ACORDES[PORTO_ACORDES[comp]]
      // baixo no 1 e no 4, violão nos tempos fracos (o "pum-pá-pá" da valsa)
      if (p === 0) baixo(ctx, out, acorde[0] - 24, t, dp * 2.5)
      if (p === 3) baixo(ctx, out, acorde[2] - 24, t, dp * 2.5)
      if (p === 1 || p === 2 || p === 4 || p === 5) violao(ctx, out, acorde, t, p === 1 || p === 4 ? 0.045 : 0.03)
      if (p === 0) bumbo(ctx, out, t, 0.18)
      if (p === 3) chocalho(ctx, out, t, 0.03)
      // melodia: acordeão nas voltas pares, flauta uma oitava acima nas ímpares
      for (const [np, m, d] of PORTO_MELODIA[comp]) {
        if (np !== p) continue
        if (volta % 2 === 0) acordeao(ctx, out, m, t, d * dp * 0.95)
        else flauta(ctx, out, m + 12, t, d * dp * 0.95, 0.07)
      }
      // na volta da flauta, o acordeão segura o acorde por baixo
      if (volta % 2 === 1 && p === 0) for (const m of acorde) acordeao(ctx, out, m, t, dp * 5.8, 0.022)
    },
  }
}

// Alto-mar: lá menor, 4/4 (8 colcheias por compasso), mais tensa
const MAR_ACORDES = ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E', 'Dm', 'Am', 'E', 'Am', 'F', 'G', 'E', 'E']
const MAR_MELODIA: Nota[][] = [
  [[0, 76, 2], [2, 74, 1], [3, 72, 1], [4, 71, 2], [6, 72, 2]],
  [[0, 77, 3], [3, 76, 1], [4, 74, 4]],
  [[0, 72, 2], [2, 74, 1], [3, 76, 1], [4, 79, 2], [6, 76, 2]],
  [[0, 74, 6], [6, 71, 2]],
  [[0, 69, 1], [1, 72, 1], [2, 76, 2], [4, 81, 2], [6, 79, 2]],
  [[0, 77, 2], [2, 76, 2], [4, 74, 2], [6, 72, 2]],
  [[0, 71, 2], [2, 74, 2], [4, 79, 3], [7, 77, 1]],
  [[0, 76, 4], [4, 80, 4]],
  [[0, 77, 2], [2, 76, 1], [3, 74, 1], [4, 72, 2], [6, 74, 2]],
  [[0, 76, 4], [4, 72, 2], [6, 69, 2]],
  [[0, 71, 2], [2, 72, 1], [3, 74, 1], [4, 76, 2], [6, 80, 2]],
  [[0, 81, 6], [6, 76, 2]],
  [[0, 77, 2], [2, 81, 2], [4, 79, 2], [6, 77, 2]],
  [[0, 79, 2], [2, 77, 2], [4, 76, 2], [6, 74, 2]],
  [[0, 76, 2], [2, 74, 1], [3, 72, 1], [4, 71, 4]],
  [[0, 68, 2], [2, 71, 2], [4, 76, 4]],
]

const ALTO_MAR: Faixa = {
  passosPorCompasso: 8,
  compassos: 16,
  segundosPorPasso: 60 / 112 / 2,
  tocar: ({ ctx, out, t, passo, dp, volta, intensidade }) => {
    const comp = Math.floor(passo / 8)
    const p = passo % 8
    const acorde = ACORDES[MAR_ACORDES[comp]]
    // baixo galopando: fundamental nas colcheias pares, oitava no contratempo
    if (p % 2 === 0) baixo(ctx, out, acorde[0] - 24, t, dp * 0.9, 0.15)
    if (p === 3 || p === 7) baixo(ctx, out, acorde[0] - 12, t, dp * 0.8, 0.1)
    if (p === 0 || p === 4) bumbo(ctx, out, t, 0.3)
    if (p === 2 || p === 6) caixa(ctx, out, t, 0.1)
    chocalho(ctx, out, t, intensidade > 0 ? 0.05 : 0.025)
    if (intensidade > 0) chocalho(ctx, out, t + dp / 2, 0.04)
    if (p === 0) for (const m of acorde) acordeao(ctx, out, m, t, dp * 3.7, 0.02)
    if (p === 4) for (const m of acorde) acordeao(ctx, out, m, t, dp * 3.7, 0.016)
    for (const [np, m, d] of MAR_MELODIA[comp]) {
      if (np !== p) continue
      // primeira volta na flauta, segunda no acordeão, depois os dois juntos
      if (volta % 3 !== 1) flauta(ctx, out, m, t, d * dp * 0.92, 0.08)
      if (volta % 3 !== 0) acordeao(ctx, out, m - 12, t, d * dp * 0.92, 0.05)
    }
  },
}

/** Vinhetas de fim: notas soltas com tempo em segundos, depois volta ao porto. */
type Vinheta = { duracao: number; notas: [t: number, midi: number, dur: number, instr: 'acordeao' | 'flauta' | 'baixo'][]; depois: Faixa }

const VITORIA: Vinheta = {
  duracao: 4.2,
  notas: [
    [0, 62, 0.25, 'acordeao'], [0.25, 66, 0.25, 'acordeao'], [0.5, 69, 0.25, 'acordeao'], [0.75, 74, 0.6, 'acordeao'],
    [1.4, 71, 0.25, 'acordeao'], [1.65, 74, 0.25, 'acordeao'], [1.9, 78, 0.9, 'flauta'],
    [2.8, 76, 0.2, 'flauta'], [3.0, 78, 0.2, 'flauta'], [3.2, 81, 1.0, 'flauta'],
    [0, 38, 0.7, 'baixo'], [1.4, 43, 0.7, 'baixo'], [2.8, 45, 0.4, 'baixo'], [3.2, 38, 1.0, 'baixo'],
  ],
  depois: porto(0.26),
}

const DERROTA: Vinheta = {
  duracao: 5,
  notas: [
    [0, 69, 0.9, 'acordeao'], [1, 68, 0.9, 'acordeao'], [2, 67, 0.9, 'acordeao'], [3, 62, 1.8, 'acordeao'],
    [0, 45, 1.9, 'baixo'], [2, 43, 0.9, 'baixo'], [3, 38, 1.8, 'baixo'],
  ],
  depois: porto(0.4),
}

// ---------------------------------------------------------------- agendador

type Tocando = { nome: FaixaNome; faixa: Faixa; saida: GainNode; passo: number; proximo: number; volta: number; buffer?: AudioBufferSourceNode }

let atual: Tocando | null = null
let desejada: FaixaNome | null = null
let nivel = 0
let relogio: ReturnType<typeof setInterval> | null = null
const ANTECEDENCIA = 0.15

function agendar() {
  const a = audio()
  if (!a || !atual || atual.buffer) return
  const { ctx } = a
  const f = atual.faixa
  const dp = f.segundosPorPasso / (1 + 0.12 * nivel)
  // aba voltou do segundo plano: pula o que ficou para trás em vez de tocar tudo de uma vez
  if (atual.proximo < ctx.currentTime - 0.05) atual.proximo = ctx.currentTime + 0.05
  const total = f.passosPorCompasso * f.compassos
  while (atual.proximo < ctx.currentTime + ANTECEDENCIA) {
    f.tocar({ ctx, out: atual.saida, t: atual.proximo, passo: atual.passo, dp, volta: atual.volta, intensidade: nivel })
    atual.proximo += dp
    atual.passo++
    if (atual.passo >= total) {
      atual.passo = 0
      atual.volta++
    }
  }
}

function novaSaida(): GainNode | null {
  const a = audio()
  if (!a) return null
  const g = a.ctx.createGain()
  g.gain.setValueAtTime(0.0001, a.ctx.currentTime)
  g.gain.linearRampToValueAtTime(1, a.ctx.currentTime + 1)
  g.connect(a.musica)
  return g
}

function soltar(t: Tocando | null) {
  const a = audio()
  if (!a || !t) return
  const agora = a.ctx.currentTime
  t.saida.gain.cancelScheduledValues(agora)
  t.saida.gain.setValueAtTime(t.saida.gain.value, agora)
  t.saida.gain.linearRampToValueAtTime(0.0001, agora + 1)
  t.buffer?.stop(agora + 1.05)
  setTimeout(() => t.saida.disconnect(), 1300)
}

function comecarFaixa(nome: FaixaNome, faixa: Faixa) {
  const a = audio()!
  soltar(atual)
  const saida = novaSaida()!
  atual = { nome, faixa, saida, passo: 0, proximo: a.ctx.currentTime + 0.1, volta: 0 }
  if (!relogio) relogio = setInterval(agendar, 25)
}

function tocarVinheta(nome: FaixaNome, v: Vinheta) {
  const a = audio()!
  soltar(atual)
  const saida = novaSaida()!
  saida.gain.cancelScheduledValues(a.ctx.currentTime)
  saida.gain.setValueAtTime(1, a.ctx.currentTime)
  const t0 = a.ctx.currentTime + 0.05
  for (const [t, m, d, instr] of v.notas) {
    if (instr === 'acordeao') acordeao(a.ctx, saida, m, t0 + t, d, 0.08)
    else if (instr === 'flauta') flauta(a.ctx, saida, m, t0 + t, d, 0.1)
    else baixo(a.ctx, saida, m, t0 + t, d, 0.18)
  }
  // fica "tocando" a vinheta (sem agendador) e depois entra o porto
  atual = { nome, faixa: { ...v.depois, tocar: () => {} }, saida, passo: 0, proximo: Infinity, volta: 0 }
  setTimeout(() => {
    if (atual?.nome === nome && desejada === nome) comecarFaixa(nome, v.depois)
  }, v.duracao * 1000)
}

async function tocarArquivo(nome: FaixaNome, url: string): Promise<boolean> {
  const a = audio()
  if (!a) return false
  try {
    const dados = await (await fetch(url)).arrayBuffer()
    const buf = await a.ctx.decodeAudioData(dados)
    if (desejada !== nome) return true
    soltar(atual)
    const saida = novaSaida()!
    const src = a.ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    src.connect(saida)
    src.start()
    atual = { nome, faixa: ALTO_MAR, saida, passo: 0, proximo: Infinity, volta: 0, buffer: src }
    return true
  } catch {
    return false
  }
}

function iniciar(nome: FaixaNome) {
  if (desejada !== nome || atual?.nome === nome) return
  const arquivo = ARQUIVOS[nome]
  const sintetizada = () => {
    if (nome === 'porto') comecarFaixa(nome, porto(0.3))
    else if (nome === 'alto-mar') comecarFaixa(nome, ALTO_MAR)
    else if (nome === 'vitoria') tocarVinheta(nome, VITORIA)
    else tocarVinheta(nome, DERROTA)
  }
  if (arquivo) void tocarArquivo(nome, arquivo).then((ok) => !ok && sintetizada())
  else sintetizada()
}

/** Toca a faixa (com troca suave). Antes do primeiro clique do jogador, fica guardada. */
export function tocarMusica(nome: FaixaNome) {
  if (desejada === nome) return
  desejada = nome
  if (nome !== 'alto-mar') nivel = 0
  quandoLiberado(() => iniciar(desejada!))
}

export function pararMusica() {
  desejada = null
  soltar(atual)
  atual = null
}

/** 0 = normal; 1 = relógio acabando (acelera e põe mais chocalho). */
export function intensidade(n: number) {
  nivel = n
}

export function musicaAtual(): FaixaNome | null {
  return atual?.nome ?? null
}

