# Documento de Projeto — Plataforma de Jogos & Pistas Piratas

Nov 16, 2026 · @Sérgio Fagundes

## 1. Visão geral

A plataforma é um site de jogos multiplayer de navegador, jogados em salas criadas por um anfitrião e compartilhadas por link, sem necessidade de conta. O primeiro jogo é o **Pistas Piratas** (antes chamado de CodeNomes Piratas), um jogo de palavras e dedução em equipes inspirado em Codenames, para 2 a 4 equipes. Os próximos jogos previstos são jogo da velha, xadrez e forca.

**Nome provisório da plataforma:** Arena de Jogos (a definir). O jogo não deve usar o nome "Codenames", que é marca registrada da Czech Games Edition.

**Princípios do produto:**

- Entrar e jogar em menos de 30 segundos: link, nome, avatar, equipe.
- Funciona bem no celular e no computador.
- Feito para grupos que conversam por voz fora do jogo (Discord). O jogo não tem chat.
- Salas, jogadores e avatares são compartilhados entre todos os jogos da plataforma. Cada jogo implementa só as próprias regras.
- Sem monetização na primeira fase.

## 2. Temática e glossário

O jogo se passa no mar: cada equipe é a tripulação de um navio pirata disputando um mapa do tesouro. As palavras são ilhas no mapa; revelar uma palavra é "desembarcar" naquela ilha.

| Termo do jogo | Nome pirata | Descrição |
| --- | --- | --- |
| Equipe | Navio / Tripulação | Cada equipe tem nome e cor de bandeira |
| Líder | Capitão | Vê o mapa completo e dá as dicas |
| Membros | Marujos | Adivinham as palavras pela dica do Capitão |
| Palavra da equipe | Tesouro | Palavra que pertence a um navio |
| Palavra neutra | Mar Aberto | Não pertence a ninguém; encerra a vez |
| Perda total | Kraken | Elimina o navio que a revelar |
| Bônus | Tiro de Canhão | Chute livre depois de acertar todas as palavras da dica |
| Dica | Ordem do Capitão | Uma palavra mais um número |
| Espectador | Gaivota | Assiste sem jogar |
| Dono da sala | Almirante | Configura a sala e inicia a partida |

**Navios (equipes):** até 4, cada um com cor e bandeira fixas: Vermelho (Rubi), Azul (Safira), Verde (Esmeralda) e Amarelo (Ouro). O dono da sala pode renomear os navios.

**Avatares:** um conjunto fixo de cerca de 16 personagens ilustrados: pirata de tapa-olho, papagaio, sereia, caveira, macaco do navio, cozinheiro, timoneiro, polvo, tubarão, gaivota, caranguejo, fantasma, cartógrafa, artilheiro, contramestre e grumete. Dois jogadores podem usar o mesmo avatar.

**Estilo visual:** mapa antigo em pergaminho, madeira de navio e tons de mar. As cartas parecem pequenos pergaminhos; ao serem reveladas, mostram a bandeira do navio dono, ondas (Mar Aberto) ou um tentáculo (Kraken).

## 3. Regras do jogo

Vence o primeiro navio que tiver todos os seus Tesouros revelados, ou o último navio que sobrar depois que os outros forem eliminados pelo Kraken.

### 3.1 Preparação

1. O sistema sorteia as palavras do tabuleiro e o mapa secreto (a qual navio cada palavra pertence), de acordo com as configurações da sala (seções 4 e 5).
2. O navio que começa é sorteado e recebe 1 Tesouro a mais.
3. A ordem dos turnos segue a ordem dos navios a partir do primeiro, em rodízio. Navios eliminados são pulados.
4. Só os Capitães veem o mapa secreto. Marujos e Gaivotas veem apenas as palavras.

### 3.2 O turno

**Fase 1, Ordem do Capitão.** O Capitão do navio da vez digita uma palavra e um número N, de 1 até a quantidade de Tesouros que o navio ainda tem. A dica passa pela validação automática (seção 9) e aparece para todos e no histórico.

**Fase 2, Palpites.** Os Marujos escolhem as palavras por votação (seção 3.4), uma de cada vez, até N palpites. Cada palavra revelada tem um destes resultados:

| Palavra revelada | Efeito | O turno |
| --- | --- | --- |
| Tesouro do próprio navio | Conta para o navio | Continua, se ainda houver palpites |
| Tesouro de outro navio | Conta para o outro navio | Termina |
| Tesouro de navio eliminado | Não conta para ninguém | Termina |
| Mar Aberto | Nada | Termina |
| Kraken | O navio é eliminado | Passa para o próximo navio |

Os Marujos podem **encerrar a vez** a qualquer momento depois do primeiro palpite, também por votação. Não existe o palpite extra N+1 do jogo original: ele foi substituído pelo Tiro de Canhão.

