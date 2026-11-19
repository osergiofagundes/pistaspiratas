'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Palco, Texto } from '@/components/ui'
import { BotaoIdioma, BotaoPreferencias, ModalInfo, ModalPerfil } from '@/components/modais/comuns'
import { useT } from '@/lib/i18n'
import { entrarNaSala, type ErroEntrada } from '@/lib/api'
import { perfil as lerPerfil, salvarPerfil, type Perfil } from '@/lib/identidade'
import { conectar, desconectar, useSala } from '@/lib/sala'
import { Salao } from './Salao'
import { Partida } from './Partida'
import { Fim } from './Fim'

type Etapa = 'perfil' | 'entrando' | 'dentro' | { erro: ErroEntrada | 'kicked' | 'expired' | 'not-member' }

/** Página da sala: perfil, entrada, conexão em tempo real e a tela de cada fase. */
export function Sala({ code }: { code: string }) {
  const router = useRouter()
  const [etapa, setEtapa] = useState<Etapa>('entrando')
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [erroNome, setErroNome] = useState(false)
  const [gaivota, setGaivota] = useState(false)
  const view = useSala((s) => s.view)
  const fechado = useSala((s) => s.fechado)
  const conectado = useSala((s) => s.conectado)
  const tentou = useRef(false)
  const t = useT()

  const entrar = async (p: Perfil) => {
    setEtapa('entrando')
    const r = await entrarNaSala(code, p)
    if (!r.ok) {
      if (r.error === 'invalid-name') {
        setErroNome(true)
        setEtapa('perfil')
        return
      }
      setEtapa({ erro: r.error })
      return
    }
    if (r.renamed) salvarPerfil({ ...p, name: r.name })
    if (r.phase !== 'lobby') setGaivota(true)
    setEtapa('dentro')
    conectar(code)
  }

  useEffect(() => {
    if (tentou.current) return
    tentou.current = true
    const p = lerPerfil()
    setPerfil(p)
    if (p) void entrar(p)
    else setEtapa('perfil')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  // sempre fecha o canal e limpa o store ao sair da tela (fora do efeito protegido por "tentou")
  useEffect(() => () => desconectar(), [])

  useEffect(() => {
    // ignora um fechamento que sobrou de outra sala
    if (!fechado || useSala.getState().code !== code) return
    if (fechado === 'left') router.push('/')
    else setEtapa({ erro: fechado === 'not-found' ? 'not-found' : fechado })
  }, [fechado, router, code])

  if (typeof etapa === 'object') {
    const m = t.sala.erros[etapa.erro] ?? t.sala.erros['not-found']
    return (
      <Palco fundo="fundo-salao" escurecer={0.35}>
        <BotaoIdioma x={1726} y={42} />
        <BotaoPreferencias x={1804} y={42} />
        <ModalInfo titulo={m.titulo} texto={m.texto} botao={t.sala.voltarInicio} onFechar={() => router.push('/')} />
      </Palco>
    )
  }

  if (etapa === 'perfil') {
    return (
      <Palco fundo="fundo-salao" escurecer={0.35}>
        <BotaoIdioma x={1726} y={42} />
        <BotaoPreferencias x={1804} y={42} />
        <Texto x={0} y={120} w={1920} centro titulo tam={40} cor="#FFF8EC" contorno>
          {t.sala.convidado(code)}
        </Texto>
        <ModalPerfil
          inicial={perfil}
          onConfirmar={(p) => {
            salvarPerfil(p)
            setPerfil(p)
            setErroNome(false)
            void entrar(p)
          }}
        />
        {erroNome && (
          <Texto x={0} y={980} w={1920} centro tam={22} cor="#FFB4A8" className="contorno-fino">
            {t.sala.nomeInvalido}
          </Texto>
        )}
      </Palco>
    )
  }

  if (!view) {
    return (
      <Palco fundo="fundo-salao" escurecer={0.35}>
        <BotaoIdioma x={1726} y={42} />
        <BotaoPreferencias x={1804} y={42} />
        <Texto x={0} y={500} w={1920} centro titulo tam={44} cor="#FFF8EC" contorno>
          {t.sala.icando}
        </Texto>
      </Palco>
    )
  }

  return (
    <>
      {view.phase === 'lobby' && <Salao view={view} />}
      {view.phase === 'playing' && (
        <Partida
          view={view}
          extra={
            gaivota && (
              <ModalInfo
                titulo={t.sala.emAndamento}
                texto={t.sala.emAndamentoTexto}
                botao={t.sala.assistir}
                onFechar={() => setGaivota(false)}
              />
            )
          }
        />
      )}
      {view.phase === 'finished' && <Fim view={view} />}
      {!conectado && (
        <div
          className="lilita"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 18,
            transform: 'translateX(-50%)',
            background: 'rgba(140,30,22,.95)',
            color: '#FFF8EC',
            padding: '8px 20px',
            borderRadius: 999,
            zIndex: 100,
            fontSize: 18,
          }}
        >
          {t.sala.reconectando}
        </div>
      )}
    </>
  )
}
