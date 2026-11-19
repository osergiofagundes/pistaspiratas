import { ehIdioma } from '@arena/words'
import { rooms } from '@/server/rooms'
import { json } from '@/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Cria uma sala vazia; quem criar e entrar primeiro vira o Almirante. As palavras saem no idioma de quem criou. */
export async function POST(req: Request) {
  const corpo = (await req.json().catch(() => null)) as { idioma?: unknown } | null
  const code = await rooms().create(ehIdioma(corpo?.idioma) ? { wordLanguage: corpo.idioma } : undefined)
  return json({ code })
}