&#91;embedded content: turno de um navio · 2 decisões\]

Com o Tiro de Canhão desligado, acertar os N palpites leva direto a "Vez termina". O Kraken revelado no Tiro de Canhão também elimina o navio.

### 3.3 Tiro de Canhão (bônus)

- Se o navio acertar os N palpites, todos em Tesouros próprios, ganha 1 Tiro de Canhão: um palpite livre em qualquer palavra, sem relação com a dica.
- O resultado segue a tabela acima: um Tesouro próprio conta, um Tesouro de outro navio conta para ele, e o Kraken elimina.
- Depois do tiro, a vez **termina** em qualquer caso.
- O tiro não é acumulável: se o navio não quiser usar, ele é perdido.
- O bônus pode ser desligado nas configurações da sala.

### 3.4 Votação dos Marujos

- Cada Marujo toca numa palavra para votar nela. O avatar dele aparece na carta para todo o navio.
- Quando uma palavra recebe votos da maioria dos Marujos conectados (mais da metade), começa uma contagem de 3 segundos. Se ninguém tirar o voto nesse tempo, a palavra é revelada.
- Um navio com 1 Marujo revela com o voto dele (ainda com a contagem de 3 s).
- "Encerrar vez" e "Disparar canhão" funcionam como cartas especiais de votação, com a mesma regra de maioria.
- Os votos de um navio são vistos por todos, mas só os Marujos do navio da vez podem votar.

### 3.5 Eliminação e vitória

- **Kraken:** o navio que revelar o Kraken sai do jogo. Os jogadores dele viram Gaivotas até o fim da partida. Os Tesouros dele que ainda não foram revelados ficam no tabuleiro como armadilhas: quem revelar um perde a vez.
- **Vitória por Tesouros:** o primeiro navio com todos os Tesouros revelados vence na hora, mesmo que o último Tesouro tenha sido revelado por outro navio, inclusive num Tiro de Canhão.
- **Vitória por sobrevivência:** se sobrar só um navio, ele vence.
- Se o último navio sobrevivente ficar sem Capitão ou sem Marujos conectados, aplica-se a regra de reconexão (seção 6).

### 3.6 Conduta

O Capitão só se comunica pela dica. Como os grupos falam pelo Discord, essa regra depende da honestidade dos jogadores. O jogo mostra um lembrete para os Capitães no início da partida.

## 4. Tabuleiro

O tabuleiro cresce com o número de navios: 5×5 para 2, 6×6 para 3 e 7×7 para 4, sempre com 8 Tesouros por navio e 1 a mais para o navio que começa.

### 4.1 Valores padrão

| Navios | Grade | Tesouros (1º navio + demais) | Mar Aberto | Kraken | Total |
| --- | --- | --- | --- | --- | --- |
| 2 | 5×5 | 9 + 8 = 17 | 7 | 1 | 25 |
| 3 | 6×6 | 9 + 8 + 8 = 25 | 9 | 2 | 36 |
| 4 | 7×7 | 9 + 8 + 8 + 8 = 33 | 14 | 2 | 49 |

### 4.2 Grade automática

Não há presets: o Almirante ajusta cada opção direto (seção 5) e pode voltar aos valores padrão com "Restaurar padrão". O dono escolhe Tesouros por navio e Kraken. O sistema escolhe a menor grade de 5 a 7 colunas que comporte todas as palavras e completa as casas que sobram com Mar Aberto. Se o Mar Aberto ficar abaixo de 20% do tabuleiro, a tela de configuração mostra um aviso de que o jogo vai ficar muito fácil.

**Celular:** uma grade de 7×7 em tela de 375 px deixa as cartas com cerca de 48 px de largura. O tabuleiro de 4 navios precisa de um layout próprio para celular: fonte menor nas cartas, com zoom ao tocar e segurar.

## 5. Configurações da sala

Só o Almirante (dono da sala) altera as configurações, e apenas no salão, antes de iniciar a partida. Todos os jogadores veem as configurações atuais.

| Configuração | Opções | Padrão |
| --- | --- | --- |
| Número de navios | 2, 3 ou 4 | 2 |
| Tesouros por navio | 4 a 10 na grade automática (no tamanho fixo, proporcional ou à mão) | 8 |
| Quantidade de Kraken | 1 ou 2; volta à sugestão quando muda o número de navios | 1 com 2 navios, 2 com 3 ou 4 |
| Tiro de Canhão | Ligado ou desligado | Ligado |
| Escolha do Capitão | Sorteio ou o navio escolhe | Sorteio |
| Rodízio de Capitão | Manter ou trocar a cada partida | Trocar |
| Tempo do Capitão | Sem limite, 60, 90, 120 ou 180 s | 90 s |
| Tempo dos Marujos | Sem limite, 60, 90, 120 ou 180 s | 120 s |
| Categorias de palavras | Uma ou mais, misturadas em partes iguais (seção 9) | Geral |
| Palavras personalizadas | Lista colada pelo dono | Vazia |
| Usar só palavras personalizadas | Sim ou não | Não |
| Série | Avulsa, melhor de 3 (quem vencer 2) ou melhor de 5 (quem vencer 3) | Avulsa |
| Espectadores | Permitir ou não | Permitir |
| Tamanho máximo da sala | 4 a 24 jogadores | 16 |

