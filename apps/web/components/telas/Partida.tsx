'use client'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { SHIP_INFO, type ShipId } from '@arena/platform'
import { validateClue } from '@arena/codenomes'
import {
  Avatar,
  Bandeira,
  Botao,
  Campo,
  DECO_ANCORA,
  FundoEscuro,
  Escotilha,
  Icone,
  IconeNovo,
  Modal,
  Navio,
  Palco,
  Seletor,
  Texto,
} from '@/components/ui'
import { Avisos } from '@/components/ui/Avisos'
import { BotaoPreferencias, ModalComoJogar, ModalConfirmar, ModalInfo } from '@/components/modais/comuns'
import { Diario } from '@/components/jogo/Diario'
import { PainelNavio, Tabuleiro } from '@/components/jogo/Paineis'
import { useSala, type Visao } from '@/lib/sala'
import { formatarTempo, nomeNavio, textoFase } from '@/lib/textos'
import { useAgora } from '@/lib/useAgora'
import { useMusica } from '@/lib/useMusica'
import { intensidade } from '@/lib/musica'

type Overlay =
  | null
  | 'menu'
  | 'ajuda'
  | 'sair'
  | 'encerrar'
  | { tipo: 'afundou'; ship: string }
  | { tipo: 'capitao' }
  | { tipo: 'canhao'; turno: number }

