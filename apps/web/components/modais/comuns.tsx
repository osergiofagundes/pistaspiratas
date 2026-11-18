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
  IconeNovo,
  Interruptor,
  Modal,
  Texto,
  type CorBotao,
  type Deco,
} from '@/components/ui'
import type { Perfil } from '@/lib/identidade'
import { useSala } from '@/lib/sala'
import { tocar } from '@/lib/sons'

const DECO_CONFIRMAR = (w: number, h: number): Deco[] => [
  { src: 'interface/decoracoes/deco-barril-moedas.webp', x: -40, y: h - 140, w: 76, h: 136 },
  { src: 'interface/decoracoes/deco-moedas.webp', x: w - 44, y: h - 60, w: 53, h: 59 },
]

/** nomes piratas para o botão de sortear (todos passam em validateName) */
const NOMES_PIRATAS = [
  'Barba Ruiva', 'Olho de Vidro', 'Perna de Pau', 'Gancho', 'Maré Alta', 'Vento Sul', 'Coral', 'Âncora',
  'Bússola', 'Tempestade', 'Sardinha', 'Lula Gigante', 'Corsária', 'Bucaneiro', 'Cara de Sal', 'Dente de Ouro',
  'Mão de Ferro', 'Gaivota Brava', 'Capitã Névoa', 'Marujo Feliz', 'Rato do Porão', 'Onda Brava', 'Estrela do Mar', 'Pirata Sorte',
]

const EQUIPES: ShipId[] = ['rubi', 'safira', 'esmeralda', 'ouro']
const NOME_EQUIPE: Record<ShipId, string> = { rubi: 'Rubi', safira: 'Safira', esmeralda: 'Esmeralda', ouro: 'Ouro' }

/** Seu perfil: nome e avatar, com prévia grande e as cores das 4 equipes. */
export function ModalPerfil({
  inicial,
  ship,
  onConfirmar,
  onFechar,
}: {
  inicial: Perfil | null
  ship?: ShipId | null
  onConfirmar: (p: Perfil) => void
  onFechar?: () => void
}) {
  const [nome, setNome] = useState(inicial?.name ?? '')
  const [avatar, setAvatar] = useState<Personagem>(inicial?.avatar ?? 'papagaio')
  const [cor, setCor] = useState<ShipId>(ship ?? 'rubi')
  const [erro, setErro] = useState<string | null>(null)
  const anim = useSala((s) => s.prefs.animacoes)
  const w = 1120
  const h = 680
  const confirmar = () => {
    const e = validateName(nome)
    if (e) return setErro(e)
    onConfirmar({ name: nome.trim().replace(/\s+/g, ' '), avatar })
  }
  const sortearNome = () => {
    const outros = NOMES_PIRATAS.filter((n) => n !== nome)
    setNome(outros[Math.floor(Math.random() * outros.length)])
    setErro(null)
  }
  const info = PERSONAGENS.find((p) => p.id === avatar)
  const COL = 6
  const CEL = 112

  return (
    <Modal titulo="Seu perfil" w={w} h={h} onFechar={onFechar} decos={[DECO_ANCORA(w, h)]}>
      {/* prévia */}
      <div
        style={{
          position: 'absolute',
          left: 44,
          top: 70,
          width: 320,
          height: 500,
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
          {nome.trim() || 'Seu nome'}
        </Texto>
        <Texto x={10} y={296} w={300} centro tam={17} cor="#7A5A3A" peso={800}>
          {info?.nome} · Navio {NOME_EQUIPE[cor]}
        </Texto>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 334, height: 2, background: 'rgba(90,52,16,.15)' }} />
        <Texto x={10} y={348} w={300} centro titulo tam={18} cor="#7E3A12">
          Cores do navio
        </Texto>
        <div style={{ position: 'absolute', left: 22, top: 380, width: 276, display: 'flex', justifyContent: 'space-between' }}>
          {EQUIPES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setCor(e)}
              aria-label={`Ver com a cor do Navio ${NOME_EQUIPE[e]}`}
              aria-pressed={cor === e}
              className="avatar-opcao"
              style={{ position: 'relative', width: 64, height: 64, background: 'none', border: 0, padding: 0, opacity: cor === e ? 1 : 0.75 }}
            >
              <Escotilha avatar={avatar} ship={e} tam={64} x={0} y={0} selecionado={cor === e} />
            </button>
          ))}
        </div>
        <Texto x={20} y={454} w={280} centro tam={14} cor="#7A5A3A" peso={700}>
          A cor acompanha o navio que você escolher no salão.
        </Texto>
      </div>

      {/* nome */}
      <Texto x={404} y={66} titulo tam={24} cor="#5A3410">
        Como vão te chamar?
      </Texto>
      <Campo
        x={398}
        y={100}
        w={600}
        h={64}
        valor={nome}
        maxLength={16}
        autoFocus
        placeholder="Seu nome (2 a 16 letras)"
        erro={!!erro}
        onChange={(v) => {
          setNome(v)
          setErro(null)
        }}
        onEnter={confirmar}
      />
      <Botao cor="pequeno-marrom" x={1008} y={100} w={70} h={64} tam={28} onClick={sortearNome} title="Sortear um nome pirata">
        🎲
      </Botao>
      {erro && (
        <Texto x={404} y={170} tam={15} cor="#B3261E">
          {erro}
        </Texto>
      )}

      {/* avatares */}
      <Texto x={404} y={196} titulo tam={24} cor="#5A3410">
        Escolha seu avatar
      </Texto>
      {PERSONAGENS.map((p, i) => {
        const sel = avatar === p.id
        return (
          <motion.button
            key={p.id}
            type="button"
            onClick={() => setAvatar(p.id)}
            aria-label={p.nome}
            aria-pressed={sel}
            initial={anim ? { opacity: 0, y: 14 } : false}
            animate={{ opacity: 1, y: 0, scale: sel ? 1.06 : 1 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25, delay: anim ? 0.1 + i * 0.03 : 0 }}
            style={{
              position: 'absolute',
              left: 398 + (i % COL) * CEL,
              top: 234 + Math.floor(i / COL) * 150,
              width: 104,
              height: 140,
              background: sel ? 'rgba(255,210,74,.22)' : 'none',
              borderRadius: 14,
              border: 0,
              padding: 0,
            }}
          >
            <Escotilha avatar={p.id} ship={cor} tam={96} x={4} y={4} selecionado={sel} />
            <span
              style={{
                position: 'absolute',
                left: -4,
                right: -4,
                top: 106,
                fontWeight: 800,
                fontSize: 15,
                color: sel ? '#B5651D' : '#5A3410',
                whiteSpace: 'nowrap',
              }}
            >
              {p.nome}
            </span>
          </motion.button>
        )
      })}

      <BotaoImagem nome="confirmar" x={w - 300} y={h - 130} w={210} h={84} onClick={confirmar} title="Confirmar" />
    </Modal>
  )
}

