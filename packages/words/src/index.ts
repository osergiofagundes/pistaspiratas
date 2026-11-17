import { geral as geralBruto } from './geral'
import { mar as marBruto } from './mar'
import { normalizar, raiz } from './normalizar'

export { normalizar, raiz }

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
export const palavrasMar = unicas(marBruto)
export const palavrasGeral = unicas(geralBruto, new Set(palavrasMar.map(normalizar)))

export const PALAVRAS: Record<Categoria, string[]> = {
  geral: palavrasGeral,
  mar: palavrasMar,
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
