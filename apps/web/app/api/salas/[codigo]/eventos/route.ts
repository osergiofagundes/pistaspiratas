import { rooms } from '@/server/rooms'
import { codeFrom } from '@/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Canal de tempo real (Server-Sent Events): o servidor manda a visão filtrada da sala
 * a cada mudança. O navegador reconecta sozinho se a conexão cair, e recebe o estado
 * completo ao voltar. As ações vão por POST em /acao.
 */
export async function GET(req: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const code = codeFrom((await params).codigo)
  const url = new URL(req.url)
  const id = url.searchParams.get('id') ?? ''
  const token = url.searchParams.get('token') ?? ''
  const encoder = new TextEncoder()
  let cleanup: (() => void) | null = null
  let ping: ReturnType<typeof setInterval> | undefined
  let closed = false

  const stop = () => {
    if (closed) return
    closed = true
    if (ping) clearInterval(ping)
    cleanup?.()
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (text: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(text))
        } catch {
          stop()
        }
      }
      const send = (msg: { type: string }) => {
        write(`data: ${JSON.stringify(msg)}\n\n`)
        if (msg.type === 'closed') {
          stop()
          try {
            controller.close()
          } catch {}
        }
      }
      write('retry: 1500\n\n')
      if (!code) {
        send({ type: 'error', message: 'not-found' } as never)
        closed = true
        controller.close()
        return
      }
      const exists = await rooms().exists(code)
      cleanup = exists ? await rooms().connect(code, id, token, send as never) : null
      if (!cleanup) {
        send({ type: 'error', message: exists ? 'not-member' : 'not-found' } as never)
        closed = true
        controller.close()
        return
      }
      ping = setInterval(() => write(': ping\n\n'), 15_000)
      req.signal.addEventListener('abort', () => {
        stop()
        try {
          controller.close()
        } catch {}
      })
    },
    cancel() {
      stop()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
