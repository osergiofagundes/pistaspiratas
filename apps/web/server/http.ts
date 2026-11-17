import { isValidCode, normalizeCode } from '@arena/platform'

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export function codeFrom(raw: string): string | null {
  const code = normalizeCode(raw)
  return isValidCode(code) ? code : null
}

export async function body<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}

export function validId(id: unknown): id is string {
  return typeof id === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(id)
}
