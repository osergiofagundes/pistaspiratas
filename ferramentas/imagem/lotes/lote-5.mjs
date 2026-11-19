// Quinta leva: decorações limpas de barril e baú de ouro para os modais e o painel do Início.
// Fonte: Imagens/Oficiais/Interface.png (folha com os painéis; as peças ficam encostadas nas molduras)
//   deco-barris: par de barris com moedas, canto inferior esquerdo do painel grande
//   deco-bau:    baú aberto com moedas, do modal de aviso
// Cada região é ampliada 4× (Real-ESRGAN). O polígono segue o contorno escuro da peça um pouco por fora;
// o que sobra entre o polígono e o contorno (xadrez, pergaminho, moldura) é removido por inundação a partir
// da borda do polígono, que para no traço escuro da peça.
// Saída em ferramentas/imagem/saida/lote-5/: deco-barris.png, deco-bau.png e catalogo-5.png
// uso: node lotes/lote-5.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(here, '../../..');
const OUT = path.resolve(here, '../saida/lote-5');
const ORIG = path.resolve(here, '../saida/origem');
const ESRGAN = path.join(RAIZ, 'ferramentas/realesrgan');
const FOLHA = path.join(RAIZ, 'Imagens/Oficiais/Interface.png');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(ORIG, { recursive: true });

/** região na folha (x, y, largura, altura) e polígono em px do recorte 1× */
const PECAS = {
  'deco-barris': {
    regiao: [0, 845, 140, 160],
    poligono: [
      [9, 44], [14, 35], [22, 31], [40, 29], [60, 29], [66, 30], [70, 33], [71, 40], [73, 48], [85, 49], [100, 50], [105, 56],
      [109, 65], [110, 90], [109, 113], [118, 116], [120.5, 121], [121.5, 126], [136, 126], [139.5, 129], [139.5, 138], [136, 143], [128, 146], [120, 147], [110, 147], [95, 147], [60, 147],
      [30, 147], [14, 143], [10, 132], [11, 110], [12, 100], [9, 90], [8, 60],
    ],
  },
  'deco-bau': {
    regiao: [800, 450, 160, 140],
    poligono: [
      [26, 36], [30, 29], [42, 25], [50, 24], [62, 23], [78, 22], [90, 24], [96, 29], [97, 44], [101, 51], [118, 55],
      [132, 57], [133.5, 62], [132.5, 80], [132, 93], [136, 97], [136, 108], [131, 115], [120, 118], [105, 120], [90, 121],
      [75, 123], [55, 124], [40, 122], [30, 118], [19, 112], [18, 100], [21, 88], [24, 78], [27, 70], [26, 60], [24, 48],
    ],
  },
};
const ESCURO = 70; // luminância do traço de contorno
const ALCANCE = 44; // px (4×) que a inundação pode andar a partir da borda do polígono
const LASCA = 8; // px (4×): pedaços mais finos que 2× isso somem na abertura
const CONTORNO = 5; // px (4×) de traço escuro em volta da silhueta
const TRACO = [26, 14, 8]; // cor do traço (o marrom quase preto do contorno da arte)

/** valor = 1: dilata a máscara `r` px (vizinhança 8); valor = 0: erode */
function dilatar(m, r, valor, W, H) {
  let a = m;
  for (let i = 0; i < r; i++) {
    const b = Uint8Array.from(a);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (a[p] === valor) continue;
        for (let dy = -1; dy <= 1 && b[p] !== valor; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx >= 0 && yy >= 0 && xx < W && yy < H && a[yy * W + xx] === valor) { b[p] = valor; break; }
          }
      }
    a = b;
  }
  return a;
}

