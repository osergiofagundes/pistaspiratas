'use client'
import { useCallback, useEffect } from 'react'
import { Palco } from '@/components/ui'
import { Guia } from '@/components/jogo/Guia'
import { DICIONARIOS, useT } from '@/lib/i18n'
import { perfil as lerPerfil, preferencias } from '@/lib/identidade'
import { useSala } from '@/lib/sala'
import { definirTextoSiga, encerrarTutorial, iniciarTutorial, useTutorial } from '@/lib/tutorial'
import { Partida } from './Partida'

/** Tutorial: a tela de partida de verdade, com navios simulados e o José guiando. */
export function Tutorial() {
  const view = useSala((s) => s.view)
  const rodada = useTutorial((s) => s.rodada)
  const t = useT()

  useEffect(() => {
    definirTextoSiga(t.tutorial.siga)
  }, [t])

  // as preferências ainda podem não estar no store: o idioma vem direto do navegador
  const comecar = useCallback(() => {
    const idioma = preferencias().idioma
    const p = lerPerfil()
    iniciarTutorial(idioma, p ?? { name: DICIONARIOS[idioma].personagens.grumete, avatar: 'grumete' })
  }, [])

  useEffect(() => {
    comecar()
    return () => encerrarTutorial()
  }, [comecar])

  if (!view?.game) return <Palco fundo="fundo-partida">{null}</Palco>
  return <Partida key={rodada} view={view} extra={<Guia onRepetir={comecar} />} />
}
