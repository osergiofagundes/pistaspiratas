'use client'
import { useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { create } from 'zustand'
import type { ShipId } from '@arena/platform'
import type { CardView } from '@arena/codenomes'
import { IMG, usePalco } from '@/components/ui'

export type CartaProps = {
  carta: CardView
  w: number
  h: number
  /** Capitão vendo o mapa (com "Ocultar mapa" desligado) */
  mapa: boolean
  /** posição na seleção da tripulação (1, 2, 3…) ou null se não está marcada */
  ordem: number | null
  podeVotar: boolean
  /** navios cujos Capitães marcaram esta carta (só os Capitães recebem) */
  marcas?: ShipId[]
  /** a marca do meu navio está nela */
  minhaMarca?: boolean
  /** Capitão: clicar marca/desmarca */
  podeMarcar?: boolean
  onMarcar?: () => void
  destaque: boolean
  onVotar?: () => void
  animar: boolean
  /** fim de partida: mapa inteiro aberto, as cartas não reveladas ficam um pouco apagadas */
  fim?: boolean
}

/** Palavra ampliada ao tocar e segurar uma carta (no celular as cartas ficam pequenas). */
const useZoom = create<{ palavra: string | null; set: (p: string | null) => void }>((set) => ({ palavra: null, set: (palavra) => set({ palavra }) }))
const SEGURAR_MS = 450

export function ZoomCarta() {
  const palavra = useZoom((s) => s.palavra)
  const { W, H } = usePalco()
  return (
    <AnimatePresence>
      {palavra && (
        <motion.div
          key={palavra}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className="lilita zoom-carta"
          role="status"
          style={{ position: 'absolute', left: W / 2 - 300, top: H / 2 - 90, width: 600, height: 180, zIndex: 70, pointerEvents: 'none', fontSize: Math.min(76, 560 / Math.max(5, palavra.length * 0.62)) }}
        >
          {palavra.toUpperCase()}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Carta do tabuleiro (Carta/tabuleiro): pergaminho fechado, tesouro com o navio, Mar Aberto ou Kraken. */
export function Carta({ carta, w, h, mapa, ordem, podeVotar, marcas = [], minhaMarca, podeMarcar, onMarcar, destaque, onVotar, animar, fim }: CartaProps) {
  const marcada = ordem !== null && !carta.revealed
  const clicavel = podeVotar || (!!podeMarcar && !carta.revealed)
  const k = w / 158
  const dono = carta.owner
  const mostrarArte = carta.revealed || (mapa && dono)
  const arte = mostrarArte && dono ? dono : 'fechada'
  const esmaecida = mapa && carta.revealed && !fim
  const apagada = fim && !carta.revealed
  const fechada = arte === 'fechada'
  const centro = arte === 'mar' || arte === 'kraken'
  // tocar e segurar amplia a palavra; o toque que vem depois não vale como clique
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const segurou = useRef(false)
  const setZoom = useZoom((s) => s.set)
  const soltar = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    if (useZoom.getState().palavra) setZoom(null)
  }
  const acao = podeVotar ? onVotar : clicavel ? onMarcar : undefined

  return (
    <motion.button
      type="button"
      onClick={() => {
        if (segurou.current) {
          segurou.current = false
          return
        }
        acao?.()
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== 'touch') return
        segurou.current = false
        timer.current = setTimeout(() => {
          segurou.current = true
          setZoom(carta.word)
        }, SEGURAR_MS)
      }}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      onPointerLeave={soltar}
      onContextMenu={(e) => e.preventDefault()}
      aria-disabled={!clicavel}
      initial={false}
      animate={{ rotateY: animar ? [90, 0] : 0, scale: marcada ? 1.04 : 1 }}
      transition={{ duration: animar ? 0.45 : 0.15 }}
      whileHover={clicavel ? { y: -3 } : undefined}
      style={{
        position: 'relative',
        width: w,
        height: h,
        border: 0,
        padding: 0,
        background: `url(${IMG}/cartas/${arte}.webp) center / 100% 100% no-repeat`,
        cursor: clicavel ? 'pointer' : 'default',
        opacity: esmaecida ? 0.38 : apagada ? 0.62 : 1,
        filter: esmaecida ? 'saturate(.5)' : apagada ? 'saturate(.6) brightness(.85)' : undefined,
        borderRadius: 10 * k,
        outline: marcada
          ? `${Math.max(3, 4 * k)}px solid #FFD24A`
          : destaque
            ? `${3 * k}px solid #FFF8EC`
            : minhaMarca && !carta.revealed
              ? `${Math.max(2, 3 * k)}px dashed #FFF8EC`
              : undefined,
        outlineOffset: -2,
        boxShadow: marcada ? '0 0 22px rgba(255,210,74,.9)' : destaque ? '0 0 16px rgba(255,248,236,.8)' : undefined,
        transformStyle: 'preserve-3d',
      }}
      aria-label={carta.word}
    >
      {fechada ? (
        <span
          className="lilita"
          style={{
            position: 'absolute',
            left: 8 * k,
            right: 8 * k,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: Math.min(19, (w - 24) / Math.max(5, carta.word.length * 0.62)) * (k > 1.2 ? 1.15 : 1),
            color: '#4A2A0E',
            letterSpacing: 0.3,
          }}
        >
          {carta.word.toUpperCase()}
        </span>
      ) : (
        <span
          className="lilita"
          style={{
            position: 'absolute',
            left: 17 * k,
            width: 124 * k,
            top: (centro ? 39 : 64) * k,
            height: 26 * k,
            borderRadius: 13 * k,
            background: arte === 'mar' ? 'rgba(11,26,46,.8)' : arte === 'kraken' ? 'rgba(30,10,46,.82)' : 'rgba(26,14,6,.72)',
            color: '#FFF8EC',
            fontSize: Math.min(16 * k, (124 * k - 10) / Math.max(5, carta.word.length * 0.6)),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {carta.word.toUpperCase()}
        </span>
      )}

      {marcas.length > 0 && !carta.revealed && (
        <span style={{ position: 'absolute', right: -6, top: -12, display: 'flex', flexDirection: 'row-reverse', pointerEvents: 'none' }}>
          {marcas.map((s, i) => (
            <motion.img
              key={s}
              initial={{ scale: 0, y: -8 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              src={`${IMG}/bandeiras/bandeirinha-${s}.webp`}
              alt=""
              style={{ width: Math.max(22, 30 * k), height: Math.max(19, 26 * k), marginLeft: i === 0 ? 0 : -8, objectFit: 'contain', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.6))' }}
            />
          ))}
        </span>
      )}
      {marcada && (
        <motion.span
          key={ordem}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 16 }}
          className="lilita"
          style={{
            position: 'absolute',
            left: -8,
            top: -10,
            width: Math.max(26, 34 * k),
            height: Math.max(26, 34 * k),
            borderRadius: '50%',
            background: 'linear-gradient(#FFE27A, #E0A21E)',
            border: '2px solid #6B3A17',
            color: '#3A1D0C',
            fontSize: Math.max(15, 20 * k),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,.5)',
          }}
        >
          {ordem}
        </motion.span>
      )}
    </motion.button>
  )
}
