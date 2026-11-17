import { Inicio } from '@/components/telas/Inicio'

const ERROS: Record<string, string> = {
  'nao-encontrada': 'Não achamos essa sala. Confira o código com o Almirante.',
  encerrada: 'Essa sala foi encerrada.',
}

export default async function Page({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams
  return <Inicio erroInicial={erro ? (ERROS[erro] ?? null) : null} />
}
