'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Botao, DECO_ANCORA, IMG, Modal, usePalco } from '@/components/ui'
import { useIdioma, useT, type Idioma } from '@/lib/i18n'
import { useSala } from '@/lib/sala'
import { tocar } from '@/lib/sons'
import { useTutorial } from '@/lib/tutorial'
import { TITULO, type Secao } from './manual/pecas'
import { SECOES as pt } from './manual/pt'
import { SECOES as en } from './manual/en'
import { SECOES as es } from './manual/es'
import { SECOES as fr } from './manual/fr'
import { SECOES as de } from './manual/de'
import { SECOES as it } from './manual/it'

/** medidas do manual: no desktop, seções numa coluna à esquerda; no compacto, numa fileira de abas no alto */
function medidas(compacto: boolean, PW: number, PH: number) {
  if (!compacto) {
    const W = 1500
    const H = 880
    return { W, H, NAV: { x: 44, y: 70, w: 300, h: 88, gap: 10 }, AREA: { x: 380, y: 70, w: W - 380 - 44, h: H - 70 - 140 }, abas: false, BH: 70, BY: H - 124 }
  }
  const W = Math.min(PW - 40, 1160)
  const H = PH - 70
  const NAV = { x: 36, y: 34, w: W - 72, h: 64, gap: 8 }
  const top = NAV.y + NAV.h + 14
  return { W, H, NAV, AREA: { x: 40, y: top, w: W - 80, h: H - top - 96 }, abas: true, BH: 62, BY: H - 82 }
}

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
  const palco = usePalco()
  const { W, H, NAV, AREA, abas, BH, BY } = medidas(palco.compacto, palco.W, palco.H)
  const router = useRouter()
  // dentro do tutorial o botão não aparece; dentro de uma sala, abre em outra aba para não sair dela
  const noTutorial = useTutorial((s) => s.ativo)
  const verTutorial = () => {
    if (useSala.getState().code) window.open('/tutorial', '_blank')
    else router.push('/tutorial')
  }
  const TW = abas ? 260 : NAV.w
  return (
    <Modal titulo={t.comum.comoJogar} w={W} h={H} onFechar={onFechar} decos={abas ? [] : [DECO_ANCORA(W, H)]}>
      {/* seções */}
      <nav aria-label={t.manual.secoes} style={{ position: 'absolute', left: NAV.x, top: NAV.y, width: NAV.w, display: abas ? 'flex' : 'block', gap: NAV.gap }}>
        {SECOES.map((sec, k) => {
          const ativo = k === i
          return (
            <button
              key={sec.nome}
              type="button"
              aria-current={ativo ? 'page' : undefined}
              aria-label={abas ? `${k + 1}. ${sec.nome}` : undefined}
              title={abas ? sec.nome : undefined}
              onClick={() => ir(k)}
              className="segmento"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: abas ? 8 : 14,
                justifyContent: abas ? 'center' : undefined,
                width: abas ? undefined : '100%',
                flex: abas ? 1 : undefined,
                height: NAV.h,
                marginBottom: abas ? 0 : NAV.gap,
                padding: abas ? '0 6px' : '0 16px',
                borderRadius: 14,
                border: `3px solid ${ativo ? '#1E5A1E' : '#3A1D0C'}`,
                background: ativo ? 'linear-gradient(#5DBB4A,#2E8A2A)' : 'linear-gradient(#9A5A2A,#6B3A17)',
                boxShadow: ativo ? 'inset 0 2px 0 rgba(255,255,255,.3)' : 'inset 0 2px 0 rgba(255,255,255,.15), 0 3px 0 rgba(0,0,0,.35)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ width: abas ? 46 : 58, height: abas ? 46 : 58, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={`${IMG}/${sec.icone}`} alt="" draggable={false} style={{ maxWidth: abas ? 46 : 58, maxHeight: abas ? 46 : 58, objectFit: 'contain' }} />
              </span>
              <span className="lilita" style={{ fontSize: abas ? 26 : 22, color: ativo ? '#FFFFFF' : '#F3DDB0', lineHeight: 1.1 }}>
                <span style={{ opacity: 0.75, marginRight: abas ? 0 : 6 }}>{k + 1}{abas ? '' : '.'}</span>
                {abas ? null : sec.nome}
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
            <h2 className="lilita" style={{ margin: '0 0 14px', fontSize: abas ? 32 : 36, fontWeight: 400, color: TITULO }}>
              {s.nome}
            </h2>
            {s.conteudo()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* tutorial interativo */}
      {!noTutorial && (
        <Botao cor="azul" x={abas ? AREA.x + (AREA.w - TW) / 2 : NAV.x} y={BY} w={TW} h={BH} tam={abas ? 22 : 24} onClick={verTutorial}>
          {t.tutorial.verTutorial}
        </Botao>
      )}

      {/* navegação */}
      <div style={{ position: 'absolute', left: AREA.x, top: BY + BH / 2 - 6, width: AREA.w, display: abas && !noTutorial ? 'none' : 'flex', justifyContent: 'center', gap: 8 }} aria-hidden>
        {SECOES.map((_, k) => (
          <span key={k} style={{ width: 12, height: 12, borderRadius: 6, background: k === i ? '#7E3A12' : 'rgba(126,58,18,.25)' }} />
        ))}
      </div>
      <Botao cor="marrom" x={AREA.x} y={BY} w={220} h={BH} onClick={() => ir(i - 1)} disabled={i === 0}>
        {t.manual.anterior}
      </Botao>
      {i < SECOES.length - 1 ? (
        <Botao cor="verde" x={AREA.x + AREA.w - 220 - (abas ? 0 : 150)} y={BY} w={220} h={BH} onClick={() => ir(i + 1)}>
          {t.manual.proximo}
        </Botao>
      ) : (
        <Botao cor="verde" x={AREA.x + AREA.w - 220 - (abas ? 0 : 150)} y={BY} w={220} h={BH} onClick={onFechar}>
          {t.manual.entendi}
        </Botao>
      )}
    </Modal>
  )
}
