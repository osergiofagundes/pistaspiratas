'use client'
import { useMemo, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { SHIP_IDS, SHIP_INFO, type ShipId } from '@arena/platform'
import { BOARD_MAX, BOARD_MIN, type BoardSize, type CodenomesConfig, TEMPOS, fixedBoard, gridFor, restaurarPadrao, updateConfig } from '@arena/codenomes'
import { lerPalavrasPersonalizadas } from '@arena/words'
import { Botao, DECO_ANCORA, IMG, Interruptor, Marcador, Modal, Segmentado, Seletor, Texto, usePalco } from '@/components/ui'
import { useSala } from '@/lib/sala'
import { IDIOMAS, useT, type Dicionario } from '@/lib/i18n'
import { nomeNavioConfig, resumoCategorias } from '@/lib/textos'
import { EscolherCategorias } from './Categorias'

function opcoesTempo(t: Dicionario) {
  return TEMPOS.map((v) => ({
    v,
    rotulo: v === null ? <span style={{ fontSize: 26, lineHeight: 1, fontFamily: 'system-ui, sans-serif', fontWeight: 800 }} title={t.comum.semLimite}>∞</span> : `${v}s`,
  }))
}

function opcoesTabuleiro(t: Dicionario): { v: BoardSize; rotulo: ReactNode }[] {
  return [
    { v: 'auto', rotulo: t.config.auto },
    ...([5, 6, 7, 8, 9, 10] as const).map((n) => ({ v: n as BoardSize, rotulo: `${n}` })),
    { v: 'custom', rotulo: t.config.pers },
  ]
}

const W = 1820
const H = 814
/** colunas dos cartões (a terceira é a prévia do tabuleiro) */
const COL = { esq: 50, dir: 630, previa: 1210, w: 560 }
/** topo de cada linha dentro do cartão */
const linha = (i: number) => 54 + i * 46

/** Cartão de pergaminho claro que agrupa as opções; entra com um leve atraso. */
function Cartao({ x, y, w = COL.w, h, titulo, nota, ordem, children }: { x: number; y: number; w?: number; h: number; titulo: string; nota?: string; ordem: number; children: ReactNode }) {
  const anim = useSala((s) => s.prefs.animacoes)
  return (
    <motion.div
      initial={anim ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: anim ? 0.15 + ordem * 0.06 : 0, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        background: 'rgba(255,248,230,.55)',
        border: '2px solid rgba(138,74,28,.35)',
        borderRadius: 14,
        boxShadow: 'inset 0 2px 8px rgba(138,74,28,.12)',
      }}
    >
      <Texto x={20} y={12} titulo tam={23} cor="#7E3A12">
        {titulo}
      </Texto>
      {nota && (
        <Texto x={200} y={20} w={w - 220} tam={13} cor="#9A7A5A" peso={700} className="text-right">
          {nota}
        </Texto>
      )}
      {children}
    </motion.div>
  )
}

type TipoCarta = ShipId | 'bonus' | 'mar' | 'kraken'
const IMG_CARTA: Record<TipoCarta, string> = {
  rubi: 'rubi', safira: 'safira', esmeralda: 'esmeralda', ouro: 'ouro', mar: 'mar', kraken: 'kraken', bonus: 'fechada',
}

/** permutação fixa de 0..n-1 (mesma semente para o mesmo total), para a prévia não pular a cada clique */
function permutacao(n: number): number[] {
  let a = (n * 2654435761) >>> 0
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const p = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  return p
}

/** Miniatura de carta com selo "+1" para o tesouro extra de quem começa. */
function MiniCarta({ tipo, w, h }: { tipo: TipoCarta; w: number; h: number }) {
  return (
    <>
      <img src={`${IMG}/cartas/${IMG_CARTA[tipo]}.webp`} alt="" draggable={false} style={{ width: w, height: h, display: 'block' }} />
      {tipo === 'bonus' && (
        <span
          className="lilita"
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.max(11, h * 0.42), color: '#7E3A12' }}
        >
          +1
        </span>
      )}
    </>
  )
}

