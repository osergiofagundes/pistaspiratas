import { redirect } from 'next/navigation'
import { isValidCode, normalizeCode } from '@arena/platform'
import { Sala } from '@/components/telas/Sala'

export default async function Page({ params }: { params: Promise<{ codigo: string }> }) {
  const code = normalizeCode((await params).codigo)
  if (!isValidCode(code)) redirect('/?erro=nao-encontrada')
  return <Sala code={code} />
}
