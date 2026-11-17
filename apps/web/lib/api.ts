import type { Personagem } from '@arena/platform'
import { identidade } from './identidade'

export async function criarSala(): Promise<string> {
  const r = await fetch('/api/salas', { method: 'POST' })
  const j = await r.json()
  return j.code
}

export type InfoSala = { phase: 'lobby' | 'playing' | 'finished'; players: number; maxPlayers: number }

export async function infoSala(code: string): Promise<InfoSala | null> {
  const r = await fetch(`/api/salas/${code}`, { cache: 'no-store' })
  if (!r.ok) return null
  return r.json()
}

export type ErroEntrada = 'not-found' | 'banned' | 'full' | 'invalid-name' | 'bad-token' | 'no-spectators'

export async function entrarNaSala(
  code: string,
  perfil: { name: string; avatar: Personagem },
): Promise<{ ok: true; name: string; renamed: boolean; phase: string } | { ok: false; error: ErroEntrada }> {
  const { id, token } = identidade()
  const r = await fetch(`/api/salas/${code}/entrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, token, ...perfil }),
  })
  return r.json()
}

export async function acao(code: string, action: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const { id, token } = identidade()
  try {
    const r = await fetch(`/api/salas/${code}/acao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, token, action }),
    })
    return await r.json()
  } catch {
    return { ok: false, error: 'Sem conexão com o servidor.' }
  }
}