**Restaurar padrão:** um link no topo das configurações volta tabuleiro, tesouros, Kraken, tempos e Tiro de Canhão aos valores padrão. Número de navios, regras de Capitão, palavras, idioma e nomes dos navios ficam como estão.

**Escolha do Capitão:** no modo sorteio, o sistema sorteia um Capitão por navio ao iniciar a partida. No modo "o navio escolhe", cada navio tem um botão "Quero ser Capitão"; o primeiro a apertar assume e o Almirante pode trocar. O rodízio evita que a mesma pessoa seja Capitã em toda partida.

**Tempo esgotado:** se o tempo do Capitão acabar, o navio perde a vez. Se o tempo dos Marujos acabar, a vez termina como se eles tivessem encerrado.

## 6. Sala, jogadores e reconexão

Qualquer pessoa cria uma sala sem conta e vira o Almirante. Os outros entram pelo link, escolhem nome, avatar e navio, e o Almirante inicia a partida quando todos os navios tiverem pelo menos 2 jogadores.

### 6.1 Sala

- A sala tem um código de 6 caracteres sem letras ambíguas (sem 0/O, 1/I) e um link no formato `/sala/K7PX2M`.
- O link pode ser copiado ou compartilhado pelo menu nativo do celular. O código também pode ser digitado na tela inicial.
- A sala é da plataforma e o jogo é escolhido dentro dela. Assim, a mesma sala poderá jogar xadrez ou forca no futuro.
- A sala expira 30 minutos depois que o último jogador sair.

### 6.2 Identidade sem conta

- Ao entrar pela primeira vez, o navegador recebe um identificador anônimo e um token secreto, guardados no `localStorage`. Nome e avatar ficam salvos para as próximas salas.
- O nome tem de 2 a 16 caracteres e é único na sala. Se já existir, o sistema sugere "Nome 2".
- Um filtro básico bloqueia nomes ofensivos.

### 6.3 Papéis na sala

| Papel | Quem | Pode |
| --- | --- | --- |
| Almirante | Quem criou a sala | Configurar, iniciar, pausar e encerrar a partida; mover jogadores entre navios; expulsar; passar o cargo de Almirante |
| Jogador | Quem entrou num navio | Trocar de navio no salão; jogar como Capitão ou Marujo |
| Gaivota | Quem não escolheu navio, chegou no meio da partida ou foi eliminado | Assistir; entrar num navio entre partidas |

O Almirante também joga normalmente num navio. Se ele sair da sala, o cargo passa para o jogador conectado há mais tempo. Um jogador expulso não consegue voltar para a mesma sala com o mesmo navegador.

### 6.4 Entrada no meio da partida

Quem chega com a partida em andamento entra como Gaivota. Ao fim da partida, escolhe um navio no salão. Gaivotas veem o tabuleiro dos Marujos, nunca o mapa do Capitão.

### 6.5 Queda e reconexão

- Um jogador que cai continua na sala por até 5 minutos, com o avatar acinzentado. Ao abrir o link de novo, volta para o mesmo lugar e papel.
- **Marujo caiu:** a maioria da votação passa a contar só os Marujos conectados.
- **Capitão caiu:** o relógio do turno pausa por até 60 s. Se ele não voltar, um Marujo conectado é sorteado como novo Capitão e passa a ver o mapa. Se o antigo Capitão voltar, ele entra como Marujo, porque já viu o mapa e não pode mais adivinhar de forma justa. Na prática, ele vira um Marujo que só assiste.
- **Navio sem Marujos conectados:** as vezes dele são puladas até alguém voltar ou o Almirante mover um jogador para lá.
- O Almirante pode pausar a partida a qualquer momento.

### 6.6 Entre partidas

Ao fim da partida, a tela mostra o mapa completo revelado, o vencedor e o histórico. Depois, todos voltam ao salão com os mesmos navios. Dá para trocar de navio, mudar as configurações ou usar "Embaralhar tripulações" (só o Almirante): redistribui quem está nos navios com o mesmo número de pessoas (diferença máxima de 1), mistura quem jogou junto na última partida, nunca repete a divisão de agora e avisa a todos. Quem está assistindo continua assistindo.

