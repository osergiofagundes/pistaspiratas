import { describe, expect, it } from 'vitest'
import { IDIOMAS_PALAVRAS, PALAVRAS, normalizar, raiz } from './index'

describe('listas de palavras', () => {
  for (const idioma of IDIOMAS_PALAVRAS) {
    it(`${idioma}: listas grandes, sem repetidas e só com letras e hífen`, () => {
      const { geral, mar } = PALAVRAS[idioma]
      expect(geral.length).toBeGreaterThanOrEqual(400)
      expect(mar.length).toBeGreaterThanOrEqual(80)
      const todas = [...geral, ...mar].map(normalizar)
      expect(new Set(todas).size).toBe(todas.length)
      for (const n of todas) expect(n).toMatch(/^[a-z]+(-[a-z]+)*$/)
    })
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
