'use client'
import { useEffect, useState } from 'react'
import { agora } from './sala'

/** Hora do servidor, atualizada a cada `ms` (para relógios e contagens). */
export function useAgora(ms = 250): number {
  const [t, setT] = useState(() => agora())
  useEffect(() => {
    const id = setInterval(() => setT(agora()), ms)
    return () => clearInterval(id)
  }, [ms])
  return t
}