/** Partida (telas 1004, 1680, 3088… 17901): visões de Capitão, Marujo e Gaivota. */
export function Partida({ view, extra }: { view: Visao; extra?: ReactNode }) {
  const router = useRouter()
  const game = view.game!
  const enviar = useSala((s) => s.enviar)
  const eventos = useSala((s) => s.eventos)
  const prefs = useSala((s) => s.prefs)
  const setPrefs = useSala((s) => s.setPrefs)
  const t = useAgora(200)

  const me = view.players.find((p) => p.id === view.you)
  const souAlmirante = view.adminId === view.you
  const turno = game.turn
  const navioVez = game.ships.find((s) => s.id === turno.shipId)!
  const infoVez = SHIP_INFO[turno.shipId]
  const role = game.me.role
  const minhaVez = game.me.shipId === turno.shipId
  const souCapitaoDaVez = role === 'capitao' && minhaVez
  const souMarujoDaVez = role === 'marujo' && minhaVez && turno.voters.includes(view.you ?? '')
  const pausada = !!view.paused

  const [ocultarMapa, setOcultarMapa] = useState(false)
  const [dica, setDica] = useState('')
  const [numero, setNumero] = useState(1)
  const [erroDica, setErroDica] = useState<string | null>(null)
  const [destaque, setDestaque] = useState<number | null>(null)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [sorteio, setSorteio] = useState(false)
  const [lembrete, setLembrete] = useState(false)
  const [aviso, setAviso] = useState<{ texto: string; seq: number } | null>(null)
  const [faixa, setFaixa] = useState<{ ship: ShipId; seq: number } | null>(null)
  const [tremor, setTremor] = useState(0)

  // faixa da vez: a cada troca de vez (não na primeira renderização)
  const ultimaVez = useRef(turno.number)
  useEffect(() => {
    if (turno.number === ultimaVez.current) return
    ultimaVez.current = turno.number
    if (prefs.animacoes && !game.finishReason) setFaixa({ ship: turno.shipId, seq: turno.number })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turno.number])

  const restantes = navioVez.left
  useEffect(() => {
    setNumero((n) => Math.min(Math.max(1, n), Math.max(1, restantes)))
  }, [restantes])

  // capitães sorteados: no começo de cada partida
  const visto = useRef<number | null>(null)
  useEffect(() => {
    if (visto.current === game.startedAt) return
    visto.current = game.startedAt
    if (game.log.length === 1 && !game.log[0].clue && t - game.startedAt < 20_000) {
      setSorteio(true)
    }
    if (role === 'capitao' && prefs.lembrete) setLembrete(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.startedAt])

  // eventos do servidor: animação das cartas, navio afundado, troca de Capitão, tempo esgotado
  const [animadas, setAnimadas] = useState<Set<number>>(new Set())
  const ultimoEvento = useRef(0)
  useEffect(() => {
    for (const ev of eventos) {
      if (ev.seq <= ultimoEvento.current) continue
      ultimoEvento.current = ev.seq
      if (ev.type === 'reveal' && prefs.animacoes) {
        setAnimadas((s) => new Set(s).add(ev.card))
        setTimeout(() => setAnimadas((s) => {
          const n = new Set(s)
          n.delete(ev.card)
          return n
        }), 700)
      }
      if (ev.type === 'reveal' && ev.owner === 'kraken' && prefs.animacoes) setTremor(ev.seq)
      if (ev.type === 'eliminated') setOverlay({ tipo: 'afundou', ship: ev.shipId })
      if (ev.type === 'captainChanged' && ev.playerId === view.you) {
        setOverlay({ tipo: 'capitao' })
        setOcultarMapa(false)
      }
      if (ev.type === 'timeout')
        setAviso({ texto: `Tempo esgotado! O Navio ${nomeNavio(game, ev.shipId)} perdeu a vez.`, seq: ev.seq })
      if (ev.type === 'turn') {
        setDestaque(null)
        setDica('')
        setErroDica(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventos])

  // Tiro de Canhão liberado para os Marujos do navio da vez
  const canhaoVisto = useRef<number | null>(null)
  useEffect(() => {
    if (turno.phase === 'cannon' && souMarujoDaVez && canhaoVisto.current !== turno.number) {
      canhaoVisto.current = turno.number
      setOverlay({ tipo: 'canhao', turno: turno.number })
    }
  }, [turno.phase, turno.number, souMarujoDaVez])

  const meuVoto = view.you ? turno.votes[view.you] : undefined
  const contagem = turno.pending ? Math.max(1, Math.ceil((turno.pending.at - t) / 1000)) : null
  const restante = pausada
    ? turno.deadline !== null && view.paused
      ? turno.deadline - view.paused.since
      : null
    : turno.deadline !== null
      ? turno.deadline - t
      : turno.frozen
  // música: alto-mar, mais rápida e agitada quando o relógio passa de 10 s
  useMusica('alto-mar')
  const apertado = restante !== null && restante > 0 && restante < 10_000 && !pausada
  useEffect(() => {
    intensidade(apertado ? 1 : 0)
    return () => intensidade(0)
  }, [apertado])
  const votosFim = Object.values(turno.votes).filter((v) => v === 'end').length

  const votar = (alvo: number | 'end') => {
    if (!souMarujoDaVez || pausada) return
    enviar({ type: 'game', action: { type: 'vote', target: meuVoto === alvo ? null : alvo } })
  }

  const darOrdem = async () => {
    const hidden = game.cards.filter((c) => !c.revealed).map((c) => c.word)
    const err = validateClue(dica, numero, hidden, restantes)
    if (err) return setErroDica(err)
    setErroDica(null)
    const ok = await enviar({ type: 'game', action: { type: 'giveClue', word: dica.trim(), count: numero } })
    if (ok) setDica('')
  }

  const mapa = game.me.seesMap && !ocultarMapa
  const centro = useMemo(() => {
    if (turno.clue) return `${turno.clue.word} · ${turno.clue.count}`
    return null
  }, [turno.clue])

  const roleTexto =
    role === 'capitao'
      ? `Capitão do Navio ${nomeNavio(game, game.me.shipId!)}`
      : role === 'marujo'
        ? `Marujo do Navio ${nomeNavio(game, game.me.shipId!)}`
        : role === 'exCapitao'
          ? `Navio ${nomeNavio(game, game.me.shipId!)} · já viu o mapa`
          : game.me.shipId
            ? 'Gaivota · navio afundado'
            : 'Gaivota · assistindo a partida'

  return (
    <Palco fundo="fundo-partida" escurecer={0.45}>
      {/* barra superior */}
      <div className="barra" style={{ left: 24, top: 16, width: 1872, height: 84 }} />
      <Bandeira ship={turno.shipId} x={42} y={30} w={64} h={55} />
      <Texto x={116} y={22} titulo tam={30} cor={infoVez.corClara} contorno>
        Vez do Navio {navioVez.name}
      </Texto>
      <Texto x={116} y={62} tam={17} cor="#F3E6C8" peso={700}>
        {textoFase(game)}
      </Texto>
      {centro ? (
        <motion.div
          key={`${turno.number}-${centro}`}
          initial={prefs.animacoes ? { scale: 1.8, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
          style={{ position: 'absolute', left: 560, top: 18, width: 800, height: 66 }}
        >
          <Texto x={0} y={0} w={800} centro titulo tam={54} cor="#FFF8EC" contorno="#3A1D0C">
            {centro}
          </Texto>
        </motion.div>
      ) : (
        <Texto x={560} y={32} w={800} centro titulo tam={36} cor="#F3E6C8" contorno="#3A1D0C">
          {souCapitaoDaVez ? 'Aguardando a sua ordem…' : `Aguardando a ordem de ${navioVez.captainName || 'Capitão'}…`}
        </Texto>
      )}
      {turno.phase !== 'clue' && (
        <div
          style={{
            position: 'absolute',
            left: 1290,
            top: 36,
            width: 210,
            height: 44,
            borderRadius: 22,
            background: turno.phase === 'cannon' ? '#FFD24A' : '#F3DDB0',
            border: '3px solid #6B3A17',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 17,
            color: '#5A3410',
          }}
        >
          {turno.phase === 'cannon' ? '💥 Tiro de Canhão!' : `${turno.guessesLeft} ${turno.guessesLeft === 1 ? 'palpite restante' : 'palpites restantes'}`}
        </div>
      )}
      <div
        className={`lilita ${restante !== null && restante > 0 && restante < 10_000 && !pausada ? 'tremer' : ''}`}
        style={{
          position: 'absolute',
          left: 1442,
          top: 30,
          width: 132,
          height: 56,
          borderRadius: 28,
          background: '#3A2414',
          border: `3px solid ${restante !== null && restante < 10_000 && !pausada ? '#FF5A4A' : '#F0B44C'}`,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 34,
          color: restante !== null && restante < 10_000 && !pausada ? '#FF8A7A' : '#FFE08A',
        }}
      >
        {restante === null ? '∞' : formatarTempo(restante)}
      </div>
      <BotaoPreferencias x={1592} y={25} />
      <Icone nome={prefs.mudo ? 'som-desligado' : 'som-ligado'} x={1666} y={25} onClick={() => setPrefs({ mudo: !prefs.mudo })} title={prefs.mudo ? 'Ligar o som' : 'Silenciar'} />
      <Icone nome="ajuda" x={1740} y={25} onClick={() => setOverlay('ajuda')} title="Como jogar" />
      <Icone nome="fechar" x={1814} y={25} onClick={() => setOverlay(souAlmirante ? (overlay === 'menu' ? null : 'menu') : 'sair')} title={souAlmirante ? 'Menu do Almirante' : 'Sair da partida'} />

      {/* navios */}
      {game.turnOrder
        .slice()
        .sort((a, b) => ['rubi', 'safira', 'esmeralda', 'ouro'].indexOf(a) - ['rubi', 'safira', 'esmeralda', 'ouro'].indexOf(b))
        .map((id, i) => {
          const s = game.ships.find((x) => x.id === id)!
          return <PainelNavio key={id} ship={s} players={view.players} x={24} y={116 + i * 212} vez={id === turno.shipId} />
        })}

      {/* tabuleiro (treme quando sai o Kraken) */}
      <div key={`tabuleiro-${tremor}`} className={tremor ? 'tremer-uma-vez' : undefined} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Tabuleiro
          view={game}
          players={view.players}
          mapa={mapa}
          podeVotar={souMarujoDaVez && turno.phase !== 'clue' && !pausada}
          meuVoto={meuVoto}
          onVotar={votar}
          contagem={contagem}
          destaque={destaque}
          animadas={animadas}
        />
      </div>

      {/* faixa "Vez do Navio X" cruzando o tabuleiro a cada troca de vez */}
      <AnimatePresence>
        {faixa && (
          <motion.div
            key={faixa.seq}
            initial={{ x: -1300, opacity: 0 }}
            animate={{ x: [-1300, 0, 0, 1300], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.9, times: [0, 0.22, 0.78, 1], ease: 'easeInOut' }}
            onAnimationComplete={() => setFaixa(null)}
            style={{ position: 'absolute', left: 0, top: 0, zIndex: 20, pointerEvents: 'none' }}
          >
            <div style={{ position: 'absolute', left: 362, top: 470, width: 1196, height: 120, background: 'linear-gradient(90deg, transparent, rgba(27,16,9,.96) 16%, rgba(27,16,9,.96) 84%, transparent)' }} />
            <Bandeira ship={faixa.ship} x={430} y={482} w={104} h={90} />
            <Bandeira ship={faixa.ship} x={1386} y={482} w={104} h={90} />
            <Texto x={540} y={494} w={840} centro titulo tam={56} cor={SHIP_INFO[faixa.ship].corClara} contorno>
              Vez do Navio {nomeNavio(game, faixa.ship)}
            </Texto>
          </motion.div>
        )}
      </AnimatePresence>
      {turno.pending?.target === 'end' && contagem !== null && (
        <div className="lilita" style={{ position: 'absolute', left: 760, top: 470, width: 400, padding: '16px 0', textAlign: 'center', borderRadius: 16, background: 'rgba(43,26,15,.92)', border: '3px solid #FFD24A', color: '#FFF8EC', fontSize: 30, zIndex: 5 }}>
          {turno.phase === 'cannon' ? 'Abrindo mão do canhão' : 'Encerrando a vez'} em {contagem}…
        </div>
      )}

      {/* diário */}
      <Diario view={game} players={view.players} x={1576} y={116} onDestacar={game.me.seesMap ? setDestaque : undefined} destaque={destaque} />

      {/* barra inferior */}
      <div className="barra" style={{ left: 24, top: 968, width: 1872, height: 96 }} />
      {me && <Avatar avatar={me.avatar} ship={me.shipId} tam={64} x={42} y={984} />}
      <Texto x={118} y={982} titulo tam={26} cor="#FFF8EC">
        Você: {me?.name}
      </Texto>
      <Texto x={118} y={1018} tam={17} cor="#F3E6C8" peso={700}>
        {roleTexto}
      </Texto>

      {souCapitaoDaVez && turno.phase === 'clue' && (
        <>
          <Campo
            x={560}
            y={984}
            w={460}
            h={60}
            valor={dica}
            placeholder="Digite a dica (uma palavra)"
            maxLength={24}
            tam={22}
            erro={!!erroDica}
            autoFocus
            onChange={(v) => {
              setDica(v)
              setErroDica(null)
            }}
            onEnter={darOrdem}
            disabled={pausada}
          />
          {erroDica && (
            <div style={{ position: 'absolute', left: 560, top: 930, padding: '6px 14px', borderRadius: 10, background: 'rgba(140,30,22,.95)', color: '#FFF8EC', fontWeight: 800, fontSize: 16, whiteSpace: 'nowrap' }}>
              {erroDica}
            </div>
          )}
          <Seletor x={1036} y={988} h={52} valor={numero} min={1} max={Math.max(1, restantes)} onChange={setNumero} disabled={pausada} />
          <Botao cor="verde" x={1270} y={976} w={230} h={80} onClick={darOrdem} disabled={pausada || !dica.trim()}>
            Dar ordem
          </Botao>
        </>
      )}
      {souCapitaoDaVez && turno.phase !== 'clue' && (
        <Texto x={560} y={1000} w={940} tam={19} cor="#F3E6C8" peso={700}>
          Ordem dada! Agora é com os Marujos. Lembre-se: o Capitão só fala pela dica.
        </Texto>
      )}
      {role === 'capitao' && (
        <>
          <Botao cor="marrom" x={1550} y={984} w={210} h={64} tam={18} onClick={() => setOcultarMapa(!ocultarMapa)}>
            {ocultarMapa ? 'Mostrar mapa' : 'Ocultar mapa'}
          </Botao>
          <IconeNovo nome={ocultarMapa ? 'olho-riscado' : 'olho'} x={1786} y={984} w={64} h={64} onClick={() => setOcultarMapa(!ocultarMapa)} title="Ocultar mapa (para transmitir a tela)" />
        </>
      )}
      {role === 'capitao' && !minhaVez && (
        <Texto x={560} y={1000} w={940} tam={19} cor="#F3E6C8" peso={700}>
          Aguardando o Navio {navioVez.name}. Prepare a próxima ordem olhando o mapa.
        </Texto>
      )}

      {souMarujoDaVez && turno.phase !== 'clue' && (
        <>
          <Texto x={500} y={990} w={700} tam={18} cor="#F3E6C8" peso={700}>
            {turno.phase === 'cannon'
              ? 'Tiro livre! Votem em qualquer carta, ou abram mão do canhão.'
              : `Toquem numa palavra para votar. Com a maioria (${turno.majority}), ela é revelada em 3 s.`}
          </Texto>
          <Botao cor="vermelho" x={1236} y={976} w={290} h={80} tam={24} onClick={() => votar('end')} disabled={pausada || (turno.phase === 'guessing' && turno.guesses < 1)}>
            {turno.phase === 'cannon' ? 'Abrir mão' : 'Encerrar vez'}
            {votosFim > 0 ? ` (${votosFim}/${turno.majority})` : ''}
          </Botao>
          <Botao cor="azul" x={1546} y={976} w={330} h={80} tam={24} disabled={turno.phase !== 'cannon'} onClick={() => setAviso({ texto: 'Escolham uma carta para o tiro!', seq: Date.now() })}>
            Disparar canhão
          </Botao>
        </>
      )}
      {souMarujoDaVez && turno.phase === 'clue' && (
        <Texto x={500} y={1000} w={1000} tam={19} cor="#F3E6C8" peso={700}>
          Seu Capitão está pensando na ordem…
        </Texto>
      )}
      {!minhaVez && role !== 'capitao' && (
        <Texto x={500} y={1000} w={1000} tam={20} cor="#F3E6C8" peso={700}>
          {role === 'gaivota' ? '👀 ' : ''}Aguardando o Navio {navioVez.name}
          {turno.phase === 'clue' ? ' receber a ordem do Capitão.' : ' escolher as palavras.'}
        </Texto>
      )}
      {role === 'exCapitao' && minhaVez && (
        <Texto x={500} y={1000} w={1000} tam={19} cor="#F3E6C8" peso={700}>
          Você já viu o mapa, então assiste sem votar. Torça pelo seu navio!
        </Texto>
      )}

      {/* pausa */}
      {pausada && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45 }}>
          <FundoEscuro opacidade={0.6} />
          <IconeNovo nome="pausa" x={900} y={330} w={120} h={120} />
          <Texto x={0} y={470} w={1920} centro titulo tam={64} cor="#FFF8EC" contorno>
            Partida pausada
          </Texto>
          <Texto x={0} y={556} w={1920} centro tam={24} cor="#F3E6C8" peso={700}>
            {souAlmirante ? 'O relógio está parado para todos.' : `O Almirante ${view.players.find((p) => p.id === view.paused?.by)?.name ?? ''} pausou a partida. O relógio está parado.`}
          </Texto>
          {souAlmirante && (
            <Botao cor="verde" x={820} y={620} w={280} h={90} onClick={() => enviar({ type: 'resume' })}>
              Retomar
            </Botao>
          )}
        </div>
      )}

      {/* menu do Almirante */}
      {overlay === 'menu' && (
        <>
          <FundoEscuro opacidade={0} z={46} onClick={() => setOverlay(null)} />
          <div style={{ position: 'absolute', right: 34, top: 108, width: 390, zIndex: 47, background: '#FFF6DF', border: '3px solid #8A4A1C', borderRadius: 14, boxShadow: '0 12px 28px rgba(0,0,0,.5)', padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 10px' }}>
              <img src="/img/itens/brasao-almirante.webp" alt="" style={{ width: 40, height: 37 }} />
              <span className="lilita" style={{ fontSize: 24, color: '#5A3410' }}>
                Menu do Almirante
              </span>
            </div>
            {[
              pausada
                ? { i: 'play' as const, t: 'Retomar partida', d: 'O relógio volta a correr', f: () => enviar({ type: 'resume' }) }
                : { i: 'pausa' as const, t: 'Pausar partida', d: 'Para o relógio de todos', f: () => enviar({ type: 'pause' }) },
              { i: 'olho' as const, t: 'Como jogar', d: 'Regras rápidas da partida', f: () => setOverlay('ajuda') },
              { i: 'sair' as const, t: 'Sair da sala', d: me?.shipId ? `Você deixa o Navio ${nomeNavio(game, me.shipId)}` : 'Você deixa a sala', f: () => setOverlay('sair') },
              { i: 'cadeado' as const, t: 'Encerrar partida', d: 'Todos voltam ao salão', f: () => setOverlay('encerrar'), cor: '#B3261E' },
            ].map((o) => (
              <button
                key={o.t}
                type="button"
                onClick={() => {
                  if (o.i === 'pausa' || o.i === 'play') setOverlay(null)
                  o.f()
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '8px 10px', border: 0, borderTop: '1px solid rgba(90,52,16,.15)', background: 'transparent', textAlign: 'left', borderRadius: 8 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,138,58,.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <img src={`/img/interface/icones/${o.i}.webp`} alt="" style={{ width: 48, height: 48 }} />
                <span>
                  <span className="lilita" style={{ display: 'block', fontSize: 21, color: o.cor ?? '#5A3410' }}>
                    {o.t}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#8A6A4A' }}>{o.d}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <Avisos extra={aviso} />

      {overlay === 'ajuda' && <ModalComoJogar onFechar={() => setOverlay(null)} />}
      {overlay === 'sair' && (
        <ModalConfirmar
          titulo="Sair da partida"
          texto={
            role === 'capitao'
              ? 'Você é o Capitão! Se sair, outro Marujo do navio assume e passa a ver o mapa.'
              : 'Quer mesmo sair? A partida continua sem você.'
          }
          confirmar="Sair"
          onFechar={() => setOverlay(null)}
          onConfirmar={async () => {
            await enviar({ type: 'leave' })
            router.push('/')
          }}
        />
      )}
      {overlay === 'encerrar' && (
        <ModalConfirmar
          titulo="Encerrar partida"
          texto="A partida termina agora, sem vencedor. Todos veem o mapa e depois voltam ao salão."
          confirmar="Encerrar"
          onFechar={() => setOverlay(null)}
          onConfirmar={() => {
            enviar({ type: 'endGame' })
            setOverlay(null)
          }}
        />
      )}
      {typeof overlay === 'object' && overlay?.tipo === 'canhao' && turno.phase === 'cannon' && (
        <Modal titulo="Tiro de Canhão!" w={700} h={460} onFechar={() => setOverlay(null)} decos={[DECO_ANCORA(700, 460)]}>
          <Texto x={60} y={70} w={580} centro tam={21} cor="#5A3410" peso={700}>
            Vocês acertaram todas as palavras da ordem! Ganharam um palpite livre em qualquer carta do tabuleiro.
          </Texto>
          <IconeNovo nome="canhao" x={310} y={176} w={80} h={80} />
          <Botao cor="azul" x={60} y={330} w={320} h={80} tam={24} onClick={() => setOverlay(null)}>
            Disparar canhão
          </Botao>
          <Botao
            cor="cinza"
            x={400}
            y={334}
            w={230}
            h={72}
            tam={20}
            onClick={() => {
              votar('end')
              setOverlay(null)
            }}
          >
            Agora não
          </Botao>
        </Modal>
      )}
      {typeof overlay === 'object' && overlay?.tipo === 'afundou' && (
        <ModalInfo
          titulo="Navio afundado!"
          h={470}
          icone={<Navio ship={overlay.ship as never} afundado x={-60} y={-10} w={190} h={125} />}
          texto={
            <>
              <br />
              <br />O Navio {nomeNavio(game, overlay.ship as never)} encontrou o Kraken e afundou! A tripulação agora assiste como Gaivota.
            </>
          }
          onFechar={() => setOverlay(null)}
        />
      )}
      {typeof overlay === 'object' && overlay?.tipo === 'capitao' && (
        <ModalInfo
          titulo="Você virou Capitão!"
          h={440}
          icone={me ? <Escotilha avatar={me.avatar} ship={me.shipId} tam={80} /> : undefined}
          texto="O Capitão anterior caiu. Agora você vê o mapa e dá as ordens do seu navio. Só fale pela dica!"
          botao="Ao leme!"
          onFechar={() => setOverlay(null)}
        />
      )}
      {sorteio && (
        <Modal titulo="Capitães sorteados" w={900} h={300} onFechar={() => setSorteio(false)} decos={[DECO_ANCORA(900, 300)]} y={330}>
          <div style={{ position: 'absolute', left: 50, right: 50, top: 60, display: 'flex', justifyContent: 'space-around' }}>
            {game.ships.map((s) => {
              const cap = view.players.find((p) => p.id === s.captainId)
              return (
                <div key={s.id} style={{ position: 'relative', width: 170, height: 140, textAlign: 'center' }}>
                  {cap && <Escotilha avatar={cap.avatar} ship={s.id} tam={84} x={43} y={0} />}
                  <div className="lilita" style={{ position: 'absolute', left: 0, right: 0, top: 88, fontSize: 20, color: SHIP_INFO[s.id].cor }}>
                    {cap?.name ?? '—'}
                  </div>
                  <div style={{ position: 'absolute', left: 0, right: 0, top: 114, fontSize: 14, fontWeight: 700, color: '#7A5A3A' }}>Navio {s.name}</div>
                </div>
              )
            })}
          </div>
          <Texto x={0} y={214} w={900} centro tam={18} cor="#5A3410" peso={700}>
            Começa o Navio {nomeNavio(game, game.firstShip)}, com 1 tesouro a mais.
          </Texto>
        </Modal>
      )}
      {!sorteio && lembrete && (
        <ModalInfo
          titulo="Lembrete do Capitão"
          h={420}
          icone={<IconeNovo nome="mapa" x={0} y={0} w={72} h={72} />}
          texto="Você vê o mapa secreto. Só se comunique pela dica: nada de caretas, pistas extras ou comentários no Discord!"
          botao="Combinado"
          onFechar={() => setLembrete(false)}
        />
      )}
      {extra}
    </Palco>
  )
}
