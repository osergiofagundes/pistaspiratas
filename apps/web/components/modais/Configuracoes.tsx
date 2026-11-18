'use client'
import { useMemo, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { SHIP_IDS, SHIP_INFO } from '@arena/platform'
import { BOARD_MAX, BOARD_MIN, type BoardSize, type CodenomesConfig, PRESETS, TEMPOS, fixedBoard, gridFor, updateConfig } from '@arena/codenomes'
import { lerPalavrasPersonalizadas } from '@arena/words'
import { Aviso, Botao, DECO_ANCORA, Interruptor, Marcador, Modal, Segmentado, Seletor, Texto } from '@/components/ui'
import { useSala } from '@/lib/sala'

export function rotuloTempo(t: number | null) {
  return t === null ? 'Sem limite' : `${t} s`
}

/** "5×5", "8×6" ou "Automático" */
export function rotuloTabuleiro(c: CodenomesConfig) {
  const f = fixedBoard(c)
  return f ? `${f[0]}×${f[1]}` : 'Automático'
}

const OPCOES_TEMPO = TEMPOS.map((t) => ({
  v: t,
  rotulo: t === null ? <span style={{ fontSize: 26, lineHeight: 1, fontFamily: 'system-ui, sans-serif', fontWeight: 800 }} title="Sem limite">∞</span> : `${t}s`,
}))

const OPCOES_TABULEIRO: { v: BoardSize; rotulo: ReactNode }[] = [
  { v: 'auto', rotulo: 'Auto' },
  ...([5, 6, 7, 8, 9, 10] as const).map((n) => ({ v: n as BoardSize, rotulo: `${n}` })),
  { v: 'custom', rotulo: 'Pers.' },
]

const W = 1240
const H = 950
/** colunas dos cartões */
const COL = { esq: 50, dir: 630, w: 560 }
/** topo de cada linha dentro do cartão */
const linha = (i: number) => 54 + i * 46

/** Cartão de pergaminho claro que agrupa as opções; entra com um leve atraso. */
function Cartao({ x, y, h, titulo, nota, ordem, children }: { x: number; y: number; h: number; titulo: string; nota?: string; ordem: number; children: ReactNode }) {
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
        width: COL.w,
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
        <Texto x={200} y={20} w={COL.w - 220} tam={13} cor="#9A7A5A" peso={700} className="text-right">
          {nota}
        </Texto>
      )}
      {children}
    </motion.div>
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
  const [texto, setTexto] = useState(config.customWords.join(', '))
  const lidas = useMemo(() => lerPalavrasPersonalizadas(texto), [texto])
  const g = gridFor(c)
  const set = (patch: Partial<CodenomesConfig>) => setC((atual) => updateConfig(atual, patch))
  const pers = c.preset === 'personalizado'
  const fixo = fixedBoard(c) !== null
  // com tamanho fixo os tesouros saem do tabuleiro; no automático, só o Personalizado ajusta
  const tesourosLivres = pers && !fixo
  const categoria = (k: 'geral' | 'mar', v: boolean) => set({ categories: v ? [...c.categories, k] : c.categories.filter((x) => x !== k) })

  const yCartoes = 166
  const hCartao1 = linha(6) + 8
  const hCartao2 = linha(4) + 8
  const yCartoes2 = yCartoes + hCartao1 + 14

  return (
    <Modal titulo="Configurações da sala" w={W} h={H} onFechar={onFechar} decos={[DECO_ANCORA(W, H)]} fecharNoFundo={false}>
      {/* preset */}
      <Texto x={COL.esq + 4} y={88} titulo tam={24} cor="#5A3410">
        Preset
      </Texto>
      <Segmentado
        x={180}
        y={80}
        w={W - 180 - COL.esq}
        h={44}
        tam={18}
        opcoes={PRESETS.map((p) => ({ v: p.id, rotulo: p.nome }))}
        valor={c.preset}
        onChange={(v) => set({ preset: v })}
      />
      <Texto x={180} y={132} w={W - 230} tam={16} cor="#7A5A3A" peso={700}>
        {PRESETS.find((p) => p.id === c.preset)?.descricao}
      </Texto>

      <Cartao
        x={COL.esq}
        y={yCartoes}
        h={hCartao1}
        titulo="Tabuleiro"
        nota={fixo ? 'Tesouros: proporcionais ao tabuleiro' : pers ? undefined : 'Tesouros e Kraken: só no Personalizado'}
        ordem={0}
      >
        <Rotulo i={0}>Tamanho</Rotulo>
        <Segmentado x={150} y={linha(0) + 3} w={390} h={36} tam={14} opcoes={OPCOES_TABULEIRO} valor={c.boardSize} onChange={(v) => set({ boardSize: v })} />
        {c.boardSize === 'custom' ? (
          <>
            <Rotulo i={1}>Colunas × linhas</Rotulo>
            <Seletor x={232} y={linha(1) + 2} h={38} valor={c.boardCols} min={BOARD_MIN} max={BOARD_MAX} onChange={(v) => set({ boardCols: v })} />
            <Texto x={364} y={linha(1) + 8} tam={20} cor="#5A3410" peso={900}>
              ×
            </Texto>
            <Seletor x={414} y={linha(1) + 2} h={38} valor={c.boardRows} min={BOARD_MIN} max={BOARD_MAX} onChange={(v) => set({ boardRows: v })} />
          </>
        ) : (
          <>
            <Rotulo i={1} apagado>
              Grade
            </Rotulo>
            <Texto x={250} y={linha(1) + 10} w={290} tam={17} cor="#7A5A3A" peso={800} className="text-right">
              {g.cols}×{g.rows} · {g.total} cartas{fixo ? '' : ' (pelo número de navios)'}
            </Texto>
          </>
        )}
        <Rotulo i={2}>Número de navios</Rotulo>
        <Segmentado
          x={380}
          y={linha(2) + 4}
          w={160}
          h={36}
          tam={17}
          opcoes={[2, 3, 4].map((n) => ({ v: n, rotulo: n }))}
          valor={c.shipCount}
          onChange={(v) => set({ shipCount: v })}
        />
        <Rotulo i={3} apagado={!tesourosLivres}>
          Tesouros por navio
        </Rotulo>
        <Seletor
          x={408}
          y={linha(3) + 2}
          h={40}
          valor={tesourosLivres ? c.treasuresPerShip : g.treasures}
          min={4}
          max={tesourosLivres ? 10 : Math.max(10, g.treasures)}
          disabled={!tesourosLivres}
          onChange={(v) => set({ treasuresPerShip: v })}
        />
        <Rotulo i={4} apagado={!pers}>
          Quantidade de Kraken
        </Rotulo>
        <Segmentado
          x={430}
          y={linha(4) + 4}
          w={110}
          h={36}
          tam={17}
          disabled={!pers}
          opcoes={[1, 2].map((n) => ({ v: n, rotulo: n }))}
          valor={pers ? c.krakenCount : g.kraken}
          onChange={(v) => set({ krakenCount: v })}
        />
        <Rotulo i={5}>Quem começa leva +1 tesouro</Rotulo>
        <Interruptor x={470} y={linha(5) + 4} ligado={c.firstBonus} onChange={(v) => set({ firstBonus: v })} />
      </Cartao>

      <Cartao x={COL.esq} y={yCartoes2} h={hCartao2} titulo="Capitão e tempo" ordem={1}>
        <Rotulo i={0}>Escolha do Capitão</Rotulo>
        <Segmentado
          x={250}
          y={linha(0) + 4}
          w={290}
          h={36}
          opcoes={[
            { v: 'sorteio' as const, rotulo: 'Sorteio' },
            { v: 'escolha' as const, rotulo: 'O navio escolhe' },
          ]}
          valor={c.captainMode}
          onChange={(v) => set({ captainMode: v })}
        />
        <Rotulo i={1}>Rodízio de Capitão</Rotulo>
        <Interruptor x={470} y={linha(1) + 4} ligado={c.captainRotation === 'trocar'} onChange={(v) => set({ captainRotation: v ? 'trocar' : 'manter' })} />
        <Rotulo i={2}>Tempo do Capitão</Rotulo>
        <Segmentado x={250} y={linha(2) + 4} w={290} h={36} opcoes={OPCOES_TEMPO} valor={c.captainTime} onChange={(v) => set({ captainTime: v })} />
        <Rotulo i={3}>Tempo dos Marujos</Rotulo>
        <Segmentado x={250} y={linha(3) + 4} w={290} h={36} opcoes={OPCOES_TEMPO} valor={c.crewTime} onChange={(v) => set({ crewTime: v })} />
      </Cartao>

      <Cartao x={COL.dir} y={yCartoes} h={hCartao1} titulo="Sala e regras" ordem={2}>
        <Rotulo i={0}>Tamanho máximo</Rotulo>
        <Seletor x={408} y={linha(0) + 2} h={40} valor={c.maxPlayers} min={4} max={24} onChange={(v) => set({ maxPlayers: v })} />
        <Rotulo i={1}>Espectadores</Rotulo>
        <Interruptor x={470} y={linha(1) + 4} ligado={c.allowSpectators} onChange={(v) => set({ allowSpectators: v })} />
        <Rotulo i={2}>Tiro de Canhão</Rotulo>
        <Interruptor x={470} y={linha(2) + 4} ligado={c.cannon} onChange={(v) => set({ cannon: v })} />
        <Rotulo i={3}>Nomes dos navios</Rotulo>
        {SHIP_IDS.slice(0, c.shipCount).map((id, i) => (
          <input
            key={id}
            value={c.shipNames[id] ?? ''}
            placeholder={SHIP_INFO[id].nome}
            maxLength={14}
            aria-label={`Nome do navio ${SHIP_INFO[id].nome}`}
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

      <Cartao x={COL.dir} y={yCartoes2} h={hCartao2} titulo="Palavras" ordem={3}>
        <Marcador x={150} y={16} marcado={c.categories.includes('geral')} onChange={(v) => categoria('geral', v)} />
        <Texto x={192} y={22} tam={17} cor="#5A3410" peso={800}>
          Geral
        </Texto>
        <Marcador x={290} y={16} marcado={c.categories.includes('mar')} onChange={(v) => categoria('mar', v)} />
        <Texto x={332} y={22} tam={17} cor="#5A3410" peso={800}>
          Mar e Pirataria
        </Texto>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label="Palavras personalizadas"
          placeholder="Palavras personalizadas: separe por vírgula ou uma por linha (até 300)"
          style={{
            position: 'absolute',
            left: 20,
            top: 60,
            width: COL.w - 40,
            height: 104,
            resize: 'none',
            borderRadius: 10,
            border: '3px solid #8A4A1C',
            background: '#FFF6DF',
            padding: '8px 12px',
            fontSize: 15,
            fontWeight: 700,
            color: '#5A3410',
            outline: 'none',
            boxShadow: 'inset 0 2px 6px rgba(90,52,16,.25)',
          }}
        />
        <Marcador x={20} y={178} marcado={c.onlyCustom} onChange={(v) => set({ onlyCustom: v })} />
        <Texto x={62} y={184} tam={16} cor="#5A3410" peso={800}>
          Usar só as personalizadas
        </Texto>
        <Texto x={300} y={185} w={240} tam={15} cor={lidas.recusadas ? '#9A5A1A' : '#2A7A2A'} peso={800} className="text-right">
          {lidas.aceitas.length} aceitas{lidas.recusadas ? ` · ${lidas.recusadas} recusadas` : ''}
        </Texto>
      </Cartao>

      <Aviso
        x={COL.esq}
        y={yCartoes2 + hCartao2 + 16}
        w={W - COL.esq * 2}
        style={{ textAlign: 'center' }}
        texto={
          `Tabuleiro ${g.cols}×${g.rows}: ` +
          (g.first > g.treasures ? `${g.first} tesouros para quem começa, ${g.treasures} para os outros` : `${g.treasures} tesouros por navio`) +
          `, ${g.sea} de Mar Aberto e ${g.kraken} Kraken.`
        }
      />

      <Botao cor="marrom" x={W / 2 - 210} y={H - 108} w={190} h={68} onClick={onFechar}>
        Cancelar
      </Botao>
      <Botao cor="verde" x={W / 2 + 10} y={H - 114} w={200} h={78} onClick={() => onSalvar({ ...c, customWords: lidas.aceitas })}>
        Salvar
      </Botao>
    </Modal>
  )
}
