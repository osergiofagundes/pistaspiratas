'use client'
import { useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { PERSONAGENS, validateName, type Personagem, type ShipId } from '@arena/platform'
import {
  Botao,
  BotaoImagem,
  Campo,
  DECO_ANCORA,
  Deslizante,
  Escotilha,
  FundoEscuro,
  IMG,
  Icone,
  IconeNovo,
  Interruptor,
  Modal,
  Texto,
  usePalco,
  type CorBotao,
  type Deco,
  type Pos,
} from '@/components/ui'
import { IDIOMAS, infoIdioma, traduzirMensagem, useIdioma, useT } from '@/lib/i18n'
import type { Perfil } from '@/lib/identidade'
import { useSala } from '@/lib/sala'
import { tocar } from '@/lib/sons'
import { alternarTelaCheia, emTelaCheia, podeTelaCheia } from '@/lib/telaCheia'

/** barris e baú de ouro apoiados nos cantos de baixo da moldura (proporções de deco-barris 500×482 e deco-bau 471×408) */
export const DECO_BARRIS = (h: number, alt = 118): Deco => ({ src: 'interface/decoracoes/deco-barris.webp', x: -54, y: h - alt + 14, w: Math.round((alt * 500) / 482), h: alt })
export const DECO_BAU = (w: number, h: number, alt = 96): Deco => {
  const larg = Math.round((alt * 471) / 408)
  return { src: 'interface/decoracoes/deco-bau.webp', x: w - larg + 50, y: h - alt + 14, w: larg, h: alt }
}
const DECO_CONFIRMAR = (w: number, h: number): Deco[] => [DECO_BARRIS(h), DECO_BAU(w, h)]

const EQUIPES: ShipId[] = ['rubi', 'safira', 'esmeralda', 'ouro']

/** Seu perfil: nome e avatar, com prévia grande e as cores das 4 equipes. */
export function ModalPerfil({
  inicial,
  ship,
  onConfirmar,
  onFechar,
  tituloCompacto,
}: {
  inicial: Perfil | null
  ship?: ShipId | null
  onConfirmar: (p: Perfil) => void
  onFechar?: () => void
  /** no compacto não sobra espaço acima do modal: o convite vira o título */
  tituloCompacto?: string
}) {
  const [nome, setNome] = useState(inicial?.name ?? '')
  const [avatar, setAvatar] = useState<Personagem>(inicial?.avatar ?? 'papagaio')
  const [cor, setCor] = useState<ShipId>(ship ?? 'rubi')
  const [erro, setErro] = useState<string | null>(null)
  const anim = useSala((s) => s.prefs.animacoes)
  const t = useT()
  const palco = usePalco()
  // compacto: prévia menor à esquerda e os 16 avatares em 8×2, com Confirmar sempre à vista
  const L = palco.compacto
    ? (() => {
        const w = Math.min(palco.W - 40, 1000)
        const rx = 286
        const COL = 8
        const CEL = (w - rx - 24) / COL
        return { w, h: 490, prev: { x: 26, y: 46, k: 0.74, h: 446 }, rx, tituloY: 44, campoY: 74, campoH: 54, campoW: w - rx - 30 - 76, erroY: 130, avTitY: 138, avY: 172, COL, CEL, cellH: 104, escAv: Math.min(70, CEL - 8), rotulo: 13, btn: { x: w - 236, y: 490 - 88, w: 200, h: 68 } }
      })()
    : { w: 1120, h: 680, prev: { x: 44, y: 70, k: 1, h: 500 }, rx: 398, tituloY: 66, campoY: 100, campoH: 64, campoW: 600, erroY: 170, avTitY: 196, avY: 234, COL: 6, CEL: 112, cellH: 150, escAv: 96, rotulo: 15, btn: { x: 1120 - 300, y: 680 - 130, w: 210, h: 84 } }
  const { w, h } = L
  const confirmar = () => {
    const e = validateName(nome)
    if (e) return setErro(traduzirMensagem(e, t))
    onConfirmar({ name: nome.trim().replace(/\s+/g, ' '), avatar })
  }
  const sortearNome = () => {
    const outros = t.nomesPiratas.filter((n) => n !== nome)
    setNome(outros[Math.floor(Math.random() * outros.length)])
    setErro(null)
  }
  const { COL, CEL } = L

  return (
    <Modal titulo={(palco.compacto && tituloCompacto) || t.perfil.titulo} w={w} h={h} onFechar={onFechar} decos={[DECO_ANCORA(w, h)]}>
      {/* prévia */}
      <div
        style={{
          position: 'absolute',
          left: L.prev.x,
          top: L.prev.y,
          width: 320,
          height: L.prev.h,
          transform: L.prev.k < 1 ? `scale(${L.prev.k})` : undefined,
          transformOrigin: '0 0',
          borderRadius: 18,
          background: 'rgba(255,248,230,.6)',
          border: '2px solid rgba(138,74,28,.35)',
          boxShadow: 'inset 0 2px 10px rgba(138,74,28,.15)',
        }}
      >
        <motion.div
          key={`${avatar}-${cor}`}
          initial={anim ? { scale: 0.7, rotate: -8, opacity: 0.4 } : false}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 15 }}
          style={{ position: 'absolute', left: 50, top: 24, width: 220, height: 220 }}
        >
          <Escotilha avatar={avatar} ship={cor} tam={220} x={0} y={0} />
        </motion.div>
        <Texto x={10} y={256} w={300} centro titulo tam={30} cor="#5A3410" className="truncate">
          {nome.trim() || t.perfil.seuNome}
        </Texto>
        <Texto x={10} y={296} w={300} centro tam={17} cor="#7A5A3A" peso={800}>
          {t.perfil.avatarNavio(t.personagens[avatar], t.navios[cor])}
        </Texto>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 334, height: 2, background: 'rgba(90,52,16,.15)' }} />
        <Texto x={10} y={348} w={300} centro titulo tam={18} cor="#7E3A12">
          {t.perfil.coresDoNavio}
        </Texto>
        <div style={{ position: 'absolute', left: 22, top: 380, width: 276, display: 'flex', justifyContent: 'space-between' }}>
          {EQUIPES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setCor(e)}
              aria-label={t.perfil.verComCor(t.navios[e])}
              aria-pressed={cor === e}
              className="avatar-opcao"
              style={{ position: 'relative', width: 64, height: 64, background: 'none', border: 0, padding: 0, opacity: cor === e ? 1 : 0.75 }}
            >
              <Escotilha avatar={avatar} ship={e} tam={64} x={0} y={0} selecionado={cor === e} />
            </button>
          ))}
        </div>
        <Texto x={20} y={454} w={280} centro tam={palco.compacto ? 18 : 14} cor="#7A5A3A" peso={700}>
          {t.perfil.corAcompanha}
        </Texto>
      </div>

      {/* nome */}
      <Texto x={L.rx + 6} y={L.tituloY} titulo tam={24} cor="#5A3410">
        {t.perfil.comoChamar}
      </Texto>
      <Campo
        x={L.rx}
        y={L.campoY}
        w={L.campoW}
        h={L.campoH}
        valor={nome}
        maxLength={16}
        autoFocus={!palco.compacto}
        placeholder={t.perfil.placeholder}
        erro={!!erro}
        onChange={(v) => {
          setNome(v)
          setErro(null)
        }}
        onEnter={confirmar}
      />
      <Botao cor="pequeno-marrom" x={L.rx + L.campoW + 10} y={L.campoY} w={L.campoH + 6} h={L.campoH} tam={28} onClick={sortearNome} title={t.perfil.sortear}>
        🎲
      </Botao>
      {erro && (
        <Texto x={L.rx + 6} y={L.erroY} tam={15} cor="#B3261E">
          {erro}
        </Texto>
      )}

      {/* avatares */}
      <Texto x={L.rx + 6} y={L.avTitY} titulo tam={24} cor="#5A3410">
        {t.perfil.escolhaAvatar}
      </Texto>
      {PERSONAGENS.map((p, i) => {
        const sel = avatar === p.id
        return (
          <motion.button
            key={p.id}
            type="button"
            onClick={() => setAvatar(p.id)}
            aria-label={t.personagens[p.id]}
            aria-pressed={sel}
            initial={anim ? { opacity: 0, y: 14 } : false}
            animate={{ opacity: 1, y: 0, scale: sel ? 1.06 : 1 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25, delay: anim ? 0.1 + i * 0.03 : 0 }}
            style={{
              position: 'absolute',
              left: L.rx + (i % COL) * CEL,
              top: L.avY + Math.floor(i / COL) * L.cellH,
              width: CEL - 8,
              height: L.cellH - 10,
              background: sel ? 'rgba(255,210,74,.22)' : 'none',
              borderRadius: 14,
              border: 0,
              padding: 0,
            }}
          >
            <Escotilha avatar={p.id} ship={cor} tam={L.escAv} x={(CEL - 8 - L.escAv) / 2} y={4} selecionado={sel} />
            <span
              style={{
                position: 'absolute',
                left: -4,
                right: -4,
                top: L.escAv + 8,
                fontWeight: 800,
                fontSize: L.rotulo,
                color: sel ? '#B5651D' : '#5A3410',
                whiteSpace: 'nowrap',
              }}
            >
              {t.personagens[p.id]}
            </span>
          </motion.button>
        )
      })}

      <BotaoTexto nome="confirmar" cor="verde" texto={t.comum.confirmar} x={L.btn.x} y={L.btn.y} w={L.btn.w} h={L.btn.h} onClick={confirmar} />
    </Modal>
  )
}

