import { rooms } from '@/server/rooms'
import { codeFrom, json } from '@/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Informações públicas da sala, usadas antes de entrar (existe? está cheia? em partida?). */
export async function GET(_req: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const code = codeFrom((await params).codigo)
  if (!code) return json({ error: 'invalid' }, 400)
  const info = await rooms().info(code)
  if (!info) return json({ error: 'not-found' }, 404)
  return json(info)
}