**Série de partidas:** com "melhor de 3" ou "melhor de 5", a sala soma as vitórias de cada navio (placar por cor: Rubi 1 × 0 Safira) e o placar aparece no salão, na coluna de cada navio e na tela de fim. Quem troca de navio passa a jogar pelo outro time; por isso, no meio de uma série, Embaralhar tripulações pede confirmação. Partida encerrada pelo Almirante não conta. Quando um navio chega à meta, a tela de fim comemora o campeão e o placar final fica no salão até o Almirante zarpar de novo, quando começa outra série. Mudar o formato ou o número de navios zera o placar, e o Almirante também pode zerar à mão.

## 7. Telas e layout

São cinco telas, todas em uma única página por sala, que muda de estado sem recarregar.

1. **Início da plataforma:** escolha do jogo (por enquanto só Pistas Piratas), botão "Criar sala" e campo "Entrar com código".
2. **Perfil:** nome e grade de avatares. Aparece só na primeira vez ou ao tocar no próprio avatar.
3. **Salão (lobby):** colunas de navios com os jogadores, botão "Entrar neste navio", área de Gaivotas, link de convite em destaque, configurações (editáveis só pelo Almirante) e botão "Zarpar!" para iniciar, habilitado quando todo navio tem pelo menos 2 jogadores.
4. **Partida:** tabuleiro, navios, dica atual e Diário de Bordo (histórico).
5. **Fim de partida:** vencedor, mapa completo revelado, Diário de Bordo completo e botão "Voltar ao salão".

### 7.1 Tela de partida no computador

- **Barra superior:** de quem é a vez (cor do navio), fase atual, relógio e a Ordem do Capitão em letras grandes, por exemplo **PIRATA · 3**, com o contador de palpites restantes.
- **Coluna esquerda, navios:** cada navio com bandeira, Tesouros restantes, Capitão e Marujos (avatares). Navios eliminados aparecem afundados.
- **Centro, tabuleiro:** as cartas, com os avatares de quem votou em cada uma e a contagem de 3 s em anel.
- **Coluna direita:** o Diário de Bordo (seção 8).
- **Barra inferior:** para o Capitão da vez, o campo da dica, o seletor de número e o botão "Dar ordem". Para os Marujos da vez, os botões "Encerrar vez" e, quando houver, "Disparar canhão". Para os outros, a mensagem "Aguardando o navio Azul".

### 7.2 Tela de partida no celular e no tablet

Decisão de 18/11/2026: celular e tablet jogam **deitados**. Em pé, o jogo mostra "Gire o aparelho". Telas pequenas usam o palco compacto (mesmas unidades do desktop, área de 1000–1240 × 560–750), e o tabuleiro ocupa o centro, com os navios à esquerda e as ações à direita. O que segue é a ideia original, adaptada para a tela deitada:


- O tabuleiro ocupa a tela. A dica atual e o relógio ficam numa barra fixa no topo.
- Navios e Diário de Bordo abrem como painéis deslizantes de baixo para cima, em abas.
- A última entrada do Diário aparece numa faixa pequena sobre o tabuleiro.
- Votar é um toque, e tocar de novo tira o voto. Tocar e segurar amplia a palavra.

### 7.3 Visão do Capitão

O Capitão vê cada carta com a borda e o fundo na cor do navio dono, o Mar Aberto em cinza-azulado e o Kraken em preto com ícone. As cartas já reveladas ficam esmaecidas. Um botão "Ocultar mapa" esconde as cores temporariamente, útil quando o Capitão está transmitindo a tela no Discord.

### 7.4 Feedback

Cada revelação tem uma animação curta (a carta vira) com um som opcional: moedas para Tesouro, ondas para Mar Aberto e um rugido para o Kraken. Há um botão de som no canto.

### 7.5 Tutorial interativo

Uma partida curta e guiada contra navios simulados, que roda inteira no navegador, sem servidor. O botão "▶ Ver tutorial" fica no Como jogar. Na tela inicial ele abre na mesma aba. Dentro de uma sala abre em outra aba, para o jogador não sair da sala dos amigos. Na primeira visita, a tela inicial convida uma vez ("Primeira vez a bordo?"), e a resposta fica guardada no navegador.

