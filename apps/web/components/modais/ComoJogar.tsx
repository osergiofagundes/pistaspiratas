'use client'
import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { SHIP_IDS } from '@arena/platform'
import { Botao, DECO_ANCORA, IMG, Modal } from '@/components/ui'
import { useSala } from '@/lib/sala'
import { tocar } from '@/lib/sons'

const W = 1500
const H = 880
const NAV = { x: 44, y: 70, w: 300, h: 88, gap: 10 }
const AREA = { x: 380, y: 70, w: W - 380 - 44, h: H - 70 - 140 }

const MARROM = '#5A3410'
const SUAVE = '#7A5A3A'
const TITULO = '#7E3A12'

// ---------------------------------------------------------------- pecinhas de texto

function P({ children, tam = 19 }: { children: ReactNode; tam?: number }) {
  return <p style={{ margin: '0 0 14px', fontSize: tam, fontWeight: 700, color: MARROM, lineHeight: 1.35 }}>{children}</p>
}

function B({ children, cor = TITULO }: { children: ReactNode; cor?: string }) {
  return <strong style={{ color: cor, fontWeight: 900 }}>{children}</strong>
}

/** Linha com uma imagem à esquerda, título e texto. */
function Linha({ img, iw = 96, ih = 63, titulo, children, cor, cinza }: { img: string; iw?: number; ih?: number; titulo: string; children: ReactNode; cor?: string; cinza?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 12 }}>
      <img src={`${IMG}/${img}`} alt="" draggable={false} style={{ width: iw, height: ih, objectFit: 'contain', flex: 'none', filter: cinza ? 'grayscale(1) brightness(.85)' : undefined }} />
      <div>
        <div className="lilita" style={{ fontSize: 22, color: cor ?? TITULO, lineHeight: 1.15 }}>
          {titulo}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: MARROM, lineHeight: 1.3 }}>{children}</div>
      </div>
    </div>
  )
}

