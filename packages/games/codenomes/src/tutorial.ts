import { type Personagem, type Room, type ShipId, applyRoomAction, createRoom, joinRoom } from '@arena/platform'
import type { Idioma } from '@arena/words'
import type { Card, Owner } from './board'
import type { CodenomesConfig } from './config'
import type { CodenomesMemory, CodenomesState } from './engine'
import { codenomes } from './index'

/**
 * Partida do tutorial: tabuleiro fixo de 5×4, o jogador no Navio Rubi e navios simulados.
 * Tudo aqui é puro (roda no navegador); o roteiro dos passos fica no app.
 */

export const TUTORIAL_IDS = {
  voce: 'voce',
  capitaoRubi: 'bot-barba',
  colega: 'bot-tico',
  capitaSafira: 'bot-coral',
  marujaSafira: 'bot-nina',
  marujoSafira: 'bot-bento',
} as const

/** Peças do tabuleiro (a chave é o nome em português, sem acento). */
export type PecaTutorial =
  | 'banana' | 'uva' | 'cavalo' | 'vaca' | 'ancora'
  | 'espada' | 'moeda' | 'corrente' | 'sino'
  | 'vulcao'
  | 'maca' | 'livro' | 'nuvem' | 'espelho' | 'chapeu' | 'bola' | 'ponte' | 'relogio' | 'janela' | 'escada'

export const DONOS_TUTORIAL: Record<PecaTutorial, Owner> = {
  banana: 'rubi', uva: 'rubi', cavalo: 'rubi', vaca: 'rubi', ancora: 'rubi',
  espada: 'safira', moeda: 'safira', corrente: 'safira', sino: 'safira',
  vulcao: 'kraken',
  maca: 'mar', livro: 'mar', nuvem: 'mar', espelho: 'mar', chapeu: 'mar', bola: 'mar', ponte: 'mar', relogio: 'mar', janela: 'mar', escada: 'mar',
}

/** Posição das peças no 5×4, igual em todos os idiomas. */
export const LAYOUT_TUTORIAL: PecaTutorial[] = [
  'livro', 'banana', 'espada', 'nuvem', 'cavalo',
  'sino', 'maca', 'ponte', 'uva', 'relogio',
  'ancora', 'chapeu', 'vulcao', 'moeda', 'janela',
  'espelho', 'vaca', 'escada', 'corrente', 'bola',
]

export const COLUNAS_TUTORIAL = 5
export const LINHAS_TUTORIAL = 4

/** Índice da carta de uma peça no tabuleiro do tutorial. */
export function cartaTutorial(peca: PecaTutorial): number {
  return LAYOUT_TUTORIAL.indexOf(peca)
}

export type TabuleiroTutorial = {
  palavras: Record<PecaTutorial, string>
  /** dicas dos Capitães simulados (Rubi na 1ª vez, Safira na 2ª) e a sugerida ao jogador */
  dicas: { fruta: string; metal: string; fazenda: string }
  /** nome do Capitão simulado do Rubi (os outros nomes servem em todos os idiomas) */
  barba: string
}

export const TABULEIROS_TUTORIAL: Record<Idioma, TabuleiroTutorial> = {
  pt: {
    palavras: {
      banana: 'BANANA', uva: 'UVA', cavalo: 'CAVALO', vaca: 'VACA', ancora: 'ÂNCORA',
      espada: 'ESPADA', moeda: 'MOEDA', corrente: 'CORRENTE', sino: 'SINO',
      vulcao: 'VULCÃO',
      maca: 'MAÇÃ', livro: 'LIVRO', nuvem: 'NUVEM', espelho: 'ESPELHO', chapeu: 'CHAPÉU', bola: 'BOLA', ponte: 'PONTE', relogio: 'RELÓGIO', janela: 'JANELA', escada: 'ESCADA',
    },
    dicas: { fruta: 'FRUTA', metal: 'METAL', fazenda: 'FAZENDA' },
    barba: 'Barba Ruiva',
  },
  en: {
    palavras: {
      banana: 'BANANA', uva: 'GRAPE', cavalo: 'HORSE', vaca: 'COW', ancora: 'ANCHOR',
      espada: 'SWORD', moeda: 'COIN', corrente: 'CHAIN', sino: 'BELL',
      vulcao: 'VOLCANO',
      maca: 'APPLE', livro: 'BOOK', nuvem: 'CLOUD', espelho: 'MIRROR', chapeu: 'HAT', bola: 'BALL', ponte: 'BRIDGE', relogio: 'CLOCK', janela: 'WINDOW', escada: 'LADDER',
    },
    dicas: { fruta: 'FRUIT', metal: 'METAL', fazenda: 'FARM' },
    barba: 'Redbeard',
  },
  es: {
    palavras: {
      banana: 'PLÁTANO', uva: 'UVA', cavalo: 'CABALLO', vaca: 'VACA', ancora: 'ANCLA',
      espada: 'ESPADA', moeda: 'MONEDA', corrente: 'CADENA', sino: 'CAMPANA',
      vulcao: 'VOLCÁN',
      maca: 'MANZANA', livro: 'LIBRO', nuvem: 'NUBE', espelho: 'ESPEJO', chapeu: 'SOMBRERO', bola: 'PELOTA', ponte: 'PUENTE', relogio: 'RELOJ', janela: 'VENTANA', escada: 'ESCALERA',
    },
    dicas: { fruta: 'FRUTA', metal: 'METAL', fazenda: 'GRANJA' },
    barba: 'Barbarroja',
  },
  fr: {
    palavras: {
      banana: 'BANANE', uva: 'RAISIN', cavalo: 'CHEVAL', vaca: 'VACHE', ancora: 'ANCRE',
      espada: 'ÉPÉE', moeda: 'PIÈCE', corrente: 'CHAÎNE', sino: 'CLOCHE',
      vulcao: 'VOLCAN',
      maca: 'POMME', livro: 'LIVRE', nuvem: 'NUAGE', espelho: 'MIROIR', chapeu: 'CHAPEAU', bola: 'BALLON', ponte: 'PONT', relogio: 'HORLOGE', janela: 'FENÊTRE', escada: 'ÉCHELLE',
    },
    dicas: { fruta: 'FRUIT', metal: 'MÉTAL', fazenda: 'FERME' },
    barba: 'Barbe-Rousse',
  },
  de: {
    palavras: {
      banana: 'BANANE', uva: 'TRAUBE', cavalo: 'PFERD', vaca: 'KUH', ancora: 'ANKER',
      espada: 'SCHWERT', moeda: 'MÜNZE', corrente: 'KETTE', sino: 'GLOCKE',
      vulcao: 'VULKAN',
      maca: 'APFEL', livro: 'BUCH', nuvem: 'WOLKE', espelho: 'SPIEGEL', chapeu: 'HUT', bola: 'BALL', ponte: 'BRÜCKE', relogio: 'UHR', janela: 'FENSTER', escada: 'LEITER',
    },
    dicas: { fruta: 'OBST', metal: 'METALL', fazenda: 'BAUERNHOF' },
    barba: 'Rotbart',
  },
  it: {
    palavras: {
      banana: 'BANANA', uva: 'UVA', cavalo: 'CAVALLO', vaca: 'MUCCA', ancora: 'ANCORA',
      espada: 'SPADA', moeda: 'MONETA', corrente: 'CATENA', sino: 'CAMPANA',
      vulcao: 'VULCANO',
      maca: 'MELA', livro: 'LIBRO', nuvem: 'NUVOLA', espelho: 'SPECCHIO', chapeu: 'CAPPELLO', bola: 'PALLA', ponte: 'PONTE', relogio: 'OROLOGIO', janela: 'FINESTRA', escada: 'SCALA',
    },
    dicas: { fruta: 'FRUTTA', metal: 'METALLO', fazenda: 'FATTORIA' },
    barba: 'Barbarossa',
  },
}

