'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PERSONAGENS, isValidCode, normalizeCode } from '@arena/platform'
import {
  BotaoImagem,
  Campo,
  Entrar,
  Escotilha,
  Icone,
  IconeNovo,
  Imagem,
  Moldura,
  Palco,
  Placa,
  Texto,
  IMG,
} from '@/components/ui'
import { BotaoPreferencias, ModalComoJogar, ModalInfo, ModalPerfil } from '@/components/modais/comuns'
import { criarSala, infoSala } from '@/lib/api'
import { perfil as lerPerfil, salvarPerfil, type Perfil } from '@/lib/identidade'
import { useSala } from '@/lib/sala'
import { useMusica } from '@/lib/useMusica'

type Modal = null | 'perfil' | 'ajuda' | 'cheia'

/** Início da plataforma (tela 726). */
export function Inicio({ erroInicial }: { erroInicial?: string | null }) {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState<string | null>(erroInicial ?? null)
  const [modal, setModal] = useState<Modal>(null)
  const [depoisDoPerfil, setDepoisDoPerfil] = useState<null | (() => void)>(null)
  const [ocupado, setOcupado] = useState(false)
  const mudo = useSala((s) => s.prefs.mudo)
  useMusica('porto')
  const setPrefs = useSala((s) => s.setPrefs)

  useEffect(() => {
    setPerfil(lerPerfil())
  }, [])

  const comPerfil = (fn: () => void) => {
    if (perfil) return fn()
    setDepoisDoPerfil(() => fn)
    setModal('perfil')
  }

  const criar = () =>
    comPerfil(async () => {
      setOcupado(true)
      const code = await criarSala()
      router.push(`/sala/${code}`)
    })

  const entrar = () => {
    const code = normalizeCode(codigo)
    if (!isValidCode(code)) return setErro('O código tem 6 letras e números, como K7PX2M.')
    comPerfil(async () => {
      setOcupado(true)
      const info = await infoSala(code)
      setOcupado(false)
      if (!info) return setErro('Não achamos essa sala. Confira o código com o Almirante.')
      if (info.players >= info.maxPlayers) return setModal('cheia')
      router.push(`/sala/${code}`)
    })
  }

  const nomeAvatar = PERSONAGENS.find((p) => p.id === perfil?.avatar)?.nome

  return (
    <Palco fundo="fundo-inicio" escurecer={0.08}>
      {/* chip do jogador */}
      <button
        type="button"
        onClick={() => setModal('perfil')}
        className="pilula-escura"
        style={{ position: 'absolute', left: 1316, top: 38, width: 302, height: 74, textAlign: 'left' }}
      >
        {perfil ? (
          <Escotilha avatar={perfil.avatar} ship="rubi" tam={66} x={4} y={2} />
        ) : (
          <IconeNovo nome="mais" x={10} y={10} w={50} h={50} />
        )}
        <span className="lilita" style={{ position: 'absolute', left: 80, top: 10, fontSize: 24, color: '#FFF8EC' }}>
          {perfil?.name ?? 'Criar perfil'}
        </span>
        <span style={{ position: 'absolute', left: 80, top: 42, fontSize: 14, color: '#E8D2A8', fontWeight: 700 }}>
          {perfil ? `${nomeAvatar} · editar perfil` : 'nome e avatar'}
        </span>
      </button>
      <Icone nome={mudo ? 'som-desligado' : 'som-ligado'} x={1648} y={42} onClick={() => setPrefs({ mudo: !mudo })} title={mudo ? 'Ligar o som' : 'Silenciar'} />
      <Icone nome="ajuda" x={1726} y={42} onClick={() => setModal('ajuda')} title="Como jogar" />
      <BotaoPreferencias x={1804} y={42} onEditarPerfil={() => setModal('perfil')} />

      {/* lado esquerdo: logo, faixa e chips */}
      <Entrar atraso={0.05} de="cima">
        <div className="balancar-logo" style={{ position: 'absolute', left: 196, top: 110, width: 712, height: 470 }}>
          <Imagem src="logos/logo-codenomes.webp" x={0} y={0} w={712} h={470} />
        </div>
      </Entrar>
      <Entrar atraso={0.25}>
        <div className="flutuar" style={{ position: 'absolute', left: 190, top: 574, width: 724, height: 176, animationDelay: '-2s' }}>
          <Imagem src="interface/molduras/faixa.webp" x={0} y={0} w={724} h={176} />
          <Texto x={60} y={62} w={604} centro titulo tam={27} cor="#5A3410">
            Dê dicas, ache tesouros e fuja do Kraken!
          </Texto>
        </div>
      </Entrar>
      {[
        { icone: `${IMG}/navios/navio-rubi.webp`, t: '2 a 4 navios', x: 200 },
        { icone: `${IMG}/personagens/papagaio-rubi.webp`, t: 'até 24 piratas', x: 430 },
        { icone: `${IMG}/interface/icones/ampulheta.webp`, t: '~15 min', x: 696 },
      ].map((c, i) => (
        <Entrar key={c.t} atraso={0.45 + i * 0.12}>
          <div className="pilula-escura" style={{ position: 'absolute', left: c.x, top: 790, height: 56, padding: '0 22px 0 60px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <img src={c.icone} alt="" style={{ position: 'absolute', left: 8, top: 6, width: 44, height: 44, objectFit: 'contain' }} />
            <span className="lilita" style={{ fontSize: 20 }}>
              {c.t}
            </span>
          </div>
        </Entrar>
      ))}

      {/* painel Jogar agora */}
      <Entrar atraso={0.2} de="direita">
      <Moldura x={1184} y={200} w={632} h={612} />
      <Placa texto="Jogar agora" x={1356} y={180} w={290} tam={26} />
      <Imagem src="interface/decoracoes/deco-barril-sala-esq.webp" x={1166} y={720} w={145} h={105} />
      <Imagem src="interface/decoracoes/deco-barril-sala-dir.webp" x={1690} y={735} w={128} h={85} />
      <Texto x={1184} y={268} w={632} centro titulo tam={34} cor="#5A3410">
        Monte sua tripulação
      </Texto>
      <Texto x={1184} y={314} w={632} centro tam={19} cor="#7A5A3A" peso={700}>
        Crie uma sala e chame os amigos pelo link.
      </Texto>
      <BotaoImagem nome="criar-sala" className="brilho" x={1316} y={372} w={368} h={128} onClick={criar} disabled={ocupado} title="Criar Sala" />
      <div style={{ position: 'absolute', left: 1240, top: 556, width: 520, height: 2, background: 'rgba(90,52,16,.25)' }} />
      <div style={{ position: 'absolute', left: 1384, top: 544, width: 232, textAlign: 'center', background: '#F3DDB0', fontSize: 16, fontWeight: 700, color: '#7A5A3A' }}>
        ou entre com o código
      </div>
      <Campo
        x={1236}
        y={606}
        w={326}
        h={62}
        valor={codigo}
        placeholder="Código da sala"
        maxLength={8}
        tam={24}
        erro={!!erro}
        onChange={(v) => {
          setCodigo(v.toUpperCase())
          setErro(null)
        }}
        onEnter={entrar}
      />
      <BotaoImagem nome="entrar-na-sala" x={1572} y={600} w={196} h={76} onClick={entrar} disabled={ocupado} title="Entrar na Sala" />
      {erro ? (
        <Texto x={1236} y={676} w={540} tam={16} cor="#B3261E">
          {erro}
        </Texto>
      ) : (
        <Texto x={1236} y={694} w={540} centro tam={16} cor="#7A5A3A" peso={600}>
          Sem conta e sem download: crie a sala e mande o link no Discord.
        </Texto>
      )}
      </Entrar>

      {modal === 'perfil' && (
        <ModalPerfil
          inicial={perfil}
          onFechar={() => {
            setModal(null)
            setDepoisDoPerfil(null)
          }}
          onConfirmar={(p) => {
            salvarPerfil(p)
            setPerfil(p)
            setModal(null)
            const fn = depoisDoPerfil
            setDepoisDoPerfil(null)
            fn?.()
          }}
        />
      )}
      {modal === 'ajuda' && <ModalComoJogar onFechar={() => setModal(null)} />}
      {modal === 'cheia' && (
        <ModalInfo
          titulo="Sala cheia"
          texto="Essa sala já atingiu o limite de jogadores. Peça ao Almirante para aumentar o tamanho da sala ou crie uma nova."
          onFechar={() => setModal(null)}
        />
      )}
    </Palco>
  )
}
