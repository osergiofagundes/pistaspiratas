'use client'
import { useState } from 'react'
import { motion } from 'motion/react'
import { SHIP_INFO, type Player, type ShipId } from '@arena/platform'
import type { CodenomesView, LogEntry } from '@arena/codenomes'
import { Avatar, Bandeirinha, IMG, Moldura, Placa } from '@/components/ui'
import { corDono, nomeNavio, resumoEntrada, rotuloDono } from '@/lib/textos'
import { traduzirMensagem, useT } from '@/lib/i18n'

/** Diário de Bordo (seção 8): um cartão por turno, o mais recente no topo, com filtro por navio. */
export function Diario({
  view,
  players,
  x,
  y,
  w = 320,
  h = 836,
  titulo,
  destaque,
  onDestacar,
}: {
  view: CodenomesView
  players: Player[]
  x: number
  y: number
  w?: number
  h?: number
  titulo?: string
  destaque?: number | null
  onDestacar?: (turno: number | null) => void
}) {
  const [filtro, setFiltro] = useState<ShipId | null>(null)
  const t = useT()
  const entradas = [...view.log].reverse().filter((e) => !filtro || e.shipId === filtro)
  const ativo = view.finishReason ? -1 : view.turn.number
  return (
    <>
      <Moldura x={x} y={y} w={w} h={h} />
      <Placa texto={titulo ?? t.diario.titulo} x={x + (w - 250) / 2} y={y - 20} w={250} tam={24} />
      <div style={{ position: 'absolute', left: x + 22, top: y + 64, width: w - 44, height: h - 92, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => setFiltro(null)}
            className="lilita"
            style={{
              height: 26,
              padding: '0 10px',
              borderRadius: 8,
              border: 0,
              fontSize: 13,
              background: filtro === null ? '#3A2414' : 'rgba(58,36,20,.15)',
              color: filtro === null ? '#FFE08A' : '#5A3410',
            }}
          >
            {t.diario.todos}
          </button>
          {view.ships.map((s) => (
            <button
              key={s.id}
              type="button"
              title={t.diario.soNavio(nomeNavio(view, s.id, t))}
              onClick={() => setFiltro(filtro === s.id ? null : s.id)}
              style={{
                width: 32,
                height: 26,
                borderRadius: 6,
                border: filtro === s.id ? `2px solid ${SHIP_INFO[s.id].cor}` : '2px solid transparent',
                background: filtro === s.id ? '#FFF8EC' : 'transparent',
                position: 'relative',
                opacity: s.eliminated ? 0.5 : 1,
              }}
            >
              <Bandeirinha ship={s.id} x={2} y={1} w={24} h={20} />
            </button>
          ))}
        </div>
        <div className="rolagem" style={{ flex: 1, paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entradas.length === 0 && <div style={{ fontSize: 14, color: '#7A5A3A', textAlign: 'center', marginTop: 20 }}>{t.diario.nadaAinda}</div>}
          {entradas.map((e) => (
            <Entrada
              key={e.number}
              e={e}
              view={view}
              players={players}
              ativo={e.number === ativo}
              destacado={destaque === e.number}
              onClick={onDestacar && e.picks.length > 0 ? () => onDestacar(destaque === e.number ? null : e.number) : undefined}
            />
          ))}
        </div>
      </div>
    </>
  )
}

function Entrada({
  e,
  view,
  players,
  ativo,
  destacado,
  onClick,
}: {
  e: LogEntry
  view: CodenomesView
  players: Player[]
  ativo: boolean
  destacado: boolean
  onClick?: () => void
}) {
  const cor = SHIP_INFO[e.shipId].cor
  const capitao = players.find((p) => p.id === e.captainId)
  const t = useT()
  const rodape = resumoEntrada(e, ativo, view, t)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onClick}
      style={{
        position: 'relative',
        flexShrink: 0,
        background: destacado ? '#FFF3C4' : '#FBF1DC',
        border: `2px solid ${ativo ? '#FFD24A' : destacado ? '#C98A3A' : '#E3C894'}`,
        boxShadow: ativo ? '0 0 10px rgba(255,210,74,.6)' : '0 1px 0 rgba(0,0,0,.15)',
        borderRadius: 8,
        padding: '6px 8px 6px 12px',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: cor }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 22 }}>
        <span style={{ position: 'relative', width: 22, height: 18 }}>
          <Bandeirinha ship={e.shipId} x={0} y={0} w={22} h={18} />
        </span>
        <span className="lilita" style={{ fontSize: 15, color: cor, flex: 1 }}>
          {t.diario.turno(e.number, nomeNavio(view, e.shipId, t))}
        </span>
        {capitao && <Avatar avatar={capitao.avatar} ship={e.shipId} tam={22} title={t.diario.capitaoX(capitao.name)} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
        {e.clue ? (
          <span className="lilita" style={{ background: '#3A2414', color: '#FFE08A', borderRadius: 10, padding: '1px 10px', fontSize: 14 }}>
            {e.clue.word} · {e.clue.count}
          </span>
        ) : (
          <span style={{ background: 'rgba(58,36,20,.12)', color: '#7A5A3A', borderRadius: 10, padding: '1px 10px', fontSize: 12, fontWeight: 700 }}>
            {ativo ? t.diario.aguardandoDica : t.diario.semOrdem}
          </span>
        )}
        {e.captainName && <span style={{ fontSize: 12, color: '#8A6A4A', fontWeight: 700 }}>{t.diario.dicaDe(e.captainName)}</span>}
      </div>

      {e.picks.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 19, fontSize: 13 }}>
          {p.cannon ? (
            <img src={`${IMG}/interface/icones/canhao.webp`} alt="" style={{ width: 14, height: 14 }} />
          ) : (
            <span style={{ width: 10, height: 10, borderRadius: 2, background: corDono(p.owner), flexShrink: 0 }} />
          )}
          <span style={{ fontWeight: 800, color: '#3A2414', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.word.toUpperCase()}
          </span>
          <span style={{ fontWeight: 700, fontSize: 12, color: corDono(p.owner) }}>
            {p.cannon ? t.diario.canhao : ''}
            {rotuloDono(view, p.owner, t)}
          </span>
        </div>
      ))}

      {e.notes.map((n, i) => (
        <div key={i} style={{ fontSize: 12, fontWeight: 700, color: /afundou|Kraken/.test(n) ? '#9B2C2C' : '#2A6A3A', marginTop: 2 }}>
          ○ {traduzirMensagem(n, t)}
        </div>
      ))}

      {(rodape || ativo) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 4,
            paddingTop: 3,
            borderTop: '1px solid rgba(90,52,16,.18)',
            fontSize: 12,
            color: '#7A5A3A',
            fontWeight: 700,
          }}
        >
          <span>{rodape}</span>
          {ativo && (
            <span className="lilita" style={{ background: '#FFD24A', color: '#5A3410', fontSize: 10, padding: '1px 6px', borderRadius: 4 }}>
              {t.diario.emAndamento}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}