/** tamanho do ícone do ModalConfirmar (quem passa `icone` desenha nesse quadrado, em x=0 y=0) */
export const ICONE_CONFIRMAR = 88

/**
 * Confirmação: ícone no alto, pergunta em destaque, explicação e os dois botões.
 * Sem `icone`, mostra a porta de saída.
 */
export function ModalConfirmar({
  titulo,
  pergunta,
  texto,
  confirmar,
  corConfirmar = 'vermelho',
  onConfirmar,
  onFechar,
  icone,
}: {
  titulo: string
  pergunta?: string
  texto: ReactNode
  confirmar: string
  corConfirmar?: CorBotao
  onConfirmar: () => void
  onFechar: () => void
  icone?: ReactNode
}) {
  const t = useT()
  const w = 680
  const h = 410
  const I = ICONE_CONFIRMAR
  return (
    <Modal titulo={titulo} w={w} h={h} onFechar={onFechar} decos={DECO_CONFIRMAR(w, h)}>
      <div style={{ position: 'absolute', left: w / 2 - I / 2, top: 44, width: I, height: I }}>
        {icone ?? <IconeNovo nome="sair" x={0} y={0} w={I} h={I} />}
      </div>
      {pergunta && (
        <Texto x={50} y={146} w={w - 100} centro titulo tam={30} cor="#5A3410">
          {pergunta}
        </Texto>
      )}
      <Texto x={70} y={pergunta ? 190 : 150} w={w - 140} centro tam={19} cor="#7A5A3A" peso={700}>
        {texto}
      </Texto>
      <Botao cor="marrom" x={w / 2 - 245} y={h - 122} w={225} h={74} onClick={onFechar}>
        {t.comum.cancelar}
      </Botao>
      <Botao cor={corConfirmar} x={w / 2 + 20} y={h - 122} w={225} h={74} onClick={onConfirmar}>
        {confirmar}
      </Botao>
    </Modal>
  )
}

