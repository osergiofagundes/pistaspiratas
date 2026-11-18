'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { SHIP_IDS, SHIP_INFO, type Player, type ShipId } from '@arena/platform'
import { type CodenomesConfig, PRESETS, canStart, gridFor } from '@arena/codenomes'
import {
  Botao,
  COR_DO_NAVIO,
  Escotilha,
  FundoEscuro,
  Avatar,
  Icone,
  IconeNovo,
  Imagem,
  Moldura,
  Navio,
  Palco,
  Placa,
  Texto,
} from '@/components/ui'
import { Avisos } from '@/components/ui/Avisos'
import { BotaoPreferencias, ModalComoJogar, ModalConfirmar, ModalPerfil } from '@/components/modais/comuns'
import { ModalConfiguracoes } from '@/components/modais/Configuracoes'
import { salvarPerfil } from '@/lib/identidade'
import { useSala, type Visao } from '@/lib/sala'
import { useMusica } from '@/lib/useMusica'

type Menu = { player: Player; x: number; y: number } | null
type Confirmar = null | { tipo: 'sair' } | { tipo: 'expulsar'; player: Player } | { tipo: 'cargo'; player: Player }

/** Salão de espera (telas 805, 9334, 9533, 9732, 18658, 18860). */
export function Salao({ view }: { view: Visao }) {
  const router = useRouter()
  const enviar = useSala((s) => s.enviar)
  const mudo = useSala((s) => s.prefs.mudo)
  useMusica('porto')
  const setPrefs = useSala((s) => s.setPrefs)
  const [menu, setMenu] = useState<Menu>(null)
  const [submenu, setSubmenu] = useState(false)
  const [confirmar, setConfirmar] = useState<Confirmar>(null)
  const [config, setConfig] = useState(false)
  const [ajuda, setAjuda] = useState(false)
  const [perfil, setPerfil] = useState(false)
  const [copiado, setCopiado] = useState<{ texto: string; seq: number } | null>(null)

  const me = view.players.find((p) => p.id === view.you)
  const souAlmirante = view.adminId === view.you
  const almirante = view.players.find((p) => p.id === view.adminId)
  const ships = SHIP_IDS.slice(0, view.config.shipCount)
  const assistindo = view.players.filter((p) => !p.shipId)
  const motivo = canStart(view.config, view.players)
  const link = typeof window !== 'undefined' ? `${window.location.host}/sala/${view.code}` : `/sala/${view.code}`
  const escolha = view.config.captainMode === 'escolha'

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.protocol}//${link}`)
    } catch {
      const t = document.createElement('textarea')
      t.value = `${window.location.protocol}//${link}`
      document.body.appendChild(t)
      t.select()
      document.execCommand('copy')
      t.remove()
    }
    setCopiado({ texto: 'Link copiado!', seq: Date.now() })
  }

  const abrirMenu = (p: Player, e: React.MouseEvent) => {
    if (!souAlmirante) return
    const palco = (e.currentTarget as HTMLElement).closest('.palco') as HTMLElement
    const r = palco.getBoundingClientRect()
    const k = r.width / 1920
    setSubmenu(false)
    setMenu({ player: p, x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k })
  }

  // colunas dos navios
  const area = { x: 40, w: 1370 }
  const gap = 26
  const colW = (area.w - gap * (ships.length - 1)) / ships.length

  return (
    <Palco fundo="fundo-salao" escurecer={0.25}>
      {menu && <FundoEscuro opacidade={0} z={39} onClick={() => setMenu(null)} />}
      <Imagem src="logos/logo-codenomes.webp" x={28} y={14} w={204} h={134} />
      <Placa texto="Salão de espera" x={760} y={36} w={400} tam={28} />
      <Texto x={560} y={122} w={800} centro tam={20} cor="#FFF8EC" className="contorno-fino">
        Sala {view.code} · Almirante: {almirante?.name ?? '—'}
      </Texto>
      <Icone nome={mudo ? 'som-desligado' : 'som-ligado'} x={1416} y={38} onClick={() => setPrefs({ mudo: !mudo })} title={mudo ? 'Ligar o som' : 'Silenciar'} />
      <Icone nome="ajuda" x={1494} y={38} onClick={() => setAjuda(true)} title="Como jogar" />
      <BotaoPreferencias x={1572} y={38} onEditarPerfil={me ? () => setPerfil(true) : undefined} />
      <button
        type="button"
        className="img-botao"
        onClick={() => setConfirmar({ tipo: 'sair' })}
        aria-label="Sair da Sala"
        style={{
          left: 1656,
          top: 34,
          width: 216,
          height: 80,
          ['--img' as string]: 'url(/img/interface/botoes/sair-da-sala.webp)',
          ['--img-h' as string]: 'url(/img/interface/botoes/sair-da-sala-hover.webp)',
          ['--img-p' as string]: 'url(/img/interface/botoes/sair-da-sala-pressionado.webp)',
        }}
      />

      {/* navios */}
      {ships.map((id, i) => {
        const x = area.x + i * (colW + gap)
        const crew = view.players.filter((p) => p.shipId === id)
        const nome = view.config.shipNames[id] || SHIP_INFO[id].nome
        const aqui = me?.shipId === id
        const capitao = view.captainClaims[id]
        return (
          <div key={id}>
            <Moldura x={x} y={184} w={colW} h={620} />
            <Navio ship={id} className="navegar" style={{ animationDelay: `-${i * 0.8}s` }} x={x + colW / 2 - 66} y={198} w={132} h={128} />
            <Texto x={x} y={326} w={colW} centro titulo tam={32} cor={SHIP_INFO[id].cor}>
              Navio {nome}
            </Texto>
            <Texto x={x} y={366} w={colW} centro tam={17} cor="#7A5A3A">
              {crew.length} {crew.length === 1 ? 'jogador' : 'jogadores'}
            </Texto>
            <div className="rolagem" style={{ position: 'absolute', left: x + 30, top: 396, width: colW - 60, height: escolha ? 220 : 262 }}>
              <AnimatePresence initial={false}>
              {crew.map((p) => (
                <LinhaJogador
                  key={p.id}
                  p={p}
                  eu={p.id === view.you}
                  almirante={p.id === view.adminId}
                  capitao={escolha && capitao === p.id}
                  clicavel={souAlmirante}
                  onClick={(e) => (p.id === view.you && !souAlmirante ? setPerfil(true) : abrirMenu(p, e))}
                />
              ))}
              </AnimatePresence>
              {crew.length === 0 && (
                <div style={{ textAlign: 'center', color: '#9A7A5A', fontWeight: 700, fontSize: 16, marginTop: 30 }}>Ninguém a bordo ainda</div>
              )}
            </div>
            {escolha && aqui && (
              <Botao cor="pequeno-marrom" x={x + colW / 2 - 110} y={620} w={220} h={50} tam={17} onClick={() => enviar({ type: 'claimCaptain' })}>
                {capitao === view.you ? 'Desistir de Capitão' : 'Quero ser Capitão'}
              </Botao>
            )}
            {aqui ? (
              <Botao cor="cinza" x={x + 20} y={672} w={colW - 40} h={88} tam={colW < 400 ? 25 : 30} disabled>
                Você está aqui
              </Botao>
            ) : (
              <Botao cor={COR_DO_NAVIO[id]} x={x + 20} y={672} w={colW - 40} h={88} tam={colW < 400 ? 25 : 30} onClick={() => enviar({ type: 'chooseShip', shipId: id })}>
                Entrar neste navio
              </Botao>
            )}
          </div>
        )
      })}

      {/* assistindo */}
      <Moldura x={40} y={830} w={1370} h={214} />
      <Texto x={84} y={878} titulo tam={26} cor="#5A3410">
        Assistindo
      </Texto>
      {souAlmirante && (
        <Botao cor="marrom" x={1150} y={866} w={226} h={56} tam={18} onClick={() => enviar({ type: 'shuffleShips' })}>
          Embaralhar navios
        </Botao>
      )}
      {me?.shipId && (
        <Botao cor="marrom" x={souAlmirante ? 930 : 1150} y={866} w={210} h={56} tam={18} onClick={() => enviar({ type: 'chooseShip', shipId: null })}>
          Ficar assistindo
        </Botao>
      )}
      <div style={{ position: 'absolute', left: 84, top: 918, width: 1290, height: 112, display: 'flex', gap: 22, overflowX: 'auto' }}>
        {assistindo.length === 0 && <div style={{ color: '#9A7A5A', fontWeight: 700, fontSize: 17, marginTop: 30 }}>Ninguém assistindo por enquanto.</div>}
        <AnimatePresence initial={false}>
        {assistindo.map((p) => (
          <motion.button
            key={p.id}
            layout
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            type="button"
            onClick={(e) => (p.id === view.you && !souAlmirante ? setPerfil(true) : abrirMenu(p, e))}
            style={{ position: 'relative', width: 84, height: 116, border: 0, background: 'none', cursor: souAlmirante || p.id === view.you ? 'pointer' : 'default', flexShrink: 0 }}
          >
            <Avatar avatar={p.avatar} ship={null} tam={76} x={4} y={0} cinza={!p.connected} />
            <span style={{ position: 'absolute', left: -10, right: -10, top: 80, fontWeight: 800, fontSize: 15, color: '#5A3410', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.name}
              {p.id === view.you ? ' (você)' : ''}
            </span>
          </motion.button>
        ))}
        </AnimatePresence>
      </div>

      {/* convite */}
      <Moldura x={1436} y={184} w={444} h={196} />
      <Texto x={1476} y={224} titulo tam={24} cor="#5A3410">
        Convide a tripulação
      </Texto>
      <div
        style={{
          position: 'absolute',
          left: 1474,
          top: 262,
          width: 254,
          height: 48,
          borderRadius: 10,
          background: '#FFF6DF',
          border: '3px solid #8A4A1C',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          fontWeight: 800,
          fontSize: 17,
          color: '#5A3410',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
        title={link}
      >
        {link}
      </div>
      <Botao cor="pequeno-verde" x={1740} y={258} w={110} h={56} tam={18} onClick={copiar}>
        Copiar
      </Botao>
      <Texto x={1476} y={322} w={380} tam={15} cor="#7A5A3A">
        Mande o link no grupo do Discord.
      </Texto>

      {/* configurações */}
      <Moldura x={1436} y={398} w={444} h={406} />
      <Texto x={1476} y={438} titulo tam={24} cor="#5A3410">
        Configurações
      </Texto>
      {souAlmirante ? (
        <Botao cor="pequeno-marrom" x={1740} y={430} w={110} h={48} tam={17} onClick={() => setConfig(true)}>
          Editar
        </Botao>
      ) : (
        <>
          <Imagem src="itens/brasao-almirante.webp" x={1690} y={436} w={30} h={28} />
          <Texto x={1724} y={442} tam={13} cor="#7A5A3A">
            só o Almirante muda
          </Texto>
        </>
      )}
      <ResumoConfig config={view.config} />

      {/* zarpar */}
      <Botao
        cor={!motivo && souAlmirante ? 'verde' : 'cinza'}
        className={!motivo && souAlmirante ? 'brilho' : undefined}
        x={1440}
        y={832}
        w={436}
        h={128}
        tam={44}
        disabled={!!motivo || !souAlmirante}
        onClick={() => enviar({ type: 'start' })}
      >
        Zarpar!
      </Botao>
      <Texto x={1420} y={978} w={476} centro tam={16} cor="#FFF8EC" className="contorno-fino">
        {motivo ?? (souAlmirante ? 'Todos os navios têm 2 ou mais jogadores' : `Esperando ${almirante?.name ?? 'o Almirante'} zarpar`)}
      </Texto>

      {/* menu do Almirante sobre um jogador */}
      {menu && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(menu.x, 1920 - 260),
            top: Math.min(menu.y, 1080 - 260),
            width: 250,
            background: '#FFF6DF',
            border: '3px solid #8A4A1C',
            borderRadius: 12,
            boxShadow: '0 10px 24px rgba(0,0,0,.45)',
            zIndex: 40,
            padding: 6,
            fontWeight: 800,
            fontSize: 17,
            color: '#5A3410',
          }}
        >
          <div style={{ padding: '6px 10px', fontSize: 14, color: '#9A7A5A' }}>{menu.player.name}</div>
          {menu.player.id === view.you && <ItemMenu onClick={() => (setMenu(null), setPerfil(true))}>Editar meu perfil</ItemMenu>}
          <ItemMenu onClick={() => setSubmenu(!submenu)}>Mover para… {submenu ? '▴' : '▾'}</ItemMenu>
          {submenu &&
            [...ships, null].map((s) => (
              <ItemMenu
                key={s ?? 'assistindo'}
                sub
                cor={s ? SHIP_INFO[s].cor : undefined}
                disabled={menu.player.shipId === s}
                onClick={() => {
                  enviar({ type: 'movePlayer', playerId: menu.player.id, shipId: s })
                  setMenu(null)
                }}
              >
                {s ? `Navio ${view.config.shipNames[s] || SHIP_INFO[s].nome}` : 'Assistindo'}
              </ItemMenu>
            ))}
          {escolha && menu.player.shipId && (
            <ItemMenu
              onClick={() => {
                enviar({ type: 'setCaptain', shipId: menu.player.shipId, playerId: menu.player.id })
                setMenu(null)
              }}
            >
              Tornar Capitão
            </ItemMenu>
          )}
          {menu.player.id !== view.you && (
            <>
              <ItemMenu onClick={() => (setConfirmar({ tipo: 'cargo', player: menu.player }), setMenu(null))}>Tornar Almirante</ItemMenu>
              <div style={{ height: 1, background: 'rgba(90,52,16,.2)', margin: '4px 6px' }} />
              <ItemMenu cor="#B3261E" onClick={() => (setConfirmar({ tipo: 'expulsar', player: menu.player }), setMenu(null))}>
                Expulsar
              </ItemMenu>
            </>
          )}
        </div>
      )}

      <Avisos extra={copiado} />

      {config && (
        <ModalConfiguracoes
          config={view.config}
          onFechar={() => setConfig(false)}
          onSalvar={async (patch) => {
            if (await enviar({ type: 'updateConfig', patch })) setConfig(false)
          }}
        />
      )}
      {ajuda && <ModalComoJogar onFechar={() => setAjuda(false)} />}
      {perfil && me && (
        <ModalPerfil
          inicial={{ name: me.name, avatar: me.avatar }}
          ship={me.shipId}
          onFechar={() => setPerfil(false)}
          onConfirmar={async (p) => {
            salvarPerfil(p)
            if (await enviar({ type: 'profile', ...p })) setPerfil(false)
          }}
        />
      )}
      {confirmar?.tipo === 'sair' && (
        <ModalConfirmar
          titulo="Sair da sala"
          texto={souAlmirante ? 'Você é o Almirante. Se sair, o cargo passa para o jogador há mais tempo na sala.' : 'Quer mesmo deixar a tripulação?'}
          confirmar="Sair"
          onFechar={() => setConfirmar(null)}
          onConfirmar={async () => {
            await enviar({ type: 'leave' })
            router.push('/')
          }}
        />
      )}
      {confirmar?.tipo === 'expulsar' && (
        <ModalConfirmar
          titulo="Expulsar jogador"
          texto={`Expulsar ${confirmar.player.name}? Ele não poderá voltar para esta sala com o mesmo navegador.`}
          confirmar="Expulsar"
          icone={<Escotilha avatar={confirmar.player.avatar} ship={confirmar.player.shipId} tam={76} />}
          onFechar={() => setConfirmar(null)}
          onConfirmar={() => {
            enviar({ type: 'kick', playerId: confirmar.player.id })
            setConfirmar(null)
          }}
        />
      )}
      {confirmar?.tipo === 'cargo' && (
        <ModalConfirmar
          titulo="Passar o cargo"
          texto={`${confirmar.player.name} vira o Almirante: configura, inicia e encerra as partidas. Você continua jogando normalmente.`}
          confirmar="Passar cargo"
          corConfirmar="verde"
          icone={<Imagem src="itens/brasao-almirante.webp" x={0} y={0} w={76} h={70} />}
          onFechar={() => setConfirmar(null)}
          onConfirmar={() => {
            enviar({ type: 'transferAdmin', playerId: confirmar.player.id })
            setConfirmar(null)
          }}
        />
      )}
    </Palco>
  )
}

