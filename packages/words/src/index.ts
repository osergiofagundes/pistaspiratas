import * as pt from './pt/geral'
import * as ptMar from './pt/mar'
import * as en from './en/geral'
import * as enMar from './en/mar'
import * as es from './es/geral'
import * as esMar from './es/mar'
import * as fr from './fr/geral'
import * as frMar from './fr/mar'
import * as de from './de/geral'
import * as deMar from './de/mar'
import * as it from './it/geral'
import * as itMar from './it/mar'
import { IDIOMAS_PALAVRAS, ehIdioma, normalizar, raiz, type Idioma } from './normalizar'

export { IDIOMAS_PALAVRAS, ehIdioma, normalizar, raiz, type Idioma }

export type Categoria = 'geral' | 'mar'

export const CATEGORIAS: { id: Categoria; nome: string }[] = [
  { id: 'geral', nome: 'Geral' },
  { id: 'mar', nome: 'Mar e Pirataria' },
]

function unicas(lista: string[], excluir: Set<string> = new Set()): string[] {
  const vistas = new Set(excluir)
  const saida: string[] = []
  for (const p of lista) {
    const n = normalizar(p)
    if (vistas.has(n)) continue
    vistas.add(n)
    saida.push(p)
  }
  return saida
}

/** Cada palavra aparece em uma categoria só (a temática tem prioridade). */
function categorias(geral: string[], mar: string[]): Record<Categoria, string[]> {
  const m = unicas(mar)
  return { mar: m, geral: unicas(geral, new Set(m.map(normalizar))) }
}

export const PALAVRAS: Record<Idioma, Record<Categoria, string[]>> = {
  pt: categorias(pt.geral, ptMar.mar),
  en: categorias(en.geral, enMar.mar),
  es: categorias(es.geral, esMar.mar),
  fr: categorias(fr.geral, frMar.mar),
  de: categorias(de.geral, deMar.mar),
  it: categorias(it.geral, itMar.mar),
}

export const palavrasMar = PALAVRAS.pt.mar
export const palavrasGeral = PALAVRAS.pt.geral

/** Lê a lista colada pelo Almirante: vírgula ou quebra de linha, 2 a 20 caracteres, sem duplicadas, até 300. */
export function lerPalavrasPersonalizadas(texto: string): { aceitas: string[]; recusadas: number } {
  const partes = texto
    .split(/[,\n;]+/)
    .map((p) => p.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
  const vistas = new Set<string>()
  const aceitas: string[] = []
  let recusadas = 0
  for (const p of partes) {
    const n = normalizar(p)
    if (p.length < 2 || p.length > 20 || vistas.has(n) || aceitas.length >= 300) {
      recusadas++
      continue
    }
    vistas.add(n)
    aceitas.push(p)
  }
  return { aceitas, recusadas }
}