export function ModalInfo({
  titulo,
  texto,
  botao,
  onFechar,
  icone,
  h = 360,
  extra,
}: {
  titulo: string
  texto: ReactNode
  botao?: string
  onFechar: () => void
  icone?: ReactNode
  h?: number
  extra?: ReactNode
}) {
  const t = useT()
  const w = 700
  return (
    <Modal titulo={titulo} w={w} h={h} onFechar={onFechar} decos={[DECO_ANCORA(w, h)]}>
      {icone && <div style={{ position: 'absolute', left: w / 2 - 36, top: 50 }}>{icone}</div>}
      <Texto x={60} y={icone ? 134 : 74} w={w - 120} centro tam={20} cor="#5A3410" peso={700}>
        {texto}
      </Texto>
      {extra}
      <Botao cor="verde" x={w / 2 - 110} y={h - 112} w={220} h={74} onClick={onFechar}>
        {botao ?? t.comum.ok}
      </Botao>
    </Modal>
  )
}

/** o manual fica em ComoJogar.tsx; reexportado aqui para as telas */
import { ModalComoJogar } from './ComoJogar'
export { ModalComoJogar }

/**
 * Botão com texto desenhado na arte (Criar Sala, Entrar na Sala, Confirmar, Sair da Sala).
 * A arte é em português; nos outros idiomas vira um Botao de cor parecida com o texto traduzido.
 */
