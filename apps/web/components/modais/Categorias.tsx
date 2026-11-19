'use client'
import { useMemo, useState } from 'react'
import { CATEGORIA_IDS, PALAVRAS, type Categoria, type Idioma } from '@arena/words'
import { Botao, Modal, Texto, usePalco } from '@/components/ui'
import { useT } from '@/lib/i18n'

const COLS = 4
const CW = 200
const CH = 64
const GAP = 12
const MARGEM = 52
const GRADE_W = COLS * CW + (COLS - 1) * GAP
const TOPO = 112
const linhas = Math.ceil(CATEGORIA_IDS.length / COLS)
const GRADE_H = linhas * (CH + GAP) - GAP
/** quantas palavras de exemplo por categoria */
const N_EXEMPLOS = 8

/** Algumas palavras sorteadas de cada categoria (sem repetir dentro da categoria). */
function sortearExemplos(idioma: Idioma): Record<Categoria, string[]> {
  const lista = PALAVRAS[idioma] ?? PALAVRAS.pt
  return Object.fromEntries(
    CATEGORIA_IDS.map((id) => {
      const copia = [...(lista[id] ?? [])]
      for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copia[i], copia[j]] = [copia[j], copia[i]]
      }
      return [id, copia.slice(0, N_EXEMPLOS)]
    }),
  ) as Record<Categoria, string[]>
}

/**
 * Escolha das categorias de palavras (várias ao mesmo tempo). Fica por cima das
 * Configurações e devolve a lista ao tocar em Pronto; as categorias se misturam em
 * partes iguais no tabuleiro. Ao lado (no compacto, embaixo), exemplos das palavras
 * de cada categoria marcada, com a última marcada no topo.
 */
export function EscolherCategorias({
  inicial,
  idioma,
  podeVazio,
  onPronto,
  onFechar,
}: {
  inicial: Categoria[]
  idioma: Idioma
  /** com "só personalizadas" dá para não escolher nenhuma */
  podeVazio: boolean
  onPronto: (cats: Categoria[]) => void
  onFechar: () => void
}) {
  const t = useT()
  const k = t.config
  const cp = usePalco().compacto
  /** ordem dos exemplos: a última marcada primeiro */
  const [ordem, setOrdem] = useState<Categoria[]>(inicial)
  // a lista devolvida segue a ordem da tela, não a dos cliques
  const sel = CATEGORIA_IDS.filter((c) => ordem.includes(c))
  const alternar = (id: Categoria) => setOrdem((o) => (o.includes(id) ? o.filter((c) => c !== id) : [id, ...o]))
  const [sorteio, setSorteio] = useState(0)
  // "sorteio" muda só para tirar outros exemplos
  const exemplos = useMemo(() => sortearExemplos(idioma), [idioma, sorteio])

  // computador: grade à esquerda e exemplos à direita; compacto: exemplos embaixo da grade
  const yAcoes = TOPO + GRADE_H + 18
  const W = cp ? GRADE_W + 2 * MARGEM : GRADE_W + 2 * MARGEM + 28 + 520
  const painel = cp
    ? { x: MARGEM, y: yAcoes + 44, w: GRADE_W, h: 300 }
    : { x: MARGEM + GRADE_W + 28, y: TOPO, w: 520, h: yAcoes + 22 - TOPO }
  const H = cp ? painel.y + painel.h + 40 : yAcoes + 140

  const pronto = (
    <Botao cor="verde" x={W / 2 - 100} y={cp ? 10 : H - 104} w={200} h={72} disabled={!sel.length && !podeVazio} onClick={() => onPronto(sel)}>
      {k.pronto}
    </Botao>
  )
  const link = { background: 'none', border: 0, padding: 0, fontSize: 16, fontWeight: 800, color: '#9A5A1A', textDecoration: 'underline' } as const
  return (
    <Modal titulo={k.escolherCategorias} w={W} h={H} onFechar={onFechar} escurecer={0.35} rodape={cp ? { h: 92, conteudo: pronto } : undefined}>
      <Texto x={MARGEM} y={70} w={W - 2 * MARGEM} tam={16} cor="#7A5A3A" peso={700} centro>
        {k.notaMistura}
      </Texto>
      {CATEGORIA_IDS.map((id, i) => {
        const ativa = ordem.includes(id)
        const n = PALAVRAS[idioma]?.[id]?.length ?? 0
        return (
          <button
            key={id}
            type="button"
            role="checkbox"
            aria-checked={ativa}
            onClick={() => alternar(id)}
            className={`pilula-categoria${ativa ? ' ativa' : ''}`}
            style={{ position: 'absolute', left: MARGEM + (i % COLS) * (CW + GAP), top: TOPO + Math.floor(i / COLS) * (CH + GAP), width: CW, height: CH }}
          >
            <span className="nome">{t.categorias[id]}</span>
            <span className="conta">{t.partida.palavras(n)}</span>
            {ativa && <span className="visto">✓</span>}
          </button>
        )
      })}
      <button type="button" className="link-ajuste" onClick={() => setOrdem([...CATEGORIA_IDS])} style={{ ...link, position: 'absolute', left: MARGEM, top: yAcoes }}>
        {k.todas}
      </button>
      <button type="button" className="link-ajuste" onClick={() => setOrdem([])} style={{ ...link, position: 'absolute', left: MARGEM + 90, top: yAcoes }}>
        {k.limpar}
      </button>
      <Texto x={MARGEM + GRADE_W / 2} y={yAcoes} w={GRADE_W / 2} tam={16} cor={sel.length ? '#2A7A2A' : '#9A5A1A'} peso={800} className="text-right">
        {k.nSelecionadas(sel.length)}
      </Texto>

      {/* exemplos das palavras de cada categoria marcada */}
      <div className="painel-exemplos" style={{ position: 'absolute', left: painel.x, top: painel.y, width: painel.w, height: painel.h }}>
        <div className="topo">
          <span className="lilita titulo">{k.exemplos}</span>
          {ordem.length > 0 && (
            <button type="button" className="link-ajuste" onClick={() => setSorteio((s) => s + 1)} style={{ ...link, fontSize: 15 }}>
              🎲 {k.outrosExemplos}
            </button>
          )}
        </div>
        <div className="lista rolagem" aria-live="polite">
          {ordem.length === 0 ? (
            <p className="vazio">{k.semExemplos}</p>
          ) : (
            ordem.map((id) => (
              <div key={id} className="exemplo" data-categoria={id}>
                <span className="nome">{t.categorias[id]}</span>
                <span className="palavras">{exemplos[id].join(' · ')}</span>
              </div>
            ))
          )}
        </div>
      </div>
      {!cp && pronto}
    </Modal>
  )
}
