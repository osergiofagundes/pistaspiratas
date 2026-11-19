'use client'
import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Botao, Escotilha, Modal, Texto, usePalco } from '@/components/ui'
import { ModalComoJogar, ModalConfirmar } from '@/components/modais/comuns'
import { useT } from '@/lib/i18n'
import { useSala } from '@/lib/sala'
import { salvarEstadoTutorial } from '@/lib/identidade'
import { type AlvoId, type Passo, ROTEIRO, avancar, useTutorial } from '@/lib/tutorial'

/**
 * Marca uma área da partida para o holofote do tutorial (não desenha nada).
 * Fica nas telas da partida com as mesmas coordenadas do que ela cobre.
 */
export function Alvo({ id, x, y, w, h }: { id: AlvoId; x: number; y: number; w: number; h: number }) {
  const ativo = useTutorial((s) => s.ativo)
  useEffect(() => {
    if (!ativo) return
    useTutorial.setState((s) => ({ alvos: { ...s.alvos, [id]: { x, y, w, h } } }))
  }, [ativo, id, x, y, w, h])
  return null
}

/** "*palavra*" vira negrito. */
function negrito(texto: string): ReactNode {
  return texto.split('*').map((parte, i) => (i % 2 ? <strong key={i}>{parte}</strong> : <Fragment key={i}>{parte}</Fragment>))
}

/** Posição do balão: no computador, sobre o tabuleiro ou sobre as colunas; no compacto, acima ou abaixo das cartas. */
function lugarDoBalao(p: Passo, compacto: boolean, W: number, H: number) {
  if (!compacto) {
    if (p.lugar.d === 'direita') return { left: 1562, top: 128, width: 348 }
    if (p.lugar.d === 'esquerda') return { left: 14, top: 128, width: 340 }
    return { left: 640, top: 330, width: 640 }
  }
  const bx = 12 + 188 + 10
  const bw = W - bx - 10 - 262 - 12
  if (p.lugar.c === 'topo') return { left: bx + 8, top: 94, width: bw - 16 }
  if (p.lugar.c === 'baixo') return { left: bx + 8, bottom: 18, width: bw - 16 }
  if (p.lugar.c === 'direita') return { left: W - 262 - 12, top: 88, width: 262 }
  return { left: (W - 580) / 2, top: Math.round(H * 0.26), width: 580 }
}

/** quanto a sombra passa das bordas do palco (cobre a janela em qualquer proporção) */
const FORA = 3000

/**
 * Escurece tudo menos o retângulo do alvo. São quatro faixas em volta (uma sombra
 * gigante com box-shadow some no Chrome dentro do palco escalado).
 */
function Holofote({ x, y, w, h, W, H }: { x: number; y: number; w: number; h: number; W: number; H: number }) {
  const faixas = [
    { left: -FORA, top: -FORA, width: W + 2 * FORA, height: y + FORA },
    { left: -FORA, top: y + h, width: W + 2 * FORA, height: H - y - h + FORA },
    { left: -FORA, top: y, width: x + FORA, height: h },
    { left: x + w, top: y, width: W - x - w + FORA, height: h },
  ]
  return (
    <>
      {faixas.map((st, i) => (
        <div key={i} className="holofote-sombra" aria-hidden style={st} />
      ))}
      <div className="holofote" aria-hidden style={{ left: x, top: y, width: w, height: h }} />
    </>
  )
}