export function BotaoTexto({
  nome,
  cor,
  texto,
  tam,
  title,
  onClick,
  disabled,
  ...p
}: Pos & { nome: string; cor: CorBotao; texto: string; tam?: number; title?: string; onClick?: () => void; disabled?: boolean }) {
  const idioma = useIdioma()
  if (idioma === 'pt') return <BotaoImagem nome={nome} onClick={onClick} disabled={disabled} title={title ?? texto} {...p} />
  return (
    <Botao cor={cor} tam={tam} title={title} onClick={onClick} disabled={disabled} {...p}>
      {texto}
    </Botao>
  )
}

/** Bandeira do idioma atual; abre a escolha entre as 6 placas. Fica na barra de cima das telas. */
export function BotaoIdioma({ x, y, tam = 64 }: { x: number; y: number; tam?: number }) {
  const [aberto, setAberto] = useState(false)
  const t = useT()
  const idioma = useIdioma()
  const alt = Math.round(tam * 0.78)
  return (
    <>
      <button
        type="button"
        onClick={() => {
          tocar('clique')
          setAberto(true)
        }}
        title={t.idioma.botao}
        aria-label={t.idioma.botao}
        className="botao-idioma"
        style={{ position: 'absolute', left: x, top: y + (tam - alt) / 2, width: tam, height: alt }}
      >
        <img src={`${IMG}/${infoIdioma(idioma).bandeira}`} alt="" draggable={false} />
      </button>
      {aberto && <ModalIdioma onFechar={() => setAberto(false)} />}
    </>
  )
}

/** As 6 placas de idioma (lote 6); a escolhida ganha o anel dourado e o visto. */
export function ModalIdioma({ onFechar }: { onFechar: () => void }) {
  const t = useT()
  const idioma = useIdioma()
  const setPrefs = useSala((s) => s.setPrefs)
  const anim = useSala((s) => s.prefs.animacoes)
  const compacto = usePalco().compacto
  const w = compacto ? 800 : 1080
  const h = compacto ? 488 : 750
  const PW = compacto ? 200 : 300
  const PH = compacto ? 144 : 230
  const GX = compacto ? 24 : 30
  const Y0 = compacto ? 98 : 132
  const x0 = (w - 3 * PW - 2 * GX) / 2
  return (
    <Modal titulo={t.idioma.titulo} w={w} h={h} onFechar={onFechar} decos={[DECO_ANCORA(w, h)]}>
      <Texto x={70} y={compacto ? 46 : 76} w={w - 140} centro tam={compacto ? 15 : 18} cor="#7A5A3A" peso={700}>
        {t.idioma.texto}
      </Texto>
      {IDIOMAS.map((l, i) => {
        const sel = l.id === idioma
        return (
          <motion.button
            key={l.id}
            type="button"
            lang={l.lang}
            aria-pressed={sel}
            aria-label={l.nome}
            onClick={() => {
              tocar('clique')
              setPrefs({ idioma: l.id })
            }}
            initial={anim ? { opacity: 0, y: 16 } : false}
            animate={{ opacity: 1, y: 0, scale: sel ? 1.04 : 1 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.22, delay: anim ? 0.08 + i * 0.04 : 0 }}
            className={`placa-idioma${sel ? ' ativa' : ''}`}
            style={{ position: 'absolute', left: x0 + (i % 3) * (PW + GX), top: Y0 + Math.floor(i / 3) * (PH + (compacto ? 12 : 22)), width: PW, height: PH }}
          >
            <img src={`${IMG}/${l.placa}`} alt="" draggable={false} />
            {sel && <span className="selo-visto" aria-hidden>✔</span>}
          </motion.button>
        )
      })}
      <Botao cor="verde" x={w / 2 - 110} y={h - (compacto ? 82 : 112)} w={220} h={compacto ? 62 : 74} onClick={onFechar}>
        {t.comum.pronto}
      </Botao>
    </Modal>
  )
}

