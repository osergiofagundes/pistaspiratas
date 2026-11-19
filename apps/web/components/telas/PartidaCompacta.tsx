'use client'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { SHIP_INFO, type Player, type ShipId } from '@arena/platform'
import type { ShipView } from '@arena/codenomes'
import { Avatar, Bandeira, Botao, Campo, FundoEscuro, Icone, IconeNovo, Navio, Seletor, Texto, usePalco } from '@/components/ui'
import { BotaoMenu, BotaoSom, type ItemMenu } from '@/components/modais/comuns'
import { Diario } from '@/components/jogo/Diario'
import { Tabuleiro } from '@/components/jogo/Paineis'
import { Alvo } from '@/components/jogo/Guia'
import { traduzNavio, useT } from '@/lib/i18n'
import { formatarTempo, resumoEntrada, textoFase } from '@/lib/textos'
import type { CtxPartida } from './Partida'

const ORDEM: ShipId[] = ['rubi', 'safira', 'esmeralda', 'ouro']
/** coluna das ações (direita) */
const RW = 262
/** coluna dos navios (esquerda) */
const LW = 188
const TOPO = 88

/**
 * Partida no formato compacto (celular e tablet deitados, spec §7.2 adaptada):
 * barra fixa no alto com a vez, a dica e o relógio; navios à esquerda; o tabuleiro com toda a
 * altura; e à direita "você", as ações da vez e o Diário, que abre numa gaveta.
 */
