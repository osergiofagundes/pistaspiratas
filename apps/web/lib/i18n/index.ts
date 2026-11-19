'use client'
import { SHIP_IDS, SHIP_INFO, type ShipId } from '@arena/platform'
import { useSala } from '@/lib/sala'
import type { Idioma } from './idiomas'
import { MENSAGENS_PT, type ChaveMensagem } from './mensagens'
import { pt, type Dicionario } from './pt'
import { en } from './en'
import { es } from './es'
import { fr } from './fr'
import { de } from './de'
import { it } from './it'

export type { Dicionario, Idioma }
export { IDIOMAS, infoIdioma } from './idiomas'

export const DICIONARIOS: Record<Idioma, Dicionario> = { pt, en, es, fr, de, it }

/** Dicionário do idioma escolhido nas preferências. */
export function useT(): Dicionario {
  return DICIONARIOS[useSala((s) => s.prefs.idioma)] ?? pt
}

export function useIdioma(): Idioma {
  return useSala((s) => s.prefs.idioma)
}

/** Dicionário atual fora de componentes (avisos montados em funções). */
export function dicionarioAtual(): Dicionario {
  return DICIONARIOS[useSala.getState().prefs.idioma] ?? pt
}

/** Nome padrão de navio (Rubi, Safira…) traduzido; nomes dados pelo Almirante ficam como estão. */
export function traduzNavio(t: Dicionario, nome: string, id?: ShipId): string {
  const padrao = id ? (SHIP_INFO[id].nome === nome ? id : null) : SHIP_IDS.find((s) => SHIP_INFO[s].nome === nome)
  return padrao ? t.navios[padrao] : nome
}

const POR_TEXTO = new Map<string, ChaveMensagem>(Object.entries(MENSAGENS_PT).map(([k, v]) => [v, k as ChaveMensagem]))

/** Mensagens com partes variáveis: regex sobre o texto em português e a tradução com as partes. */
const VARIAVEIS: [RegExp, (t: Dicionario, m: string[]) => string][] = [
  [/^O Navio (.+) precisa de pelo menos 2 jogadores$/, (t, m) => t.servidorVariavel.navioPrecisa(traduzNavio(t, m[1]))],
  [/^Faltam palavras personalizadas: são (\d+), o tabuleiro tem (\d+) casas$/, (t, m) => t.servidorVariavel.faltamPalavras(+m[1], +m[2])],
  [/^Vocês já marcaram (\d+) palavras\. Desmarquem uma para trocar\.$/, (t, m) => t.servidorVariavel.jaMarcaram(+m[1])],
  [/^O número vai de 1 até (\d+) \(os tesouros que faltam\)\.$/, (t, m) => t.servidorVariavel.numeroAte(+m[1])],
  [/^Dica inválida: (.+) está no tabuleiro\.$/, (t, m) => t.servidorVariavel.noTabuleiro(m[1])],
  [/^Dica inválida: é plural ou singular de (.+)\.$/, (t, m) => t.servidorVariavel.plural(m[1])],
  [/^Dica inválida: contém ou está contida em (.+)\.$/, (t, m) => t.servidorVariavel.contem(m[1])],
  [/^Dica inválida: muito parecida com (.+)\.$/, (t, m) => t.servidorVariavel.parecida(m[1])],
  [/^(.+) foi removido da sala\.$/, (t, m) => t.servidorVariavel.removido(m[1])],
  [/^(.+) agora é o Almirante\.$/, (t, m) => t.servidorVariavel.agoraAlmirante(m[1])],
  [/^(.+) embaralhou as tripulações\.$/, (t, m) => t.servidorVariavel.embaralhou(m[1])],
  [/^(.+) zerou o placar da série\.$/, (t, m) => t.servidorVariavel.zerouPlacar(m[1])],
  [/^O Navio (.+) afundou$/, (t, m) => t.servidorVariavel.afundou(traduzNavio(t, m[1]))],
  [/^O Navio (.+) venceu!$/, (t, m) => t.servidorVariavel.venceu(traduzNavio(t, m[1]))],
  [/^(.+) caiu; (.+) assumiu como Capitão$/, (t, m) => t.servidorVariavel.caiuAssumiu(m[1], m[2])],
  [/^(.+) assumiu como Capitão$/, (t, m) => t.servidorVariavel.assumiu(m[1])],
  [/^Partida pausada por (.+)$/, (t, m) => t.servidorVariavel.pausadaPor(m[1])],
]

/** Traduz uma mensagem que veio em português do servidor (erro, aviso ou nota do Diário). */
export function traduzirMensagem(texto: string, t: Dicionario): string {
  const chave = POR_TEXTO.get(texto)
  if (chave) return t.servidor[chave]
  for (const [re, f] of VARIAVEIS) {
    const m = texto.match(re)
    if (m) return f(t, m)
  }
  return texto
}
