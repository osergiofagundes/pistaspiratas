import { rooms } from '@/server/rooms'
import { json } from '@/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Cria uma sala vazia; quem criar e entrar primeiro vira o Almirante. */
export async function POST() {
  const code = await rooms().create()
  return json({ code })
}
