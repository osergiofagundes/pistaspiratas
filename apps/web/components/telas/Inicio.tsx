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
  usePalco,
} from '@/components/ui'
import { BotaoIdioma, BotaoMenu, BotaoPreferencias, BotaoSom, BotaoTexto, DECO_BARRIS, DECO_BAU, ModalComoJogar, ModalConfirmar, ModalInfo, ModalPerfil } from '@/components/modais/comuns'
import { useIdioma, useT } from '@/lib/i18n'
import { criarSala, infoSala } from '@/lib/api'
import { estadoTutorial, perfil as lerPerfil, salvarEstadoTutorial, salvarPerfil, type Perfil } from '@/lib/identidade'
import { useSala } from '@/lib/sala'
import { useMusica } from '@/lib/useMusica'

type Modal = null | 'perfil' | 'ajuda' | 'cheia' | 'convite'

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
    // primeira visita: convida para o tutorial (uma vez só)
    if (!estadoTutorial()) setModal('convite')
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

  const props: PropsConteudo = {
    perfil,
    nomeAvatar: perfil ? t.personagens[perfil.avatar] : '',
    codigo,
    setCodigo,
    erro,
    setErro,
    ocupado,
    mudo,
    onPerfil: () => setModal('perfil'),
    onAjuda: () => setModal('ajuda'),
    onSom: () => setPrefs({ mudo: !mudo }),
    criar,
    entrar,
  }

  return (
    <Palco fundo="fundo-inicio" escurecer={0.08}>
      <Conteudo {...props} />

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
      {modal === 'convite' && (
        <ModalConfirmar
          titulo={t.tutorial.convite.titulo}
          pergunta={t.tutorial.convite.pergunta}
          texto={t.tutorial.convite.texto}
          confirmar={t.tutorial.convite.sim}
          cancelar={t.tutorial.convite.agoraNao}
          corConfirmar="verde"
          icone={<Escotilha avatar="papagaio" tam={88} x={0} y={0} />}
          onFechar={() => {
            salvarEstadoTutorial('visto')
            setModal(null)
          }}
          onConfirmar={() => {
            salvarEstadoTutorial('visto')
            router.push('/tutorial')
          }}
        />
      )}
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

type PropsConteudo = {
  perfil: Perfil | null
  nomeAvatar: string
  codigo: string
  setCodigo: (v: string) => void
  erro: string | null
  setErro: (v: string | null) => void
  ocupado: boolean
  mudo: boolean
  onPerfil: () => void
  onAjuda: () => void
  onSom: () => void
  criar: () => void
  entrar: () => void
}

/** Desenho do Início: desktop (tela 726) ou compacto (celular e tablet deitados). */
function Conteudo(p: PropsConteudo) {
  return usePalco().compacto ? <InicioCompacto {...p} /> : <InicioDesktop {...p} />
}

function InicioDesktop({ perfil, nomeAvatar, codigo, setCodigo, erro, setErro, ocupado, mudo, onPerfil, onAjuda, onSom, criar, entrar }: PropsConteudo) {
  const t = useT()
  return (
    <>
      {/* chip do jogador */}
      <button
        type="button"
        onClick={onPerfil}
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
      <Icone nome={mudo ? 'som-desligado' : 'som-ligado'} x={1648} y={42} onClick={onSom} title={mudo ? t.comum.ligarSom : t.comum.silenciar} />
      <Icone nome="ajuda" x={1726} y={42} onClick={onAjuda} title={t.comum.comoJogar} />
      <BotaoPreferencias x={1804} y={42} onEditarPerfil={onPerfil} />

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
          <Creditos tam={20} h={56} />
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
    </>
  )
}

function Creditos({ tam, h }: { tam: number; h: number }) {
  const t = useT()
  return (
    <div className="pilula-escura" style={{ position: 'relative', height: h, padding: '0 26px', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
      <span className="lilita" style={{ fontSize: tam }}>
        {t.inicio.creditos}
      </span>
      <a
        href="https://www.linkedin.com/in/sergiofagundes/"
        target="_blank"
        rel="noopener noreferrer"
        className="lilita link-credito"
        style={{ fontSize: tam, color: '#FFD24A', textDecoration: 'underline', textUnderlineOffset: 4 }}
      >
        LinkedIn
      </a>
    </div>
  )
}

/** Compacto: logo e faixa à esquerda, "Jogar agora" à direita, e no alto o chip, o som e o menu. */
function InicioCompacto({ perfil, nomeAvatar, codigo, setCodigo, erro, setErro, ocupado, onPerfil, criar, entrar }: PropsConteudo) {
  const t = useT()
  const { W, H } = usePalco()
  // painel da direita
  const pw = 520
  const ph = 432
  const px = W - pw - 30
  const py = Math.max(114, (H - ph) / 2 + 40)
  // coluna da esquerda: logo, faixa e créditos, centralizados na altura
  const lw = px - 20
  const logoW = Math.min(lw - 30, 470)
  const logoH = Math.round((logoW * 470) / 712)
  const faixaW = Math.min(lw - 10, 500)
  const faixaH = Math.round((faixaW * 176) / 724)
  const ly = Math.max(12, (H - (logoH + faixaH + 56)) / 2 - 4)
  const lx = 10 + (lw - logoW) / 2
  const fx = 10 + (lw - faixaW) / 2
  const fy = ly + logoH - 16
  const kf = faixaW / 724
  const longo = t.inicio.slogan.length > 44
  return (
    <>
      {/* chip do jogador, som e menu */}
      <button type="button" onClick={onPerfil} className="pilula-escura" style={{ position: 'absolute', left: W - 452, top: 16, width: 290, height: 66, textAlign: 'left' }}>
        {perfil ? <Escotilha avatar={perfil.avatar} ship="rubi" tam={60} x={3} y={1} /> : <IconeNovo nome="mais" x={8} y={8} w={46} h={46} />}
        <span className="lilita" style={{ position: 'absolute', left: 72, top: 8, right: 14, fontSize: 23, color: '#FFF8EC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {perfil?.name ?? t.inicio.criarPerfil}
        </span>
        <span style={{ position: 'absolute', left: 72, top: 38, right: 14, fontSize: 14, color: '#E8D2A8', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {perfil ? t.inicio.editarPerfil(nomeAvatar) : t.inicio.nomeAvatar}
        </span>
      </button>
      <BotaoSom x={W - 148} y={18} />
      <BotaoMenu x={W - 80} y={18} onEditarPerfil={onPerfil} />

      {/* logo, faixa e créditos */}
      <Entrar atraso={0.05} de="cima">
        <div className="balancar-logo" style={{ position: 'absolute', left: lx, top: ly, width: logoW, height: logoH }}>
          <Imagem src="logos/logo-pistas-piratas.webp" x={0} y={0} w={logoW} h={logoH} />
        </div>
      </Entrar>
      <Entrar atraso={0.25}>
        <div className="flutuar" style={{ position: 'absolute', left: fx, top: fy, width: faixaW, height: faixaH, animationDelay: '-2s' }}>
          <Imagem src="interface/molduras/faixa.webp" x={0} y={0} w={faixaW} h={faixaH} />
          <Texto x={50 * kf} y={(longo ? 60 : 54) * kf} w={624 * kf} centro titulo tam={Math.round((longo ? 26 : 31) * kf)} cor="#5A3410">
            {t.inicio.slogan}
          </Texto>
        </div>
      </Entrar>
      <Entrar atraso={0.45}>
        <div style={{ position: 'absolute', left: 10, top: fy + faixaH + 6, width: lw, display: 'flex', justifyContent: 'center' }}>
          <Creditos tam={18} h={46} />
        </div>
      </Entrar>

      {/* Jogar agora */}
      <Entrar atraso={0.2} de="direita">
        <Moldura x={px} y={py} w={pw} h={ph} />
        <Placa texto={t.inicio.jogarAgora} x={px + (pw - 270) / 2} y={py - 24} w={270} h={68} tam={24} />
        {[DECO_BARRIS(ph, 96), DECO_BAU(pw, ph, 84)].map((d) => (
          <Imagem key={d.src} src={d.src} x={px + d.x} y={py + d.y} w={d.w} h={d.h} />
        ))}
        <Texto x={px} y={py + 54} w={pw} centro titulo tam={30} cor="#5A3410">
          {t.inicio.monte}
        </Texto>
        <Texto x={px + 30} y={py + 92} w={pw - 60} centro tam={17} cor="#7A5A3A" peso={700}>
          {t.inicio.crie}
        </Texto>
        <BotaoTexto nome="criar-sala" cor="marrom" texto={t.inicio.criarSala} tam={36} className="brilho" x={px + (pw - 300) / 2} y={py + 140} w={300} h={104} onClick={criar} disabled={ocupado} />
        <div style={{ position: 'absolute', left: px + 40, top: py + 282, width: pw - 80, height: 2, background: 'rgba(90,52,16,.25)' }} />
        <div style={{ position: 'absolute', left: px + (pw - 220) / 2, top: py + 270, width: 220, textAlign: 'center', background: '#F3DDB0', fontSize: 16, fontWeight: 700, color: '#7A5A3A' }}>
          {t.inicio.ouEntre}
        </div>
        <Campo
          x={px + 36}
          y={py + 304}
          w={290}
          h={60}
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
        <BotaoTexto nome="entrar-na-sala" cor="marrom" texto={t.inicio.entrar} title={t.inicio.entrarNaSala} tam={24} x={px + 336} y={py + 301} w={160} h={66} onClick={entrar} disabled={ocupado} />
        {erro ? (
          <Texto x={px + 36} y={py + 372} w={pw - 72} tam={15} cor="#B3261E">
            {erro}
          </Texto>
        ) : (
          <Texto x={px + 36} y={py + 378} w={pw - 72} centro tam={15} cor="#7A5A3A" peso={600}>
            {t.inicio.semConta}
          </Texto>
        )}
      </Entrar>
    </>
  )
}
