'use client'
import { motion } from 'motion/react'
import type { Player } from '@arena/platform'
import type { CardView } from '@arena/codenomes'
import { avatarSrc, IMG } from '@/components/ui'

export type CartaProps = {
  carta: CardView
  w: number
  h: number
  /** Capitão vendo o mapa (com "Ocultar mapa" desligado) */
  mapa: boolean
  votos: Player[]
  meuVoto: boolean
  contagem: number | null
  podeVotar: boolean
  destaque: boolean
  onVotar?: () => void
  animar: boolean
  /** fim de partida: mapa inteiro aberto, as cartas não reveladas ficam um pouco apagadas */
  fim?: boolean
}

/** Carta do tabuleiro (Carta/tabuleiro): pergaminho fechado, tesouro com o navio, Mar Aberto ou Kraken. */
export function Carta({ carta, w, h, mapa, votos, meuVoto, contagem, podeVotar, destaque, onVotar, animar, fim }: CartaProps) {
  const k = w / 158
  const dono = carta.owner
  const mostrarArte = carta.revealed || (mapa && dono)
  const arte = mostrarArte && dono ? dono : 'fechada'
  const esmaecida = mapa && carta.revealed && !fim
  const apagada = fim && !carta.revealed
  const fechada = arte === 'fechada'
  const centro = arte === 'mar' || arte === 'kraken'

  return (
    <motion.button
      type="button"
      onClick={podeVotar ? onVotar : undefined}
      disabled={!podeVotar}
      initial={false}
      animate={{ rotateY: animar ? [90, 0] : 0, scale: meuVoto ? 1.03 : 1 }}
      transition={{ duration: animar ? 0.45 : 0.15 }}
      whileHover={podeVotar ? { y: -3 } : undefined}
      style={{
        position: 'relative',
        width: w,
        height: h,
        border: 0,
        padding: 0,
        background: `url(${IMG}/cartas/${arte}.webp) center / 100% 100% no-repeat`,
        cursor: podeVotar ? 'pointer' : 'default',
        opacity: esmaecida ? 0.38 : apagada ? 0.62 : 1,
        filter: esmaecida ? 'saturate(.5)' : apagada ? 'saturate(.6) brightness(.85)' : undefined,
        borderRadius: 10 * k,
        outline: meuVoto ? `${3 * k}px solid #FFD24A` : destaque ? `${3 * k}px solid #FFF8EC` : undefined,
        outlineOffset: -2,
        boxShadow: meuVoto ? '0 0 18px rgba(255,210,74,.75)' : destaque ? '0 0 16px rgba(255,248,236,.8)' : undefined,
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

      {votos.length > 0 && !carta.revealed && (
        <span style={{ position: 'absolute', right: -6, top: -10, display: 'flex', flexDirection: 'row-reverse' }}>
          {votos.slice(0, 5).map((p, i) => (
            <motion.img
              key={p.id}
              initial={{ scale: 0, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              src={avatarSrc(p.avatar, p.shipId)}
              alt={p.name}
              title={p.name}
              style={{ width: 30, height: 30, marginLeft: i === 0 ? 0 : -8, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.5))' }}
            />
          ))}
        </span>
      )}
      {contagem !== null && !carta.revealed && <Contagem valor={contagem} />}
    </motion.button>
  )
}

export function Contagem({ valor, cor = '#C2362B' }: { valor: number; cor?: string }) {
  return (
    <motion.span
      key={valor}
      initial={{ scale: 1.5 }}
      animate={{ scale: 1 }}
      className="lilita"
      style={{
        position: 'absolute',
        left: -8,
        top: -10,
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: cor,
        border: '2px solid #FFF8EC',
        color: '#FFF8EC',
        fontSize: 19,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,.5)',
      }}
    >
      {valor}
    </motion.span>
  )
}