function LinhaJogador({
  p,
  eu,
  almirante,
  capitao,
  clicavel,
  onClick,
}: {
  p: Player
  eu: boolean
  almirante: boolean
  capitao: boolean
  clicavel: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        height: 52,
        marginBottom: 8,
        borderRadius: 10,
        border: eu ? '2px solid #C98A3A' : '2px solid transparent',
        background: eu ? 'rgba(255,224,138,.55)' : 'rgba(201,150,90,.22)',
        cursor: clicavel || eu ? 'pointer' : 'default',
        textAlign: 'left',
      }}
    >
      <Avatar avatar={p.avatar} ship={p.shipId} tam={42} x={8} y={3} cinza={!p.connected} />
      <span style={{ position: 'absolute', left: 60, top: 12, fontWeight: 800, fontSize: 19, color: '#3A2414' }}>
        {p.name}
        {eu && <span style={{ fontSize: 13, color: '#9A6A3A' }}> (você)</span>}
        {!p.connected && <span style={{ fontSize: 13, color: '#9A7A5A' }}> · caiu</span>}
      </span>
      {almirante && (
        <img src="/img/itens/brasao-almirante.webp" alt="Almirante" title="Almirante" style={{ position: 'absolute', right: capitao ? 42 : 8, top: 9, width: 34, height: 32, objectFit: 'contain' }} />
      )}
      {capitao && (
        <img src="/img/itens/coroa.webp" alt="Capitão" title="Capitão escolhido" style={{ position: 'absolute', right: 8, top: 11, width: 32, height: 28, objectFit: 'contain' }} />
      )}
    </motion.button>
  )
}

