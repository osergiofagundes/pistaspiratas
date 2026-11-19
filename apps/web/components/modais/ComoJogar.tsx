'use client'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Botao, DECO_ANCORA, IMG, Modal } from '@/components/ui'
import { useIdioma, useT, type Idioma } from '@/lib/i18n'
import { useSala } from '@/lib/sala'
import { tocar } from '@/lib/sons'
import { TITULO, type Secao } from './manual/pecas'
import { SECOES as pt } from './manual/pt'
import { SECOES as en } from './manual/en'
import { SECOES as es } from './manual/es'
import { SECOES as fr } from './manual/fr'
import { SECOES as de } from './manual/de'
import { SECOES as it } from './manual/it'

const W = 1500
const H = 880
const NAV = { x: 44, y: 70, w: 300, h: 88, gap: 10 }
const AREA = { x: 380, y: 70, w: W - 380 - 44, h: H - 70 - 140 }

/** o manual de cada idioma (o conteúdo é JSX, com negrito e ilustrações) */
const MANUAIS: Record<Idioma, Secao[]> = { pt, en, es, fr, de, it }

// ---------------------------------------------------------------- modal

/** Manual de como jogar, em seções. */
export function ModalComoJogar({ onFechar }: { onFechar: () => void }) {
  const [i, setI] = useState(0)
  const anim = useSala((s) => s.prefs.animacoes)
  const t = useT()
  const SECOES = MANUAIS[useIdioma()] ?? pt
  const ir = (n: number) => {
    if (n < 0 || n >= SECOES.length || n === i) return
    tocar('clique')
    setI(n)
  }
  const s = SECOES[i]
  return (
    <Modal titulo={t.comum.comoJogar} w={W} h={H} onFechar={onFechar} decos={[DECO_ANCORA(W, H)]}>
      {/* seções */}
      <nav aria-label={t.manual.secoes} style={{ position: 'absolute', left: NAV.x, top: NAV.y, width: NAV.w }}>
        {SECOES.map((sec, k) => {
          const ativo = k === i
          return (
            <button
              key={sec.nome}
              type="button"
              aria-current={ativo ? 'page' : undefined}
              onClick={() => ir(k)}
              className="segmento"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                width: '100%',
                height: NAV.h,
                marginBottom: NAV.gap,
                padding: '0 16px',
                borderRadius: 14,
                border: `3px solid ${ativo ? '#1E5A1E' : '#3A1D0C'}`,
                background: ativo ? 'linear-gradient(#5DBB4A,#2E8A2A)' : 'linear-gradient(#9A5A2A,#6B3A17)',
                boxShadow: ativo ? 'inset 0 2px 0 rgba(255,255,255,.3)' : 'inset 0 2px 0 rgba(255,255,255,.15), 0 3px 0 rgba(0,0,0,.35)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ width: 58, height: 58, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={`${IMG}/${sec.icone}`} alt="" draggable={false} style={{ maxWidth: 58, maxHeight: 58, objectFit: 'contain' }} />
              </span>
              <span className="lilita" style={{ fontSize: 22, color: ativo ? '#FFFFFF' : '#F3DDB0', lineHeight: 1.1 }}>
                <span style={{ opacity: 0.75, marginRight: 6 }}>{k + 1}.</span>
                {sec.nome}
              </span>
            </button>
          )
        })}
      </nav>

      {/* conteúdo */}
      <div style={{ position: 'absolute', left: AREA.x, top: AREA.y, width: AREA.w, height: AREA.h, overflowY: 'auto', overflowX: 'hidden' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={i}
            initial={anim ? { opacity: 0, x: 24 } : false}
            animate={{ opacity: 1, x: 0 }}
            exit={anim ? { opacity: 0, x: -24 } : undefined}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ paddingRight: 8 }}
          >
            <h2 className="lilita" style={{ margin: '0 0 14px', fontSize: 36, fontWeight: 400, color: TITULO }}>
              {s.nome}
            </h2>
            {s.conteudo()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* navegação */}
      <div style={{ position: 'absolute', left: AREA.x, top: H - 112, width: AREA.w, display: 'flex', justifyContent: 'center', gap: 8 }} aria-hidden>
        {SECOES.map((_, k) => (
          <span key={k} style={{ width: 12, height: 12, borderRadius: 6, background: k === i ? '#7E3A12' : 'rgba(126,58,18,.25)' }} />
        ))}
      </div>
      <Botao cor="marrom" x={AREA.x} y={H - 124} w={220} h={70} onClick={() => ir(i - 1)} disabled={i === 0}>
        {t.manual.anterior}
      </Botao>
      {i < SECOES.length - 1 ? (
        <Botao cor="verde" x={AREA.x + AREA.w - 220 - 150} y={H - 124} w={220} h={70} onClick={() => ir(i + 1)}>
          {t.manual.proximo}
        </Botao>
      ) : (
        <Botao cor="verde" x={AREA.x + AREA.w - 220 - 150} y={H - 124} w={220} h={70} onClick={onFechar}>
          {t.manual.entendi}
        </Botao>
      )}
    </Modal>
  )
}
