import { pt } from './pt'
import { en } from './en'
import { es } from './es'
import { fr } from './fr'
import { de } from './de'
import { it } from './it'
import { IDIOMAS_PALAVRAS, ehIdioma, normalizar, raiz, type Idioma } from './normalizar'
import type { Categoria, ListasDoIdioma } from './categorias'

export { IDIOMAS_PALAVRAS, ehIdioma, normalizar, raiz, type Idioma }
export { CATEGORIA_IDS, CATEGORIAS, ehCategoria, type Categoria } from './categorias'

function unicas(lista: string[]): string[] {
  const vistas = new Set<string>()
  const saida: string[] = []
  for (const p of lista) {
    const n = normalizar(p)
    if (vistas.has(n)) continue
    vistas.add(n)
    saida.push(p)
  }
  return saida
}

/**
 * Cada lista tira só as suas repetidas: uma palavra pode estar em duas categorias
 * (Vilão em Filmes e em Desenhos); o sorteio evita a repetição na mesa.
 */
function limpar(listas: ListasDoIdioma): Record<Categoria, string[]> {
  return Object.fromEntries(Object.entries(listas).map(([id, lista]) => [id, unicas(lista)])) as Record<Categoria, string[]>
}

export const PALAVRAS: Record<Idioma, Record<Categoria, string[]>> = {
  pt: limpar(pt),
  en: limpar(en),
  es: limpar(es),
  fr: limpar(fr),
  de: limpar(de),
  it: limpar(it),
}

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
