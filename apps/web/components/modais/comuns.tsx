'use client'
import { useState, type ReactNode } from 'react'
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

/** Seu perfil: nome e avatar (tela 760). */
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
  const [erro, setErro] = useState<string | null>(null)
  const w = 812
  const h = 570
  const confirmar = () => {
    const e = validateName(nome)
    if (e) return setErro(e)
    onConfirmar({ name: nome.trim().replace(/\s+/g, ' '), avatar })
  }
  return (
    <Modal titulo="Seu perfil" w={w} h={h} onFechar={onFechar} decos={[DECO_ANCORA(w, h)]}>
      <Texto x={56} y={60} titulo tam={24} cor="#5A3410">
        Como vão te chamar?
      </Texto>
      <Campo
        x={50}
        y={98}
        w={w - 100}
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
      {erro && (
        <Texto x={56} y={166} tam={15} cor="#B3261E">
          {erro}
        </Texto>
      )}
      <Texto x={56} y={192} titulo tam={24} cor="#5A3410">
        Escolha seu avatar
      </Texto>
      {PERSONAGENS.map((p, i) => (
        <button
          key={p.id}
          type="button"
          onClick={() => setAvatar(p.id)}
          aria-label={p.nome}
          aria-pressed={avatar === p.id}
          style={{ position: 'absolute', left: 52 + i * 118, top: 226, width: 108, height: 140, background: 'none', border: 0 }}
        >
          <Escotilha avatar={p.id} ship={ship ?? 'rubi'} tam={104} x={2} y={0} selecionado={avatar === p.id} />
          <span
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 110,
              fontWeight: 800,
              fontSize: 16,
              color: avatar === p.id ? '#B5651D' : '#5A3410',
            }}
          >
            {p.nome}
          </span>
        </button>
      ))}
      <Texto x={0} y={390} w={w} centro tam={16} cor="#7A5A3A" peso={700}>
        A cor do avatar acompanha o navio que você escolher no salão.
      </Texto>
      <BotaoImagem nome="confirmar" x={w / 2 - 100} y={440} w={200} h={80} onClick={confirmar} title="Confirmar" />
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
  const h = 640
  const volumes: { k: 'musica' | 'efeitos'; t: string; d: string; amostra?: () => void }[] = [
    { k: 'musica', t: 'Música', d: 'Trilha do porto e do alto-mar' },
    { k: 'efeitos', t: 'Efeitos sonoros', d: 'Moedas, ondas, Kraken e cliques', amostra: () => tocar('moedas') },
  ]
  const chaves: { k: 'mudo' | 'animacoes' | 'lembrete'; t: string; d: string }[] = [
    { k: 'mudo', t: 'Silenciar tudo', d: 'O mesmo do ícone de som no canto da tela' },
    { k: 'animacoes', t: 'Animações', d: 'Logo balançando, navios, cartas virando' },
    { k: 'lembrete', t: 'Lembrete do Capitão', d: 'Mostra as regras de conduta ao virar Capitão' },
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
