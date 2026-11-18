import { SHIP_INFO, type ShipId } from '@arena/platform'
import type { CodenomesView, EndReason, LogEntry, Owner } from '@arena/codenomes'

export function nomeNavio(view: CodenomesView | null, id: ShipId): string {
  return view?.ships.find((s) => s.id === id)?.name ?? SHIP_INFO[id].nome
}

export function corDono(owner: Owner): string {
  if (owner === 'mar') return '#4C7A96'
  if (owner === 'kraken') return '#6B3FA0'
  return SHIP_INFO[owner].cor
}

export function rotuloDono(view: CodenomesView, owner: Owner): string {
  if (owner === 'mar') return 'Mar Aberto'
  if (owner === 'kraken') return 'Kraken!'
  return `Tesouro ${nomeNavio(view, owner)}`
}

const FIM: Record<EndReason, string> = {
  mar: 'caiu no Mar Aberto · vez encerrada',
  outro: 'achou tesouro de outro navio',
  eliminado: 'armadilha de navio afundado',
  kraken: 'encontrou o Kraken',
  encerrou: 'vez encerrada',
  tempo: 'acabou o tempo',
  tempoCapitao: 'o Capitão perdeu o tempo',
  todos: 'acertou tudo · vez encerrada',
  canhao: 'vez encerrada',
  semCanhao: 'abriu mão do canhão',
  semMarujos: 'vez pulada',
  vitoria: 'fim de jogo',
  encerrada: 'partida encerrada',
}

/** Rodapé de uma entrada do Diário, por exemplo "3 de 3 + canhão · vez encerrada". */
export function resumoEntrada(e: LogEntry, ativo: boolean, view: CodenomesView): string {
  if (ativo && !e.clue) {
    const nome = e.captainName || 'Capitão'
    return `${nome} pensando na dica…`
  }
  const normais = e.picks.filter((p) => !p.cannon)
  const certos = normais.filter((p) => p.owner === e.shipId).length
  const canhao = e.picks.some((p) => p.cannon)
  if (ativo) {
    if (view.turn.phase === 'cannon') return 'Canhão liberado!'
    return normais.length ? `${certos} de ${e.clue?.count ?? 0} acertos` : 'Aguardando palpites'
  }
  if (!e.end) return ''
  if (e.end === 'tempoCapitao' || e.end === 'semMarujos') return FIM[e.end]
  if (!e.clue) return FIM[e.end]
  const base = `${certos} de ${e.clue.count}${canhao ? ' + tiro de canhão' : ''}`
  if (e.end === 'canhao' || e.end === 'todos') return `${base} · vez encerrada`
  return `${base} · ${FIM[e.end]}`
}

export function textoFase(view: CodenomesView): string {
  if (view.finishReason) return 'Fim de jogo'
  if (view.paused) return 'Partida pausada'
  if (view.turn.phase === 'clue') return 'Fase 1 · Ordem do Capitão'
  if (view.turn.phase === 'cannon') return 'Tiro de Canhão!'
  return 'Fase 2 · Palpites dos Marujos'
}

export function formatarTempo(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Texto do "Copiar resumo" para colar no Discord. */
export function resumoPartida(view: CodenomesView): string {
  const linhas: string[] = []
  const vencedor = view.winner ? `Vitória do Navio ${nomeNavio(view, view.winner)}!` : 'Partida encerrada'
  const minutos = view.finishedAt ? Math.max(1, Math.round((view.finishedAt - view.startedAt) / 60000)) : 0
  linhas.push(`🏴‍☠️ Pistas Piratas — ${vencedor} (${view.log.length} turnos, ${minutos} min)`)
  for (const e of view.log) {
    if (!e.clue && e.picks.length === 0) continue
    const nome = nomeNavio(view, e.shipId)
    const picks = e.picks
      .map((p) => `${p.cannon ? '💥 ' : ''}${p.word} ${p.owner === e.shipId ? '✔' : `✘ (${rotuloDono(view, p.owner)})`}`)
      .join(', ')
    linhas.push(`Turno ${e.number} · ${nome} (${e.captainName}): ${e.clue ? `${e.clue.word} ${e.clue.count}` : '—'}${picks ? ` → ${picks}` : ''}`)
  }
  const placar = [...view.ships]
    .sort((a, b) => b.total - b.left - (a.total - a.left))
    .map((s) => `${s.name} ${s.total - s.left}/${s.total}${s.eliminated ? ' (afundado)' : ''}`)
    .join(' · ')
  linhas.push(`Placar: ${placar}`)
  return linhas.join('\n')
}
