import { IDIOMAS_PALAVRAS, ehIdioma, type Idioma } from '@arena/words'

export { ehIdioma, type Idioma }

/** Os 6 idiomas da interface (os mesmos das listas de palavras), com as placas do lote 6. */
export const IDIOMAS: { id: Idioma; nome: string; lang: string; placa: string; bandeira: string }[] = IDIOMAS_PALAVRAS.map((id) => ({
  id,
  nome: { pt: 'Português (Brasil)', en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch', it: 'Italiano' }[id],
  lang: id === 'pt' ? 'pt-BR' : id,
  placa: `idiomas/${id}.webp`,
  bandeira: `idiomas/bandeira-${id}.webp`,
}))

export const infoIdioma = (id: Idioma) => IDIOMAS.find((i) => i.id === id) ?? IDIOMAS[0]

/** Primeiro idioma do navegador que o jogo conhece; português quando nenhum serve. */
export function detectarIdioma(lista: readonly string[] | undefined): Idioma {
  for (const l of lista ?? []) {
    const base = l.toLowerCase().split('-')[0]
    if (ehIdioma(base)) return base
  }
  return 'pt'
}
