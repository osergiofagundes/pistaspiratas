'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isValidCode, normalizeCode } from '@arena/platform'
import {
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
} from '@/components/ui'
import { BotaoIdioma, BotaoPreferencias, BotaoTexto, DECO_BARRIS, DECO_BAU, ModalComoJogar, ModalInfo, ModalPerfil } from '@/components/modais/comuns'
import { useIdioma, useT } from '@/lib/i18n'
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
  const t = useT()
  const idioma = useIdioma()
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
      const code = await criarSala(idioma)
      router.push(`/sala/${code}`)
    })

  const entrar = () => {
    const code = normalizeCode(codigo)
    if (!isValidCode(code)) return setErro(t.inicio.erroCodigo)
    comPerfil(async () => {
      setOcupado(true)
      const info = await infoSala(code)
      setOcupado(false)
      if (!info) return setErro(t.inicio.naoAchamos)
      if (info.players >= info.maxPlayers) return setModal('cheia')
      router.push(`/sala/${code}`)
    })
  }

  const nomeAvatar = perfil ? t.personagens[perfil.avatar] : ''

  return (
    <Palco fundo="fundo-inicio" escurecer={0.08}>
      {/* chip do jogador */}
      <button
        type="button"
        onClick={() => setModal('perfil')}
        className="pilula-escura"
        style={{ position: 'absolute', left: 1238, top: 38, width: 302, height: 74, textAlign: 'left' }}
      >
        {perfil ? (
          <Escotilha avatar={perfil.avatar} ship="rubi" tam={66} x={4} y={2} />
        ) : (
          <IconeNovo nome="mais" x={10} y={10} w={50} h={50} />
        )}
        <span className="lilita" style={{ position: 'absolute', left: 80, top: 10, fontSize: 24, color: '#FFF8EC' }}>
          {perfil?.name ?? t.inicio.criarPerfil}
        </span>
        <span style={{ position: 'absolute', left: 80, top: 42, fontSize: 14, color: '#E8D2A8', fontWeight: 700 }}>
          {perfil ? t.inicio.editarPerfil(nomeAvatar) : t.inicio.nomeAvatar}
        </span>
      </button>
      <BotaoIdioma x={1570} y={42} />
      <Icone nome={mudo ? 'som-desligado' : 'som-ligado'} x={1648} y={42} onClick={() => setPrefs({ mudo: !mudo })} title={mudo ? t.comum.ligarSom : t.comum.silenciar} />
      <Icone nome="ajuda" x={1726} y={42} onClick={() => setModal('ajuda')} title={t.comum.comoJogar} />
      <BotaoPreferencias x={1804} y={42} onEditarPerfil={() => setModal('perfil')} />

      {/* lado esquerdo: logo, faixa e chips */}
      <Entrar atraso={0.05} de="cima">
        <div className="balancar-logo" style={{ position: 'absolute', left: 196, top: 110, width: 712, height: 470 }}>
          <Imagem src="logos/logo-pistas-piratas.webp" x={0} y={0} w={712} h={470} />
        </div>
      </Entrar>
      <Entrar atraso={0.25}>
        <div className="flutuar" style={{ position: 'absolute', left: 190, top: 574, width: 724, height: 176, animationDelay: '-2s' }}>
          <Imagem src="interface/molduras/faixa.webp" x={0} y={0} w={724} h={176} />
          <Texto x={60} y={t.inicio.slogan.length > 44 ? 66 : 62} w={604} centro titulo tam={t.inicio.slogan.length > 44 ? 23 : 27} cor="#5A3410">
            {t.inicio.slogan}
          </Texto>
        </div>
      </Entrar>
      {/* créditos */}
      <Entrar atraso={0.45}>
        <div style={{ position: 'absolute', left: 190, top: 790, width: 724, display: 'flex', justifyContent: 'center' }}>
          <div className="pilula-escura" style={{ position: 'relative', height: 56, padding: '0 26px', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span className="lilita" style={{ fontSize: 20 }}>
              {t.inicio.creditos}
            </span>
            <a
              href="https://www.linkedin.com/in/sergiofagundes/"
              target="_blank"
              rel="noopener noreferrer"
              className="lilita link-credito"
              style={{ fontSize: 20, color: '#FFD24A', textDecoration: 'underline', textUnderlineOffset: 4 }}
            >
              LinkedIn
            </a>
          </div>
        </div>
      </Entrar>

      {/* painel Jogar agora */}
      <Entrar atraso={0.2} de="direita">
      <Moldura x={1184} y={200} w={632} h={612} />
      <Placa texto={t.inicio.jogarAgora} x={1356} y={180} w={290} tam={26} />
      {/* barris e baú apoiados nos cantos de baixo da moldura (base em 200 + 612) */}
      {[DECO_BARRIS(612, 136), DECO_BAU(632, 612, 112)].map((d) => (
        <Imagem key={d.src} src={d.src} x={1184 + d.x} y={200 + d.y} w={d.w} h={d.h} />
      ))}
      <Texto x={1184} y={268} w={632} centro titulo tam={34} cor="#5A3410">
        {t.inicio.monte}
      </Texto>
      <Texto x={1184} y={314} w={632} centro tam={19} cor="#7A5A3A" peso={700}>
        {t.inicio.crie}
      </Texto>
      <BotaoTexto nome="criar-sala" cor="marrom" texto={t.inicio.criarSala} tam={44} className="brilho" x={1316} y={372} w={368} h={128} onClick={criar} disabled={ocupado} />
      <div style={{ position: 'absolute', left: 1240, top: 556, width: 520, height: 2, background: 'rgba(90,52,16,.25)' }} />
      <div style={{ position: 'absolute', left: 1384, top: 544, width: 232, textAlign: 'center', background: '#F3DDB0', fontSize: 16, fontWeight: 700, color: '#7A5A3A' }}>
        {t.inicio.ouEntre}
      </div>
      <Campo
        x={1236}
        y={606}
        w={326}
        h={62}
        valor={codigo}
        placeholder={t.inicio.codigo}
        maxLength={8}
        tam={24}
        erro={!!erro}
        onChange={(v) => {
          setCodigo(v.toUpperCase())
          setErro(null)
        }}
        onEnter={entrar}
      />
      <BotaoTexto nome="entrar-na-sala" cor="marrom" texto={t.inicio.entrar} title={t.inicio.entrarNaSala} tam={26} x={1572} y={600} w={196} h={76} onClick={entrar} disabled={ocupado} />
      {erro ? (
        <Texto x={1236} y={676} w={540} tam={16} cor="#B3261E">
          {erro}
        </Texto>
      ) : (
        <Texto x={1236} y={694} w={540} centro tam={16} cor="#7A5A3A" peso={600}>
          {t.inicio.semConta}
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
          titulo={t.inicio.salaCheia}
          texto={t.inicio.salaCheiaTexto}
          onFechar={() => setModal(null)}
        />
      )}
    </Palco>
  )
}
