'use client'
import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { SHIP_INFO } from '@arena/platform'
import { Avatar, Bandeira, Botao, Icone, Moldura, Navio, Palco, Texto } from '@/components/ui'
import { Avisos } from '@/components/ui/Avisos'
import { BotaoPreferencias, ModalConfirmar } from '@/components/modais/comuns'
import { Diario } from '@/components/jogo/Diario'
import { Tabuleiro } from '@/components/jogo/Paineis'
import { useSala, type Visao } from '@/lib/sala'
import { nomeNavio, resumoPartida } from '@/lib/textos'
import { useMusica } from '@/lib/useMusica'

/** Fim de partida (telas 2375 e 10970): vencedor, mapa revelado, placar e Diário completo. */
export function Fim({ view }: { view: Visao }) {
  const router = useRouter()
  const game = view.game!
  const enviar = useSala((s) => s.enviar)
  const prefs = useSala((s) => s.prefs)
  const setPrefs = useSala((s) => s.setPrefs)
  const [aviso, setAviso] = useState<{ texto: string; seq: number } | null>(null)
  const [sair, setSair] = useState(false)
  const souAlmirante = view.adminId === view.you
  const venc = game.winner ? game.ships.find((s) => s.id === game.winner)! : null
  const derrota = game.me.shipId !== null && game.winner !== null && game.me.shipId !== game.winner
  const minutos = game.finishedAt ? Math.max(1, Math.round((game.finishedAt - game.startedAt) / 60000)) : 0
  const placar = [...game.ships].sort((a, b) => (a.eliminated ? 1 : 0) - (b.eliminated ? 1 : 0) || b.total - b.left - (a.total - a.left))
  useMusica(derrota ? 'derrota' : 'vitoria')
  const titulo = venc ? `Vitória do Navio ${venc.name}!` : 'Partida encerrada'
  // moedas caindo na vitória (posições fixas por partida para não pularem a cada renderização)
  const moedas = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: (i * 89 + 37) % 1900,
        dur: 3.5 + ((i * 7) % 5) * 0.6,
        delay: -((i * 13) % 40) / 10,
        tam: 24 + ((i * 5) % 4) * 6,
      })),
    [],
  )

  const copiar = async () => {
    const texto = resumoPartida(game)
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      const t = document.createElement('textarea')
      t.value = texto
      document.body.appendChild(t)
      t.select()
      document.execCommand('copy')
      t.remove()
    }
    setAviso({ texto: 'Resumo copiado! Cole no Discord.', seq: Date.now() })
  }

  return (
    <Palco fundo={derrota ? 'fundo-derrota' : 'fundo-vitoria'} escurecer={0.4}>
      {venc && <Bandeira ship={venc.id} x={330} y={10} w={84} h={72} />}
      {venc && <Bandeira ship={venc.id} x={1500} y={10} w={84} h={72} />}
      <motion.div
        initial={prefs.animacoes ? { scale: 0.3, opacity: 0, y: -40 } : false}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 12 }}
        style={{ position: 'absolute', left: 420, top: 16, width: 1080, height: 80 }}
      >
        <Texto x={0} y={0} w={1080} centro titulo tam={60} cor={venc ? SHIP_INFO[venc.id].corClara : '#FFF8EC'} contorno>
          {titulo}
        </Texto>
      </motion.div>
      <BotaoPreferencias x={1740} y={18} />
      <Icone nome={prefs.mudo ? 'som-desligado' : 'som-ligado'} x={1814} y={18} onClick={() => setPrefs({ mudo: !prefs.mudo })} title={prefs.mudo ? 'Ligar o som' : 'Silenciar'} />

      {/* vencedor e placar */}
      <Moldura x={24} y={136} w={320} h={808} />
      {venc ? (
        <>
          <Navio ship={venc.id} className="navegar" x={64} y={160} w={240} h={232} />
          <Texto x={24} y={392} w={320} centro titulo tam={34} cor={SHIP_INFO[venc.id].cor}>
            Navio {venc.name}
          </Texto>
          <Texto x={24} y={436} w={320} centro tam={18} cor="#5A3410">
            {game.finishReason === 'sobrevivencia' ? 'Último navio no mar!' : `Achou os ${venc.total} tesouros!`}
          </Texto>
          <div style={{ position: 'absolute', left: 54, top: 476, width: 260, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            {view.players
              .filter((p) => p.shipId === venc.id)
              .map((p) => (
                <div key={p.id} style={{ position: 'relative', width: 60, height: 84, textAlign: 'center' }}>
                  <Avatar avatar={p.avatar} ship={p.shipId} tam={56} x={2} y={0} />
                  <div style={{ position: 'absolute', top: 60, left: -6, right: -6, fontSize: 13, fontWeight: 800, color: '#5A3410', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                </div>
              ))}
          </div>
        </>
      ) : (
        <>
          <img src="/img/interface/icones/cadeado.webp" alt="" style={{ position: 'absolute', left: 124, top: 200, width: 120, height: 120 }} />
          <Texto x={24} y={350} w={320} centro titulo tam={30} cor="#5A3410">
            Sem vencedor
          </Texto>
          <Texto x={44} y={392} w={280} centro tam={17} cor="#7A5A3A">
            O Almirante encerrou a partida antes do fim.
          </Texto>
        </>
      )}
      <Texto x={64} y={640} titulo tam={26} cor="#5A3410">
        Placar
      </Texto>
      {placar.map((s, i) => (
        <div key={s.id} style={{ position: 'absolute', left: 64, top: 680 + i * 44, width: 260, display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 800, color: s.eliminated ? '#8A7A6A' : '#5A3410' }}>
          <span style={{ width: 16, height: 16, borderRadius: '50%', background: SHIP_INFO[s.id].cor, opacity: s.eliminated ? 0.5 : 1 }} />
          {s.eliminated ? `${s.name} · afundado` : `${i + 1}º ${s.name} · ${s.total - s.left} de ${s.total}`}
        </div>
      ))}

      <Tabuleiro
        view={game}
        players={view.players}
        mapa
        podeVotar={false}
        meuVoto={undefined}
        onVotar={() => {}}
        contagem={null}
        destaque={null}
        animadas={new Set()}
        fim
      />
      <Diario view={game} players={view.players} x={1576} y={136} h={808} titulo="Diário completo" />

      {/* barra inferior */}
      <div className="barra" style={{ left: 24, top: 968, width: 1872, height: 96 }} />
      <Texto x={50} y={1002} tam={19} cor="#F3E6C8" peso={700}>
        Partida de {minutos} min · {game.log.length} turnos{venc ? ` · começou o Navio ${nomeNavio(game, game.firstShip)}` : ''}
      </Texto>
      <Botao cor="cinza" x={1050} y={980} w={150} h={72} tam={22} onClick={() => setSair(true)}>
        Sair
      </Botao>
      <Botao cor="marrom" x={1236} y={976} w={290} h={80} tam={26} onClick={copiar}>
        Copiar resumo
      </Botao>
      <Botao
        cor={souAlmirante ? 'verde' : 'cinza'}
        x={1546}
        y={976}
        w={330}
        h={80}
        tam={souAlmirante ? 28 : 21}
        disabled={!souAlmirante}
        onClick={() => enviar({ type: 'backToLobby' })}
        title={souAlmirante ? undefined : 'Só o Almirante leva todos ao salão'}
      >
        {souAlmirante ? 'Voltar ao salão' : 'Esperando o Almirante'}
      </Botao>

      {venc && !derrota && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 30 }}>
          {moedas.map((m, i) => (
            <span key={i} className="moeda" style={{ left: m.left, width: m.tam, height: m.tam, animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` }} />
          ))}
        </div>
      )}
      <Avisos extra={aviso} />
      {sair && (
        <ModalConfirmar
          titulo="Sair da sala"
          texto="Quer mesmo deixar a tripulação? Você pode entrar de novo pelo link enquanto a sala existir."
          confirmar="Sair"
          onFechar={() => setSair(false)}
          onConfirmar={async () => {
            await enviar({ type: 'leave' })
            router.push('/')
          }}
        />
      )}
    </Palco>
  )
}