- **Partida:** tabuleiro fixo de 5×4 no idioma da interface, com 5 tesouros do Rubi, 4 do Safira, 1 Kraken e 10 de mar. Relógios desligados e canhão ligado.
- **Tripulações:** o jogador está no Rubi, com o Capitão simulado "Barba Ruiva" e o colega Juca. O Safira tem a Capitã Coral e mais dois Marujos.
- **Guia:** o papagaio José explica cada passo num balão, e um holofote destaca a área explicada. É **guiado**: em cada passo só valem as cartas realçadas e os botões indicados. Outra ação mostra "Siga o José" e não muda nada. A dica do Capitão é livre e passa pela validação de verdade (9.3).
- **Roteiro:**
  1. apresentação dos navios, das cartas, do Diário e da barra de cima;
  2. o jogador é **Marujo**: recebe "FRUTA 2", marca as duas cartas e confirma junto com o colega;
  3. ganha o Tiro de Canhão e atira na MAÇÃ, que é mar;
  4. assiste o Safira entregar um tesouro ao Rubi;
  5. vira **Capitão**: vê o mapa e o Kraken, marca as cartas que faltam e dá a ordem (a sugestão é "FAZENDA 2"). Os Marujos simulados acham os tesouros e o Rubi vence;
  6. um cartão final resume as regras, com os botões Jogar com amigos, Repetir tutorial e Ler o manual.
- **Avisos automáticos:** os da partida (Capitães sorteados, Tiro de Canhão, "você virou Capitão") não aparecem, porque o balão faz esse papel. "Pular tutorial" e o ✕ voltam ao início.
- **Código:**
  - cenário puro em `packages/games/codenomes/src/tutorial.ts` (testado nos 6 idiomas);
  - motor local e roteiro em `apps/web/lib/tutorial/`;
  - balão e holofote em `components/jogo/Guia.tsx`;
  - a tela é a mesma `Partida`, que recebe um motor local no lugar do servidor (`useSala.local`).

## 8. Diário de Bordo (histórico)

O Diário de Bordo registra cada turno com a dica, o número e as palavras escolhidas, na ordem e com o resultado de cada uma. Fica sempre visível no computador e a um toque no celular.

### 8.1 Formato de uma entrada

Cada turno vira um cartão com a cor do navio:

```
🔴 Navio Rubi · Capitão Ana · Turno 4
Ordem: PIRATA · 3
  1. Navio      → Tesouro Rubi ✔
  2. Capitão    → Tesouro Rubi ✔
  3. Mar        → Tesouro Rubi ✔
  💥 Tiro de Canhão: Ilha → Tesouro Safira ✘
Resultado: 3 de 3 + canhão, vez encerrada
```

### 8.2 O que é registrado

| Campo | Exemplo |
| --- | --- |
| Navio e Capitão | Rubi, Ana |
| Número do turno | 4 |
| Dica e número | PIRATA, 3 |
| Palavras reveladas, em ordem | Navio, Capitão, Mar |
| Resultado de cada palavra | Tesouro próprio, de outro navio, Mar Aberto ou Kraken |
| Tiro de Canhão | Usado ou não, palavra e resultado |
| Como a vez terminou | Errou, encerrou, acabou o tempo, usou todos os palpites ou Kraken |
| Eventos especiais | Navio eliminado, troca de Capitão por queda, pausa |

### 8.3 Comportamento

- A entrada mais recente fica no topo. O turno em andamento aparece aberto e vai sendo preenchido ao vivo.
- Filtro por navio.
- Os Capitães podem tocar numa dica antiga para destacar no tabuleiro as palavras que ela revelou.
- Ao fim da partida, o Diário completo aparece junto com o mapa revelado, e o botão "Copiar resumo" gera um texto para colar no Discord.
- O Diário vive só enquanto a sala existir. Não há histórico permanente no MVP.

## 9. Palavras e validação de dicas

O jogo tem 17 categorias de palavras, cada uma nos 6 idiomas (pt, en, es, fr, de e it), e o dono da sala pode acrescentar palavras próprias.

### 9.1 Categorias

| Categoria | Tamanho | Exemplos |
| --- | --- | --- |
| Geral | ~1000 | Banco, Chave, Leão, Ponte, Relógio |
| Mar e Pirataria | ~120 | Âncora, Baú, Ilha, Papagaio, Mapa |
| Brasil | ~130 | Feijoada, Carnaval, Ipê, Samba |
| Cultura pop | ~130 | Meme, Cosplay, Spoiler, Selfie |
| Infantil | ~130 | Bola, Gato, Bolo, Pipa |
| Filmes | ~125 | Pipoca, Diretor, Oscar, Vilão |
| Séries | ~120 | Episódio, Temporada, Spoiler, Final |
| Desenhos | ~125 | Mascote, Varinha, Bigorna, Gibi |
| Animais | ~130 | Capivara, Tucano, Polvo, Girafa |
| Comidas | ~130 | Lasanha, Manga, Pudim, Coxinha |
| Esportes | ~125 | Pênalti, Raquete, Pódio, Skate |
| Profissões | ~125 | Bombeiro, Dentista, Piloto, Padeiro |
| Games | ~125 | Joystick, Chefão, Fase, Pixel |
| Música | ~120 | Guitarra, Refrão, Maestro, Vinil |
| Fantasia e Mitologia | ~125 | Dragão, Elfo, Grimório, Oráculo |
| Ciência e Espaço | ~125 | Átomo, Galáxia, Cometa, Ímã |
| Lugares do mundo | ~125 | Paris, Egito, Saara, Fiorde |