/** Balão do José, holofote e cartão final do tutorial (vai no `extra` da Partida). */
export function Guia({ onRepetir }: { onRepetir: () => void }) {
  const passo = useTutorial((s) => s.passo)
  const tab = useTutorial((s) => s.tab)
  const alvos = useTutorial((s) => s.alvos)
  const anim = useSala((s) => s.prefs.animacoes)
  const t = useT()
  const { compacto, W, H } = usePalco()
  const router = useRouter()
  const [sair, setSair] = useState(false)
  const p = ROTEIRO[passo]
  if (!tab || !p) return null
  if (p.final) return <CartaoFinal onRepetir={onRepetir} />

  const alvo = p.alvo ? alvos[p.alvo] : undefined
  const lugar = lugarDoBalao(p, compacto, W, H)
  const espera = !!p.ate
  const age = !!p.permite
  return (
    <>
      {alvo && <Holofote x={alvo.x - 8} y={alvo.y - 8} w={alvo.w + 16} h={alvo.h + 16} W={W} H={H} />}
      <motion.div
        key={passo}
        role="dialog"
        aria-label={t.tutorial.guia}
        data-passo={p.id}
        className={`balao-guia ${compacto ? 'compacto' : ''}`}
        initial={anim ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={lugar}
      >
        <div className="cabeca">
          <div style={{ position: 'relative', width: compacto ? 44 : 58, height: compacto ? 44 : 58, flex: 'none' }}>
            <Escotilha avatar="papagaio" tam={compacto ? 44 : 58} x={0} y={0} />
          </div>
          <span className="lilita nome">{t.tutorial.guia}</span>
          <span className="contador">
            {passo + 1}/{ROTEIRO.length}
          </span>
        </div>
        <div className="texto">{negrito(t.tutorial.passos[p.id](tab))}</div>
        <div className="rodape">
          <button type="button" className="pular" onClick={() => setSair(true)}>
            {t.tutorial.pular}
          </button>
          {!espera ? (
            <div style={{ position: 'relative', flex: 'none', width: compacto ? 150 : 176, height: compacto ? 48 : 58 }}>
              <Botao cor="verde" x={0} y={0} w={compacto ? 150 : 176} h={compacto ? 48 : 58} tam={compacto ? 18 : 22} onClick={avancar}>
                {t.tutorial.continuar}
              </Botao>
            </div>
          ) : (
            <span className="aguarde">{age ? t.tutorial.suaVez : t.tutorial.observe}</span>
          )}
        </div>
      </motion.div>
      {sair && (
        <ModalConfirmar
          titulo={t.tutorial.sair.titulo}
          pergunta={t.tutorial.sair.pergunta}
          texto={t.tutorial.sair.texto}
          confirmar={t.tutorial.sair.confirmar}
          icone={<Escotilha avatar="papagaio" tam={88} x={0} y={0} />}
          onFechar={() => setSair(false)}
          onConfirmar={() => {
            salvarEstadoTutorial('visto')
            router.push('/')
          }}
        />
      )}
    </>
  )
}

/** Fim do tutorial: o que foi aprendido e os próximos passos. */
function CartaoFinal({ onRepetir }: { onRepetir: () => void }) {
  const t = useT()
  const router = useRouter()
  const tab = useTutorial((s) => s.tab)
  const [manual, setManual] = useState(false)
  const { compacto, H } = usePalco()
  const w = 980
  // no compacto o cartão cabe na tela, sem rolagem
  const h = compacto ? Math.min(640, H - 64) : 640
  const RH = compacto ? 90 : 110
  const BH = compacto ? 66 : 76
  const f = t.tutorial.final
  if (manual) return <ModalComoJogar onFechar={() => setManual(false)} />
  const botoes = (
    <>
      <Botao cor="marrom" x={60} y={10} w={260} h={BH} tam={22} onClick={() => setManual(true)}>
        {f.manual}
      </Botao>
      <Botao cor="azul" x={(w - 260) / 2} y={10} w={260} h={BH} tam={22} onClick={onRepetir}>
        {f.repetir}
      </Botao>
      <Botao cor="verde" x={w - 60 - 300} y={10} w={300} h={BH} tam={22} onClick={() => router.push('/')}>
        {f.amigos}
      </Botao>
    </>
  )
  return (
    // os botões ficam no rodapé fixo: no celular o texto rola e eles continuam à vista
    <Modal titulo={f.titulo} w={w} h={h} escurecer={0.5} fecharNoFundo={false} rodape={{ h: RH, conteudo: botoes }}>
      <Escotilha avatar="papagaio" tam={compacto ? 78 : 110} x={compacto ? 56 : 60} y={compacto ? 50 : 60} />
      <Texto x={compacto ? 150 : 190} y={compacto ? 70 : 78} w={w - 250} titulo tam={compacto ? 26 : 30} cor="#5A3410">
        {tab ? t.tutorial.passos.vitoria(tab) : ''}
      </Texto>
      <ul className={`lista-final ${compacto ? 'compacto' : ''}`} style={{ position: 'absolute', left: 70, top: compacto ? 140 : 190, width: w - 140, margin: 0 }}>
        {f.itens.map((item) => (
          <li key={item}>{negrito(item)}</li>
        ))}
      </ul>
    </Modal>
  )
}
