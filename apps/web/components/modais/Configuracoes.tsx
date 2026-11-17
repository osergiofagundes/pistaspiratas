'use client'
import { useMemo, useState } from 'react'
import { SHIP_IDS, SHIP_INFO } from '@arena/platform'
import { type CodenomesConfig, PRESETS, TEMPOS, gridFor, updateConfig } from '@arena/codenomes'
import { lerPalavrasPersonalizadas } from '@arena/words'
import { Aviso, Botao, FundoEscuro, Imagem, Interruptor, Marcador, PainelGrande, Pilula, Placa, Seletor, Texto } from '@/components/ui'

export function rotuloTempo(t: number | null) {
  return t === null ? 'Sem limite' : `${t} s`
}

function proximo<T>(lista: T[], atual: T): T {
  const i = lista.indexOf(atual)
  return lista[(i + 1) % lista.length]
}

/** Configurações da sala (tela 9732), só para o Almirante. */
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

  const W = 1180
  const H = 900
  const X = (1920 - W) / 2
  const Y = 96
  const L = X + 100 // coluna esquerda
  const R = X + 650 // coluna direita
  const linha = (i: number) => Y + 168 + i * 56

  const rotulo = (t: string, x: number, y: number) => (
    <Texto x={x} y={y + 6} titulo tam={21} cor="#5A3410">
      {t}
    </Texto>
  )

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
      <FundoEscuro opacidade={0.6} onClick={onFechar} />
      <PainelGrande x={X} y={Y} w={W} h={H} />
      <Imagem src="interface/decoracoes/painel-grande-palmeira-esq.webp" x={X - 26} y={Y - 64} w={193} h={208} />
      <Imagem src="interface/decoracoes/painel-grande-palmeira-dir.webp" x={X + W - 160} y={Y - 64} w={181} h={208} />
      <Imagem src="interface/decoracoes/painel-grande-barris-esq.webp" x={X - 22} y={Y + H - 110} w={183} h={131} />
      <Imagem src="interface/decoracoes/painel-grande-barril-dir.webp" x={X + W - 140} y={Y + H - 130} w={160} h={156} />
      <Placa texto="Configurações da sala" x={X + W / 2 - 190} y={Y - 50} w={380} tam={28} />

      {/* preset */}
      {rotulo('Preset', L, Y + 124)}
      {PRESETS.map((p, i) => (
        <Pilula key={p.id} x={L + 110 + i * 176} y={Y + 126} w={164} h={38} ativo={c.preset === p.id} onClick={() => set({ preset: p.id })}>
          {p.nome}
        </Pilula>
      ))}

      {rotulo('Número de navios', L, linha(1))}
      {[2, 3, 4].map((n, i) => (
        <Pilula key={n} x={L + 330 + i * 56} y={linha(1) + 4} w={44} h={36} ativo={c.shipCount === n} onClick={() => set({ shipCount: n })}>
          {n}
        </Pilula>
      ))}

      {rotulo('Tesouros por navio', L, linha(2))}
      <Seletor x={L + 312} y={linha(2) - 2} h={48} valor={pers ? c.treasuresPerShip : g.treasures} min={4} max={10} disabled={!pers} onChange={(v) => set({ treasuresPerShip: v })} />

      {rotulo('Quantidade de Kraken', L, linha(3))}
      {[1, 2].map((n, i) => (
        <Pilula
          key={n}
          x={L + 386 + i * 56}
          y={linha(3) + 4}
          w={44}
          h={36}
          ativo={(pers ? c.krakenCount : g.kraken) === n}
          onClick={pers ? () => set({ krakenCount: n }) : undefined}
        >
          {n}
        </Pilula>
      ))}

      {rotulo('Tiro de Canhão', L, linha(4))}
      <Interruptor x={L + 410} y={linha(4) + 4} ligado={c.cannon} onChange={(v) => set({ cannon: v })} />

      {rotulo('Escolha do Capitão', L, linha(5))}
      <Pilula x={L + 290} y={linha(5) + 4} w={190} h={36} ativo onClick={() => set({ captainMode: c.captainMode === 'sorteio' ? 'escolha' : 'sorteio' })}>
        {c.captainMode === 'sorteio' ? 'Sorteio' : 'O navio escolhe'}
      </Pilula>

      {rotulo('Rodízio de Capitão', L, linha(6))}
      <Interruptor x={L + 410} y={linha(6) + 4} ligado={c.captainRotation === 'trocar'} onChange={(v) => set({ captainRotation: v ? 'trocar' : 'manter' })} />

      {rotulo('Tempo do Capitão', L, linha(7))}
      <Pilula x={L + 350} y={linha(7) + 4} w={130} h={36} onClick={() => set({ captainTime: proximo(TEMPOS, c.captainTime) })}>
        {rotuloTempo(c.captainTime)}
      </Pilula>

      {rotulo('Tempo dos Marujos', L, linha(8))}
      <Pilula x={L + 350} y={linha(8) + 4} w={130} h={36} onClick={() => set({ crewTime: proximo(TEMPOS, c.crewTime) })}>
        {rotuloTempo(c.crewTime)}
      </Pilula>

      {rotulo('Espectadores', L, linha(9))}
      <Interruptor x={L + 410} y={linha(9) + 4} ligado={c.allowSpectators} onChange={(v) => set({ allowSpectators: v })} />

      {/* coluna direita */}
      {rotulo('Tamanho máximo da sala', R, linha(1))}
      <Seletor x={R + 286} y={linha(1) - 2} h={48} valor={c.maxPlayers} min={4} max={24} onChange={(v) => set({ maxPlayers: v })} />

      {rotulo('Nomes dos navios', R, linha(2))}
      {SHIP_IDS.slice(0, c.shipCount).map((id, i) => (
        <input
          key={id}
          value={c.shipNames[id] ?? ''}
          placeholder={SHIP_INFO[id].nome}
          maxLength={14}
          onChange={(e) => setC((a) => ({ ...a, shipNames: { ...a.shipNames, [id]: e.target.value } }))}
          style={{
            position: 'absolute',
            left: R + 190 + (i % 2) * 140,
            top: linha(2) + 2 + Math.floor(i / 2) * 40,
            width: 130,
            height: 34,
            borderRadius: 8,
            border: `2px solid ${SHIP_INFO[id].cor}`,
            background: '#FFF8EC',
            color: SHIP_INFO[id].cor,
            fontWeight: 800,
            fontSize: 15,
            padding: '0 8px',
          }}
        />
      ))}

      {rotulo('Categorias de palavras', R, linha(3) + 30)}
      <Marcador x={R} y={linha(4) + 30} marcado={c.categories.includes('geral')} onChange={(v) => set({ categories: v ? [...c.categories, 'geral'] : c.categories.filter((x) => x !== 'geral') })} />
      <Texto x={R + 44} y={linha(4) + 36} tam={17} cor="#5A3410">
        Geral
      </Texto>
      <Marcador x={R + 140} y={linha(4) + 30} marcado={c.categories.includes('mar')} onChange={(v) => set({ categories: v ? [...c.categories, 'mar'] : c.categories.filter((x) => x !== 'mar') })} />
      <Texto x={R + 184} y={linha(4) + 36} tam={17} cor="#5A3410">
        Mar e Pirataria
      </Texto>

      {rotulo('Palavras personalizadas', R, linha(5) + 24)}
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Separe por vírgula ou uma por linha (até 300)"
        style={{
          position: 'absolute',
          left: R,
          top: linha(6) + 18,
          width: 440,
          height: 96,
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
      <Texto x={R} y={linha(8) + 4} tam={15} cor="#2A7A2A">
        {lidas.aceitas.length} aceitas{lidas.recusadas ? ` · ${lidas.recusadas} recusadas` : ''}
      </Texto>
      <Marcador x={R} y={linha(8) + 30} marcado={c.onlyCustom} onChange={(v) => set({ onlyCustom: v })} />
      <Texto x={R + 44} y={linha(8) + 36} tam={16} cor="#5A3410">
        Usar só palavras personalizadas
      </Texto>

      <Aviso
        x={R}
        y={linha(9) + 30}
        w={440}
        tipo={g.seaWarning ? 'erro' : 'info'}
        texto={
          g.seaWarning
            ? `Mar Aberto ficou em ${Math.round((g.sea / g.total) * 100)}% do tabuleiro: o jogo vai ficar fácil demais.`
            : `Tabuleiro ${g.cols}×${g.rows}: ${g.first} tesouros para quem começa, ${g.treasures} para os outros, ${g.sea} de Mar Aberto e ${g.kraken} Kraken.`
        }
      />

      <Botao cor="marrom" x={X + W / 2 - 200} y={Y + H - 96} w={180} h={66} onClick={onFechar}>
        Cancelar
      </Botao>
      <Botao
        cor="verde"
        x={X + W / 2 + 10}
        y={Y + H - 104}
        w={190}
        h={76}
        onClick={() =>
          onSalvar({
            ...c,
            customWords: lidas.aceitas,
          })
        }
      >
        Salvar
      </Botao>
    </div>
  )
}
