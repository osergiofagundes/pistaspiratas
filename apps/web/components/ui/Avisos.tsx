'use client'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSala } from '@/lib/sala'

/** Faixa curta no topo para erros de ação e avisos da sala ("Link copiado!", "Ana agora é o Almirante"). */
export function Avisos({ extra }: { extra?: { texto: string; seq: number } | null }) {
  const erro = useSala((s) => s.erro)
  const notice = useSala((s) => s.view?.notice)
  const [atual, setAtual] = useState<{ texto: string; tipo: 'erro' | 'info'; id: string } | null>(null)

  useEffect(() => {
    if (erro) setAtual({ texto: erro.texto, tipo: 'erro', id: `e${erro.seq}` })
  }, [erro])
  useEffect(() => {
    if (notice) setAtual({ texto: notice.text, tipo: 'info', id: `n${notice.id}` })
  }, [notice?.id])
  useEffect(() => {
    if (extra) setAtual({ texto: extra.texto, tipo: 'info', id: `x${extra.seq}` })
  }, [extra?.seq])
  useEffect(() => {
    if (!atual) return
    const t = setTimeout(() => setAtual(null), 3200)
    return () => clearTimeout(t)
  }, [atual?.id])

  return (
    <AnimatePresence>
      {atual && (
        <motion.div
          key={atual.id}
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="lilita"
          style={{
            position: 'absolute',
            left: '50%',
            top: 120,
            zIndex: 80,
            padding: '10px 26px',
            borderRadius: 999,
            fontSize: 22,
            color: '#FFF8EC',
            background: atual.tipo === 'erro' ? 'rgba(140,30,22,.95)' : 'rgba(43,26,15,.95)',
            border: `3px solid ${atual.tipo === 'erro' ? '#FF7A68' : '#C98A3A'}`,
            boxShadow: '0 6px 18px rgba(0,0,0,.45)',
            whiteSpace: 'nowrap',
            x: '-50%',
          }}
        >
          {atual.texto}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