for (const [nome, { regiao, poligono }] of Object.entries(PECAS)) {
  const de = path.join(ORIG, `${nome}.png`), para = path.join(ORIG, `${nome}-4x.png`);
  const [rx, ry, rw, rh] = regiao;
  if (!fs.existsSync(de)) await sharp(FOLHA).extract({ left: rx, top: ry, width: rw, height: rh }).png().toFile(de);
  if (!fs.existsSync(para)) {
    const r = spawnSync(path.join(ESRGAN, 'realesrgan-ncnn-vulkan.exe'), ['-i', de, '-o', para, '-n', 'realesrgan-x4plus-anime', '-s', '4'], { cwd: ESRGAN, encoding: 'utf8' });
    if (r.status !== 0 || !fs.existsSync(para)) throw new Error(`Real-ESRGAN falhou em ${nome}: ${r.stderr || r.error}`);
  }
  const { data, info } = await sharp(para).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;

  // polígono rasterizado em 4×
  const pts = poligono.map(([x, y]) => `${x * 4},${y * 4}`).join(' ');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><polygon points="${pts}" fill="#fff"/></svg>`;
  const poly = (await sharp(Buffer.from(svg)).extractChannel(0).raw().toBuffer());

  // inundação limitada a partir de fora do polígono, parando no traço escuro
  const lum = (p) => 0.299 * data[p * 3] + 0.587 * data[p * 3 + 1] + 0.114 * data[p * 3 + 2];
  const dist = new Int32Array(W * H).fill(-1);
  let frente = [];
  for (let p = 0; p < W * H; p++) if (poly[p] < 128) (dist[p] = 0), frente.push(p);
  for (let d = 1; d <= ALCANCE && frente.length; d++) {
    const prox = [];
    for (const p of frente) {
      const x = p % W;
      for (const q of [p - W, p + W, x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1]) {
        if (q < 0 || q >= W * H || dist[q] >= 0 || lum(q) < ESCURO) continue;
        dist[q] = d;
        prox.push(q);
      }
    }
    frente = prox;
  }
  let peca = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) peca[p] = dist[p] < 0 ? 1 : 0;
  // abertura (tira lascas finas que sobraram da moldura) e contorno de adesivo em volta da silhueta,
  // no mesmo traço escuro da arte: um corte reto vira borda contornada
  peca = dilatar(dilatar(peca, LASCA, 0, W, H), LASCA, 1, W, H);
  const fora = dilatar(peca, CONTORNO, 1, W, H);
  const alfa = Buffer.alloc(W * H);
  for (let p = 0; p < W * H; p++) alfa[p] = fora[p] ? 255 : 0;
  const suave = await sharp(alfa, { raw: { width: W, height: H, channels: 1 } }).blur(1.2).extractChannel(0).raw().toBuffer();
  const rgba = Buffer.alloc(W * H * 4);
  for (let p = 0; p < W * H; p++) {
    const borda = !peca[p];
    rgba[p * 4] = borda ? TRACO[0] : data[p * 3];
    rgba[p * 4 + 1] = borda ? TRACO[1] : data[p * 3 + 1];
    rgba[p * 4 + 2] = borda ? TRACO[2] : data[p * 3 + 2];
    rgba[p * 4 + 3] = Math.min(alfa[p], suave[p]);
  }
  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 }).png({ compressionLevel: 9 }).toFile(path.join(OUT, `${nome}.png`));
  const m = await sharp(path.join(OUT, `${nome}.png`)).metadata();
  console.log(nome.padEnd(14), `${m.width}×${m.height}`, `proporção ${(m.width / m.height).toFixed(3)}`);
}

// ---------- catálogo: sobre pergaminho, mar e magenta (para achar sobras) ----------
const FUNDOS = ['#F3D9A4', '#2a6fb0', '#ff00ff'];
const camadas = [];
let x = 20;
for (const nome of Object.keys(PECAS)) {
  const b = await sharp(path.join(OUT, `${nome}.png`)).resize({ height: 360 }).png().toBuffer();
  const { width } = await sharp(b).metadata();
  FUNDOS.forEach((cor, i) => {
    camadas.push({ input: { create: { width: width + 20, height: 380, channels: 3, background: cor } }, left: x - 10, top: 10 + i * 400 });
    camadas.push({ input: b, left: x, top: 20 + i * 400 });
  });
  x += width + 50;
}
await sharp({ create: { width: x, height: 1210, channels: 3, background: '#0f151d' } }).composite(camadas).png().toFile(path.join(OUT, 'catalogo-5.png'));
console.log('catálogo:', path.join(OUT, 'catalogo-5.png'));