**Critérios para as palavras:** uma palavra só (hífen permitido), de 3 a 12 letras, de preferência substantivos concretos com mais de um sentido (Banco, Manga, Pena). As categorias temáticas usam palavras do tema, sem títulos de obras nem marcas (Filmes tem Pipoca e Vilão, não nomes de filmes). Ficam de fora nomes próprios de pessoas, palavras ofensivas e palavras muito raras; Lugares do mundo aceita nomes geográficos. Cada categoria tem pelo menos 100 palavras de raízes diferentes, para encher sozinha o tabuleiro 10×10. Uma palavra pode estar em duas categorias (Vilão em Filmes e Desenhos). As palavras são guardadas com uma forma normalizada (minúsculas e sem acento) para comparação.

**Sorteio:** com várias categorias escolhidas, cada uma entra com a mesma quantidade de cartas (3 categorias num 6×6 dão 12 de cada); as palavras personalizadas contam como mais uma parte. Uma parte que acaba (poucas personalizadas) é completada pelas outras. O tabuleiro evita a mesma palavra, palavras da mesma raiz (Navio e Navios) e palavras usadas nas últimas 3 partidas da mesma sala.

### 9.2 Palavras personalizadas

- Um campo de texto no salão aceita até 300 palavras, separadas por vírgula ou quebra de linha.
- Cada palavra precisa ter de 2 a 20 caracteres. O sistema remove duplicadas e mostra quantas foram aceitas.
- Elas se misturam às categorias escolhidas, como uma parte a mais do sorteio. Com "Usar só palavras personalizadas", é preciso ter pelo menos o número de casas do tabuleiro.
- A lista vale só para a sala e não é salva no servidor depois que a sala expira.

### 9.3 Validação automática da dica

A validação acontece no servidor, comparando a dica com as palavras **ainda não reveladas**, já normalizadas. Se a dica for recusada, o Capitão vê o motivo e pode tentar de novo dentro do mesmo tempo.

| Regra | Recusa | Aceita |
| --- | --- | --- |
| Uma palavra só, letras e hífen | "barco velho", "r2d2" | "guarda-chuva" |
| Não pode ser uma palavra do tabuleiro | MAR (com Mar no tabuleiro) | MAR (se Mar já foi revelada) |
| Não pode ser plural ou singular de uma palavra do tabuleiro | NAVIOS (com Navio) |  |
| Não pode conter nem estar contida numa palavra do tabuleiro, a partir de 4 letras | MARINHEIRO (com Marinha) | MAREJAR (com Mar, que tem menos de 4 letras) |
| Número de 1 até os Tesouros restantes do navio | 0, ou 5 com 4 restantes | 3 |

A validação é propositalmente simples. Casos como sinônimos diretos ou traduções (SHIP com Navio no tabuleiro) ficam para o bom senso dos jogadores.

## 10. Arquitetura técnica

O site em React fica na Vercel. As salas rodam num servidor de tempo real autoritativo: o servidor guarda o mapa secreto e decide o resultado de cada jogada, e cada cliente recebe só o que pode ver.

&#91;embedded content: arquitetura recomendada (opção A) · site na Vercel, salas na Cloudflare\]

O navegador carrega o site uma vez e depois conversa só com a sala. A sala roda o motor do jogo e envia para cada jogador uma visão filtrada: o Capitão recebe o mapa, os demais não.

### 10.1 Stack

| Camada | Escolha | Por quê |
| --- | --- | --- |
| Linguagem | TypeScript em tudo | Tipos compartilhados entre cliente e servidor |
| Repositório | Monorepo com pnpm e Turborepo | Site, servidor e motores de jogo no mesmo lugar |
| Front-end | Next.js (React), Tailwind CSS, Framer Motion, Zustand | Deploy direto na Vercel; animação das cartas; estado simples |
| Tempo real | WebSocket com um servidor por sala (decisão em 10.3) | Estado da partida centralizado e seguro |
| Motor do jogo | Pacote TypeScript puro, sem rede | Testável e reaproveitável no cliente e no servidor |
| Banco de palavras | Arquivos JSON versionados no repositório | Sem banco de dados no MVP |
| Testes | Vitest para o motor, Playwright para partidas simuladas | As regras são a parte mais crítica |

### 10.2 Estrutura do monorepo

```
apps/
  web/              Next.js: telas, componentes, conexão com a sala
  realtime/         servidor das salas
packages/
  platform/         sala, jogadores, avatares, interface GameDefinition
  games/codenomes/  regras, geração de tabuleiro, validação de dicas
  words/            banco de palavras por categoria
  ui/               componentes visuais compartilhados
```

