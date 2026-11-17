import type { Rng } from './types'

/** Gerador determinístico (mulberry32), útil nos testes. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(list: readonly T[], rng: Rng): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pick<T>(list: readonly T[], rng: Rng): T | undefined {
  if (list.length === 0) return undefined
  return list[Math.floor(rng() * list.length)]
}

/** 6 caracteres sem letras ambíguas (sem 0/O e 1/I). */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function roomCode(rng: Rng): string {
  let s = ''
  for (let i = 0; i < 6; i++) s += ALFABETO[Math.floor(rng() * ALFABETO.length)]
  return s
}

export function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}

export function isValidCode(code: string): boolean {
  return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(code)
}

const OFENSIVOS = [
  'porra', 'caralho', 'buceta', 'puta', 'merda', 'viado', 'arrombado', 'foder', 'fodase', 'cuzao',
  'piroca', 'xoxota', 'vagabunda', 'otario', 'babaca', 'retardado', 'macaco preto', 'nazista', 'hitler',
]

function semAcento(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Valida o nome: 2 a 16 caracteres e sem palavras ofensivas. Retorna o erro ou null. */
export function validateName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, ' ')
  if (name.length < 2) return 'O nome precisa ter pelo menos 2 letras.'
  if (name.length > 16) return 'O nome pode ter no máximo 16 letras.'
  const flat = semAcento(name).replace(/[^a-z ]/g, '')
  const junto = flat.replace(/ /g, '')
  if (OFENSIVOS.some((w) => flat.includes(w) || junto.includes(w.replace(/ /g, ''))))
    return 'Escolha outro nome, por favor.'
  return null
}

export function cleanName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, 16)
}

/** Nome único na sala: se já existir, sugere "Nome 2", "Nome 3"… */
export function uniqueName(name: string, taken: string[]): string {
  const set = new Set(taken.map(semAcento))
  if (!set.has(semAcento(name))) return name
  for (let i = 2; i < 100; i++) {
    const base = name.slice(0, 16 - String(i).length - 1)
    const candidate = `${base} ${i}`
    if (!set.has(semAcento(candidate))) return candidate
  }
  return name
}