export type SalaTutorial = Room<CodenomesConfig, CodenomesState, CodenomesMemory>

/**
 * Monta a sala do tutorial já em partida: Rubi (Capitão simulado, o jogador e um colega)
 * contra Safira (três simulados). Relógios desligados, canhão ligado, o Rubi começa.
 */
export function montarTutorial(idioma: Idioma, perfil: { name: string; avatar: Personagem }, now: number): SalaTutorial {
  const tab = TABULEIROS_TUTORIAL[idioma] ?? TABULEIROS_TUTORIAL.pt
  const room = createRoom('TUTORIAL', codenomes, now, {
    wordLanguage: idioma,
    captainTime: null,
    crewTime: null,
    cannon: true,
    firstBonus: true,
    captainMode: 'escolha',
  }) as SalaTutorial
  const I = TUTORIAL_IDS
  const entrar = (id: string, name: string, avatar: Personagem, shipId: ShipId) => {
    joinRoom(room, id, id, { name, avatar }, now)
    room.players[id].shipId = shipId
    room.players[id].connected = true
  }
  // o Capitão simulado entra primeiro: ele é o Almirante
  entrar(I.capitaoRubi, tab.barba, 'capitao', 'rubi')
  entrar(I.voce, perfil.name, perfil.avatar, 'rubi')
  entrar(I.colega, 'Juca', 'macaco', 'rubi')
  entrar(I.capitaSafira, 'Coral', 'navegadora', 'safira')
  entrar(I.marujaSafira, 'Nina', 'ruiva', 'safira')
  entrar(I.marujoSafira, 'Bento', 'polvo', 'safira')
  room.captainClaims = { rubi: I.capitaoRubi, safira: I.capitaSafira }
  // rng 0: o primeiro navio sorteado é o Rubi
  applyRoomAction(room, codenomes, I.capitaoRubi, { type: 'start' }, { now, rng: () => 0 })
  const s = room.game!
  const cards: Card[] = LAYOUT_TUTORIAL.map((p) => ({ word: tab.palavras[p], owner: DONOS_TUTORIAL[p], revealed: false, revealedBy: null, turn: null }))
  s.cards = cards
  s.cols = COLUNAS_TUTORIAL
  s.rows = LINHAS_TUTORIAL
  for (const ship of s.ships) ship.total = cards.filter((c) => c.owner === ship.id).length
  // começou "há um tempo": o aviso dos Capitães sorteados não aparece
  s.startedAt = now - 60_000
  room.memory = { recentWords: [], lastCaptains: {} }
  return room
}

/** O jogador assume como Capitão do Rubi (na vez atual e no Diário). */
export function virarCapitao(room: SalaTutorial, playerId: string) {
  const s = room.game
  const p = room.players[playerId]
  if (!s || !p) return
  const ship = s.ships.find((x) => x.id === 'rubi')!
  ship.captainId = p.id
  ship.captainName = p.name
  const entry = s.log[s.log.length - 1]
  if (entry && entry.shipId === 'rubi') {
    entry.captainId = p.id
    entry.captainName = p.name
  }
  room.version++
}