Cada jogo implementa a mesma interface, e a plataforma cuida do resto (sala, conexão, jogadores):

```ts
interface GameDefinition<Config, State, Action, View> {
  setup(config: Config, players: Player[]): State
  validate(state: State, playerId: string, action: Action): string | null
  apply(state: State, playerId: string, action: Action): State
  viewFor(state: State, playerId: string): View   // filtra o que cada um vê
  result(state: State): GameResult | null
}
```

Jogo da velha, forca e xadrez entram depois como novos pacotes em `packages/games/`, sem mexer na sala.

### 10.3 Onde rodar o tempo real (decisão)

A Vercel lançou em 2026 o suporte nativo a WebSocket nas Functions, mas com dois limites que pesam para salas de jogo: cada conexão é encerrada quando a função atinge a duração máxima (300 s fixos no plano Hobby; até 800 s no Pro), e jogadores da mesma sala podem cair em instâncias diferentes. Por isso o estado da sala precisa ficar num armazenamento externo, como Redis ([Vercel KB](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections)).

| Opção | Como funciona | Prós | Contras |
| --- | --- | --- | --- |
| **A. Vercel + Cloudflare Durable Objects (recomendada)** | Site na Vercel; cada sala é um Durable Object (via PartyServer) que mantém o estado em memória e as conexões abertas | A sala é a unidade natural, sem quedas periódicas, sem Redis; serve para todos os jogos futuros | Duas plataformas para manter |
| B. Tudo na Vercel | WebSocket nas Vercel Functions mais Upstash Redis para estado e pub/sub | Uma plataforma só | Reconexão a cada 5 min no Hobby; lógica de estado e travas no Redis; recurso recente |

A recomendação é a opção A. Ela mantém a Vercel para o site e deixa as salas num serviço feito para esse padrão. Se for importante ter uma plataforma só, a opção B funciona, desde que a reconexão transparente seja feita desde o primeiro dia.

**Decisão (17/11/2026): opção B, tudo na Vercel com Redis.** Consequências para a implementação:

- O estado da sala vive no Redis (Upstash), nunca na memória da função. Cada ação lê o estado, aplica o motor e grava de volta com trava ou transação, para dois votos simultâneos não se sobrescreverem.
- As instâncias conversam por pub/sub do Redis: a ação que muda o estado publica no canal da sala, e cada função com conexões abertas reenvia a visão filtrada aos seus jogadores.
- A reconexão transparente entra desde o primeiro dia: o cliente reconecta sozinho antes do limite de duração da função e recebe o estado completo ao voltar, sem aviso na tela.
- Relógios por fase não podem depender de `setTimeout` na função; o prazo fica gravado no estado (`deadline`) e é conferido a cada ação e por uma verificação periódica.

### 10.4 Segurança e justiça

- O mapa secreto nunca é enviado para Marujos e Gaivotas: `viewFor` remove a cor das cartas não reveladas. Assim, não dá para trapacear abrindo as ferramentas do navegador.
- Toda ação é validada no servidor: é a vez do navio? O jogador é Marujo? A carta já foi revelada?
- O token do jogador identifica quem ele é na reconexão. Ninguém consegue agir em nome de outro jogador só trocando o nome.
- Há limite de mensagens por segundo por conexão, contra spam de votos.

## 11. Modelo de dados e eventos

O estado completo da sala vive no servidor. Os clientes enviam intenções (ações) e recebem de volta a visão filtrada do estado sempre que algo muda.

### 11.1 Estado (resumo)

```ts
type Room = {
  code: string                // "K7PX2M"
  adminId: string
  players: Record<string, Player>
  gameId: "codenomes"         // futuro: "velha" | "forca" | "xadrez"
  phase: "lobby" | "playing" | "finished"
  config: CodenomesConfig
  game: CodenomesState | null
}

type Player = {
  id: string; name: string; avatar: AvatarId
  shipId: ShipId | null       // null = Gaivota
  connected: boolean; lastSeen: number
}

type CodenomesState = {
  cards: Card[]               // { word, owner: ShipId | "sea" | "kraken", revealed, revealedBy }
  ships: Ship[]               // { id, name, color, captainId, eliminated }
  turnOrder: ShipId[]
  turn: {
    shipId: ShipId
    phase: "clue" | "guessing" | "cannon"
    clue?: { word: string; count: number }
    guessesLeft: number
    votes: Record<string, number | "end" | "cannon">   // playerId -> carta ou ação
    deadline: number | null
  }
  log: LogEntry[]             // Diário de Bordo
  winner: ShipId | null
}
```

### 11.2 Ações do cliente para o servidor

