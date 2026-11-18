// Terceira leva: 6 personagens novos (Seis Piratas em Estilo Cartoon.png) em 4 equipes.
// Entrada: Imagens/Novas/Seis Piratas em Estilo Cartoon.png → saida/origem/piratas-2.png → Real-ESRGAN 4×
// Saída em ferramentas/imagem/saida/lote-3/: personagens/{id}-{equipe}.png (1024×1024) e catalogo-3.png
// A imagem original é a equipe Rubi; nas outras, só o vermelho da bandana/casaco (dentro da região
// de cada personagem) troca de matiz, como nos personagens da primeira leva.
// uso: node lotes/lote-3.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { recortar, itensDe, mascaraDoItem } from '../recorte-branco.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(here, '../../..');
const OUT = path.resolve(here, '../saida/lote-3');
const ORIG = path.resolve(here, '../saida/origem');
const ESRGAN = path.join(RAIZ, 'ferramentas/realesrgan');
fs.mkdirSync(path.join(OUT, 'personagens'), { recursive: true });
fs.mkdirSync(ORIG, { recursive: true });

// ---------- ampliação ----------
const de = path.join(ORIG, 'piratas-2.png'), para = path.join(ORIG, 'piratas-2-4x.png');
if (!fs.existsSync(de)) fs.copyFileSync(path.join(RAIZ, 'Imagens/Novas/Seis Piratas em Estilo Cartoon.png'), de);
if (!fs.existsSync(para)) {
  const t = Date.now();
  const r = spawnSync(path.join(ESRGAN, 'realesrgan-ncnn-vulkan.exe'), ['-i', de, '-o', para, '-n', 'realesrgan-x4plus-anime', '-s', '4'], { cwd: ESRGAN, encoding: 'utf8' });
  if (r.status !== 0 || !fs.existsSync(para)) throw new Error(`Real-ESRGAN falhou: ${r.stderr || r.error}`);
  console.log(`ampliado em ${((Date.now() - t) / 1000).toFixed(1)} s`);
}

// ---------- personagens, na ordem da folha (3 colunas × 2 linhas) ----------
const IDS = ['ruiva', 'barba-branca', 'crocodilo', 'polvo', 'navegadora', 'touro'];

/**
 * Onde o vermelho vira a cor da equipe, em frações do quadro final de 1024 px (x0, y0, x1, y1).
 * `fora` são retângulos dentro da região que não mudam (cabelo, boca, ventosas…).
 */
const REGIOES = {
  // casaco: o cabelo tem a mesma cor, então o casaco é um polígono seguindo a gola dourada
  ruiva: {
    dentro: [[[0.17, 1], [0.19, 0.9], [0.21, 0.83], [0.24, 0.775], [0.32, 0.755], [0.4, 0.735], [0.6, 0.735], [0.7, 0.76], [0.75, 0.8], [0.79, 0.86], [0.81, 0.92], [0.82, 1]]],
    fora: [],
  },
  // bandana (faixa na testa e nó à esquerda); a orelha fica de fora pelo matiz
  'barba-branca': { dentro: [[0.25, 0.12, 0.9, 0.37], [0.06, 0.28, 0.42, 0.64]], fora: [[0.27, 0.4, 0.37, 0.57]] },
  // bandana; a boca fica de fora
  crocodilo: { dentro: [[0.2, 0.05, 0.8, 0.32], [0, 0.18, 0.36, 0.56]], fora: [[0.42, 0.4, 0.95, 0.65]] },
  // casaco; as ventosas rosadas ficam de fora pelo matiz mais estreito
  polvo: { dentro: [[0, 0.8, 1, 1]], fora: [], tol: [9, 14] },
  // bandana (o óculos fica em cima)
  navegadora: { dentro: [[0.12, 0.02, 0.95, 0.38], [0, 0.22, 0.3, 0.7]], fora: [], tol: [14, 22] },
  // casaco; o pelo marrom fica de fora pelo matiz mais estreito
  touro: { dentro: [[0, 0.76, 1, 1]], fora: [], tol: [9, 14] },
};

/** matiz (graus), multiplicador de saturação e de brilho de cada equipe */
const EQUIPES = {
  rubi: null,
  safira: { h: 216, s: 1.0, v: 1.0 },
  esmeralda: { h: 122, s: 0.95, v: 0.95 },
  ouro: { h: 44, s: 1.0, v: 1.25 },
};

const LADO = 1024;
const LARG_MAX = 912; // largura máxima do personagem no quadro (como os da primeira leva)
const ALT_MAX = 930;

function rgbHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max];
}

function hsvRgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** peso 0..1 de "vermelho da equipe" (com transição suave nas bordas do critério) */
function pesoVermelho(h, s, v, [cheio, zero] = [12, 20]) {
  const dh = Math.min(Math.abs(h - 0), Math.abs(h - 360)); // distância ao vermelho puro
  const wh = dh <= cheio ? 1 : dh >= zero ? 0 : (zero - dh) / (zero - cheio);
  const ws = s >= 0.45 ? 1 : s <= 0.3 ? 0 : (s - 0.3) / 0.15;
  const wv = v >= 0.18 ? 1 : v <= 0.08 ? 0 : (v - 0.08) / 0.1;
  return wh * ws * wv;
}

