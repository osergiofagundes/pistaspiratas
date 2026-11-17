import type { Personagem } from '@arena/platform'
import { rooms } from '@/server/rooms'
import { body, codeFrom, json, validId } from '@/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = { id: string; token: string; name: string; avatar: Personagem }

export async function POST(req: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const code = codeFrom((await params).codigo)
  if (!code) return json({ ok: false, error: 'not-found' }, 404)
  const b = await body<Body>(req)
  if (!b || !validId(b.id) || typeof b.token !== 'string' || b.token.length < 16)
    return json({ ok: false, error: 'bad-token' }, 400)
  const res = await rooms().join(code, b.id, b.token, { name: String(b.name ?? ''), avatar: b.avatar })
  return json(res, res.ok ? 200 : res.error === 'not-found' ? 404 : 409)
}
