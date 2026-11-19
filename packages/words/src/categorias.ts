/** Categorias de palavras, na ordem em que aparecem na tela. */
export const CATEGORIA_IDS = [
  'geral',
  'mar',
  'brasil',
  'pop',
  'infantil',
  'filmes',
  'series',
  'desenhos',
  'animais',
  'comidas',
  'esportes',
  'profissoes',
  'games',
  'musica',
  'fantasia',
  'ciencia',
  'lugares',
] as const

export type Categoria = (typeof CATEGORIA_IDS)[number]

/** Nomes em português (as telas usam o dicionário do idioma do jogador). */
export const CATEGORIAS: { id: Categoria; nome: string }[] = [
  { id: 'geral', nome: 'Geral' },
  { id: 'mar', nome: 'Mar e Pirataria' },
  { id: 'brasil', nome: 'Brasil' },
  { id: 'pop', nome: 'Cultura pop' },
  { id: 'infantil', nome: 'Infantil' },
  { id: 'filmes', nome: 'Filmes' },
  { id: 'series', nome: 'Séries' },
  { id: 'desenhos', nome: 'Desenhos' },
  { id: 'animais', nome: 'Animais' },
  { id: 'comidas', nome: 'Comidas' },
  { id: 'esportes', nome: 'Esportes' },
  { id: 'profissoes', nome: 'Profissões' },
  { id: 'games', nome: 'Games' },
  { id: 'musica', nome: 'Música' },
  { id: 'fantasia', nome: 'Fantasia e Mitologia' },
  { id: 'ciencia', nome: 'Ciência e Espaço' },
  { id: 'lugares', nome: 'Lugares do mundo' },
]

export function ehCategoria(x: unknown): x is Categoria {
  return typeof x === 'string' && (CATEGORIA_IDS as readonly string[]).includes(x)
}

/** Listas de um idioma, uma por categoria. */
export type ListasDoIdioma = Record<Categoria, string[]>
