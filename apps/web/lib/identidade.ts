import type { Personagem } from '@arena/platform'

/** Identificador anônimo e token secreto do navegador (6.2), guardados no localStorage. */
export type Identidade = { id: string; token: string }
export type Perfil = { name: string; avatar: Personagem }

function aleatorio(bytes: number): string {
  const a = new Uint8Array(bytes)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}

function ler<T>(chave: string): T | null {
  try {
    const v = localStorage.getItem(chave)
    return v ? (JSON.parse(v) as T) : null
  } catch {
    return null
  }
}

function gravar(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
  } catch {}
}

export function identidade(): Identidade {
  const atual = ler<Identidade>('arena.identidade')
  if (atual?.id && atual?.token) return atual
  const nova = { id: aleatorio(12), token: aleatorio(24) }
  gravar('arena.identidade', nova)
  return nova
}

export function perfil(): Perfil | null {
  return ler<Perfil>('arena.perfil')
}

export function salvarPerfil(p: Perfil) {
  gravar('arena.perfil', p)
}

/** Volumes de 0 a 1; mudo silencia tudo (ícone de som). */
export type Preferencias = { efeitos: number; musica: number; mudo: boolean; animacoes: boolean; lembrete: boolean }
export const PREFS_PADRAO: Preferencias = { efeitos: 0.8, musica: 0.5, mudo: false, animacoes: true, lembrete: true }

const limitar = (n: unknown, padrao: number) => (typeof n === 'number' && isFinite(n) ? Math.min(1, Math.max(0, n)) : padrao)

export function preferencias(): Preferencias {
  const salvo = ler<Partial<Preferencias> & { som?: boolean }>('arena.preferencias') ?? {}
  return {
    efeitos: limitar(salvo.efeitos, PREFS_PADRAO.efeitos),
    musica: limitar(salvo.musica, PREFS_PADRAO.musica),
    // a versão antiga guardava só "som: false"
    mudo: typeof salvo.mudo === 'boolean' ? salvo.mudo : salvo.som === false,
    animacoes: salvo.animacoes ?? PREFS_PADRAO.animacoes,
    lembrete: salvo.lembrete ?? PREFS_PADRAO.lembrete,
  }
}

export function salvarPreferencias(p: Preferencias) {
  gravar('arena.preferencias', p)
}