| Ação | Quem pode | Quando |
| --- | --- | --- |
| `join { name, avatar }` | Qualquer um com o link | Sempre |
| `chooseShip { shipId \| null }` | O próprio jogador | No salão |
| `updateConfig { ... }` | Almirante | No salão |
| `claimCaptain` | Jogador do navio | No salão, modo "o navio escolhe" |
| `start` | Almirante | No salão, com navios completos |
| `giveClue { word, count }` | Capitão da vez | Fase de dica |
| `vote { target: cardIndex \| "end" \| "cannon" \| null }` | Marujo da vez | Fase de palpites ou de canhão |
| `pause` / `resume` / `endGame` | Almirante | Durante a partida |
| `kick { playerId }` / `movePlayer { playerId, shipId }` / `transferAdmin { playerId }` | Almirante | Sempre |
| `backToLobby` | Almirante | No fim da partida |

### 11.3 Mensagens do servidor para o cliente

| Mensagem | Conteúdo |
| --- | --- |
| `state` | Visão completa filtrada para aquele jogador; enviada ao conectar e a cada mudança |
| `event` | Evento pontual para animação e som: carta revelada, navio eliminado, vitória |
| `error` | Motivo de uma ação recusada, como "Dica inválida: MAR está no tabuleiro" |

No MVP, mandar o estado filtrado inteiro a cada mudança é suficiente: um tabuleiro de 49 cartas com o Diário tem poucos KB. Atualizações parciais (diffs) só se aparecer problema de desempenho.

## 12. Escopo do MVP e roadmap

O MVP é uma partida completa de Pistas Piratas com 2 a 4 navios, jogada por link no computador. A versão para celular e tablet (seção 7.2) entrou em 18/11/2026, com os aparelhos deitados. Contas, estatísticas e novos jogos ficam para depois.

### 12.1 Checklist do MVP

- [ ] Motor de regras com testes: tabuleiro, turnos, votação, Tiro de Canhão, Kraken e vitória
- [ ] Gerador de tabuleiro com grade automática ou tamanho fixo (os presets saíram em 19/11/2026)
- [ ] Banco com 500 palavras (Geral e Mar e Pirataria) e palavras personalizadas
- [ ] Validação automática de dicas
- [ ] Criar sala, link de convite e entrada por código
- [ ] Perfil sem conta: nome e 16 avatares
- [ ] Salão: escolher navio, configurações, Capitão por sorteio ou escolha
- [ ] Tela de partida no computador, com visão de Capitão e de Marujo (e no celular e tablet deitados)
- [ ] Relógio configurável por fase
- [ ] Diário de Bordo ao vivo e no fim da partida
- [ ] Reconexão, troca de Capitão por queda e pausa
- [ ] Poderes do Almirante: expulsar, mover, transferir, encerrar
- [ ] Gaivotas (espectadores)
- [ ] Voltar ao salão e jogar de novo

### 12.2 Fases

1. **Fundação:** monorepo, interface `GameDefinition`, motor do Pistas Piratas com testes e banco de palavras. Ainda sem tela; dá para simular partidas inteiras nos testes.
2. **MVP jogável:** servidor das salas, telas, conexão em tempo real e o checklist acima. Termina com uma partida de verdade entre amigos pelo Discord.
3. **Polimento:** sons, animações, tutorial interativo de 1 minuto, "Copiar resumo", categorias Brasil, Cultura pop e Infantil (feito em 19/11/2026, junto com outras 12 categorias).
4. **Plataforma:** tela inicial com vários jogos. Jogo da velha e forca entram primeiro, porque são simples e testam se a interface `GameDefinition` serve para outros jogos. Depois vem o xadrez.
5. **Futuro:** conta opcional com estatísticas, salas públicas, outros idiomas e, talvez, monetização (avatares ou pacotes de palavras).

## 13. Decisões em aberto

Os itens abaixo ainda precisam de resposta. Os que têm uma suposição já estão escritos assim no documento e podem ser trocados.

- [x] **Nome do jogo:** decidido em 18/11/2026: **Pistas Piratas** (antes CodeNomes Piratas). Internamente o pacote continua `@arena/codenomes`. O nome da plataforma ("Arena de Jogos") segue provisório.
- [x] **Onde rodar o tempo real:** decidido em 17/11/2026: opção B, tudo na Vercel com Upstash Redis. Seção 10.3.
- [ ] **Primeiro palpite obrigatório:** os Marujos só podem encerrar a vez depois de pelo menos 1 palpite.
- [ ] **Tesouro de navio eliminado:** não conta para ninguém e encerra a vez.
- [ ] **Tempo do Capitão esgotado:** o navio perde a vez.
- [ ] **Capitão que volta depois de ser substituído:** volta como Marujo sem voto, porque já viu o mapa.

## Fontes

- [Vercel KB: Do Vercel Functions support WebSocket connections?](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections)
- [Vercel Docs: WebSockets](https://vercel.com/docs/functions/websockets)