/** Cartão de pergaminho claro. */
function Quadro({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(255,248,230,.6)',
        border: '2px solid rgba(138,74,28,.3)',
        borderRadius: 14,
        padding: '16px 20px',
        boxShadow: 'inset 0 2px 8px rgba(138,74,28,.1)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Lista({ itens, marca = '•', cor = TITULO }: { itens: ReactNode[]; marca?: string; cor?: string }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {itens.map((t, i) => (
        <li key={i} style={{ display: 'flex', gap: 10, fontSize: 17, fontWeight: 700, color: MARROM, lineHeight: 1.3, marginBottom: 9 }}>
          <span style={{ color: cor, fontWeight: 900, flex: 'none', width: 18, textAlign: 'center' }}>{marca}</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

/** Faixa de ordem como aparece na partida: palavra + número. */
function Ordem({ palavra, n }: { palavra: string; n: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '8px 10px 8px 26px', borderRadius: 40, background: 'linear-gradient(#3B2414,#24150B)', border: '3px solid #C8902E', boxShadow: '0 3px 0 rgba(0,0,0,.3)' }}>
      <span className="lilita" style={{ fontSize: 30, color: '#FFF3D6', letterSpacing: 1 }}>
        {palavra}
      </span>
      <span className="lilita" style={{ width: 46, height: 46, borderRadius: 23, background: 'linear-gradient(#FFD24A,#E09A1A)', border: '3px solid #7E3A12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#5A3410' }}>
        {n}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------- seções

const SECOES: { nome: string; icone: string; conteudo: () => ReactNode }[] = [
  {
    nome: 'O objetivo',
    icone: 'navios/navio-rubi.webp',
    conteudo: () => (
      <>
        <P>
          <B>Pistas Piratas</B> é um jogo de palavras em equipes. Cada equipe é a tripulação de um <B>navio</B> (de 2 a 4) e todos olham o mesmo mapa de
          palavras. Escondidos atrás delas estão os <B>tesouros</B> de cada navio, o <B>Mar Aberto</B> e o temido <B>Kraken</B>.
        </P>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 34, margin: '4px 0 18px' }}>
          {SHIP_IDS.map((id) => (
            <img key={id} src={`${IMG}/navios/navio-${id}.webp`} alt="" style={{ width: 120, height: 116, objectFit: 'contain' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 18 }}>
          <Quadro>
            <Linha img="itens/coroa.webp" iw={64} ih={56} titulo="Capitão">
              Um por navio. Vê o mapa com as cores das cartas e dá a ordem: uma palavra e um número.
            </Linha>
          </Quadro>
          <Quadro>
            <Linha img="personagens/papagaio-rubi.webp" iw={64} ih={64} titulo="Marujos">
              O resto da tripulação. Não veem as cores: conversam, escolhem as cartas e confirmam juntos.
            </Linha>
          </Quadro>
          <Quadro>
            <Linha img="itens/brasao-almirante.webp" iw={64} ih={60} titulo="Almirante">
              Quem criou a sala. Configura, inicia, pausa e encerra a partida, expulsa e pode passar o cargo.
            </Linha>
          </Quadro>
        </div>
        <Quadro style={{ textAlign: 'center', background: 'rgba(255,226,140,.45)' }}>
          <span className="lilita" style={{ fontSize: 24, color: TITULO }}>
            Vence o primeiro navio a achar todos os seus tesouros
          </span>
          <div style={{ fontSize: 17, fontWeight: 700, color: SUAVE, marginTop: 4 }}>ou o último que sobrar sem ser afundado pelo Kraken.</div>
        </Quadro>
      </>
    ),
  },
  {
    nome: 'As cartas',
    icone: 'cartas/fechada.webp',
    conteudo: () => (
      <>
        <P>
          Os Marujos veem só as palavras. Só o Capitão sabe o que tem atrás de cada uma. Quando uma carta é revelada, ela mostra o que escondia:
        </P>
        <Linha img="cartas/rubi.webp" titulo="Tesouro do seu navio">
          Acerto! Conta para vocês, e a vez continua enquanto houver palpites da ordem.
        </Linha>
        <Linha img="cartas/safira.webp" titulo="Tesouro de outro navio">
          A vez acaba e o tesouro conta para aquele navio. Se era o último dele, <B>ele vence na hora</B>!
        </Linha>
        <Linha img="cartas/mar.webp" titulo="Mar Aberto">
          Nada por aqui. A vez acaba.
        </Linha>
        <Linha img="cartas/kraken.webp" titulo="Kraken" cor="#5B2A86">
          O navio de quem revelou <B cor="#5B2A86">afunda</B> e sai da partida. Se só sobrar um navio, ele vence.
        </Linha>
        <Linha img="cartas/esmeralda.webp" cinza titulo="Tesouro de um navio afundado">
          Não conta para ninguém, e a vez acaba.
        </Linha>
        <P tam={16}>
          Cada navio tem o mesmo número de tesouros. Na sala dá para escolher que o navio que começa leve <B>1 tesouro a mais</B>, para compensar a
          vantagem de sair na frente.
        </P>
      </>
    ),
  },
  {
    nome: 'A ordem do Capitão',
    icone: 'itens/coroa.webp',
    conteudo: () => (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginBottom: 16 }}>
          <Ordem palavra="PIRATA" n={3} />
          <P>
            Na vez do navio, o Capitão olha o mapa e manda a <B>ordem</B>: uma palavra que ligue os tesouros dele e quantas cartas ela liga. Ex.: PIRATA · 3
            para NAVIO, PAPAGAIO e ILHA.
          </P>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 16, marginBottom: 16 }}>
          <Quadro>
            <div className="lilita" style={{ fontSize: 22, color: '#2E7A2A', marginBottom: 8 }}>
              A ordem precisa
            </div>
            <Lista
              marca="✔"
              cor="#2E7A2A"
              itens={['Ser uma palavra só (letras e hífen valem).', 'Ter um número de 1 até os tesouros que ainda faltam.', 'Ser dada só pela tela: nada de gestos ou dicas faladas!']}
            />
          </Quadro>
          <Quadro>
            <div className="lilita" style={{ fontSize: 22, color: '#9B2C2C', marginBottom: 8 }}>
              Não vale
            </div>
            <Lista
              marca="✕"
              cor="#9B2C2C"
              itens={[
                'Uma palavra que está no tabuleiro.',
                <>O plural ou singular de uma delas (<B>TESOUROS</B> com TESOURO na mesa).</>,
                <>Conter uma delas ou estar dentro dela (<B>CAVALO-MARINHO</B> com CAVALO).</>,
                <>Ser muito parecida com uma delas (<B>CAVERNOSO</B> com CAVERNA).</>,
              ]}
            />
          </Quadro>
        </div>
        <Linha img="interface/icones/mapa.webp" iw={64} ih={64} titulo="Marcas do Capitão">
          Enquanto pensa, o Capitão pode tocar nos próprios tesouros para marcar os que quer ligar. Só os Capitães veem as marcas.
        </Linha>
        <Linha img="interface/icones/ampulheta.webp" iw={64} ih={64} titulo="Tempo do Capitão">
          A sala pode ter um tempo para pensar. Se acabar antes da ordem, a vez passa para o próximo navio.
        </Linha>
      </>
    ),
  },
  {
    nome: 'A vez dos Marujos',
    icone: 'interface/icones/olho.webp',
    conteudo: () => (
      <>
        <P>Com a ordem na tela, a tripulação conversa e escolhe as cartas. Só os Marujos do navio da vez jogam:</P>
        <Linha img="interface/icones/olho.webp" iw={64} ih={64} titulo="1. Selecionem as cartas">
          Toquem em até N palavras (N é o número da ordem). A seleção é de todos: cada um vê o que os outros marcaram. Quando o limite é 1, tocar em outra
          carta troca a escolha.
        </Linha>
        <Linha img="interface/icones/play.webp" iw={64} ih={64} titulo="2. Todos confirmam">
          As cartas só são reveladas quando <B>todos os Marujos presentes</B> tocam em Confirmar. Elas abrem na ordem em que foram escolhidas.
        </Linha>
        <Linha img="interface/icones/mais.webp" iw={64} ih={64} titulo="3. Faltou alguma?">
          Se confirmaram menos cartas que o número e todas eram tesouros de vocês, a vez continua para escolher as outras.
        </Linha>
        <Linha img="interface/icones/pausa.webp" iw={64} ih={64} titulo="4. Parar antes">
          Para não arriscar, todos tocam em Encerrar vez. Se o tempo dos Marujos acabar, a vez passa sozinha.
        </Linha>
        <P tam={16}>Quem cai da conexão deixa de contar na votação, para ninguém ficar esperando.</P>
      </>
    ),
  },
  {
    nome: 'Canhão e vitória',
    icone: 'interface/icones/canhao.webp',
    conteudo: () => (
      <>
        <Linha img="interface/icones/canhao.webp" iw={80} ih={80} titulo="Tiro de Canhão">
          Acertaram todas as cartas da ordem? Ganham <B>1 palpite livre</B> em qualquer carta. O relógio para por 5 segundos enquanto o aviso aparece. Depois
          do tiro, a vez acaba, acertando ou não. (A sala pode desligar o canhão.)
        </Linha>
        <Linha img="cartas/kraken.webp" iw={110} ih={72} titulo="Kraken" cor="#5B2A86">
          Afunda o navio que o revelou. Ele sai da partida e a vez passa para o próximo navio que ainda navega.
        </Linha>
        <Linha img="itens/coroa.webp" iw={80} ih={70} titulo="Como vencer">
          O primeiro navio a ter todos os seus tesouros revelados vence, mesmo que o último tenha sido aberto por outro navio. Se todos os outros afundarem,
          o navio que sobrou vence.
        </Linha>
        <Linha img="interface/icones/pausa.webp" iw={80} ih={80} titulo="Diário, pausa e fim">
          O Diário guarda cada ordem e cada palpite. O Almirante pode pausar ou encerrar a partida. No fim, todos veem o mapa completo e voltam ao salão para
          a revanche.
        </Linha>
      </>
    ),
  },
  {
    nome: 'Dicas e ajustes',
    icone: 'interface/icones/mapa.webp',
    conteudo: () => (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Quadro>
          <div className="lilita" style={{ fontSize: 24, color: TITULO, marginBottom: 10 }}>
            Dicas de pirata
          </div>
          <Lista
            itens={[
              'Comece com ordens de 2 ou 3 palavras: são mais seguras que tentar ligar tudo.',
              'Capitão: antes de mandar a ordem, confira se ela não puxa para o Kraken ou para o Mar Aberto.',
              'Marujos: falem por que escolheram cada palavra. A mais certa vai primeiro.',
              'Na dúvida, Encerrar vez: um tesouro garantido vale mais que afundar o navio.',
              'Fiquem de olho nos tesouros dos outros navios: abrir o último deles dá a vitória a eles.',
            ]}
          />
        </Quadro>
        <Quadro>
          <div className="lilita" style={{ fontSize: 24, color: TITULO, marginBottom: 10 }}>
            Ajustes da sala
          </div>
          <Lista
            itens={[
              <><B>Presets:</B> Clássico, Rápido, Caótico, Tranquilo ou Personalizado.</>,
              <><B>Tabuleiro:</B> automático ou de 5×5 a 10×10. Os tesouros acompanham o tamanho, mas dá para ajustar.</>,
              <><B>Quem começa</B> pode levar 1 tesouro a mais.</>,
              <><B>Capitão:</B> sorteado ou escolhido pelo navio, com rodízio a cada partida.</>,
              <><B>Tempo</B> do Capitão e dos Marujos, ou sem relógio.</>,
              <><B>Palavras:</B> Geral, Mar e Pirataria ou uma lista sua.</>,
            ]}
          />
          <div style={{ fontSize: 15, fontWeight: 700, color: SUAVE, marginTop: 6 }}>Só o Almirante muda as configurações, pelo botão Editar no salão.</div>
        </Quadro>
      </div>
    ),
  },
]