/** Prévia do tabuleiro: a grade com as cartas de cada tipo e a legenda com as quantidades. */
function PreviaTabuleiro({ config, w, h }: { config: CodenomesConfig; w: number; h: number }) {
  const anim = useSala((s) => s.prefs.animacoes)
  const t = useT()
  const g = gridFor(config)
  const navios = SHIP_IDS.slice(0, config.shipCount)
  const bonus = g.first - g.treasures
  // as cartas na ordem dos tipos, espalhadas por uma permutação fixa
  const tipos: TipoCarta[] = [
    ...navios.flatMap((id) => Array<TipoCarta>(g.treasures).fill(id)),
    ...Array<TipoCarta>(bonus).fill('bonus'),
    ...Array<TipoCarta>(g.kraken).fill('kraken'),
    ...Array<TipoCarta>(Math.max(0, g.sea)).fill('mar'),
  ]
  const perm = permutacao(g.total)
  const casas: TipoCarta[] = Array(g.total).fill('mar')
  tipos.slice(0, g.total).forEach((t, i) => (casas[perm[i]] = t))

  const legenda: { tipo: TipoCarta; nome: string; n: number; cor?: string }[] = [
    ...navios.map((id) => ({ tipo: id as TipoCarta, nome: t.comum.navio(nomeNavioConfig(config.shipNames, id, t)), n: g.treasures, cor: SHIP_INFO[id].cor })),
    ...(bonus ? [{ tipo: 'bonus' as const, nome: t.config.extra, n: bonus }] : []),
    { tipo: 'mar', nome: t.config.marAberto, n: g.sea },
    { tipo: 'kraken', nome: t.config.kraken, n: g.kraken, cor: '#5B2A86' },
  ]
  const colsLeg = 2
  const linhasLeg = Math.ceil(legenda.length / colsLeg)
  const hLinha = 50
  const hLegenda = linhasLeg * hLinha
  // grade centralizada na área que sobra (mesma conta do Tabuleiro da partida)
  const gap = 4
  const areaW = w
  const areaH = h - hLegenda - 14
  const cw = Math.min((areaW - (g.cols - 1) * gap) / g.cols, ((areaH - (g.rows - 1) * gap) / g.rows) * (474 / 312))
  const ch = (cw * 312) / 474
  const gw = g.cols * cw + (g.cols - 1) * gap
  const gh = g.rows * ch + (g.rows - 1) * gap
  const ox = (areaW - gw) / 2
  const oy = (areaH - gh) / 2

  return (
    <div aria-label={t.config.previa} style={{ position: 'absolute', inset: 0 }}>
      {casas.map((t, i) => (
        <motion.div
          key={`${i}-${t}`}
          initial={anim ? { opacity: 0, scale: 0.85 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          style={{ position: 'absolute', left: ox + (i % g.cols) * (cw + gap), top: oy + Math.floor(i / g.cols) * (ch + gap), width: cw, height: ch }}
        >
          <MiniCarta tipo={t} w={cw} h={ch} />
        </motion.div>
      ))}
      {legenda.map((l, i) => {
        const x = (i % colsLeg) * (w / colsLeg)
        const y = areaH + 14 + Math.floor(i / colsLeg) * hLinha
        return (
          <div key={l.tipo} style={{ position: 'absolute', left: x, top: y, width: w / colsLeg - 10, height: hLinha - 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flex: 'none' }}>
              <MiniCarta tipo={l.tipo} w={62} h={41} />
            </div>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 800, color: l.cor ?? '#5A3410', lineHeight: 1.1 }}>{l.nome}</span>
            <span className="lilita" style={{ fontSize: 22, color: '#5A3410', whiteSpace: 'nowrap' }}>
              × {l.n}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Rotulo({ i, children, apagado }: { i: number; children: ReactNode; apagado?: boolean }) {
  return (
    <Texto x={20} y={linha(i) + 9} tam={18} cor={apagado ? '#9A7A5A' : '#5A3410'} peso={800}>
      {children}
    </Texto>
  )
}

/** Configurações da sala, só para o Almirante. */
export function ModalConfiguracoes({
  config,
  onSalvar,
  onFechar,
}: {
  config: CodenomesConfig
  onSalvar: (patch: Partial<CodenomesConfig>) => void
  onFechar: () => void
}) {
  const [c, setC] = useState<CodenomesConfig>(config)
  const t = useT()
  const k = t.config
  const OPCOES_TEMPO = opcoesTempo(t)
  const [texto, setTexto] = useState(config.customWords.join(', '))
  const lidas = useMemo(() => lerPalavrasPersonalizadas(texto), [texto])
  const g = gridFor(c)
  const set = (patch: Partial<CodenomesConfig>) => setC((atual) => updateConfig(atual, patch))
  const fixo = fixedBoard(c) !== null
  // mudou o tabuleiro (tamanho, navios, Kraken ou bônus): os tesouros voltam a ser proporcionais
  const mudaTabuleiro = (patch: Partial<CodenomesConfig>) => set({ ...patch, treasuresManual: false })
  // no tamanho fixo, ajustar os tesouros à mão deixa de ser proporcional
  const mudaTesouros = (v: number) => set(fixo ? { treasuresPerShip: v, treasuresManual: true } : { treasuresPerShip: v })
  const mudaKraken = (v: number) => mudaTabuleiro({ krakenCount: v })
  const notaTabuleiro = fixo ? (c.treasuresManual ? k.notaManual : k.notaProporcional) : undefined
  const [escolhendo, setEscolhendo] = useState(false)

  const hCartao1 = linha(6) + 8
  const hCartao2 = linha(4) + 8
  // compacto: os cartões numa coluna só, com rolagem, e Cancelar/Salvar fixos no pé
  const cp = usePalco().compacto
  const L = cp
    ? (() => {
        const y1 = 96
        const y2 = y1 + hCartao1 + 14
        const y3 = y2 + hCartao2 + 14
        const y4 = y3 + hCartao1 + 14
        const yP = y4 + hCartao2 + 14
        const hP = 440
        return {
          W: COL.w + 100,
          H: yP + hP + 44,
          padrao: { y: 60 },
          tab: { x: COL.esq, y: y1 },
          cap: { x: COL.esq, y: y2 },
          sala: { x: COL.esq, y: y3 },
          pal: { x: COL.esq, y: y4 },
          prev: { x: COL.esq, y: yP, h: hP },
        }
      })()
    : (() => {
        const y1 = 90
        const y2 = y1 + hCartao1 + 14
        return {
          W,
          H,
          padrao: { y: 56 },
          tab: { x: COL.esq, y: y1 },
          cap: { x: COL.esq, y: y2 },
          sala: { x: COL.dir, y: y1 },
          pal: { x: COL.dir, y: y2 },
          prev: { x: COL.previa, y: y1, h: y2 + hCartao2 - y1 },
        }
      })()
  const hPrevia = L.prev.h
  const salvar = () => onSalvar({ ...c, customWords: lidas.aceitas })

  return (
    <>
    <Modal
      titulo={k.titulo}
      w={L.W}
      h={L.H}
      // com a escolha de categorias aberta, o Esc fecha só ela
      onFechar={escolhendo ? undefined : onFechar}
      decos={cp ? [] : [DECO_ANCORA(W, H)]}
      fecharNoFundo={false}
      rodape={
        cp
          ? {
              h: 92,
              conteudo: (
                <>
                  <div style={{ position: 'absolute', left: 30, right: 30, top: 0, height: 2, background: 'rgba(90,52,16,.2)' }} />
                  <Botao cor="marrom" x={L.W / 2 - 210} y={14} w={190} h={64} onClick={onFechar}>
                    {t.comum.cancelar}
                  </Botao>
                  <Botao cor="verde" x={L.W / 2 + 10} y={10} w={200} h={72} onClick={salvar}>
                    {t.comum.salvar}
                  </Botao>
                </>
              ),
            }
          : undefined
      }
    >
      {/* volta tabuleiro, tesouros, Kraken, tempos e Canhão aos valores iniciais */}
      <button
        type="button"
        className="link-ajuste"
        onClick={() => setC(restaurarPadrao(c))}
        style={{ position: 'absolute', right: L.W - (cp ? COL.esq + COL.w : COL.previa + COL.w), top: L.padrao.y, background: 'none', border: 0, padding: 0, fontSize: 16, fontWeight: 800, color: '#9A5A1A', textDecoration: 'underline' }}
      >
        ↺ {k.restaurarPadrao}
      </button>

      <Cartao
        x={L.tab.x}
        y={L.tab.y}
        h={hCartao1}
        titulo={k.tabuleiro}
        nota={notaTabuleiro}
        ordem={0}
      >
        <Rotulo i={0}>{k.tamanho}</Rotulo>
        <Segmentado x={150} y={linha(0) + 3} w={390} h={36} tam={14} opcoes={opcoesTabuleiro(t)} valor={c.boardSize} onChange={(v) => mudaTabuleiro({ boardSize: v })} />
        {c.boardSize === 'custom' ? (
          <>
            <Rotulo i={1}>{k.colunasLinhas}</Rotulo>
            <Seletor x={232} y={linha(1) + 2} h={38} valor={c.boardCols} min={BOARD_MIN} max={BOARD_MAX} onChange={(v) => mudaTabuleiro({ boardCols: v })} />
            <Texto x={364} y={linha(1) + 8} tam={20} cor="#5A3410" peso={900}>
              ×
            </Texto>
            <Seletor x={414} y={linha(1) + 2} h={38} valor={c.boardRows} min={BOARD_MIN} max={BOARD_MAX} onChange={(v) => mudaTabuleiro({ boardRows: v })} />
          </>
        ) : (
          <>
            <Rotulo i={1} apagado>
              {k.grade}
            </Rotulo>
            <Texto x={250} y={linha(1) + 10} w={290} tam={17} cor="#7A5A3A" peso={800} className="text-right">
              {k.gradeValor(g.cols, g.rows, g.total, !fixo)}
            </Texto>
          </>
        )}
        <Rotulo i={2}>{k.numeroNavios}</Rotulo>
        <Segmentado
          x={380}
          y={linha(2) + 4}
          w={160}
          h={36}
          tam={17}
          opcoes={[2, 3, 4].map((n) => ({ v: n, rotulo: n }))}
          valor={c.shipCount}
          onChange={(v) => mudaTabuleiro({ shipCount: v })}
        />
        <Rotulo i={3}>{k.tesourosPorNavio}</Rotulo>
        {fixo && c.treasuresManual && (
          <button
            type="button"
            onClick={() => set({ treasuresManual: false })}
            title={k.voltarProporcional}
            className="link-ajuste"
            style={{ position: 'absolute', left: 212, top: linha(3) + 10, background: 'none', border: 0, padding: 0, fontSize: 14, fontWeight: 800, color: '#9A5A1A', textDecoration: 'underline' }}
          >
            {k.proporcional}
          </button>
        )}
        <Seletor
          x={408}
          y={linha(3) + 2}
          h={40}
          valor={g.treasures}
          min={fixo ? 2 : 4}
          max={g.maxTreasures}
          onChange={mudaTesouros}
        />
        <Rotulo i={4}>{k.quantidadeKraken}</Rotulo>
        <Segmentado
          x={430}
          y={linha(4) + 4}
          w={110}
          h={36}
          tam={17}
          opcoes={[1, 2].map((n) => ({ v: n, rotulo: n }))}
          valor={g.kraken}
          onChange={mudaKraken}
        />
        <Rotulo i={5}>{k.bonus}</Rotulo>
        <Interruptor x={470} y={linha(5) + 4} ligado={c.firstBonus} onChange={(v) => mudaTabuleiro({ firstBonus: v })} />
      </Cartao>

      <Cartao x={L.cap.x} y={L.cap.y} h={hCartao2} titulo={k.capitaoTempo} ordem={1}>
        <Rotulo i={0}>{k.escolhaCapitao}</Rotulo>
        <Segmentado
          x={250}
          y={linha(0) + 4}
          w={290}
          h={36}
          opcoes={[
            { v: 'sorteio' as const, rotulo: k.sorteio },
            { v: 'escolha' as const, rotulo: k.navioEscolhe },
          ]}
          valor={c.captainMode}
          onChange={(v) => set({ captainMode: v })}
        />
        <Rotulo i={1}>{k.rodizio}</Rotulo>
        <Interruptor x={470} y={linha(1) + 4} ligado={c.captainRotation === 'trocar'} onChange={(v) => set({ captainRotation: v ? 'trocar' : 'manter' })} />
        <Rotulo i={2}>{k.tempoCapitao}</Rotulo>
        <Segmentado x={250} y={linha(2) + 4} w={290} h={36} opcoes={OPCOES_TEMPO} valor={c.captainTime} onChange={(v) => set({ captainTime: v })} />
        <Rotulo i={3}>{k.tempoMarujos}</Rotulo>
        <Segmentado x={250} y={linha(3) + 4} w={290} h={36} opcoes={OPCOES_TEMPO} valor={c.crewTime} onChange={(v) => set({ crewTime: v })} />
      </Cartao>

      <Cartao x={L.sala.x} y={L.sala.y} h={hCartao1} titulo={k.salaRegras} ordem={2}>
        <Rotulo i={0}>{k.tamanhoMax}</Rotulo>
        <Seletor x={408} y={linha(0) + 2} h={40} valor={c.maxPlayers} min={4} max={24} onChange={(v) => set({ maxPlayers: v })} />
        <Rotulo i={1}>{k.espectadores}</Rotulo>
        <Interruptor x={470} y={linha(1) + 4} ligado={c.allowSpectators} onChange={(v) => set({ allowSpectators: v })} />
        <Rotulo i={2}>{k.canhao}</Rotulo>
        <Interruptor x={470} y={linha(2) + 4} ligado={c.cannon} onChange={(v) => set({ cannon: v })} />
        <Rotulo i={3}>{k.nomesNavios}</Rotulo>
        {SHIP_IDS.slice(0, c.shipCount).map((id, i) => (
          <input
            key={id}
            value={c.shipNames[id] ?? ''}
            placeholder={t.navios[id]}
            maxLength={14}
            aria-label={k.nomeDoNavio(t.navios[id])}
            onChange={(e) => setC((a) => ({ ...a, shipNames: { ...a.shipNames, [id]: e.target.value } }))}
            className="campo-navio"
            style={{
              position: 'absolute',
              left: 220 + (i % 2) * 164,
              top: linha(3) + 4 + Math.floor(i / 2) * 44,
              width: 156,
              height: 36,
              borderRadius: 9,
              border: `2px solid ${SHIP_INFO[id].cor}`,
              background: '#FFF8EC',
              color: SHIP_INFO[id].cor,
              fontWeight: 800,
              fontSize: 16,
              padding: '0 10px',
              outline: 'none',
              boxShadow: 'inset 0 2px 4px rgba(90,52,16,.15)',
            }}
          />
        ))}
      </Cartao>

      <Cartao x={L.pal.x} y={L.pal.y} h={hCartao2} titulo={k.palavras} ordem={3}>
        {/* várias categorias ao mesmo tempo, misturadas em partes iguais */}
        <button
          type="button"
          className="botao-categorias"
          onClick={() => setEscolhendo(true)}
          title={k.escolherCategorias}
          aria-label={`${k.escolherCategorias}: ${resumoCategorias(c.categories, t, 99)}`}
          style={{ position: 'absolute', left: 150, top: 12, width: COL.w - 170, height: 38, opacity: c.onlyCustom ? 0.6 : 1 }}
        >
          <span className="resumo">{resumoCategorias(c.categories, t)}</span>
          <span className="seta">{k.escolher} ›</span>
        </button>
        {/* idioma das palavras do tabuleiro (e da regra de plural das dicas) */}
        <Texto x={20} y={66} tam={17} cor="#5A3410" peso={800}>
          {k.idiomaPalavras}
        </Texto>
        {IDIOMAS.map((l, i) => {
          const sel = (c.wordLanguage ?? 'pt') === l.id
          return (
            <button
              key={l.id}
              type="button"
              lang={l.lang}
              aria-pressed={sel}
              title={k.idiomaDe(l.nome)}
              aria-label={k.idiomaDe(l.nome)}
              onClick={() => set({ wordLanguage: l.id })}
              className={`bandeira-palavras${sel ? ' ativa' : ''}`}
              style={{ position: 'absolute', left: 150 + i * 64, top: 58, width: 54, height: 38 }}
            >
              <img src={`${IMG}/${l.bandeira}`} alt="" draggable={false} />
            </button>
          )
        })}
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label={k.personalizadas}
          placeholder={k.personalizadasPh}
          style={{
            position: 'absolute',
            left: 20,
            top: 106,
            width: COL.w - 40,
            height: 62,
            resize: 'none',
            borderRadius: 10,
            border: '3px solid #8A4A1C',
            background: '#FFF6DF',
            padding: '6px 12px',
            fontSize: 15,
            fontWeight: 700,
            color: '#5A3410',
            outline: 'none',
            boxShadow: 'inset 0 2px 6px rgba(90,52,16,.25)',
          }}
        />
        <Marcador x={20} y={178} marcado={c.onlyCustom} onChange={(v) => set({ onlyCustom: v })} />
        <Texto x={62} y={184} tam={16} cor="#5A3410" peso={800}>
          {k.soPersonalizadas}
        </Texto>
        <Texto x={300} y={185} w={240} tam={15} cor={lidas.recusadas ? '#9A5A1A' : '#2A7A2A'} peso={800} className="text-right">
          {k.aceitas(lidas.aceitas.length, lidas.recusadas)}
        </Texto>
      </Cartao>

      <Cartao x={L.prev.x} y={L.prev.y} h={hPrevia} titulo={k.previa} nota={k.previaNota(g.cols, g.rows, g.total)} ordem={4}>
        <div style={{ position: 'absolute', left: 20, top: 56, width: COL.w - 40, height: hPrevia - 72 }}>
          <PreviaTabuleiro config={c} w={COL.w - 40} h={hPrevia - 72} />
        </div>
      </Cartao>

      {!cp && (
        <>
          <Botao cor="marrom" x={W / 2 - 210} y={H - 108} w={190} h={68} onClick={onFechar}>
            {t.comum.cancelar}
          </Botao>
          <Botao cor="verde" x={W / 2 + 10} y={H - 114} w={200} h={78} onClick={salvar}>
            {t.comum.salvar}
          </Botao>
        </>
      )}
    </Modal>
    {escolhendo && (
      <EscolherCategorias
        inicial={c.categories}
        idioma={c.wordLanguage ?? 'pt'}
        podeVazio={c.onlyCustom}
        onPronto={(cats) => {
          set({ categories: cats })
          setEscolhendo(false)
        }}
        onFechar={() => setEscolhendo(false)}
      />
    )}
    </>
  )
}
