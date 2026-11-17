'use client'
import { useMemo, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { SHIP_IDS, SHIP_INFO } from '@arena/platform'
import { type CodenomesConfig, PRESETS, TEMPOS, gridFor, updateConfig } from '@arena/codenomes'
import { lerPalavrasPersonalizadas } from '@arena/words'
import { Aviso, Botao, DECO_ANCORA, Interruptor, Marcador, Modal, Segmentado, Seletor, Texto } from '@/components/ui'
import { useSala } from '@/lib/sala'

export function rotuloTempo(t: number | null) {
  return t === null ? 'Sem limite' : `${t} s`
}

const OPCOES_TEMPO = TEMPOS.map((t) => ({
  v: t,
  rotulo: t === null ? <span style={{ fontSize: 26, lineHeight: 1, fontFamily: 'system-ui, sans-serif', fontWeight: 800 }} title="Sem limite">∞</span> : `${t}s`,
}))

const W = 1240
const H = 920
/** colunas dos cartões */
const COL = { esq: 50, dir: 630, w: 560 }
/** topo de cada linha dentro do cartão */
const linha = (i: number) => 56 + i * 50

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
    <Texto x={20} y={linha(i) + 10} tam={19} cor={apagado ? '#9A7A5A' : '#5A3410'} peso={800}>
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
  const categoria = (k: 'geral' | 'mar', v: boolean) => set({ categories: v ? [...c.categories, k] : c.categories.filter((x) => x !== k) })

  const yCartoes = 168
  const hCartao = 266
  const yCartoes2 = yCartoes + hCartao + 16

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

      <Cartao x={COL.esq} y={yCartoes} h={hCartao} titulo="Navios e tabuleiro" nota={pers ? undefined : 'Tesouros e Kraken: só no Personalizado'} ordem={0}>
        <Rotulo i={0}>Número de navios</Rotulo>
        <Segmentado
          x={360}
          y={linha(0) + 3}
          w={180}
          h={38}
          tam={17}
          opcoes={[2, 3, 4].map((n) => ({ v: n, rotulo: n }))}
          valor={c.shipCount}
          onChange={(v) => set({ shipCount: v })}
        />
        <Rotulo i={1} apagado={!pers}>
          Tesouros por navio
        </Rotulo>
        <Seletor x={395} y={linha(1)} h={44} valor={pers ? c.treasuresPerShip : g.treasures} min={4} max={10} disabled={!pers} onChange={(v) => set({ treasuresPerShip: v })} />
        <Rotulo i={2} apagado={!pers}>
          Quantidade de Kraken
        </Rotulo>
        <Segmentado
          x={420}
          y={linha(2) + 3}
          w={120}
          h={38}
          tam={17}
          disabled={!pers}
          opcoes={[1, 2].map((n) => ({ v: n, rotulo: n }))}
          valor={pers ? c.krakenCount : g.kraken}
          onChange={(v) => set({ krakenCount: v })}
        />
        <Rotulo i={3}>Tiro de Canhão</Rotulo>
        <Interruptor x={470} y={linha(3) + 3} ligado={c.cannon} onChange={(v) => set({ cannon: v })} />
      </Cartao>

      <Cartao x={COL.esq} y={yCartoes2} h={hCartao} titulo="Capitão e tempo" ordem={1}>
        <Rotulo i={0}>Escolha do Capitão</Rotulo>
        <Segmentado
          x={250}
          y={linha(0) + 3}
          w={290}
          h={38}
          opcoes={[
            { v: 'sorteio' as const, rotulo: 'Sorteio' },
            { v: 'escolha' as const, rotulo: 'O navio escolhe' },
          ]}
          valor={c.captainMode}
          onChange={(v) => set({ captainMode: v })}
        />
        <Rotulo i={1}>Rodízio de Capitão</Rotulo>
        <Interruptor x={470} y={linha(1) + 3} ligado={c.captainRotation === 'trocar'} onChange={(v) => set({ captainRotation: v ? 'trocar' : 'manter' })} />
        <Rotulo i={2}>Tempo do Capitão</Rotulo>
        <Segmentado x={250} y={linha(2) + 3} w={290} h={38} opcoes={OPCOES_TEMPO} valor={c.captainTime} onChange={(v) => set({ captainTime: v })} />
        <Rotulo i={3}>Tempo dos Marujos</Rotulo>
        <Segmentado x={250} y={linha(3) + 3} w={290} h={38} opcoes={OPCOES_TEMPO} valor={c.crewTime} onChange={(v) => set({ crewTime: v })} />
      </Cartao>

      <Cartao x={COL.dir} y={yCartoes} h={hCartao} titulo="Sala" ordem={2}>
        <Rotulo i={0}>Tamanho máximo</Rotulo>
        <Seletor x={395} y={linha(0)} h={44} valor={c.maxPlayers} min={4} max={24} onChange={(v) => set({ maxPlayers: v })} />
        <Rotulo i={1}>Espectadores</Rotulo>
        <Interruptor x={470} y={linha(1) + 3} ligado={c.allowSpectators} onChange={(v) => set({ allowSpectators: v })} />
        <Rotulo i={2}>Nomes dos navios</Rotulo>
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
              top: linha(2) + 4 + Math.floor(i / 2) * 44,
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

      <Cartao x={COL.dir} y={yCartoes2} h={hCartao} titulo="Palavras" ordem={3}>
        <Marcador x={150} y={18} marcado={c.categories.includes('geral')} onChange={(v) => categoria('geral', v)} />
        <Texto x={192} y={24} tam={17} cor="#5A3410" peso={800}>
          Geral
        </Texto>
        <Marcador x={290} y={18} marcado={c.categories.includes('mar')} onChange={(v) => categoria('mar', v)} />
        <Texto x={332} y={24} tam={17} cor="#5A3410" peso={800}>
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
            top: 64,
            width: COL.w - 40,
            height: 118,
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
        <Marcador x={20} y={200} marcado={c.onlyCustom} onChange={(v) => set({ onlyCustom: v })} />
        <Texto x={62} y={206} tam={16} cor="#5A3410" peso={800}>
          Usar só as personalizadas
        </Texto>
        <Texto x={300} y={207} w={240} tam={15} cor={lidas.recusadas ? '#9A5A1A' : '#2A7A2A'} peso={800} className="text-right">
          {lidas.aceitas.length} aceitas{lidas.recusadas ? ` · ${lidas.recusadas} recusadas` : ''}
        </Texto>
      </Cartao>

      <Aviso
        x={COL.esq}
        y={yCartoes2 + hCartao + 18}
        w={W - COL.esq * 2}
        style={{ textAlign: 'center' }}
        texto={`Tabuleiro ${g.cols}×${g.rows}: ${g.first} tesouros para quem começa, ${g.treasures} para os outros, ${g.sea} de Mar Aberto e ${g.kraken} Kraken.`}
      />

      <Botao cor="marrom" x={W / 2 - 210} y={H - 112} w={190} h={70} onClick={onFechar}>
        Cancelar
      </Botao>
      <Botao cor="verde" x={W / 2 + 10} y={H - 118} w={200} h={80} onClick={() => onSalvar({ ...c, customWords: lidas.aceitas })}>
        Salvar
      </Botao>
    </Modal>
  )
}