export function PartidaCompacta({ c }: { c: CtxPartida }) {
  const { W, H } = usePalco()
  const t = useT()
  const [diario, setDiario] = useState(false)
  const [tripulacao, setTripulacao] = useState<ShipId | null>(null)
  const { view, game, turno, navioVez, infoVez, centro, restante, pausada, souCapitaoDaVez, nome } = c
  const players = view.players
  const vermelho = restante !== null && restante < 10_000 && !pausada

  // menu do topo: o Almirante pausa, sai ou encerra por ali
  const itens: ItemMenu[] = c.souAlmirante
    ? [
        pausada
          ? { icone: 'interface/icones/play.webp', rotulo: t.partida.menu.retomar, onClick: () => c.enviar({ type: 'resume' }) }
          : { icone: 'interface/icones/pausa.webp', rotulo: t.partida.menu.pausar, onClick: () => c.enviar({ type: 'pause' }) },
        { icone: 'interface/icones/sair.webp', rotulo: t.partida.menu.sair, onClick: () => c.setOverlay('sair') },
        { icone: 'interface/icones/cadeado.webp', rotulo: t.partida.menu.encerrar, cor: '#B3261E', onClick: () => c.setOverlay('encerrar') },
      ]
    : [{ icone: 'interface/icones/sair.webp', rotulo: t.partida.sairPartida, cor: '#B3261E', onClick: () => c.setOverlay('sair') }]

  const navios = game.turnOrder.slice().sort((a, b) => ORDEM.indexOf(a) - ORDEM.indexOf(b))
  const navH = Math.min(118, (H - TOPO - 12 - (navios.length - 1) * 8) / navios.length)
  const bx = 12 + LW + 10
  const bw = W - bx - 10 - RW - 12
  const rx = W - RW - 12

  return (
    <>
      {/* barra do alto */}
      <div className="barra" style={{ left: 12, top: 8, width: W - 24, height: 70 }} />
      <Bandeira ship={turno.shipId} x={24} y={20} w={52} h={45} />
      <Texto x={84} y={13} w={300} titulo tam={23} cor={infoVez.corClara} contorno className="truncate">
        {t.partida.vezDoNavio(c.navioVezNome)}
      </Texto>
      <Texto x={84} y={45} w={300} tam={14} cor="#F3E6C8" peso={700} className="truncate">
        {textoFase(game, t)}
      </Texto>
      <div style={{ position: 'absolute', left: 392, top: 8, width: W - 392 - 270, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        {centro ? (
          <motion.div
            key={`${turno.number}-${centro.word}`}
            initial={c.prefs.animacoes ? { scale: 1.6, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}
          >
            <span
              className="lilita contorno"
              style={{ ['--c' as string]: '#3A1D0C', fontSize: Math.min(40, (W - 392 - 340) / Math.max(5, centro.word.length * 0.62)), lineHeight: 1, color: '#FFF8EC', whiteSpace: 'nowrap' } as React.CSSProperties}
            >
              {centro.word}
            </span>
            <span className="lilita numero-dica" title={t.partida.palavras(centro.count)}>
              {centro.count}
            </span>
          </motion.div>
        ) : (
          <span className="lilita contorno" style={{ ['--c' as string]: '#3A1D0C', fontSize: 24, lineHeight: 1.1, color: '#F3E6C8', textAlign: 'center', overflow: 'hidden', maxHeight: 56 } as React.CSSProperties}>
            {souCapitaoDaVez ? t.partida.aguardandoSua : t.partida.aguardandoDe(navioVez.captainName || t.comum.capitao)}
          </span>
        )}
      </div>
      <div
        className={`lilita ${c.apertado ? 'tremer' : ''}`}
        style={{
          position: 'absolute',
          left: W - 262,
          top: 18,
          width: 112,
          height: 50,
          borderRadius: 25,
          background: '#3A2414',
          border: `3px solid ${vermelho ? '#FF5A4A' : '#F0B44C'}`,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 30,
          color: vermelho ? '#FF8A7A' : '#FFE08A',
        }}
      >
        {restante === null ? '∞' : formatarTempo(restante)}
      </div>
      <BotaoSom x={W - 142} y={14} tam={56} />
      <BotaoMenu x={W - 78} y={14} tam={56} itens={itens} />

      {/* navios */}
      {navios.map((id, i) => {
        const s = game.ships.find((x) => x.id === id)!
        return <CartaoNavio key={id} ship={s} players={players} x={12} y={TOPO + i * (navH + 8)} w={LW} h={navH} vez={id === turno.shipId} onClick={() => setTripulacao(id)} />
      })}

      {/* tabuleiro */}
      <div key={`tabuleiro-${c.tremor}`} className={c.tremor ? 'tremer-uma-vez' : undefined} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Tabuleiro
          view={game}
          players={players}
          x={bx}
          y={TOPO}
          w={bw}
          h={H - TOPO - 12}
          mapa={c.mapa}
          podeVotar={c.souMarujoDaVez && turno.phase !== 'clue' && !pausada}
          podeMarcar={c.role === 'capitao' && !pausada}
          onMarcar={c.marcar_}
          meuNavio={game.me.shipId}
          onVotar={c.marcar}
          destaque={c.destaque}
          animadas={c.animadas}
          realce={c.realce}
        />
      </div>
      {c.tutorial && (
        <>
          <Alvo id="barra" x={12} y={8} w={W - 24} h={70} />
          <Alvo id="ordem" x={392} y={8} w={W - 392 - 270} h={70} />
          <Alvo id="navios" x={12} y={TOPO} w={LW} h={navios.length * (navH + 8) - 8} />
          <Alvo id="tabuleiro" x={bx} y={TOPO} w={bw} h={H - TOPO - 12} />
          <Alvo id="diario" x={rx + 14} y={H - 12 - 70} w={RW - 28} h={58} />
          <Alvo id="confirmar" x={rx + 14} y={H - 12 - 74 - 64 - 10 - 76} w={RW - 28} h={64} />
          <Alvo id="campoDica" x={rx + 10} y={TOPO + 84} w={RW - 20} h={224} />
        </>
      )}

      {/* coluna das ações */}
      <Acoes c={c} x={rx} y={TOPO} h={H - TOPO - 12} onDiario={() => setDiario(true)} />

      {/* Diário numa gaveta que vem da direita */}
      <AnimatePresence>
        {diario && (
          <motion.div key="diario" style={{ position: 'absolute', inset: 0, zIndex: 35 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FundoEscuro opacidade={0.45} onClick={() => setDiario(false)} />
            <motion.div
              initial={{ x: 380 }}
              animate={{ x: 0 }}
              exit={{ x: 380 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{ position: 'absolute', left: 0, top: 0 }}
            >
              <Diario
                view={game}
                players={players}
                x={W - 12 - 360}
                y={30}
                w={360}
                h={H - 42}
                onDestacar={game.me.seesMap ? (n) => (c.setDestaque(n), setDiario(false)) : undefined}
                destaque={c.destaque}
              />
              <Icone nome="fechar" x={W - 12 - 360 - 26} y={44} w={52} h={54} onClick={() => setDiario(false)} title={t.comum.fechar} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* tripulação de um navio (no toque não há "title" com os nomes) */}
      {tripulacao && <Tripulacao ship={game.ships.find((s) => s.id === tripulacao)!} players={players} nome={nome(tripulacao)} onFechar={() => setTripulacao(null)} />}
    </>
  )
}

/** Navio na coluna da esquerda, em tamanho de celular. */
function CartaoNavio({ ship, players, x, y, w, h, vez, onClick }: { ship: ShipView; players: Player[]; x: number; y: number; w: number; h: number; vez: boolean; onClick: () => void }) {
  const t = useT()
  const info = SHIP_INFO[ship.id]
  const crew = players.filter((p) => p.shipId === ship.id)
  const ordenados = [...crew].sort((a, b) => (a.id === ship.captainId ? -1 : b.id === ship.captainId ? 1 : 0))
  const achados = ship.total - ship.left
  const compacto = h < 100
  return (
    <button
      type="button"
      onClick={onClick}
      className={vez ? 'pulsar' : undefined}
      aria-label={`${traduzNavio(t, ship.name, ship.id)} · ${t.compacto.tripulacao}`}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        padding: 0,
        borderRadius: 14,
        border: `3px solid ${vez ? '#FFD24A' : '#8A4A1C'}`,
        background: ship.eliminated ? 'linear-gradient(#D8CBB4, #BBA98C)' : 'linear-gradient(#FBF1DC, #EED9AE)',
        boxShadow: '0 4px 10px rgba(0,0,0,.4)',
        textAlign: 'left',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: info.cor }} />
      {ship.eliminated ? (
        <Navio ship={ship.id} afundado x={8} y={h / 2 - 22} w={60} h={40} />
      ) : (
        <Navio ship={ship.id} className={vez ? 'navegar' : undefined} x={10} y={compacto ? 6 : 10} w={52} h={50} />
      )}
      <span className="lilita" style={{ position: 'absolute', left: 68, right: 8, top: 6, fontSize: 19, color: ship.eliminated ? '#8A7A6A' : info.cor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {traduzNavio(t, ship.name, ship.id)}
      </span>
      {ship.eliminated ? (
        <span style={{ position: 'absolute', left: 68, right: 6, top: 32, fontSize: 12, fontWeight: 800, color: '#9B2C2C', lineHeight: 1.1 }}>{t.paineis.afundadoKraken}</span>
      ) : (
        <>
          <span style={{ position: 'absolute', left: 68, top: 31, fontSize: 14, fontWeight: 800, color: '#5A3410' }}>
            {achados}/{ship.total}
          </span>
          <span style={{ position: 'absolute', left: 112, right: 10, top: 37, height: 8, borderRadius: 4, background: 'rgba(0,0,0,.15)' }}>
            <span style={{ display: 'block', width: `${(achados / ship.total) * 100}%`, height: '100%', borderRadius: 4, background: info.cor, transition: 'width .4s' }} />
          </span>
        </>
      )}
      <span style={{ position: 'absolute', left: compacto ? 68 : 12, top: compacto ? 52 : 64, display: 'flex', gap: 4, alignItems: 'center' }}>
        {ordenados.slice(0, compacto ? 3 : 5).map((p) => (
          <span key={p.id} style={{ position: 'relative', width: 28, height: 28 }}>
            <Avatar avatar={p.avatar} ship={p.shipId} tam={28} x={0} y={0} apagado={ship.eliminated} cinza={!p.connected} />
            {p.id === ship.captainId && !ship.eliminated && <img src="/img/itens/coroa.webp" alt="" style={{ position: 'absolute', left: 14, top: -8, width: 18, height: 15 }} />}
          </span>
        ))}
        {ordenados.length > (compacto ? 3 : 5) && <span style={{ fontSize: 13, fontWeight: 800, color: '#5A3410' }}>+{ordenados.length - (compacto ? 3 : 5)}</span>}
      </span>
    </button>
  )
}

/** Quem está em cada navio, com o Capitão primeiro. */
function Tripulacao({ ship, players, nome, onFechar }: { ship: ShipView; players: Player[]; nome: string; onFechar: () => void }) {
  const t = useT()
  const { H } = usePalco()
  const crew = players.filter((p) => p.shipId === ship.id).sort((a, b) => (a.id === ship.captainId ? -1 : b.id === ship.captainId ? 1 : 0))
  const h = Math.min(H - 80, 92 + crew.length * 50)
  return (
    <>
      <FundoEscuro opacidade={0.35} z={36} onClick={onFechar} />
      <div
        role="dialog"
        aria-label={t.compacto.tripulacao}
        onClick={onFechar}
        style={{ position: 'absolute', left: 12 + LW + 10, top: Math.min(TOPO, H - h - 10), width: 330, maxHeight: h, overflowY: 'auto', zIndex: 37, background: '#FFF6DF', border: `3px solid ${SHIP_INFO[ship.id].cor}`, borderRadius: 14, boxShadow: '0 12px 28px rgba(0,0,0,.5)', padding: '10px 14px' }}
      >
        <div className="lilita" style={{ fontSize: 22, color: SHIP_INFO[ship.id].cor, marginBottom: 6 }}>
          {t.comum.navio(nome)} · {t.compacto.tripulacao}
        </div>
        {crew.map((p) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 48, borderTop: '1px solid rgba(90,52,16,.15)' }}>
            <span style={{ position: 'relative', width: 38, height: 38 }}>
              <Avatar avatar={p.avatar} ship={p.shipId} tam={38} x={0} y={0} cinza={!p.connected} />
            </span>
            <span style={{ flex: 1, fontSize: 17, fontWeight: 800, color: '#3A2414', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.name}
              {!p.connected && <span style={{ fontSize: 13, color: '#9A7A5A' }}> {t.comum.caiu}</span>}
            </span>
            {p.id === ship.captainId && <img src="/img/itens/coroa.webp" alt={t.comum.capitao} style={{ width: 30, height: 26 }} />}
          </div>
        ))}
        {crew.length === 0 && <div style={{ fontSize: 15, fontWeight: 700, color: '#9A7A5A' }}>—</div>}
      </div>
    </>
  )
}

/** Coluna da direita: quem é você, as ações da vez e o Diário. */
function Acoes({ c, x, y, h, onDiario }: { c: CtxPartida; x: number; y: number; h: number; onDiario: () => void }) {
  const t = useT()
  const { view, game, turno, me, role, minhaVez, pausada, selecao, presentes, confirmaram, querFim } = c
  const ultima = [...game.log].reverse().find((e) => e.picks.length > 0 || e.clue)
  const ativo = game.finishReason ? -1 : turno.number
  const w = RW
  const ix = x + 14
  const iw = w - 28
  const texto = (conteudo: React.ReactNode, top: number, tam = 15) => (
    <Texto x={ix} y={top} w={iw} tam={tam} cor="#F3E6C8" peso={700}>
      {conteudo}
    </Texto>
  )
  return (
    <>
      <div className="barra" style={{ left: x, top: y, width: w, height: h }} />
      {/* você */}
      {me && <Avatar avatar={me.avatar} ship={me.shipId} tam={46} x={ix} y={y + 12} />}
      <Texto x={ix + 54} y={y + 10} w={iw - 54 - (role === 'capitao' ? 52 : 0)} titulo tam={19} cor="#FFF8EC" className="truncate">
        {t.partida.voce(me?.name ?? '')}
      </Texto>
      <Texto x={ix + 54} y={y + 36} w={iw - 54 - (role === 'capitao' ? 52 : 0)} tam={12.5} cor="#E8D2A8" peso={700}>
        {c.roleTexto}
      </Texto>
      {role === 'capitao' && (
        <IconeNovo
          nome={c.ocultarMapa ? 'olho-riscado' : 'olho'}
          x={x + w - 14 - 46}
          y={y + 12}
          w={46}
          h={46}
          onClick={() => c.setOcultarMapa(!c.ocultarMapa)}
          title={c.ocultarMapa ? t.partida.mostrarMapa : t.partida.ocultarMapa}
        />
      )}
      <div style={{ position: 'absolute', left: ix, top: y + 72, width: iw, height: 2, background: 'rgba(240,180,76,.35)' }} />

      {/* palpites restantes ou Tiro de Canhão */}
      {turno.phase !== 'clue' && (
        <div
          style={{
            position: 'absolute',
            left: ix,
            top: y + 84,
            width: iw,
            height: 36,
            borderRadius: 18,
            background: turno.phase === 'cannon' ? '#FFD24A' : '#F3DDB0',
            border: '3px solid #6B3A17',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 15,
            color: '#5A3410',
          }}
        >
          {turno.phase === 'cannon' ? t.partida.tiroCanhao : t.partida.palpitesRestantes(turno.guessesLeft)}
        </div>
      )}

      {/* Capitão da vez: dica, número e ordem */}
      {c.souCapitaoDaVez && turno.phase === 'clue' && (
        <>
          <Campo
            x={ix - 4}
            y={y + 84}
            w={iw + 8}
            h={56}
            valor={c.dica}
            placeholder={t.partida.dicaPh}
            maxLength={24}
            tam={19}
            erro={!!c.erroDica}
            onChange={(v) => {
              c.setDica(v)
              c.setErroDica(null)
            }}
            onEnter={c.darOrdem}
            disabled={pausada}
          />
          {c.erroDica ? (
            <Texto x={ix} y={y + 144} w={iw} tam={13} cor="#FF9A8A" peso={800}>
              {c.erroDica}
            </Texto>
          ) : (
            <Texto x={ix} y={y + 146} w={iw} tam={13} cor="#FFE08A" peso={800}>
              {t.partida.marcadas(c.minhasMarcas.length)}
            </Texto>
          )}
          <Seletor x={ix + (iw - 46 * 3.3) / 2} y={y + 184} h={46} valor={c.numero} min={1} max={Math.max(1, c.restantes)} onChange={c.setNumero} disabled={pausada} />
          <Botao cor="verde" x={ix} y={y + 240} w={iw} h={68} tam={24} onClick={c.darOrdem} disabled={pausada || !c.dica.trim()}>
            {t.partida.darOrdem}
          </Botao>
        </>
      )}
      {c.souCapitaoDaVez && turno.phase !== 'clue' &&
        texto(
          <>
            {t.partida.ordemDada}
            <br />
            <span style={{ fontSize: 13, color: '#E8D2A8' }}>{t.partida.selecaoResumo(selecao.length, confirmaram, presentes.length)}</span>
          </>,
          y + 132,
        )}
      {role === 'capitao' && !minhaVez &&
        texto(
          <>
            {t.partida.aguardandoNavio(c.navioVezNome)}
            <br />
            <span style={{ fontSize: 13, color: '#E8D2A8' }}>{t.partida.toqueTesouros(c.minhasMarcas.length)}</span>
          </>,
          y + (turno.phase !== 'clue' ? 132 : 88),
        )}

      {/* Marujos da vez: quem confirmou, Confirmar e Encerrar */}
      {c.souMarujoDaVez && turno.phase !== 'clue' && (
        <>
          <Texto x={ix} y={y + 128} w={iw} tam={13} cor="#F3E6C8" peso={700}>
            {turno.phase === 'cannon' ? t.partida.tiroLivre : t.partida.marquemAte(turno.limit)}
          </Texto>
          <div style={{ position: 'absolute', left: ix, top: y + 168, width: iw, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {presentes.map((id) => {
              const p = view.players.find((x) => x.id === id)
              if (!p) return null
              const ok = turno.confirms.includes(id)
              const fim = turno.endVotes.includes(id)
              return (
                <div key={id} style={{ position: 'relative', width: 32, height: 32, opacity: ok || fim ? 1 : 0.55 }}>
                  <Avatar avatar={p.avatar} ship={p.shipId} tam={32} x={0} y={0} />
                  {(ok || fim) && <span className={`selo-voto ${ok ? 'ok' : 'fim'}`}>{ok ? '✔' : '✕'}</span>}
                </div>
              )
            })}
            <span style={{ fontSize: 13, fontWeight: 800, color: '#E8D2A8' }}>{t.partida.confirmaram(selecao.length, confirmaram, presentes.length)}</span>
          </div>
          <Botao
            cor={c.confirmei ? 'marrom' : 'verde'}
            className={!c.confirmei && selecao.length > 0 ? 'brilho' : undefined}
            x={ix}
            y={y + h - 74 - 64 - 10 - 76}
            w={iw}
            h={64}
            tam={c.confirmei ? 16 : 20}
            onClick={c.confirmar}
            disabled={pausada || (!c.confirmei && selecao.length === 0)}
          >
            {c.confirmei ? t.partida.cancelarConfirmacao : t.partida.confirmarN(selecao.length)}
          </Botao>
          <Botao
            cor={c.pediFim ? 'marrom' : 'vermelho'}
            x={ix}
            y={y + h - 74 - 64 - 4}
            w={iw}
            h={58}
            tam={c.pediFim ? 15 : 17}
            onClick={() => c.encerrar()}
            disabled={pausada || (turno.phase === 'guessing' && turno.guesses < 1)}
          >
            {c.pediFim ? t.comum.cancelar : turno.phase === 'cannon' ? t.partida.abrirMao : t.partida.encerrarVez} ({querFim}/{presentes.length})
          </Botao>
        </>
      )}
      {c.souMarujoDaVez && turno.phase === 'clue' && texto(t.partida.capitaoPensando, y + 88)}
      {!minhaVez && role !== 'capitao' &&
        texto(
          <>
            {role === 'gaivota' ? '👀 ' : ''}
            {turno.phase === 'clue' ? t.partida.aguardandoOrdem(c.navioVezNome) : t.partida.aguardandoEscolha(c.navioVezNome, selecao.length, confirmaram, presentes.length)}
          </>,
          y + (turno.phase !== 'clue' ? 132 : 88),
          16,
        )}
      {role === 'exCapitao' && minhaVez && texto(t.partida.jaViuMapa, y + (turno.phase !== 'clue' ? 132 : 88))}

      {/* última jogada e o botão do Diário */}
      {ultima && !(c.souMarujoDaVez && turno.phase !== 'clue') && !(c.souCapitaoDaVez && turno.phase === 'clue' && h < 470) && (
        <div style={{ position: 'absolute', left: ix, top: y + h - 74 - 58, width: iw, height: 50, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#C9A878', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.compacto.ultima}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#F3E6C8', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {ultima.clue ? `${ultima.clue.word} · ${ultima.clue.count} — ` : ''}
            {resumoEntrada(ultima, ultima.number === ativo, game, t)}
          </div>
        </div>
      )}
      <Botao cor="azul" x={ix} y={y + h - 70} w={iw} h={58} tam={20} onClick={onDiario}>
        {t.compacto.diario}
      </Botao>
    </>
  )
}
