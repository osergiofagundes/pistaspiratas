# Assets

Artes-fonte do jogo, em resolução alta. Aqui fica só o que o jogo usa. Os originais gerados no ChatGPT ficam em `../Imagens/`, e o arquivo de telas `../telas/codenomes-piratas.figcraft` guarda uma cópia das imagens dentro dele.

A pasta `apps/web/public/img/` é gerada a partir desta e repete a mesma estrutura, em WebP:

```bash
cd ferramentas/imagem && node exportar-web.mjs
```

## Estrutura

| Pasta | Conteúdo | No jogo |
| --- | --- | --- |
| `fundos/` | 5 fundos de 1920×1080: início, salão, partida, vitória e derrota | fundo de cada tela |
| `cartas/` | 7 cartas do tabuleiro: fechada, tesouro de cada navio, Mar Aberto e Kraken | `Carta` |
| `personagens/` | 12 personagens × 4 cores de navio (`papagaio-rubi.png`…). Os 6 da terceira leva (ruiva, barba-branca, crocodilo, polvo, navegadora, touro) saem de `lotes/lote-3.mjs`, que recolore só a bandana/casaco | avatares |
| `personagens/vetor/` | vetores dos personagens (SVG; o arquivo do VectorCraft fica fora do git) | não vai para a web |
| `navios/` | 4 navios e o navio afundado | painéis, Salão, fim |
| `bandeiras/` | bandeiras grandes e bandeirinhas dos 4 navios | barra da vez, Diário |
| `logos/` | Pistas Piratas | Início, Salão |
| `idiomas/` | placas dos 6 idiomas (`pt`, `en`, `es`, `fr`, `de`, `it`) e o pano de cada bandeira (`bandeira-*`), do lote 6 | seletor de idioma, idioma das palavras |
| (`apps/web/public/img/app/`) | ícones do app de 180, 192 e 512 px (bandeira do Rubi sobre madeira), gerados direto pelo lote 7 | manifesto e "Adicionar à tela inicial" |
| `itens/` | brasão do Almirante e coroa do Capitão | selos |
| `interface/botoes/` | botões de 3 partes por cor e botões com texto, cada um com 4 estados (normal, `-hover`, `-pressionado` e `-desativado`) | `Botao`, `BotaoImagem` |
| `interface/icones/` | ícones redondos (som, ajuda, fechar e os da segunda leva) e o X dos modais (`fechar-modal`) | `Icone`, `IconeNovo` |
| `interface/molduras/` | peças que esticam em 9 ou 3 partes: moldura, painel grande, placa, campo, faixa e escotilha | `Moldura`, `PainelGrande`, `Placa`, `Campo` |
| `interface/controles/` | interruptor e caixa de marcar | `Interruptor`, `Marcador` |
| `interface/decoracoes/` | âncora, barris, baú de ouro e palmeiras em volta dos modais e painéis (barris e baú: `ferramentas/imagem/lotes/lote-5.mjs`) | modais, Início |
| `interface/fatias.json` | medidas das fatias (border-image) de cada moldura e botão, em px do PNG | CSS e `components/ui` |

## Nova leva de artes

1. Coloque os originais em `Imagens/Novas/`.
2. Crie um script em `ferramentas/imagem/lotes/` (use `lote-2.mjs` como modelo). Ele amplia as imagens 4× com o Real-ESRGAN, recorta o fundo branco com `recorte-branco.mjs` e salva em `ferramentas/imagem/saida/`, uma pasta de rascunho fora do git.
3. Confira o catálogo gerado, copie para a pasta certa daqui só as peças que o jogo vai usar e rode `exportar-web.mjs`.