/** Engrenagem que abre as Preferências; fica na barra de cima de todas as telas. */
export function BotaoPreferencias({ x, y, onEditarPerfil }: { x: number; y: number; onEditarPerfil?: () => void }) {
  const [aberto, setAberto] = useState(false)
  const t = useT()
  return (
    <>
      <IconeNovo nome="engrenagem" x={x} y={y} w={66} h={66} onClick={() => setAberto(true)} title={t.comum.preferencias} />
      {aberto && (
        <ModalPreferencias
          onFechar={() => setAberto(false)}
          onEditarPerfil={
            onEditarPerfil &&
            (() => {
              setAberto(false)
              onEditarPerfil()
            })
          }
        />
      )}
    </>
  )
}

export function ModalPreferencias({ onFechar, onEditarPerfil }: { onFechar: () => void; onEditarPerfil?: () => void }) {
  const prefs = useSala((s) => s.prefs)
  const setPrefs = useSala((s) => s.setPrefs)
  const t = useT()
  const [idiomas, setIdiomas] = useState(false)
  // compacto: as mesmas linhas, mais juntas, para caber sem rolar
  const c = usePalco().compacto
  const w = 700
  const h = c ? 490 : 640
  const Y = c ? { vol: 50, volG: 68, div: 190, ch: 200, chG: 60, idi: 322 } : { vol: 74, volG: 82, div: 240, ch: 258, chG: 76, idi: 410 }
  const volumes: { k: 'musica' | 'efeitos'; t: string; d: string; amostra?: () => void }[] = [
    { k: 'musica', t: t.prefs.musica, d: t.prefs.musicaD },
    { k: 'efeitos', t: t.prefs.efeitos, d: t.prefs.efeitosD, amostra: () => tocar('moedas') },
  ]
  const chaves: { k: 'mudo' | 'animacoes'; t: string; d: string }[] = [
    { k: 'mudo', t: t.prefs.mudo, d: t.prefs.mudoD },
    { k: 'animacoes', t: t.prefs.animacoes, d: t.prefs.animacoesD },
  ]
  const atual = infoIdioma(prefs.idioma)
  return (
    <>
    {/* com o Idioma aberto por cima, o Esc só fecha o Idioma */}
    <Modal titulo={t.comum.preferencias} w={w} h={h} onFechar={idiomas ? undefined : onFechar} decos={[DECO_ANCORA(w, h)]}>
      {volumes.map((l, i) => (
        <div key={l.k} style={{ position: 'absolute', left: 60, top: Y.vol + i * Y.volG, width: w - 120, height: 70 }}>
          <Texto x={0} y={4} titulo tam={22} cor="#5A3410">
            {l.t}
          </Texto>
          <Texto x={0} y={34} w={300} tam={15} cor="#7A5A3A" peso={600}>
            {l.d}
          </Texto>
          <Deslizante
            x={w - 120 - 330}
            y={12}
            w={260}
            rotulo={t.prefs.volume(l.t)}
            valor={prefs[l.k]}
            disabled={prefs.mudo}
            onChange={(v) => setPrefs({ [l.k]: v })}
            onSoltar={l.amostra}
          />
          <Texto x={w - 120 - 58} y={14} w={58} tam={18} cor="#5A3410" peso={800} className="text-right">
            {Math.round(prefs[l.k] * 100)}%
          </Texto>
        </div>
      ))}
      <div style={{ position: 'absolute', left: 60, top: Y.div, width: w - 120, height: 2, background: 'rgba(90,52,16,.18)' }} />
      {chaves.map((l, i) => (
        <div key={l.k} style={{ position: 'absolute', left: 60, top: Y.ch + i * Y.chG, width: w - 120, height: 66 }}>
          <Texto x={0} y={4} titulo tam={22} cor="#5A3410">
            {l.t}
          </Texto>
          <Texto x={0} y={34} tam={15} cor="#7A5A3A" peso={600}>
            {l.d}
          </Texto>
          <Interruptor x={w - 120 - 74} y={10} ligado={prefs[l.k]} onChange={(v) => setPrefs({ [l.k]: v })} />
        </div>
      ))}
      {/* idioma: a bandeira atual abre as 6 placas */}
      <div style={{ position: 'absolute', left: 60, top: Y.idi, width: w - 120, height: 66 }}>
        <Texto x={0} y={4} titulo tam={22} cor="#5A3410">
          {t.idioma.titulo}
        </Texto>
        <Texto x={0} y={34} tam={15} cor="#7A5A3A" peso={600}>
          {t.idioma.descricao}
        </Texto>
        <button
          type="button"
          onClick={() => {
            tocar('clique')
            setIdiomas(true)
          }}
          className="pilula-idioma"
          style={{ position: 'absolute', right: 0, top: 6, height: 50 }}
        >
          <img src={`${IMG}/${atual.bandeira}`} alt="" draggable={false} />
          <span lang={atual.lang}>{atual.nome}</span>
        </button>
      </div>
      {onEditarPerfil && (
        <Botao cor="marrom" x={60} y={h - (c ? 88 : 116)} w={230} h={c ? 66 : 74} onClick={onEditarPerfil}>
          {t.prefs.editarPerfil}
        </Botao>
      )}
      <Botao cor="verde" x={w - 60 - 200} y={h - (c ? 88 : 116)} w={200} h={c ? 66 : 74} onClick={onFechar}>
        {t.comum.pronto}
      </Botao>
    </Modal>
    {/* fora da moldura das Preferências: assim o Idioma se posiciona pelo palco, como quando abre pela bandeira */}
    {idiomas && <ModalIdioma onFechar={() => setIdiomas(false)} />}
    </>
  )
}

