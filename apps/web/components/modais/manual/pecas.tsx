'use client'
import type { ReactNode } from 'react'
import { IMG } from '@/components/ui'

export const MARROM = '#5A3410'
export const SUAVE = '#7A5A3A'
export const TITULO = '#7E3A12'

/** Uma seção do manual: nome no menu, ícone e conteúdo. */
export type Secao = { nome: string; icone: string; conteudo: () => ReactNode }

// ---------------------------------------------------------------- pecinhas de texto

export function P({ children, tam = 19 }: { children: ReactNode; tam?: number }) {
  return <p style={{ margin: '0 0 14px', fontSize: tam, fontWeight: 700, color: MARROM, lineHeight: 1.35 }}>{children}</p>
}

export function B({ children, cor = TITULO }: { children: ReactNode; cor?: string }) {
  return <strong style={{ color: cor, fontWeight: 900 }}>{children}</strong>
}

/** Linha com uma imagem à esquerda, título e texto. */
export function Linha({ img, iw = 96, ih = 63, titulo, children, cor, cinza }: { img: string; iw?: number; ih?: number; titulo: string; children: ReactNode; cor?: string; cinza?: boolean }) {
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
export function Quadro({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
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

export function Lista({ itens, marca = '•', cor = TITULO }: { itens: ReactNode[]; marca?: string; cor?: string }) {
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
export function Ordem({ palavra, n }: { palavra: string; n: number }) {
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
