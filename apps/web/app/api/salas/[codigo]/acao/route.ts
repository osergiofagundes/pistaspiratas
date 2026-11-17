import { rooms } from '@/server/rooms'
import { body, codeFrom, json, validId } from '@/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// limite simples de ações por segundo por jogador (10.4)
const g = globalThis as unknown as { __arenaRate?: Map<string, number[]> }
const rate = (g.__arenaRate ??= new Map<string, number[]>())

function limited(id: string): boolean {
  const now = Date.now()
  const list = (rate.get(id) ?? []).filter((t) => now - t < 1000)
  list.push(now)
  rate.set(id, list)
  return list.length > 12
}

export async function POST(req: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const code = codeFrom((await params).codigo)
  if (!code) return json({ ok: false, error: 'Sala não encontrada.' }, 404)
  const b = await body<{ id: string; token: string; action: { type: string } }>(req)
  if (!b || !validId(b.id) || typeof b.token !== 'string' || !b.action || typeof b.action.type !== 'string')
    return json({ ok: false, error: 'Pedido inválido.' }, 400)
  if (limited(b.id)) return json({ ok: false, error: 'Calma, marujo! Muitas ações seguidas.' }, 429)
  const res = await rooms().act(code, b.id, b.token, b.action as never)
  return json(res, res.ok ? 200 : 400)
}
