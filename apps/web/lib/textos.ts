import { SHIP_INFO, type Series, type ShipId } from '@arena/platform'
import type { CodenomesView, LogEntry, Owner } from '@arena/codenomes'
import type { Categoria } from '@arena/words'
import { traduzNavio, type Dicionario } from './i18n'

/** Nome do navio na partida; os nomes padrão (Rubi, Safira…) saem no idioma escolhido. */
export function nomeNavio(view: CodenomesView | null, id: ShipId, t: Dicionario): string {
  const nome = view?.ships.find((s) => s.id === id)?.name
  return nome ? traduzNavio(t, nome, id) : t.navios[id]
}

/** Placar da série: "Rubi 1 × 0 Safira" com 2 navios; "Rubi 1 · Safira 0 · Ouro 2" com mais. */
export function placarSerie(series: Series, ships: ShipId[], nome: (id: ShipId) => string): string {
  const v = (id: ShipId) => series.wins[id] ?? 0
  if (ships.length === 2) return `${nome(ships[0])} ${v(ships[0])} × ${v(ships[1])} ${nome(ships[1])}`
  return ships.map((id) => `${nome(id)} ${v(id)}`).join(' · ')
}

/** Série em andamento: já teve partida e ninguém ganhou ainda. */
export function serieEmAndamento(bestOf: number | undefined, series: Series): boolean {
  return (bestOf ?? 1) > 1 && series.games > 0 && !series.champion
}

/** Categorias escolhidas em poucas palavras: até `max` nomes e "+N" para o resto. */
export function resumoCategorias(cats: Categoria[], t: Dicionario, max = 2): string {
  if (!cats.length) return '—'
  const nomes = cats.map((c) => t.categorias[c])
  return nomes.length <= max ? nomes.join(' + ') : `${nomes.slice(0, max).join(' + ')} +${nomes.length - max}`
}

/** Nome do navio no salão: o que o Almirante deu ou o padrão traduzido. */
export function nomeNavioConfig(nomes: Partial<Record<ShipId, string>>, id: ShipId, t: Dicionario): string {
  return nomes[id] || t.navios[id]
}

export function corDono(owner: Owner): string {
  if (owner === 'mar') return '#4C7A96'
  if (owner === 'kraken') return '#6B3FA0'
  return SHIP_INFO[owner].cor
}

export function rotuloDono(view: CodenomesView, owner: Owner, t: Dicionario): string {
  if (owner === 'mar') return t.textos.marAberto
  if (owner === 'kraken') return t.textos.kraken
  return t.textos.tesouroDe(nomeNavio(view, owner, t))
}

/** Rodapé de uma entrada do Diário, por exemplo "3 de 3 + canhão · vez encerrada". */
export function resumoEntrada(e: LogEntry, ativo: boolean, view: CodenomesView, t: Dicionario): string {
  const x = t.textos
  if (ativo && !e.clue) return x.pensando(e.captainName || t.comum.capitao)
  const normais = e.picks.filter((p) => !p.cannon)
  const certos = normais.filter((p) => p.owner === e.shipId).length
  const canhao = e.picks.some((p) => p.cannon)
  if (ativo) {
    if (view.turn.phase === 'cannon') return x.canhaoLiberado
    return normais.length ? x.acertosDe(certos, e.clue?.count ?? 0) : x.aguardandoPalpites
  }
  if (!e.end) return ''
  if (e.end === 'tempoCapitao' || e.end === 'semMarujos') return x.fim[e.end]
  if (!e.clue) return x.fim[e.end]
  const base = x.base(certos, e.clue.count, canhao)
  if (e.end === 'canhao' || e.end === 'todos') return `${base} · ${x.vezEncerrada}`
  return `${base} · ${x.fim[e.end]}`
}

export function textoFase(view: CodenomesView, t: Dicionario): string {
  const f = t.partida.fase
  if (view.finishReason) return f.fim
  if (view.paused) return f.pausada
  if (view.turn.phase === 'clue') return f.clue
  if (view.turn.phase === 'cannon') return f.cannon
  return f.guessing
}

export function formatarTempo(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Texto do "Copiar resumo" para colar no Discord. */
export function resumoPartida(view: CodenomesView, t: Dicionario): string {
  const linhas: string[] = []
  const vencedor = view.winner ? t.fim.vitoriaDo(nomeNavio(view, view.winner, t)) : t.fim.encerrada
  const minutos = view.finishedAt ? Math.max(1, Math.round((view.finishedAt - view.startedAt) / 60000)) : 0
  linhas.push(t.textos.resumoTitulo(vencedor, view.log.length, minutos))
  for (const e of view.log) {
    if (!e.clue && e.picks.length === 0) continue
    const nome = nomeNavio(view, e.shipId, t)
    const picks = e.picks
      .map((p) => `${p.cannon ? '💥 ' : ''}${p.word} ${p.owner === e.shipId ? '✔' : `✘ (${rotuloDono(view, p.owner, t)})`}`)
      .join(', ')
    linhas.push(`${t.textos.resumoTurno(e.number, nome, e.captainName)}: ${e.clue ? `${e.clue.word} ${e.clue.count}` : '—'}${picks ? ` → ${picks}` : ''}`)
  }
  const placar = [...view.ships]
    .sort((a, b) => b.total - b.left - (a.total - a.left))
    .map((s) => `${nomeNavio(view, s.id, t)} ${s.total - s.left}/${s.total}${s.eliminated ? t.textos.afundado : ''}`)
    .join(' · ')
  linhas.push(t.textos.placar(placar))
  return linhas.join('\n')
}
