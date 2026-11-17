'use client'
import { useEffect } from 'react'
import { type FaixaNome, tocarMusica } from './musica'

/** Liga a faixa da tela. A música continua entre telas e só troca quando a faixa muda. */
export function useMusica(faixa: FaixaNome) {
  useEffect(() => {
    tocarMusica(faixa)
  }, [faixa])
}