export function ModalConfirmar({
  titulo,
  texto,
  confirmar,
  corConfirmar = 'vermelho',
  onConfirmar,
  onFechar,
  icone,
}: {
  titulo: string
  texto: ReactNode
  confirmar: string
  corConfirmar?: CorBotao
  onConfirmar: () => void
  onFechar: () => void
  icone?: ReactNode
}) {
  const w = 700
  const h = 380
  return (
    <Modal titulo={titulo} w={w} h={h} onFechar={onFechar} decos={DECO_CONFIRMAR(w, h)}>
      {icone && <div style={{ position: 'absolute', left: w / 2 - 32, top: 54 }}>{icone}</div>}
      <Texto x={60} y={icone ? 130 : 80} w={w - 120} h={140} centro tam={20} cor="#5A3410" peso={700}>
        {texto}
      </Texto>
      <Botao cor="marrom" x={w / 2 - 250} y={h - 120} w={230} h={74} onClick={onFechar}>
        Cancelar
      </Botao>
      <Botao cor={corConfirmar} x={w / 2 + 20} y={h - 120} w={230} h={74} onClick={onConfirmar}>
        {confirmar}
      </Botao>
    </Modal>
  )
}

export function ModalInfo({
  titulo,
  texto,
  botao = 'Ok',
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
  const w = 700
  return (
    <Modal titulo={titulo} w={w} h={h} onFechar={onFechar} decos={[DECO_ANCORA(w, h)]}>
      {icone && <div style={{ position: 'absolute', left: w / 2 - 36, top: 50 }}>{icone}</div>}
      <Texto x={60} y={icone ? 134 : 74} w={w - 120} centro tam={20} cor="#5A3410" peso={700}>
        {texto}
      </Texto>
      {extra}
      <Botao cor="verde" x={w / 2 - 110} y={h - 112} w={220} h={74} onClick={onFechar}>
        {botao}
      </Botao>
    </Modal>
  )
}

const PASSOS: { icone: 'mapa' | 'olho' | 'canhao' | 'cadeado'; titulo: string; texto: string }[] = [
  {
    icone: 'mapa',
    titulo: '1. A Ordem do Capitão',
    texto: 'Só o Capitão vê o mapa. Ele dá uma palavra e um número: "PIRATA · 3" quer dizer 3 tesouros ligados a pirata.',
  },
  {
    icone: 'olho',
    titulo: '2. Os Marujos votam',
    texto: 'Toquem numa palavra para votar. Com a maioria do navio, ela é revelada em 3 segundos. Dá para encerrar a vez depois do 1º palpite.',
  },
  {
    icone: 'canhao',
    titulo: '3. Tiro de Canhão',
    texto: 'Acertou todas as palavras da ordem? Ganha um palpite livre em qualquer carta. Depois do tiro, a vez acaba.',
  },
  {
    icone: 'cadeado',
    titulo: '4. Cuidado com o Kraken',
    texto: 'Mar Aberto ou tesouro de outro navio encerram a vez. O Kraken afunda o navio! Vence quem achar todos os seus tesouros primeiro.',
  },
]

export function ModalComoJogar({ onFechar }: { onFechar: () => void }) {
  const w = 1040
  const h = 660
  return (
    <Modal titulo="Como jogar" w={w} h={h} onFechar={onFechar} decos={[DECO_ANCORA(w, h)]}>
      <Texto x={60} y={78} w={w - 120} centro tam={20} cor="#5A3410" peso={700}>
        Cada equipe é a tripulação de um navio. Achem os seus tesouros no mapa antes dos outros navios!
      </Texto>
      {PASSOS.map((p, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        return (
          <div key={p.titulo} style={{ position: 'absolute', left: 60 + col * 470, top: 140 + row * 190, width: 450, height: 170 }}>
            <IconeNovo nome={p.icone} x={0} y={4} w={72} h={72} />
            <Texto x={86} y={4} w={360} titulo tam={23} cor="#7E3A12">
              {p.titulo}
            </Texto>
            <Texto x={86} y={38} w={360} tam={16} cor="#5A3410" peso={600}>
              {p.texto}
            </Texto>
          </div>
        )
      })}
      <Botao cor="verde" x={w / 2 - 120} y={h - 116} w={240} h={78} onClick={onFechar}>
        Entendi!
      </Botao>
    </Modal>
  )
}

/** Engrenagem que abre as Preferências; fica na barra de cima de todas as telas. */
export function BotaoPreferencias({ x, y, onEditarPerfil }: { x: number; y: number; onEditarPerfil?: () => void }) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <IconeNovo nome="engrenagem" x={x} y={y} w={66} h={66} onClick={() => setAberto(true)} title="Preferências" />
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
  const w = 700
  const h = 564
  const volumes: { k: 'musica' | 'efeitos'; t: string; d: string; amostra?: () => void }[] = [
    { k: 'musica', t: 'Música', d: 'Trilha do porto e do alto-mar' },
    { k: 'efeitos', t: 'Efeitos sonoros', d: 'Moedas, ondas, Kraken e cliques', amostra: () => tocar('moedas') },
  ]
  const chaves: { k: 'mudo' | 'animacoes'; t: string; d: string }[] = [
    { k: 'mudo', t: 'Silenciar tudo', d: 'O mesmo do ícone de som no canto da tela' },
    { k: 'animacoes', t: 'Animações', d: 'Logo balançando, navios, cartas virando' },
  ]
  return (
    <Modal titulo="Preferências" w={w} h={h} onFechar={onFechar} decos={[DECO_ANCORA(w, h)]}>
      {volumes.map((l, i) => (
        <div key={l.k} style={{ position: 'absolute', left: 60, top: 74 + i * 82, width: w - 120, height: 70 }}>
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
            rotulo={`Volume: ${l.t}`}
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
      <div style={{ position: 'absolute', left: 60, top: 240, width: w - 120, height: 2, background: 'rgba(90,52,16,.18)' }} />
      {chaves.map((l, i) => (
        <div key={l.k} style={{ position: 'absolute', left: 60, top: 258 + i * 76, width: w - 120, height: 66 }}>
          <Texto x={0} y={4} titulo tam={22} cor="#5A3410">
            {l.t}
          </Texto>
          <Texto x={0} y={34} tam={15} cor="#7A5A3A" peso={600}>
            {l.d}
          </Texto>
          <Interruptor x={w - 120 - 74} y={10} ligado={prefs[l.k]} onChange={(v) => setPrefs({ [l.k]: v })} />
        </div>
      ))}
      {onEditarPerfil && (
        <Botao cor="marrom" x={60} y={h - 116} w={230} h={74} onClick={onEditarPerfil}>
          Editar perfil
        </Botao>
      )}
      <Botao cor="verde" x={w - 60 - 200} y={h - 116} w={200} h={74} onClick={onFechar}>
        Pronto
      </Botao>
    </Modal>
  )
}
