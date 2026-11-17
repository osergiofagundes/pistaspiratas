# Arena de Jogos · CodeNomes Piratas

Jogo de palavras em equipes (2 a 4 navios), jogado por link, sem conta. Regras e decisões em [`projeto-jogo.md`](projeto-jogo.md); telas desenhadas em `telas/codenomes-piratas.figcraft`.

Os arquivos de design (`*.figcraft` e `*.vectorcraft`) são grandes e ficam fora do git: guarde o backup deles em outro lugar (drive, nuvem).

O Real-ESRGAN (ampliação 4× das artes) também fica fora do git: baixe o `realesrgan-ncnn-vulkan` para Windows (releases de xinntao/Real-ESRGAN) e descompacte em `ferramentas/realesrgan/`.

## Rodar no computador

Requisitos: Node 22+ e pnpm (`npm i -g pnpm`).

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Para jogar sozinho testando, abra a sala em janelas anônimas diferentes (cada janela é um jogador). Na mesma rede, os amigos entram pelo endereço "Network" que o `pnpm dev` mostra (por exemplo `http://192.168.1.7:3000`).

Versão de produção local:

```bash
pnpm --filter @arena/web build
pnpm start
```

## Testes

```bash
pnpm test         # motor do jogo e sala (Vitest)
pnpm e2e          # partidas simuladas com vários navegadores (Playwright; sobe o servidor sozinho)
pnpm typecheck
```

## Estrutura

```
apps/web/                 Next.js: telas, API das salas e canal de tempo real
  app/api/salas/...       criar, entrar, ações (POST) e eventos (Server-Sent Events)
  components/telas/       Início, Salão, Partida e Fim
  components/jogo/        Carta, Tabuleiro, Painel do navio e Diário de Bordo
  components/ui/          palco 1920×1080, molduras de 9 partes, botões, avatares
  server/rooms.ts         serviço das salas (memória local)
  public/img/             artes em WebP, geradas de assets/ por ferramentas/imagem/exportar-web.mjs
packages/
  platform/               sala, jogadores, Almirante, interface GameDefinition, RoomService
  games/codenomes/        regras, tabuleiro e presets, validação de dicas, Diário, visão filtrada
  words/                  banco de palavras (Geral e Mar e Pirataria)
tests/e2e/                testes de ponta a ponta
assets/                   artes-fonte usadas pelo jogo (estrutura em assets/README.md)
ferramentas/imagem/       exportação para a web, recorte de fundo branco e scripts de cada leva (lotes/)
```

## Tempo real

O servidor é autoritativo: guarda o mapa secreto, valida cada ação e manda para cada jogador só o que ele pode ver (`viewFor`). O navegador recebe o estado por Server-Sent Events (`/api/salas/[codigo]/eventos`), que reconecta sozinho, e envia as ações por POST (`/api/salas/[codigo]/acao`). Relógios, contagem de 3 s dos votos, queda de Capitão e limpeza de salas rodam num passo periódico (`RoomService.tick`).

Localmente as salas ficam na memória do processo (`MemoryStore`). Para publicar na Vercel com Redis (decisão da seção 10.3), basta implementar a interface `RoomStore` sobre o Upstash Redis e trocar o pub/sub em memória pelo do Redis; o motor e as telas não mudam.

## Artes

As artes-fonte ficam em `assets/` (veja [`assets/README.md`](assets/README.md)); a pasta `apps/web/public/img` é gerada a partir delas, com a mesma estrutura:

```bash
cd ferramentas/imagem && node exportar-web.mjs
```
