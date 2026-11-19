/** Idiomas com lista de palavras (e regra de plural) próprias. */
export type Idioma = 'pt' | 'en' | 'es' | 'fr' | 'de' | 'it'
export const IDIOMAS_PALAVRAS: Idioma[] = ['pt', 'en', 'es', 'fr', 'de', 'it']

export function ehIdioma(x: unknown): x is Idioma {
  return typeof x === 'string' && (IDIOMAS_PALAVRAS as string[]).includes(x)
}

/** Minúsculas, sem acento e sem espaços nas pontas. Usada para comparar palavras. */
export function normalizar(palavra: string): string {
  return palavra
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

type Regras = [RegExp, string][]

/** Regras de singular/plural por idioma: a primeira que casar é aplicada. */
const REGRAS: Record<Idioma, Regras> = {
  // navio/navios, leão/leões, animal/animais, papel/papéis, homem/homens
  pt: [
    [/oes$/, 'ao'],
    [/aes$/, 'ao'],
    [/ais$/, 'al'],
    [/eis$/, 'el'],
    [/ois$/, 'ol'],
    [/uis$/, 'ul'],
    [/ns$/, 'm'],
    [/(r|z|s)es$/, '$1'],
    [/s$/, ''],
  ],
  // cat/cats, box/boxes, city/cities, wolf/wolves
  en: [
    [/ies$/, 'y'],
    [/ves$/, 'f'],
    [/(s|x|z|ch|sh)es$/, '$1'],
    [/s$/, ''],
  ],
  // gato/gatos, flor/flores, pez/peces
  es: [
    [/ces$/, 'z'],
    [/([^aeiou])es$/, '$1'],
    [/s$/, ''],
  ],
  // chat/chats, bateau/bateaux, cheval/chevaux, nez/nez
  fr: [
    [/eaux$/, 'eau'],
    [/aux$/, 'al'],
    [/(s|x)$/, ''],
  ],
  // Hund/Hunde, Blume/Blumen, Kind/Kinder, Auto/Autos (aproximação)
  de: [
    [/en$/, ''],
    [/er$/, ''],
    [/e$/, ''],
    [/n$/, ''],
    [/s$/, ''],
  ],
  // gatto/gatti, casa/case, fiore/fiori: tira a vogal final
  it: [
    [/(c|g)h[ie]$/, '$1'],
    [/[aeio]$/, ''],
  ],
}

/** Raiz aproximada para comparar singular e plural no idioma das palavras. */
export function raiz(palavra: string, idioma: Idioma = 'pt'): string {
  let p = normalizar(palavra)
  for (const [re, sub] of REGRAS[idioma] ?? REGRAS.pt) {
    if (re.test(p) && p.length > 3) {
      p = p.replace(re, sub)
      break
    }
  }
  return p
}