// ---------------------------------------------------------------- formato compacto

export type ItemMenu = { icone?: string; rotulo: string; descricao?: string; cor?: string; onClick: () => void }

/**
 * Formato compacto: um botão só no topo (engrenagem) abre a folha com Idioma, Preferências,
 * Como jogar, Tela cheia e os itens da tela (Sair, Pausar…).
 */
export function BotaoMenu({
  x,
  y,
  tam = 60,
  itens = [],
  onEditarPerfil,
  semAjuda,
}: {
  x: number
  y: number
  tam?: number
  itens?: ItemMenu[]
  onEditarPerfil?: () => void
  semAjuda?: boolean
}) {
  const [aberto, setAberto] = useState(false)
  const [modal, setModal] = useState<null | 'idioma' | 'prefs' | 'ajuda'>(null)
  const [cheia, setCheia] = useState(false)
  const t = useT()
  const idioma = useIdioma()
  const palco = usePalco()
  const abrir = (m: typeof modal) => () => {
    setAberto(false)
    setModal(m)
  }
  const todos: ItemMenu[] = [
    { icone: infoIdioma(idioma).bandeira, rotulo: t.idioma.titulo, descricao: infoIdioma(idioma).nome, onClick: abrir('idioma') },
    { icone: 'interface/icones/engrenagem.webp', rotulo: t.comum.preferencias, onClick: abrir('prefs') },
    ...(semAjuda ? [] : [{ icone: 'interface/icones/ajuda.webp', rotulo: t.comum.comoJogar, onClick: abrir('ajuda') }]),
    ...(podeTelaCheia()
      ? [
          {
            icone: 'interface/icones/mapa.webp',
            rotulo: cheia ? t.compacto.sairTelaCheia : t.compacto.telaCheia,
            onClick: () => {
              setAberto(false)
              void alternarTelaCheia()
            },
          },
        ]
      : []),
    ...itens.map((i) => ({ ...i, onClick: () => (setAberto(false), i.onClick()) })),
  ]
  const larg = 360
  return (
    <>
      <IconeNovo
        nome="engrenagem"
        x={x}
        y={y}
        w={tam}
        h={tam}
        onClick={() => {
          setCheia(emTelaCheia())
          setAberto(!aberto)
        }}
        title={t.compacto.menu}
      />
      {aberto && (
        <>
          <FundoEscuro opacidade={0.25} z={60} onClick={() => setAberto(false)} />
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              left: Math.min(palco.W - larg - 10, Math.max(10, x + tam - larg)),
              top: y + tam + 6,
              width: larg,
              maxHeight: palco.H - y - tam - 16,
              overflowY: 'auto',
              zIndex: 61,
              background: '#FFF6DF',
              border: '3px solid #8A4A1C',
              borderRadius: 14,
              boxShadow: '0 12px 28px rgba(0,0,0,.5)',
              padding: 8,
            }}
          >
            {todos.map((o, i) => (
              <button
                key={o.rotulo}
                type="button"
                role="menuitem"
                onClick={() => {
                  tocar('clique')
                  o.onClick()
                }}
                className="item-menu"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  width: '100%',
                  minHeight: 62,
                  padding: '6px 10px',
                  border: 0,
                  borderTop: i ? '1px solid rgba(90,52,16,.15)' : 0,
                  background: 'transparent',
                  textAlign: 'left',
                  borderRadius: 8,
                }}
              >
                {o.icone ? (
                  <img
                    src={`${IMG}/${o.icone}`}
                    alt=""
                    draggable={false}
                    style={{ width: 48, height: o.icone.startsWith('idiomas') ? 32 : 48, objectFit: o.icone.startsWith('idiomas') ? 'cover' : 'contain', borderRadius: o.icone.startsWith('idiomas') ? 6 : 0, margin: o.icone.startsWith('idiomas') ? '8px 0' : 0, flex: 'none' }}
                  />
                ) : (
                  <span style={{ width: 48, flex: 'none' }} />
                )}
                <span style={{ minWidth: 0 }}>
                  <span className="lilita" style={{ display: 'block', fontSize: 22, lineHeight: 1.1, color: o.cor ?? '#5A3410' }}>
                    {o.rotulo}
                  </span>
                  {o.descricao && <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#8A6A4A' }}>{o.descricao}</span>}
                </span>
              </button>
            ))}
          </motion.div>
        </>
      )}
      {modal === 'idioma' && <ModalIdioma onFechar={() => setModal(null)} />}
      {modal === 'prefs' && (
        <ModalPreferencias
          onFechar={() => setModal(null)}
          onEditarPerfil={
            onEditarPerfil &&
            (() => {
              setModal(null)
              onEditarPerfil()
            })
          }
        />
      )}
      {modal === 'ajuda' && <ModalComoJogar onFechar={() => setModal(null)} />}
    </>
  )
}

/** Som ligado/desligado (usado nas barras compactas). */
export function BotaoSom({ x, y, tam = 60 }: { x: number; y: number; tam?: number }) {
  const mudo = useSala((s) => s.prefs.mudo)
  const setPrefs = useSala((s) => s.setPrefs)
  const t = useT()
  return <Icone nome={mudo ? 'som-desligado' : 'som-ligado'} x={x} y={y} w={tam} h={Math.round(tam * 1.03)} onClick={() => setPrefs({ mudo: !mudo })} title={mudo ? t.comum.ligarSom : t.comum.silenciar} />
}
