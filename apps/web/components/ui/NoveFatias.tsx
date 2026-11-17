import type { CSSProperties } from 'react'
import type { Fatia } from './fatias'

/**
 * Desenha uma imagem esticável em 9 partes (ou 3, quando não há fatia em cima e embaixo)
 * com divs separadas. Diferente do border-image, cada parte do meio avança 1 px sobre as
 * vizinhas, então não aparecem frestas quando o palco está escalado.
 *
 * Cada parte mostra só o seu retângulo da imagem: com background-size = W/sw·100% e
 * background-position = sx/(W−sw)·100%, o recorte independe do tamanho final da parte.
 */
export function NoveFatias({ f, escala, img }: { f: Omit<Fatia, 'src'> & { src?: string }; escala: number; img?: string }) {
  const dt = Math.round(f.t * escala)
  const db = Math.round(f.b * escala)
  const dl = Math.round(f.l * escala)
  const dr = Math.round(f.r * escala)
  const meioW = f.w - f.l - f.r
  const meioH = f.h - f.t - f.b

  // colunas e linhas: [início no destino, largura no destino, início na imagem, largura na imagem]
  type Faixa = { pos: CSSProperties; s: number; sw: number; meio: boolean }
  const cols: Faixa[] = [
    { pos: { left: 0, width: dl }, s: 0, sw: f.l, meio: false },
    { pos: { left: dl - 1, width: `calc(100% - ${dl + dr - 2}px)` }, s: f.l, sw: meioW, meio: true },
    { pos: { right: 0, width: dr }, s: f.w - f.r, sw: f.r, meio: false },
  ]
  const rows: Faixa[] =
    f.t === 0 && f.b === 0
      ? [{ pos: { top: 0, height: '100%' }, s: 0, sw: f.h, meio: false }]
      : [
          { pos: { top: 0, height: dt }, s: 0, sw: f.t, meio: false },
          { pos: { top: dt - 1, height: `calc(100% - ${dt + db - 2}px)` }, s: f.t, sw: meioH, meio: true },
          { pos: { bottom: 0, height: db }, s: f.h - f.b, sw: f.b, meio: false },
        ]

  const pct = (s: number, sw: number, total: number) => (total === sw ? 0 : (s / (total - sw)) * 100)
  const partes: { key: string; style: CSSProperties; ordem: number }[] = []
  rows.forEach((r, i) =>
    cols.forEach((c, j) => {
      if (c.sw <= 0 || r.sw <= 0) return
      partes.push({
        key: `${i}${j}`,
        // meio primeiro, bordas depois, cantos por cima
        ordem: (c.meio ? 0 : 1) + (r.meio || rows.length === 1 ? 0 : 1),
        style: {
          position: 'absolute',
          ...c.pos,
          ...r.pos,
          backgroundImage: 'var(--img)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${(f.w / c.sw) * 100}% ${(f.h / r.sw) * 100}%`,
          backgroundPosition: `${pct(c.s, c.sw, f.w)}% ${pct(r.s, r.sw, f.h)}%`,
        },
      })
    }),
  )
  partes.sort((a, b) => a.ordem - b.ordem)

  return (
    <div
      aria-hidden
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...(img ? ({ '--img': `url(${img})` } as CSSProperties) : {}) }}
    >
      {partes.map((p) => (
        <div key={p.key} style={p.style} />
      ))}
    </div>
  )
}
