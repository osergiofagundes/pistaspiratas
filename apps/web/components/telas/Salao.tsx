'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { SHIP_IDS, SHIP_INFO, type Player, type ShipId } from '@arena/platform'
import { type CodenomesConfig, canStart, gridFor } from '@arena/codenomes'
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
import { BotaoIdioma, BotaoPreferencias, BotaoTexto, ICONE_CONFIRMAR, ModalComoJogar, ModalConfirmar, ModalPerfil } from '@/components/modais/comuns'
import { infoIdioma, traduzirMensagem, useT } from '@/lib/i18n'
import { nomeNavioConfig } from '@/lib/textos'
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
  const t = useT()
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
  const motivoPt = canStart(view.config, view.players)
  const motivo = motivoPt && traduzirMensagem(motivoPt, t)
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
    setCopiado({ texto: t.salao.linkCopiado, seq: Date.now() })
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
      <Imagem src="logos/logo-pistas-piratas.webp" x={28} y={14} w={204} h={134} />
      <Placa texto={t.salao.titulo} x={760} y={36} w={400} tam={28} />
      <Texto x={560} y={122} w={800} centro tam={20} cor="#FFF8EC" className="contorno-fino">
        {t.salao.info(view.code, almirante?.name ?? '—')}
      </Texto>
      <BotaoIdioma x={1338} y={38} />
      <Icone nome={mudo ? 'som-desligado' : 'som-ligado'} x={1416} y={38} onClick={() => setPrefs({ mudo: !mudo })} title={mudo ? t.comum.ligarSom : t.comum.silenciar} />
      <Icone nome="ajuda" x={1494} y={38} onClick={() => setAjuda(true)} title={t.comum.comoJogar} />
      <BotaoPreferencias x={1572} y={38} onEditarPerfil={me ? () => setPerfil(true) : undefined} />
      <BotaoTexto nome="sair-da-sala" cor="vermelho" texto={t.salao.sairDaSala} tam={24} x={1656} y={34} w={216} h={80} onClick={() => setConfirmar({ tipo: 'sair' })} />

      {/* navios */}
      {ships.map((id, i) => {
        const x = area.x + i * (colW + gap)
        const crew = view.players.filter((p) => p.shipId === id)
        const nome = nomeNavioConfig(view.config.shipNames, id, t)
        const aqui = me?.shipId === id
        const capitao = view.captainClaims[id]
        return (
          <div key={id}>
            <Moldura x={x} y={184} w={colW} h={620} />
            <Navio ship={id} className="navegar" style={{ animationDelay: `-${i * 0.8}s` }} x={x + colW / 2 - 66} y={198} w={132} h={128} />
            <Texto x={x} y={326} w={colW} centro titulo tam={32} cor={SHIP_INFO[id].cor}>
              {t.comum.navio(nome)}
            </Texto>
            <Texto x={x} y={366} w={colW} centro tam={17} cor="#7A5A3A">
              {t.salao.jogadores(crew.length)}
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
                <div style={{ textAlign: 'center', color: '#9A7A5A', fontWeight: 700, fontSize: 16, marginTop: 30 }}>{t.salao.ninguemABordo}</div>
              )}
            </div>
            {escolha && aqui && (
              <Botao cor="pequeno-marrom" x={x + colW / 2 - 110} y={620} w={220} h={50} tam={17} onClick={() => enviar({ type: 'claimCaptain' })}>
                {capitao === view.you ? t.salao.desistirCapitao : t.salao.queroCapitao}
              </Botao>
            )}
            {aqui ? (
              <Botao cor="cinza" x={x + 20} y={672} w={colW - 40} h={88} tam={colW < 400 ? 25 : 30} disabled>
                {t.salao.vocePaqui}
              </Botao>
            ) : (
              <Botao cor={COR_DO_NAVIO[id]} x={x + 20} y={672} w={colW - 40} h={88} tam={colW < 400 ? 25 : 30} onClick={() => enviar({ type: 'chooseShip', shipId: id })}>
                {t.salao.entrarNavio}
              </Botao>
            )}
          </div>
        )
      })}

      {/* assistindo */}
      <Moldura x={40} y={830} w={1370} h={214} />
      <Texto x={84} y={878} titulo tam={26} cor="#5A3410">
        {t.salao.assistindo}
      </Texto>
      {souAlmirante && (
        <Botao cor="marrom" x={1150} y={866} w={226} h={56} tam={18} onClick={() => enviar({ type: 'shuffleShips' })}>
          {t.salao.embaralhar}
        </Botao>
      )}
      {me?.shipId && (
        <Botao cor="marrom" x={souAlmirante ? 930 : 1150} y={866} w={210} h={56} tam={18} onClick={() => enviar({ type: 'chooseShip', shipId: null })}>
          {t.salao.ficarAssistindo}
        </Botao>
      )}
      <div style={{ position: 'absolute', left: 84, top: 918, width: 1290, height: 112, display: 'flex', gap: 22, overflowX: 'auto' }}>
        {assistindo.length === 0 && <div style={{ color: '#9A7A5A', fontWeight: 700, fontSize: 17, marginTop: 30 }}>{t.salao.ninguemAssistindo}</div>}
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
              {p.id === view.you ? ` ${t.comum.voce}` : ''}
            </span>
          </motion.button>
        ))}
        </AnimatePresence>
      </div>

      {/* convite */}
      <Moldura x={1436} y={184} w={444} h={196} />
      <Texto x={1476} y={224} titulo tam={24} cor="#5A3410">
        {t.salao.convide}
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
        {t.comum.copiar}
      </Botao>
      <Texto x={1476} y={322} w={380} tam={15} cor="#7A5A3A">
        {t.salao.mandeLink}
      </Texto>

      {/* configurações */}
      <Moldura x={1436} y={398} w={444} h={406} />
      <Texto x={1476} y={438} titulo tam={24} cor="#5A3410">
        {t.salao.configuracoes}
      </Texto>
      {souAlmirante ? (
        <Botao cor="pequeno-marrom" x={1740} y={430} w={110} h={48} tam={17} onClick={() => setConfig(true)}>
          {t.comum.editar}
        </Botao>
      ) : (
        <>
          <Imagem src="itens/brasao-almirante.webp" x={1690} y={436} w={30} h={28} />
          <Texto x={1724} y={442} tam={13} cor="#7A5A3A">
            {t.salao.soAlmiranteMuda}
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
        {t.salao.zarpar}
      </Botao>
      <Texto x={1420} y={978} w={476} centro tam={16} cor="#FFF8EC" className="contorno-fino">
        {motivo ?? (souAlmirante ? t.salao.prontoZarpar : t.salao.esperando(almirante?.name ?? t.salao.oAlmirante))}
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
          {menu.player.id === view.you && <ItemMenu onClick={() => (setMenu(null), setPerfil(true))}>{t.salao.editarMeuPerfil}</ItemMenu>}
          <ItemMenu onClick={() => setSubmenu(!submenu)}>{t.salao.moverPara} {submenu ? '▴' : '▾'}</ItemMenu>
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
                {s ? t.comum.navio(nomeNavioConfig(view.config.shipNames, s, t)) : t.salao.assistindo}
              </ItemMenu>
            ))}
          {escolha && menu.player.shipId && (
            <ItemMenu
              onClick={() => {
                enviar({ type: 'setCaptain', shipId: menu.player.shipId, playerId: menu.player.id })
                setMenu(null)
              }}
            >
              {t.salao.tornarCapitao}
            </ItemMenu>
          )}
          {menu.player.id !== view.you && (
            <>
              <ItemMenu onClick={() => (setConfirmar({ tipo: 'cargo', player: menu.player }), setMenu(null))}>{t.salao.tornarAlmirante}</ItemMenu>
              <div style={{ height: 1, background: 'rgba(90,52,16,.2)', margin: '4px 6px' }} />
              <ItemMenu cor="#B3261E" onClick={() => (setConfirmar({ tipo: 'expulsar', player: menu.player }), setMenu(null))}>
                {t.salao.expulsar}
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
          titulo={t.salao.sair.titulo}
          pergunta={t.salao.sair.pergunta}
          texto={souAlmirante ? t.salao.sair.textoAlmirante : t.salao.sair.texto}
          confirmar={t.comum.sair}
          onFechar={() => setConfirmar(null)}
          onConfirmar={async () => {
            await enviar({ type: 'leave' })
            router.push('/')
          }}
        />
      )}
      {confirmar?.tipo === 'expulsar' && (
        <ModalConfirmar
          titulo={t.salao.expulsarModal.titulo}
          pergunta={t.salao.expulsarModal.pergunta(confirmar.player.name)}
          texto={t.salao.expulsarModal.texto}
          confirmar={t.salao.expulsar}
          icone={<Escotilha avatar={confirmar.player.avatar} ship={confirmar.player.shipId} tam={ICONE_CONFIRMAR} />}
          onFechar={() => setConfirmar(null)}
          onConfirmar={() => {
            enviar({ type: 'kick', playerId: confirmar.player.id })
            setConfirmar(null)
          }}
        />
      )}
      {confirmar?.tipo === 'cargo' && (
        <ModalConfirmar
          titulo={t.salao.cargo.titulo}
          pergunta={t.salao.cargo.pergunta(confirmar.player.name)}
          texto={t.salao.cargo.texto}
          confirmar={t.salao.cargo.confirmar}
          corConfirmar="verde"
          icone={<Imagem src="itens/brasao-almirante.webp" x={0} y={0} w={ICONE_CONFIRMAR} h={ICONE_CONFIRMAR} />}
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
  const t = useT()
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
        {eu && <span style={{ fontSize: 13, color: '#9A6A3A' }}> {t.comum.voce}</span>}
        {!p.connected && <span style={{ fontSize: 13, color: '#9A7A5A' }}> {t.comum.caiu}</span>}
      </span>
      {almirante && (
        <img src="/img/itens/brasao-almirante.webp" alt={t.comum.almirante} title={t.comum.almirante} style={{ position: 'absolute', right: capitao ? 42 : 8, top: 9, width: 34, height: 32, objectFit: 'contain' }} />
      )}
      {capitao && (
        <img src="/img/itens/coroa.webp" alt={t.comum.capitao} title={t.salao.capitaoEscolhido} style={{ position: 'absolute', right: 8, top: 11, width: 32, height: 28, objectFit: 'contain' }} />
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
  const t = useT()
  const r = t.salao.resumo
  const g = gridFor(config)
  const preset = t.presets[config.preset]
  const tempo = (s: number | null) => (s === null ? '∞' : `${s} s`)
  const idioma = infoIdioma(config.wordLanguage ?? 'pt')
  const categorias = config.onlyCustom ? t.config.personalizadas : config.categories.map((c) => t.categorias[c]).join(' + ') || '—'
  const cartoes: { icone: string; rotulo: string; valor: string; apagado?: boolean }[] = [
    { icone: 'navios/navio-rubi.webp', rotulo: r.navios, valor: r.nNavios(config.shipCount) },
    { icone: 'cartas/fechada.webp', rotulo: r.tabuleiro, valor: r.cartas(g.cols, g.rows, g.total) },
    { icone: 'cartas/rubi.webp', rotulo: r.tesouros, valor: g.first > g.treasures ? r.tesourosEe(g.first, g.treasures) : r.tesourosCada(g.treasures) },
    { icone: 'cartas/kraken.webp', rotulo: r.kraken, valor: r.nKraken(g.kraken) },
    {
      icone: 'itens/coroa.webp',
      rotulo: r.capitao,
      valor: `${config.captainMode === 'escolha' ? r.escolhido : r.sorteio} · ${config.captainRotation === 'trocar' ? r.troca : r.mantem}`,
    },
    { icone: 'interface/icones/ampulheta.webp', rotulo: r.tempos, valor: `${tempo(config.captainTime)} / ${tempo(config.crewTime)}` },
    { icone: 'interface/icones/canhao.webp', rotulo: r.canhao, valor: config.cannon ? r.ligado : r.desligado, apagado: !config.cannon },
    { icone: idioma.bandeira, rotulo: `${r.palavras} · ${categorias}`, valor: idioma.nome.split(' ')[0] },
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
