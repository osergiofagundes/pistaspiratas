'use client'
import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { SHIP_INFO, type ShipId } from '@arena/platform'
import { Bandeira, Botao, Escotilha, Icone, Imagem, Moldura, Navio, Palco, Texto } from '@/components/ui'
import { Avisos } from '@/components/ui/Avisos'
import { BotaoIdioma, BotaoPreferencias, ModalConfirmar } from '@/components/modais/comuns'
import { useT } from '@/lib/i18n'
import { Diario } from '@/components/jogo/Diario'
import { Tabuleiro } from '@/components/jogo/Paineis'
import { useSala, type Visao } from '@/lib/sala'
import { nomeNavio, resumoPartida } from '@/lib/textos'
import { useMusica } from '@/lib/useMusica'

const MEDALHA = ['#F5C542', '#C9D1D9', '#D08A4E', '#9A7A5A']

/** Fim de partida: resumo com vencedor, placar e números; e o mapa revelado com o Diário completo. */
export function Fim({ view }: { view: Visao }) {
  const router = useRouter()
  const game = view.game!
  const enviar = useSala((s) => s.enviar)
  const prefs = useSala((s) => s.prefs)
  const setPrefs = useSala((s) => s.setPrefs)
  const anim = prefs.animacoes
  const t = useT()
  const nome = (id: ShipId) => nomeNavio(game, id, t)
  const [aviso, setAviso] = useState<{ texto: string; seq: number } | null>(null)
  const [sair, setSair] = useState(false)
  const [aba, setAba] = useState<'resumo' | 'mapa'>('resumo')
  const souAlmirante = view.adminId === view.you
  const venc = game.winner ? game.ships.find((s) => s.id === game.winner)! : null
  const meuNavio = game.me.shipId
  const venci = !!venc && meuNavio === venc.id
  const derrota = meuNavio !== null && game.winner !== null && meuNavio !== game.winner
  const minutos = game.finishedAt ? Math.max(1, Math.round((game.finishedAt - game.startedAt) / 60000)) : 0
  useMusica(derrota ? 'derrota' : 'vitoria')

  const titulo = venci ? t.fim.vitoria : derrota ? t.fim.derrota : venc ? t.fim.vitoriaDo(nome(venc.id)) : t.fim.encerrada
  const corTitulo = venci ? '#FFD24A' : derrota ? '#A9C7E8' : venc ? SHIP_INFO[venc.id].corClara : '#FFF8EC'
  const motivo = !venc
    ? t.fim.motivoEncerrou
    : game.finishReason === 'sobrevivencia'
      ? t.fim.motivoSobrevivencia(nome(venc.id))
      : t.fim.motivoTesouros(nome(venc.id), venc.total)
  const subtitulo = derrota ? t.fim.proxima(motivo) : venci ? t.fim.rica(motivo) : motivo

  // números de cada navio e da partida, tirados do Diário
  const stats = useMemo(() => {
    const porNavio = new Map<ShipId, { acertos: number; erros: number; turnos: number; afundouNoTurno: number | null }>()
    for (const s of game.ships) porNavio.set(s.id, { acertos: 0, erros: 0, turnos: 0, afundouNoTurno: null })
    let krakens = 0
    let canhoes = 0
    let tesouros = 0
    for (const e of game.log) {
      const n = porNavio.get(e.shipId)
      if (!n) continue
      if (e.clue) n.turnos++
      for (const p of e.picks) {
        if (p.owner === e.shipId) n.acertos++
        else n.erros++
        if (p.owner === 'kraken') {
          krakens++
          n.afundouNoTurno = e.number
        }
        if (p.cannon) canhoes++
        if (p.owner !== 'mar' && p.owner !== 'kraken') tesouros++
      }
    }
    return { porNavio, krakens, canhoes, tesouros }
  }, [game.log, game.ships])

  const placar = [...game.ships].sort(
    (a, b) =>
      (b.id === game.winner ? 1 : 0) - (a.id === game.winner ? 1 : 0) ||
      (a.eliminated ? 1 : 0) - (b.eliminated ? 1 : 0) ||
      b.total - b.left - (a.total - a.left),
  )

  const copiar = async () => {
    const texto = resumoPartida(game, t)
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      const area = document.createElement('textarea')
      area.value = texto
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    setAviso({ texto: t.fim.resumoCopiado, seq: Date.now() })
  }

  const tripulacao = venc ? view.players.filter((p) => p.shipId === venc.id) : []

  return (
    <Palco fundo={derrota ? 'fundo-derrota' : 'fundo-vitoria'} escurecer={derrota ? 0.5 : 0.35}>
      {/* título */}
      {venc && <Bandeira ship={venc.id} x={420} y={18} w={84} h={72} className={anim ? 'flutuar' : undefined} />}
      {venc && <Bandeira ship={venc.id} x={1416} y={18} w={84} h={72} className={anim ? 'flutuar' : undefined} />}
      <motion.div
        initial={anim ? (derrota ? { y: 40, opacity: 0 } : { scale: 0.3, opacity: 0, y: -40 }) : false}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={derrota ? { duration: 0.9, ease: 'easeOut' } : { type: 'spring', stiffness: 260, damping: 12 }}
        style={{ position: 'absolute', left: 510, top: 12, width: 900, height: 84 }}
      >
        <Texto x={0} y={0} w={900} centro titulo tam={venc && !venci && !derrota ? 56 : 68} cor={corTitulo} contorno>
          {titulo}
        </Texto>
      </motion.div>
      <motion.div
        initial={anim ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: anim ? 0.4 : 0, duration: 0.5 }}
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <Texto x={360} y={98} w={1200} centro tam={22} cor="#FFF8EC" peso={800} className="contorno-fino">
          {subtitulo}
        </Texto>
      </motion.div>
      <BotaoIdioma x={1666} y={18} />
      <BotaoPreferencias x={1740} y={18} />
      <Icone nome={prefs.mudo ? 'som-desligado' : 'som-ligado'} x={1814} y={18} onClick={() => setPrefs({ mudo: !prefs.mudo })} title={prefs.mudo ? t.comum.ligarSom : t.comum.silenciar} />

      {aba === 'resumo' ? (
        <>
          {/* herói: o navio vencedor e a tripulação */}
          <motion.div
            initial={anim ? { opacity: 0, x: -80 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: anim ? 0.2 : 0, ease: 'easeOut' }}
            style={{ position: 'absolute', left: 0, top: 0 }}
          >
            <Moldura x={50} y={150} w={760} h={650} />
            {venc ? (
              <>
                <div style={{ position: 'absolute', left: 50, top: 210, width: 760, height: 8, display: 'flex', justifyContent: 'center' }}>
                  <span className="lilita" style={{ padding: '4px 18px', borderRadius: 999, background: SHIP_INFO[venc.id].cor, color: '#FFF8EC', fontSize: 18, height: 30, display: 'flex', alignItems: 'center' }}>
                    {t.fim.vencedor}
                  </span>
                </div>
                <Navio ship={venc.id} className={anim ? 'navegar' : undefined} x={250} y={252} w={360} h={330} />
                <Texto x={50} y={584} w={760} centro titulo tam={44} cor={SHIP_INFO[venc.id].cor}>
                  {t.comum.navio(nome(venc.id))}
                </Texto>
                <div style={{ position: 'absolute', left: 90, top: 646, width: 680, display: 'flex', justifyContent: 'center', gap: 14 }}>
                  {tripulacao.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={anim ? { scale: 0, y: 20 } : false}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 16, delay: anim ? 0.6 + i * 0.08 : 0 }}
                      style={{ position: 'relative', width: 76, height: 110, textAlign: 'center' }}
                    >
                      <Escotilha avatar={p.avatar} ship={p.shipId} tam={70} x={3} y={6} />
                      {p.id === venc.captainId && <Imagem src="itens/coroa.webp" x={22} y={-14} w={32} h={26} />}
                      <div style={{ position: 'absolute', top: 80, left: -8, right: -8, fontSize: 14, fontWeight: 800, color: '#5A3410', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <img src="/img/interface/icones/cadeado.webp" alt="" style={{ position: 'absolute', left: 350, top: 290, width: 160, height: 160 }} />
                <Texto x={50} y={480} w={760} centro titulo tam={44} cor="#5A3410">
                  {t.fim.semVencedor}
                </Texto>
                <Texto x={120} y={540} w={620} centro tam={20} cor="#7A5A3A">
                  {t.fim.semVencedorTexto}
                </Texto>
              </>
            )}
          </motion.div>

          {/* placar */}
          <Texto x={860} y={154} titulo tam={32} cor="#FFF8EC" contorno>
            {t.fim.placar}
          </Texto>
          {placar.map((s, i) => {
            const n = stats.porNavio.get(s.id)!
            const achados = s.total - s.left
            const meu = s.id === meuNavio
            const info = SHIP_INFO[s.id]
            const h = placar.length > 3 ? 132 : 150
            const top = 204 + i * (h + 12)
            return (
              <motion.div
                key={s.id}
                initial={anim ? { opacity: 0, x: 80 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: anim ? 0.35 + i * 0.12 : 0, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  left: 860,
                  top,
                  width: 1010,
                  height: h,
                  borderRadius: 16,
                  background: s.eliminated ? 'rgba(232,220,200,.9)' : 'rgba(255,246,223,.95)',
                  border: `3px solid ${meu ? info.cor : 'rgba(138,74,28,.5)'}`,
                  boxShadow: meu ? `0 0 0 3px rgba(255,255,255,.35), 0 8px 18px rgba(0,0,0,.35)` : '0 6px 14px rgba(0,0,0,.3)',
                }}
              >
                {/* posição */}
                <div
                  className="lilita"
                  style={{
                    position: 'absolute',
                    left: 18,
                    top: h / 2 - 28,
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: s.eliminated ? '#6B5A4A' : MEDALHA[i] ?? MEDALHA[3],
                    border: '3px solid #6B3A17',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: s.eliminated ? 26 : 28,
                    color: s.eliminated ? '#FFF8EC' : '#3A1D0C',
                  }}
                >
                  {s.eliminated ? '☠' : t.fim.posicao(i + 1)}
                </div>
                <Navio ship={s.id} afundado={s.eliminated} x={88} y={h / 2 - 52} w={112} h={104} />
                <Texto x={214} y={h / 2 - 50} titulo tam={30} cor={s.eliminated ? '#7A6A5A' : info.cor}>
                  {t.comum.navio(nome(s.id))}
                  {meu ? <span style={{ fontSize: 18, color: '#7A5A3A' }}>{t.fim.seuNavio}</span> : null}
                </Texto>
                <Texto x={214} y={h / 2 - 12} tam={16} cor="#7A5A3A" peso={700}>
                  {t.fim.capitaoX(s.captainName || '—')}
                </Texto>
                {/* tesouros */}
                <div style={{ position: 'absolute', left: 214, top: h / 2 + 18, width: 270, height: 18, borderRadius: 9, background: 'rgba(90,52,16,.18)', overflow: 'hidden' }}>
                  <motion.div
                    initial={anim ? { width: 0 } : false}
                    animate={{ width: `${(achados / Math.max(1, s.total)) * 100}%` }}
                    transition={{ duration: 0.8, delay: anim ? 0.7 + i * 0.12 : 0, ease: 'easeOut' }}
                    style={{ height: '100%', background: s.eliminated ? '#9A8A7A' : info.cor }}
                  />
                </div>
                <Texto x={496} y={h / 2 + 15} tam={17} cor="#5A3410" peso={800}>
                  {t.fim.tesourosDe(achados, s.total)}
                </Texto>
                {/* números do navio */}
                <div style={{ position: 'absolute', right: 24, top: h / 2 - 38, display: 'flex', gap: 10 }}>
                  <Numero valor={n.acertos} rotulo={t.fim.acertos(n.acertos)} cor="#2E7A2A" />
                  <Numero valor={n.erros} rotulo={t.fim.erros(n.erros)} cor="#B3261E" />
                  <Numero valor={n.turnos} rotulo={t.fim.turnos(n.turnos)} cor="#5A3410" />
                </div>
                {s.eliminated && (
                  <Texto x={214} y={h - 26} tam={14} cor="#8A2A1E" peso={800}>
                    {t.fim.afundouKraken(n.afundouNoTurno)}
                  </Texto>
                )}
              </motion.div>
            )
          })}

          {/* números da partida */}
          {[
            { v: t.fim.minutos(minutos), r: t.fim.dePartida },
            { v: game.log.length, r: t.fim.turnos(game.log.length) },
            { v: stats.tesouros, r: t.fim.tesourosAchados },
            { v: stats.krakens, r: t.fim.krakens(stats.krakens) },
            { v: stats.canhoes, r: t.fim.canhoes(stats.canhoes) },
          ].map((n, i) => (
            <motion.div
              key={n.r}
              initial={anim ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: anim ? 0.9 + i * 0.07 : 0 }}
              style={{
                position: 'absolute',
                left: 50 + i * 368,
                top: 826,
                width: 352,
                height: 118,
                borderRadius: 16,
                background: 'rgba(27,16,9,.78)',
                border: '2px solid rgba(240,180,76,.55)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="lilita" style={{ fontSize: 44, lineHeight: 1, color: '#FFE08A' }}>
                {n.v}
              </span>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#F3E6C8', marginTop: 6 }}>{n.r}</span>
            </motion.div>
          ))}
        </>
      ) : (
        <>
          <Tabuleiro
            view={game}
            players={view.players}
            x={40}
            y={140}
            w={1510}
            h={808}
            mapa
            podeVotar={false}
            onVotar={() => {}}
            destaque={null}
            animadas={new Set()}
            fim
          />
          <Diario view={game} players={view.players} x={1576} y={140} h={808} titulo={t.fim.diarioCompleto} />
        </>
      )}

      {/* barra inferior */}
      <div className="barra" style={{ left: 24, top: 968, width: 1872, height: 96 }} />
      <Texto x={50} y={1002} tam={19} cor="#F3E6C8" peso={700}>
        {t.fim.rodape(minutos, game.log.length)}
      </Texto>
      <Botao cor="azul" x={760} y={980} w={270} h={72} tam={22} onClick={() => setAba(aba === 'resumo' ? 'mapa' : 'resumo')}>
        {aba === 'resumo' ? t.fim.verMapa : t.fim.verResumo}
      </Botao>
      <Botao cor="cinza" x={1050} y={980} w={150} h={72} tam={22} onClick={() => setSair(true)}>
        {t.comum.sair}
      </Botao>
      <Botao cor="marrom" x={1236} y={976} w={290} h={80} tam={26} onClick={copiar}>
        {t.fim.copiarResumo}
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
        title={souAlmirante ? undefined : t.fim.soAlmiranteLeva}
      >
        {souAlmirante ? t.fim.voltarSalao : t.fim.esperandoAlmirante}
      </Botao>

      <Avisos extra={aviso} />
      {sair && (
        <ModalConfirmar
          titulo={t.salao.sair.titulo}
          pergunta={t.salao.sair.pergunta}
          texto={t.salao.sair.texto}
          confirmar={t.comum.sair}
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

function Numero({ valor, rotulo, cor }: { valor: number; rotulo: string; cor: string }) {
  return (
    <div style={{ width: 82, height: 76, borderRadius: 12, background: 'rgba(90,52,16,.08)', border: '2px solid rgba(90,52,16,.18)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <span className="lilita" style={{ fontSize: 30, lineHeight: 1, color: cor }}>
        {valor}
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, color: '#7A5A3A', marginTop: 4 }}>{rotulo}</span>
    </div>
  )
}
