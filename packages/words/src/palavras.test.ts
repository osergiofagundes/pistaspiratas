import { describe, expect, it } from 'vitest'
import { CATEGORIAS, CATEGORIA_IDS, IDIOMAS_PALAVRAS, PALAVRAS, ehCategoria, normalizar, raiz } from './index'

describe('listas de palavras', () => {
  it('toda categoria existe em todos os idiomas', () => {
    expect(CATEGORIAS.map((c) => c.id)).toEqual([...CATEGORIA_IDS])
    for (const idioma of IDIOMAS_PALAVRAS) expect(Object.keys(PALAVRAS[idioma]).sort()).toEqual([...CATEGORIA_IDS].sort())
  })

  it('ehCategoria', () => {
    expect(ehCategoria('filmes')).toBe(true)
    expect(ehCategoria('xx')).toBe(false)
    expect(ehCategoria(3)).toBe(false)
  })

  for (const idioma of IDIOMAS_PALAVRAS) {
    for (const cat of CATEGORIA_IDS) {
      it(`${idioma}/${cat}: lista grande, sem repetidas e só com letras e hífen`, () => {
        const lista = PALAVRAS[idioma][cat]
        // uma categoria sozinha precisa encher o maior tabuleiro (10×10), sem repetir raiz
        expect(lista.length).toBeGreaterThanOrEqual(cat === 'geral' ? 400 : cat === 'mar' ? 80 : 110)
        const normais = lista.map(normalizar)
        for (const n of normais) expect(n).toMatch(/^[a-z]+(-[a-z]+)*$/)
        expect(new Set(normais.map((n) => raiz(n, idioma))).size).toBeGreaterThanOrEqual(cat === 'mar' ? 80 : 100)
      })
    }
  }
})

describe('normalizar', () => {
  it('troca ß, œ e æ e tira acentos', () => {
    expect(normalizar('Fuß')).toBe('fuss')
    expect(normalizar('Œuf')).toBe('oeuf')
    expect(normalizar('Ægide')).toBe('aegide')
    expect(normalizar('Espanõl')).toBe('espanol')
  })
})

describe('raiz por idioma', () => {
  const pares: [Parameters<typeof raiz>[1], string, string][] = [
    ['pt', 'Navio', 'Navios'],
    ['pt', 'Leão', 'Leões'],
    ['en', 'Cat', 'Cats'],
    ['en', 'City', 'Cities'],
    ['en', 'Box', 'Boxes'],
    ['en', 'Wolf', 'Wolves'],
    ['es', 'Gato', 'Gatos'],
    ['es', 'Flor', 'Flores'],
    ['es', 'Pez', 'Peces'],
    ['fr', 'Chat', 'Chats'],
    ['fr', 'Bateau', 'Bateaux'],
    ['fr', 'Cheval', 'Chevaux'],
    ['de', 'Hund', 'Hunde'],
    ['de', 'Blume', 'Blumen'],
    ['de', 'Kind', 'Kinder'],
    ['de', 'Auto', 'Autos'],
    ['de', 'Wand', 'Wände'],
    ['it', 'Gatto', 'Gatti'],
    ['it', 'Casa', 'Case'],
    ['it', 'Cuoco', 'Cuochi'],
  ]
  for (const [idioma, singular, plural] of pares)
    it(`${idioma}: ${singular} / ${plural}`, () => expect(raiz(plural, idioma)).toBe(raiz(singular, idioma)))

  it('palavras diferentes continuam diferentes', () => {
    expect(raiz('Cat', 'en')).not.toBe(raiz('Car', 'en'))
    expect(raiz('Gatto', 'it')).not.toBe(raiz('Gallo', 'it'))
  })
})
