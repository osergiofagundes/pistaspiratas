/** Minúsculas, sem acento e sem espaços nas pontas. Usada para comparar palavras. */
export function normalizar(palavra: string): string {
  return palavra
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Raiz aproximada para comparar singular e plural em português
 * (navio/navios, leão/leões, animal/animais, papel/papéis, homem/homens).
 */
export function raiz(palavra: string): string {
  let p = normalizar(palavra)
  const regras: [RegExp, string][] = [
    [/oes$/, 'ao'],
    [/aes$/, 'ao'],
    [/ais$/, 'al'],
    [/eis$/, 'el'],
    [/ois$/, 'ol'],
    [/uis$/, 'ul'],
    [/ns$/, 'm'],
    [/(r|z|s)es$/, '$1'],
    [/s$/, ''],
  ]
  for (const [re, sub] of regras) {
    if (re.test(p) && p.length > 3) {
      p = p.replace(re, sub)
      break
    }
  }
  return p
}
