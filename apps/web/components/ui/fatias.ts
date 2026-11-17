/**
 * Medidas das peças que esticam (de assets/interface/fatias.json), em px do WebP servido.
 * t, r, b, l = fatias de cima, direita, baixo e esquerda.
 */
export type Fatia = { src: string; w: number; h: number; t: number; r: number; b: number; l: number }

const M = '/img/interface/molduras'

/** Moldura padrão dos painéis e modais (desenhada a 25%). */
export const MOLDURA: Fatia = { src: `${M}/moldura.webp`, w: 1000, h: 1136, t: 282, r: 224, b: 110, l: 224 }
/** Painel grande das configurações (desenhado a 25%). */
export const PAINEL_GRANDE: Fatia = { src: `${M}/painel-grande.webp`, w: 960, h: 1174, t: 560, r: 330, b: 314, l: 330 }
/** Placa de madeira dos títulos (3 partes). */
export const PLACA: Fatia = { src: `${M}/placa.webp`, w: 750, h: 305, t: 0, r: 100, b: 0, l: 105 }
/** Campo de texto (3 partes, 10% de cada lado). */
export const CAMPO: Fatia = { src: `${M}/campo.webp`, w: 1100, h: 303, t: 0, r: 110, b: 0, l: 110 }

export type CorBotao = 'verde' | 'azul' | 'amarelo' | 'vermelho' | 'marrom' | 'cinza' | 'pequeno-verde' | 'pequeno-marrom'

/** Botões de 3 partes; a imagem vem de var(--img), trocada por CSS em hover, pressionado e desativado. */
export const BOTOES: Record<CorBotao, Omit<Fatia, 'src'>> = {
  verde: { w: 482, h: 459, t: 0, r: 176, b: 0, l: 176 },
  azul: { w: 374, h: 436, t: 0, r: 147, b: 0, l: 147 },
  amarelo: { w: 374, h: 438, t: 0, r: 96, b: 0, l: 96 },
  vermelho: { w: 488, h: 430, t: 0, r: 130, b: 0, l: 130 },
  marrom: { w: 397, h: 428, t: 0, r: 181, b: 0, l: 187 },
  cinza: { w: 315, h: 319, t: 0, r: 86, b: 0, l: 98 },
  'pequeno-verde': { w: 298, h: 248, t: 0, r: 89, b: 0, l: 88 },
  'pequeno-marrom': { w: 157, h: 243, t: 0, r: 63, b: 0, l: 59 },
}
