import { normalizar, raiz } from '@arena/words'

/** Maior prefixo comum entre duas palavras. */
function prefixoComum(a: string, b: string) {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

/**
 * Validação automática da Ordem do Capitão (9.3), comparando com as palavras
 * ainda não reveladas. Retorna o motivo da recusa ou null.
 */
export function validateClue(
  rawWord: string,
  count: number,
  hiddenWords: string[],
  treasuresLeft: number,
): string | null {
  const word = rawWord.trim()
  if (!word) return 'Digite uma palavra.'
  if (/\s/.test(word)) return 'A dica precisa ser uma palavra só.'
  const n = normalizar(word)
  if (!/^[a-z]+(-[a-z]+)*$/.test(n)) return 'A dica só pode ter letras e hífen.'
  if (n.length < 2) return 'A dica precisa ter pelo menos 2 letras.'
  if (n.length > 24) return 'A dica é longa demais.'
  if (!Number.isInteger(count) || count < 1) return 'O número precisa ser pelo menos 1.'
  if (count > treasuresLeft)
    return `O número vai de 1 até ${treasuresLeft} (os tesouros que faltam).`

  const r = raiz(n)
  for (const original of hiddenWords) {
    const w = normalizar(original)
    const upper = original.toUpperCase()
    if (w === n) return `Dica inválida: ${upper} está no tabuleiro.`
    if (raiz(w) === r) return `Dica inválida: é plural ou singular de ${upper}.`
    const [curta, longa] = w.length <= n.length ? [w, n] : [n, w]
    if (curta.length >= 4 && longa.includes(curta))
      return `Dica inválida: contém ou está contida em ${upper}.`
    const p = prefixoComum(w, n)
    if (curta.length >= 4 && p >= Math.max(5, curta.length - 1))
      return `Dica inválida: muito parecida com ${upper}.`
  }
  return null
}