/** ponto dentro do polígono [[x, y], …] (regra par-ímpar) */
function noPoligono(pts, fx, fy) {
  let dentro = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > fy !== yj > fy && fx < ((xj - xi) * (fy - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

/** regiões: retângulo [x0, y0, x1, y1] ou polígono [[x, y], …] */
const dentroDe = (rs, fx, fy) =>
  rs.some((r) => (Array.isArray(r[0]) ? noPoligono(r, fx, fy) : fx >= r[0] && fx <= r[2] && fy >= r[1] && fy <= r[3]));

/** máscara suavizada (0..255) dos pixels que trocam de cor */
async function mascara(id, data) {
  const reg = REGIOES[id];
  const m = Buffer.alloc(LADO * LADO);
  for (let y = 0; y < LADO; y++)
    for (let x = 0; x < LADO; x++) {
      const p = y * LADO + x;
      if (data[p * 4 + 3] < 8) continue;
      const fx = x / LADO, fy = y / LADO;
      if (!dentroDe(reg.dentro, fx, fy) || dentroDe(reg.fora, fx, fy)) continue;
      const [h, s, v] = rgbHsv(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);
      m[p] = Math.round(pesoVermelho(h, s, v, reg.tol) * 255);
    }
  // desfoque leve para não deixar serrilhado na divisa
  // (o sharp devolve 3 canais depois do blur: fica só o primeiro)
  return sharp(m, { raw: { width: LADO, height: LADO, channels: 1 } }).blur(1.2).extractChannel(0).raw().toBuffer();
}

function recolorir(data, m, eq) {
  const out = Buffer.from(data);
  for (let p = 0; p < LADO * LADO; p++) {
    const k = m[p] / 255;
    if (k <= 0) continue;
    const [, s, v] = rgbHsv(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);
    const [r, g, b] = hsvRgb(eq.h, Math.min(1, s * eq.s), Math.min(1, v * eq.v));
    out[p * 4] = Math.round(data[p * 4] * (1 - k) + r * k);
    out[p * 4 + 1] = Math.round(data[p * 4 + 1] * (1 - k) + g * k);
    out[p * 4 + 2] = Math.round(data[p * 4 + 2] * (1 - k) + b * k);
  }
  return out;
}

// ---------- recorte e enquadramento ----------
const { src, label, grade, up } = await itensDe('piratas-2', { linhas: 2, colunas: 3, minArea: 20000, juntar: 12 });
const quadros = {};
for (let i = 0; i < IDS.length; i++) {
  const it = grade[Math.floor(i / 3)][i % 3];
  const { img } = await recortar(up, it, mascaraDoItem(label, src.W, src.H, it), src.W);
  const k = Math.min(LARG_MAX / img.w, ALT_MAX / img.h);
  const w = Math.round(img.w * k), h = Math.round(img.h * k);
  const redim = await sharp(img.buf).resize(w, h, { kernel: 'lanczos3' }).png().toBuffer();
  // centralizado e encostado embaixo (os ombros são cortados retos, como nos outros personagens)
  const quadro = await sharp({ create: { width: LADO, height: LADO, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: redim, left: Math.round((LADO - w) / 2), top: LADO - h }])
    .raw()
    .toBuffer();
  quadros[IDS[i]] = quadro;
}

// ---------- equipes ----------
const fichas = [];
for (const id of IDS) {
  const data = quadros[id];
  const m = await mascara(id, data);
  for (const [eq, cor] of Object.entries(EQUIPES)) {
    const px = cor ? recolorir(data, m, cor) : data;
    const file = path.join(OUT, 'personagens', `${id}-${eq}.png`);
    await sharp(px, { raw: { width: LADO, height: LADO, channels: 4 } }).png({ compressionLevel: 9 }).toFile(file);
    fichas.push(file);
  }
  // máscara para conferência
  await sharp(m, { raw: { width: LADO, height: LADO, channels: 1 } }).png().toFile(path.join(OUT, `mascara-${id}.png`));
  console.log(id.padEnd(14), 'ok');
}

// ---------- catálogo (6 linhas × 4 equipes) sobre fundo escuro ----------
const T = 220;
const comp = await Promise.all(
  fichas.map(async (f, i) => ({ input: await sharp(f).resize(T, T).png().toBuffer(), left: (i % 4) * T, top: Math.floor(i / 4) * T })),
);
await sharp({ create: { width: 4 * T, height: 6 * T, channels: 4, background: '#3a3a44' } })
  .composite(comp)
  .png()
  .toFile(path.join(OUT, 'catalogo-3.png'));
console.log('catálogo:', path.join(OUT, 'catalogo-3.png'));
