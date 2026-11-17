'use client'
import { SHIP_INFO, type Player } from '@arena/platform'
import type { CardView, CodenomesView, ShipView } from '@arena/codenomes'
import { Avatar, Moldura, Navio, Texto } from '@/components/ui'
import { Carta } from './Carta'

/** Painel de um navio na coluna da esquerda (Moldura 320×200). */
export function PainelNavio({ ship, players, x, y, vez }: { ship: ShipView; players: Player[]; x: number; y: number; vez: boolean }) {
  const info = SHIP_INFO[ship.id]
  const crew = players.filter((p) => p.shipId === ship.id)
  const ordenados = [...crew].sort((a, b) => (a.id === ship.captainId ? -1 : b.id === ship.captainId ? 1 : 0))
  const achados = ship.total - ship.left
  return (
    <>
      {vez && <div className="pulsar" style={{ position: 'absolute', left: x - 6, top: y - 6, width: 332, height: 212, border: '4px solid #FFD24A', borderRadius: 18 }} />}
      <Moldura x={x} y={y} w={320} h={200} />
      {ship.eliminated ? <Navio ship={ship.id} afundado x={x + 12} y={y + 74} w={124} h={82} /> : <Navio ship={ship.id} className={vez ? "navegar" : undefined} x={x + 20} y={y + 58} w={104} h={101} />}
      <Texto x={x + 138} y={y + 50} w={170} titulo tam={26} cor={ship.eliminated ? '#8A7A6A' : info.cor}>
        {ship.name}
      </Texto>
      {ship.eliminated ? (
        <Texto x={x + 138} y={y + 84} w={166} tam={16} cor="#9B2C2C">
          Afundado pelo Kraken
        </Texto>
      ) : (
        <>
          <Texto x={x + 138} y={y + 82} w={170} tam={16} cor="#5A3410" peso={700}>
            Tesouros {achados} de {ship.total}
          </Texto>
          <div style={{ position: 'absolute', left: x + 138, top: y + 106, width: 150, height: 9, borderRadius: 5, background: 'rgba(0,0,0,.15)' }}>
            <div style={{ width: `${(achados / ship.total) * 100}%`, height: '100%', borderRadius: 5, background: info.cor, transition: 'width .4s' }} />
          </div>
        </>
      )}
      {ordenados.slice(0, 4).map((p, i) => (
        <div key={p.id} style={{ position: 'absolute', left: x + 138 + i * 42, top: y + (ship.eliminated ? 130 : 124), width: 38, height: 38 }} title={`${p.name}${p.id === ship.captainId ? ' · Capitão' : ''}`}>
          <Avatar avatar={p.avatar} ship={p.shipId} tam={38} x={0} y={0} apagado={ship.eliminated} cinza={!p.connected} />
          {p.id === ship.captainId && !ship.eliminated && <img src="/img/itens/coroa.webp" alt="" style={{ position: 'absolute', left: 22, top: -10, width: 22, height: 19 }} />}
        </div>
      ))}
      {ordenados.length > 4 && (
        <Texto x={x + 138 + 4 * 42 - 6} y={y + 134} tam={15} cor="#5A3410">
          +{ordenados.length - 4}
        </Texto>
      )}
    </>
  )
}

/** Tabuleiro centralizado na área de 1196×836. */
export function Tabuleiro({
  view,
  players,
  x = 362,
  y = 116,
  w = 1196,
  h = 836,
  mapa,
  podeVotar,
  meuVoto,
  onVotar,
  contagem,
  destaque,
  animadas,
  fim,
}: {
  view: CodenomesView
  players: Player[]
  x?: number
  y?: number
  w?: number
  h?: number
  mapa: boolean
  podeVotar: boolean
  meuVoto: number | 'end' | undefined
  onVotar: (i: number) => void
  contagem: number | null
  destaque: number | null
  animadas: Set<number>
  fim?: boolean
}) {
  const pad = 22
  const gx = 10
  const gy = 10
  const cw = Math.min((w - pad * 2 - (view.cols - 1) * gx) / view.cols, ((h - pad * 2 - (view.rows - 1) * gy) / view.rows) * (158 / 104))
  const ch = (cw * 104) / 158
  const gridW = view.cols * cw + (view.cols - 1) * gx
  const gridH = view.rows * ch + (view.rows - 1) * gy
  const ox = x + (w - gridW) / 2
  const oy = y + (h - gridH) / 2
  const votosPorCarta = new Map<number, Player[]>()
  for (const [pid, t] of Object.entries(view.turn.votes)) {
    if (typeof t !== 'number') continue
    const p = players.find((pl) => pl.id === pid)
    if (!p) continue
    votosPorCarta.set(t, [...(votosPorCarta.get(t) ?? []), p])
  }
  const alvo = view.turn.pending?.target
  return (
    <>
      <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 20, background: 'rgba(27,16,9,.78)' }} />
      {view.cards.map((c: CardView, i) => {
        const col = i % view.cols
        const row = Math.floor(i / view.cols)
        return (
          <div key={i} style={{ position: 'absolute', left: ox + col * (cw + gx), top: oy + row * (ch + gy), width: cw, height: ch, perspective: 800 }}>
            <Carta
              carta={c}
              w={cw}
              h={ch}
              mapa={mapa}
              votos={votosPorCarta.get(i) ?? []}
              meuVoto={meuVoto === i}
              contagem={alvo === i ? contagem : null}
              podeVotar={podeVotar && !c.revealed}
              destaque={destaque !== null && c.turn === destaque}
              onVotar={() => onVotar(i)}
              animar={animadas.has(i)}
              fim={fim}
            />
          </div>
        )
      })}
    </>
  )
}
