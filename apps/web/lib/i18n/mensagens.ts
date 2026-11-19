/**
 * Mensagens fixas que o servidor (motor, sala, rotas) manda em português.
 * O texto em português é a chave: o cliente procura aqui e mostra a tradução (servidor.ts).
 * Se uma mensagem mudar no servidor, mude aqui também.
 */
export const MENSAGENS_PT = {
  // motor (engine.ts)
  acabou: 'A partida já acabou.',
  pausada: 'A partida está pausada.',
  soCapitaoOrdem: 'Só o Capitão da vez dá a ordem.',
  ordemDada: 'A ordem já foi dada.',
  esperemOrdem: 'Esperem a ordem do Capitão.',
  soMarujos: 'Só os Marujos do navio da vez escolhem as palavras.',
  cartaInvalida: 'Carta inválida.',
  jaRevelada: 'Essa carta já foi revelada.',
  marquemAntes: 'Marquem pelo menos uma palavra antes de confirmar.',
  escolhamAntes: 'Escolham pelo menos uma palavra antes de encerrar.',
  soCapitaesMarcam: 'Só os Capitães marcam cartas no mapa.',
  marqueSeus: 'Marque só os tesouros do seu navio.',
  acaoDesconhecida: 'Ação desconhecida.',
  // dica (clue.ts)
  digite: 'Digite uma palavra.',
  umaPalavra: 'A dica precisa ser uma palavra só.',
  soLetras: 'A dica só pode ter letras e hífen.',
  duasLetras: 'A dica precisa ter pelo menos 2 letras.',
  longa: 'A dica é longa demais.',
  numeroMin: 'O número precisa ser pelo menos 1.',
  // sala (room.ts, service.ts, util.ts)
  foraDaSala: 'Você não está nesta sala.',
  espereTrocar: 'Espere a partida acabar para trocar de navio.',
  navioFora: 'Esse navio não está no jogo.',
  soAlmiranteConfig: 'Só o Almirante muda as configurações.',
  configSoSalao: 'As configurações só mudam no salão.',
  jaComecou: 'A partida já começou.',
  entreNavio: 'Entre num navio primeiro.',
  jaTemCapitao: 'Esse navio já tem Capitão.',
  soAlmiranteCapitao: 'Só o Almirante troca o Capitão.',
  jogadorForaNavio: 'Esse jogador não está nesse navio.',
  soAlmiranteZarpa: 'Só o Almirante pode zarpar.',
  soAlmiranteExpulsa: 'Só o Almirante pode expulsar.',
  naoSeExpulsa: 'Você não pode se expulsar.',
  jogadorNaoEncontrado: 'Jogador não encontrado.',
  soAlmiranteMove: 'Só o Almirante move jogadores.',
  soAlmiranteCargo: 'Só o Almirante pode passar o cargo.',
  soAlmiranteEmbaralha: 'Só o Almirante embaralha os navios.',
  embaralhaSalao: 'Só dá para embaralhar no salão.',
  soAlmiranteVolta: 'Só o Almirante leva todos de volta ao salão.',
  naoAcabou: 'A partida ainda não acabou.',
  soAlmirantePausa: 'Só o Almirante pausa a partida.',
  semPartida: 'Não há partida em andamento.',
  soAlmiranteEncerra: 'Só o Almirante encerra a partida.',
  sessaoInvalida: 'Sessão inválida. Recarregue a página.',
  salaNaoExiste: 'Esta sala não existe mais.',
  nomeCurto: 'O nome precisa ter pelo menos 2 letras.',
  nomeLongo: 'O nome pode ter no máximo 16 letras.',
  nomeProibido: 'Escolha outro nome, por favor.',
  // rotas e conexão
  salaNaoEncontrada: 'Sala não encontrada.',
  pedidoInvalido: 'Pedido inválido.',
  calma: 'Calma, marujo! Muitas ações seguidas.',
  semConexao: 'Sem conexão com o servidor.',
  // canStart e notas do Diário
  escolhaCategoria: 'Escolha pelo menos uma categoria de palavras',
  encerradaAlmirante: 'Partida encerrada pelo Almirante',
  semMarujosPulada: 'Sem Marujos conectados, a vez foi pulada',
  retomada: 'Partida retomada',
} as const

export type ChaveMensagem = keyof typeof MENSAGENS_PT