// ---------------------------------------------------------------- modal

/** Manual de como jogar, em seções. */
export function ModalComoJogar({ onFechar }: { onFechar: () => void }) {
  const [i, setI] = useState(0)
  const anim = useSala((s) => s.prefs.animacoes)
  const ir = (n: number) => {
    if (n < 0 || n >= SECOES.length || n === i) return
    tocar('clique')
    setI(n)
  }
  const s = SECOES[i]
  return (
    <Modal titulo="Como jogar" w={W} h={H} onFechar={onFechar} decos={[DECO_ANCORA(W, H)]}>
      {/* seções */}
      <nav aria-label="Seções do manual" style={{ position: 'absolute', left: NAV.x, top: NAV.y, width: NAV.w }}>
        {SECOES.map((sec, k) => {
          const ativo = k === i
          return (
            <button
              key={sec.nome}
              type="button"
              aria-current={ativo ? 'page' : undefined}
              onClick={() => ir(k)}
              className="segmento"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                width: '100%',
                height: NAV.h,
                marginBottom: NAV.gap,
                padding: '0 16px',
                borderRadius: 14,
                border: `3px solid ${ativo ? '#1E5A1E' : '#3A1D0C'}`,
                background: ativo ? 'linear-gradient(#5DBB4A,#2E8A2A)' : 'linear-gradient(#9A5A2A,#6B3A17)',
                boxShadow: ativo ? 'inset 0 2px 0 rgba(255,255,255,.3)' : 'inset 0 2px 0 rgba(255,255,255,.15), 0 3px 0 rgba(0,0,0,.35)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ width: 58, height: 58, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={`${IMG}/${sec.icone}`} alt="" draggable={false} style={{ maxWidth: 58, maxHeight: 58, objectFit: 'contain' }} />
              </span>
              <span className="lilita" style={{ fontSize: 22, color: ativo ? '#FFFFFF' : '#F3DDB0', lineHeight: 1.1 }}>
                <span style={{ opacity: 0.75, marginRight: 6 }}>{k + 1}.</span>
                {sec.nome}
              </span>
            </button>
          )
        })}
      </nav>

      {/* conteúdo */}
      <div style={{ position: 'absolute', left: AREA.x, top: AREA.y, width: AREA.w, height: AREA.h, overflowY: 'auto', overflowX: 'hidden' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={i}
            initial={anim ? { opacity: 0, x: 24 } : false}
            animate={{ opacity: 1, x: 0 }}
            exit={anim ? { opacity: 0, x: -24 } : undefined}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ paddingRight: 8 }}
          >
            <h2 className="lilita" style={{ margin: '0 0 14px', fontSize: 36, fontWeight: 400, color: TITULO }}>
              {s.nome}
            </h2>
            {s.conteudo()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* navegação */}
      <div style={{ position: 'absolute', left: AREA.x, top: H - 112, width: AREA.w, display: 'flex', justifyContent: 'center', gap: 8 }} aria-hidden>
        {SECOES.map((_, k) => (
          <span key={k} style={{ width: 12, height: 12, borderRadius: 6, background: k === i ? '#7E3A12' : 'rgba(126,58,18,.25)' }} />
        ))}
      </div>
      <Botao cor="marrom" x={AREA.x} y={H - 124} w={220} h={70} onClick={() => ir(i - 1)} disabled={i === 0}>
        ‹ Anterior
      </Botao>
      {i < SECOES.length - 1 ? (
        <Botao cor="verde" x={AREA.x + AREA.w - 220 - 150} y={H - 124} w={220} h={70} onClick={() => ir(i + 1)}>
          Próximo ›
        </Botao>
      ) : (
        <Botao cor="verde" x={AREA.x + AREA.w - 220 - 150} y={H - 124} w={220} h={70} onClick={onFechar}>
          Entendi!
        </Botao>
      )}
    </Modal>
  )
}