function ItemMenu({
  children,
  onClick,
  cor,
  sub,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  cor?: string
  sub?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        border: 0,
        background: 'transparent',
        padding: sub ? '6px 10px 6px 28px' : '8px 10px',
        borderRadius: 8,
        color: cor ?? '#5A3410',
        fontWeight: 800,
        fontSize: sub ? 15 : 17,
        opacity: disabled ? 0.45 : 1,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,138,58,.2)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  )
}

/** Resumo das configurações no Salão: preset no topo e 8 cartões com ícone. */
function ResumoConfig({ config }: { config: CodenomesConfig }) {
  const anim = useSala((s) => s.prefs.animacoes)
  const g = gridFor(config)
  const preset = PRESETS.find((p) => p.id === config.preset)
  const tempo = (t: number | null) => (t === null ? '∞' : `${t} s`)
  const cartoes: { icone: string; rotulo: string; valor: string; apagado?: boolean }[] = [
    { icone: 'navios/navio-rubi.webp', rotulo: 'Navios', valor: `${config.shipCount} navios` },
    { icone: 'cartas/fechada.webp', rotulo: 'Tabuleiro', valor: `${g.cols}×${g.rows} · ${g.total} cartas` },
    { icone: 'cartas/rubi.webp', rotulo: 'Tesouros por navio', valor: g.first > g.treasures ? `${g.first} e ${g.treasures}` : `${g.treasures} cada` },
    { icone: 'cartas/kraken.webp', rotulo: 'Kraken', valor: `${g.kraken} Kraken` },
    {
      icone: 'itens/coroa.webp',
      rotulo: 'Capitão',
      valor: `${config.captainMode === 'escolha' ? 'Escolhido' : 'Sorteio'} · ${config.captainRotation === 'trocar' ? 'troca' : 'mantém'}`,
    },
    { icone: 'interface/icones/ampulheta.webp', rotulo: 'Capitão / Marujos', valor: `${tempo(config.captainTime)} / ${tempo(config.crewTime)}` },
    { icone: 'interface/icones/canhao.webp', rotulo: 'Tiro de Canhão', valor: config.cannon ? 'Ligado' : 'Desligado', apagado: !config.cannon },
    { icone: 'interface/icones/olho.webp', rotulo: 'Espectadores', valor: config.allowSpectators ? 'Permitidos' : 'Fechado', apagado: !config.allowSpectators },
  ]
  const X = 1462
  const Y = 476
  const W = 392
  const CW = (W - 8) / 2
  return (
    <>
      {/* preset */}
      <motion.div
        key={`preset-${config.preset}`}
        initial={anim ? { opacity: 0, y: 6 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          position: 'absolute',
          left: X,
          top: Y,
          width: W,
          height: 50,
          borderRadius: 12,
          background: 'linear-gradient(#9A5A2A, #6B3A17)',
          border: '2px solid #3A1D0C',
          boxShadow: 'inset 0 2px 0 rgba(255,255,255,.2), 0 2px 0 rgba(0,0,0,.3)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 14px',
        }}
      >
        <span className="lilita" style={{ fontSize: 19, lineHeight: 1.05, color: '#FFE08A' }}>
          {preset?.nome}
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#F3DDB0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {preset?.descricao}
        </span>
      </motion.div>
      {/* cartões */}
      {cartoes.map((c, i) => (
        <motion.div
          key={`${c.rotulo}-${c.valor}`}
          initial={anim ? { opacity: 0, scale: 0.94 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: anim ? i * 0.03 : 0 }}
          title={`${c.rotulo}: ${c.valor}`}
          style={{
            position: 'absolute',
            left: X + (i % 2) * (CW + 8),
            top: Y + 60 + Math.floor(i / 2) * 64,
            width: CW,
            height: 56,
            borderRadius: 12,
            background: 'rgba(255,248,230,.75)',
            border: '2px solid rgba(138,74,28,.3)',
            boxShadow: 'inset 0 1px 4px rgba(138,74,28,.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 8px',
            opacity: c.apagado ? 0.6 : 1,
            filter: c.apagado ? 'grayscale(.6)' : undefined,
          }}
        >
          <img src={`/img/${c.icone}`} alt="" style={{ width: 40, height: 40, objectFit: 'contain', flex: '0 0 auto' }} />
          <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#8A6A4A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.rotulo}</span>
            <span className="lilita" style={{ fontSize: 16, lineHeight: 1.1, color: '#5A3410', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.valor}
            </span>
          </span>
        </motion.div>
      ))}
    </>
  )
}

export type { ShipId }
