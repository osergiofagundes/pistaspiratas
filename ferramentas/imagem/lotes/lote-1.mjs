// Prepara as imagens novas (geradas no ChatGPT, fundo branco) e os fundos de tela.
//
// Entradas em ferramentas/imagem/saida/origem/ (cópias com nome simples dos arquivos de Imagens/Novas e Imagens/):
//   logo-codenomes.png, logo-arena.png, cartas.png (8 cartas 2×4), navio-afundado.png, fundo-inicio.png (imagem7)
//   e os 6 cenários recortados aqui de Imagens/imagem6.png → fundo-<nome>.png
// Cada uma é ampliada 4× com o Real-ESRGAN (ferramentas/realesrgan, modelo realesrgan-x4plus-anime) → *-4x.png
// Saída em ferramentas/imagem/saida/lote-1/: logos/, cartas/, navios/, fundos/ e catalogo.png
// uso: node preparar-novas.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { raw, inundar, componentes } from '../recorte.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(here, '../../..');
// saída numa pasta de rascunho: depois de conferir o catálogo, copie as peças usadas para assets/
const OUT = path.resolve(here, '../saida/lote-1');
const ORIG = path.resolve(here, '../saida/origem');
const ESRGAN = path.join(RAIZ, 'ferramentas/realesrgan');
for (const d of ['logos', 'cartas', 'navios', 'fundos']) fs.mkdirSync(path.join(OUT, d), { recursive: true });

// ---------- cenários de imagem6.png (linhas e colunas medidas pelas faixas coloridas) ----------
const CENARIOS = [
  ['fundo-ilha', 11, 9, 505, 312], ['fundo-salao', 520, 9, 1017, 312], ['fundo-conves', 1032, 9, 1526, 312],
  ['fundo-oceano', 10, 324, 507, 597], ['fundo-vitoria', 522, 324, 1019, 597], ['fundo-derrota', 1034, 324, 1526, 597],
];
const RECUO = 9; // px para dentro: some o canto arredondado e a borda clara do painel
for (const [nome, x0, y0, x1, y1] of CENARIOS) {
  const f = path.join(ORIG, `${nome}.png`);
  if (fs.existsSync(f)) continue;
  await sharp(path.join(RAIZ, 'Imagens/imagem6.png'))
    .extract({ left: x0 + RECUO, top: y0 + RECUO, width: x1 - x0 + 1 - 2 * RECUO, height: y1 - y0 + 1 - 2 * RECUO })
    .png().toFile(f);
}

// ---------- ampliação 4× ----------
const ENTRADAS = ['logo-codenomes', 'logo-arena', 'cartas', 'navio-afundado', 'fundo-inicio', ...CENARIOS.map((c) => c[0])];
for (const nome of ENTRADAS) {
  const de = path.join(ORIG, `${nome}.png`), para = path.join(ORIG, `${nome}-4x.png`);
  if (fs.existsSync(para)) continue;
  const t = Date.now();
  const r = spawnSync(path.join(ESRGAN, 'realesrgan-ncnn-vulkan.exe'), ['-i', de, '-o', para, '-n', 'realesrgan-x4plus-anime', '-s', '4'], { cwd: ESRGAN, encoding: 'utf8' });
  if (r.status !== 0 || !fs.existsSync(para)) throw new Error(`Real-ESRGAN falhou em ${nome}: ${r.stderr || r.error}`);
  console.log(`ampliado ${nome} em ${((Date.now() - t) / 1000).toFixed(1)} s`);
}

// ---------- recorte sobre fundo branco ----------
const brancura = (d, i) => 765 - d[i] - d[i + 1] - d[i + 2]; // 0 = branco puro
const T_DETECTA = 45; // 1×: mais longe do branco que isso é item
const T_FUNDO = 60; // 4×: fundo ligado às bordas
const T_BOLSAO = 9; // 4×: bolsão fechado precisa ser branco puro
const AREA_BOLSAO = 600; // px (4×)
const ESCURO_BOLSAO = 0.45; // fração mínima do contorno do bolsão que é traço escuro
const FRANJA = 2; // px (4×) de borda que pode virar semitransparente
const D_OPACO = 210; // brancura a partir da qual a borda é opaca
const MARGEM = 16; // px (4×) em volta da caixa
const PAD = 16; // px de folga no quadro comum das cartas
const LADO_MAX = 2400; // logos e navio são reduzidos até esse lado maior

function agrupar(comps, minArea, juntar) {
  const grandes = comps.filter((c) => c.area >= minArea).map((c) => ({ ...c, ids: [c.id] }));
  for (const c of comps) {
    if (c.area >= minArea) continue;
    let best = null, bd = Infinity;
    for (const g of grandes) {
      const d = Math.hypot(Math.max(g.x0 - c.x1, c.x0 - g.x1, 0), Math.max(g.y0 - c.y1, c.y0 - g.y1, 0));
      if (d < bd) (bd = d), (best = g);
    }
    if (best && bd < juntar) {
      best.x0 = Math.min(best.x0, c.x0); best.y0 = Math.min(best.y0, c.y0);
      best.x1 = Math.max(best.x1, c.x1); best.y1 = Math.max(best.y1, c.y1);
      best.area += c.area; best.ids.push(c.id);
    }
  }
  return grandes;
}

function emGrade(itens, linhas, colunas, nome) {
  if (itens.length !== linhas * colunas) throw new Error(`${nome}: esperava ${linhas * colunas} itens, achei ${itens.length}`);
  const cy = (i) => (i.y0 + i.y1) / 2, cx = (i) => (i.x0 + i.x1) / 2;
  const porY = [...itens].sort((a, b) => cy(a) - cy(b));
  const grade = [];
  for (let r = 0; r < linhas; r++) grade.push(porY.slice(r * colunas, (r + 1) * colunas).sort((a, b) => cx(a) - cx(b)));
  return grade;
}

/** máscara 1× do próprio item: seus componentes e tudo o que eles cercam (áreas brancas internas, como
 *  caveiras e espuma), alargada `raio` px. Só fica de fora o que se alcança pela borda sem cruzar o item. */
function mascaraDoItem(label, W1, H1, it, raio = 4) {
  const ids = new Set(it.ids);
  const bx0 = Math.max(0, it.x0 - raio - 1), by0 = Math.max(0, it.y0 - raio - 1);
  const bx1 = Math.min(W1 - 1, it.x1 + raio + 1), by1 = Math.min(H1 - 1, it.y1 + raio + 1);
  const w = bx1 - bx0 + 1, h = by1 - by0 + 1;
  const doItem = (x, y) => ids.has(label[(by0 + y) * W1 + bx0 + x]);
  const fora = inundar(w, h, (p) => !doItem(p % w, Math.floor(p / w)));
  const m = new Uint8Array(W1 * H1);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let dentro = !fora[y * w + x];
      for (let dy = -raio; dy <= raio && !dentro; dy++)
        for (let dx = -raio; dx <= raio && !dentro; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h && !fora[yy * w + xx]) dentro = true;
        }
      if (dentro) m[(by0 + y) * W1 + bx0 + x] = 1;
    }
  return m;
}

async function aparar(rgba, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (rgba[(y * w + x) * 4 + 3] > 8) (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y));
  const buf = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toBuffer();
  return { buf, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** recorta o item da imagem 4× e tira o branco: inundação pelas bordas, bolsões fechados (opcional) e franja */
async function recortar(up, it, proprio, W1, { bolsoes = false } = {}) {
  const x = Math.max(0, it.x0 * 4 - MARGEM), y = Math.max(0, it.y0 * 4 - MARGEM);
  const w = Math.min(up.W, (it.x1 + 1) * 4 + MARGEM) - x, h = Math.min(up.H, (it.y1 + 1) * 4 + MARGEM) - y;
  const buf = Buffer.alloc(w * h * 3);
  for (let r = 0; r < h; r++) up.data.copy(buf, r * w * 3, ((y + r) * up.W + x) * 3, ((y + r) * up.W + x + w) * 3);
  const fora = (p) => !proprio[((y + Math.floor(p / w)) >> 2) * W1 + ((x + (p % w)) >> 2)];
  const bg = inundar(w, h, (p) => brancura(buf, p * 3) <= T_FUNDO);
  for (let p = 0; p < w * h; p++) if (fora(p)) bg[p] = 1;

  const removidos = [];
  if (bolsoes) {
    const quase = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) if (!bg[p] && brancura(buf, p * 3) <= T_BOLSAO) quase[p] = 1;
    const { comps, label } = componentes(quase, w, h, { guardarPixels: true });
    for (const c of comps) {
      if (c.area < AREA_BOLSAO) continue;
      // contorno do bolsão: vizinhos (até 3 px) fora dele; um buraco de verdade é cercado de traço escuro
      let n = 0, escuros = 0;
      for (const p of c.pixels) {
        const px = p % w, py = (p - px) / w;
        for (const [dx, dy] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) {
          const xx = px + dx, yy = py + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const q = yy * w + xx;
          if (label[q] === c.id) continue;
          if (brancura(buf, q * 3) <= T_FUNDO) continue; // ainda na franja clara
          n++;
          if (buf[q * 3] + buf[q * 3 + 1] + buf[q * 3 + 2] < 330) escuros++;
        }
      }
      const fr = n ? escuros / n : 0;
      if (fr < ESCURO_BOLSAO) continue;
      for (const p of c.pixels) bg[p] = 1;
      removidos.push({ area: c.area, x: c.x0, y: c.y0, w: c.x1 - c.x0 + 1, h: c.y1 - c.y0 + 1, escuro: +fr.toFixed(2) });
    }
    // a franja clara colada nos bolsões removidos também sai
    for (let pass = 0; pass < 3; pass++) {
      const add = [];
      for (let p = 0; p < w * h; p++) {
        if (bg[p] || brancura(buf, p * 3) > T_FUNDO) continue;
        const px = p % w;
        if ((px > 0 && bg[p - 1]) || (px < w - 1 && bg[p + 1]) || (p >= w && bg[p - w]) || (p < w * (h - 1) && bg[p + w])) add.push(p);
      }
      for (const p of add) bg[p] = 1;
    }
  }

  // distância (em px, até FRANJA) de cada pixel do item ao fundo
  const dist = new Uint8Array(w * h).fill(255);
  let frente = [];
  for (let p = 0; p < w * h; p++) if (bg[p]) dist[p] = 0, frente.push(p);
  for (let d = 1; d <= FRANJA; d++) {
    const prox = [];
    for (const p of frente) {
      const px = p % w;
      for (const q of [p - w, p + w, px > 0 ? p - 1 : -1, px < w - 1 ? p + 1 : -1]) {
        if (q < 0 || q >= w * h || dist[q] <= d) continue;
        dist[q] = d; prox.push(q);
      }
    }
    frente = prox;
  }

  const rgba = Buffer.alloc(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    if (bg[p]) continue;
    let a = 1;
    if (dist[p] <= FRANJA) a = Math.min(1, brancura(buf, p * 3) / D_OPACO);
    if (a <= 0.02) continue;
    for (let k = 0; k < 3; k++) {
      // pixel = a·cor + (1 − a)·branco  ⇒  cor = 255 − (255 − pixel)/a
      const c = buf[p * 3 + k];
      rgba[p * 4 + k] = a >= 1 ? c : Math.max(0, Math.min(255, Math.round(255 - (255 - c) / a)));
    }
    rgba[p * 4 + 3] = Math.round(a * 255);
  }
  return { img: await aparar(rgba, w, h), removidos };
}

async function itensDe(nome, { linhas = 1, colunas = 1, minArea = 3000, juntar = 90 } = {}) {
  const src = await raw(path.join(ORIG, `${nome}.png`));
  const sel = new Uint8Array(src.W * src.H);
  for (let p = 0; p < sel.length; p++) if (brancura(src.data, p * 3) > T_DETECTA) sel[p] = 1;
  const { label, comps } = componentes(sel, src.W, src.H);
  const grade = emGrade(agrupar(comps, minArea, juntar), linhas, colunas, nome);
  const up = await raw(path.join(ORIG, `${nome}-4x.png`));
  if (up.W !== src.W * 4 || up.H !== src.H * 4) throw new Error(`${nome}-4x.png não tem 4× o tamanho do original`);
  return { src, label, grade, up };
}

async function reduzir(img) {
  const k = LADO_MAX / Math.max(img.w, img.h);
  if (k >= 1) return img;
  const w = Math.round(img.w * k), h = Math.round(img.h * k);
  return { buf: await sharp(img.buf).resize(w, h, { kernel: 'lanczos3' }).png().toBuffer(), w, h };
}

const feitos = [];
async function gravar(pasta, nome, img) {
  const file = path.join(OUT, pasta, `${nome}.png`);
  await sharp(img.buf).png({ compressionLevel: 9 }).toFile(file);
  feitos.push({ pasta, nome, file, w: img.w, h: img.h });
}

// logos e navio: uma peça por imagem
for (const [nome, pasta, saida, bolsoes] of [
  ['logo-codenomes', 'logos', 'logo-codenomes', false],
  ['logo-arena', 'logos', 'logo-arena', true],
  ['navio-afundado', 'navios', 'navio-afundado', true],
]) {
  const { src, label, grade, up } = await itensDe(nome);
  const it = grade[0][0];
  const { img, removidos } = await recortar(up, it, mascaraDoItem(label, src.W, src.H, it), src.W, { bolsoes });
  const red = await reduzir(img);
  await gravar(pasta, saida, red);
  console.log(saida.padEnd(26), `${img.w}×${img.h} → ${red.w}×${red.h}`, `peças juntadas: ${it.ids.length}`, bolsoes ? `bolsões removidos: ${removidos.length}` : '');
  for (const b of removidos) console.log('   bolsão', JSON.stringify(b));
}

// cartas: 8 em 2×4, num quadro comum
{
  const NOMES = [
    ['carta-fechada', 'carta-tesouro-rubi', 'carta-tesouro-safira', 'carta-tesouro-esmeralda'],
    ['carta-tesouro-ouro', 'carta-mar-aberto', 'carta-kraken', 'carta-verso'],
  ];
  const { src, label, grade, up } = await itensDe('cartas', { linhas: 2, colunas: 4, minArea: 20000, juntar: 12 });
  const cortes = [];
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 4; c++) {
      const it = grade[r][c];
      const { img } = await recortar(up, it, mascaraDoItem(label, src.W, src.H, it), src.W);
      cortes.push({ nome: NOMES[r][c], img });
    }
  const W = Math.max(...cortes.map((k) => k.img.w)) + 2 * PAD, H = Math.max(...cortes.map((k) => k.img.h)) + 2 * PAD;
  for (const k of cortes) {
    const buf = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: k.img.buf, left: Math.round((W - k.img.w) / 2), top: Math.round((H - k.img.h) / 2) }])
      .png().toBuffer();
    await gravar('cartas', k.nome, { buf, w: W, h: H });
    console.log(k.nome.padEnd(26), `${k.img.w}×${k.img.h} no quadro ${W}×${H}`);
  }
}

// ---------- fundos: 16:9, 1920×1080 JPG ----------
const fundos = [];
for (const nome of ['fundo-inicio', ...CENARIOS.map((c) => c[0])]) {
  const file = path.join(OUT, 'fundos', `${nome}.jpg`);
  await sharp(path.join(ORIG, `${nome}-4x.png`)).resize(1920, 1080, { fit: 'cover', position: 'centre', kernel: 'lanczos3' }).jpeg({ quality: 90, mozjpeg: true }).toFile(file);
  const m = await sharp(file).metadata();
  fundos.push({ nome, file });
  console.log(nome.padEnd(26), `${m.width}×${m.height}`, `${Math.round(fs.statSync(file).size / 1024)} KB`);
}

// ---------- catálogo: recortes sobre xadrez e sobre escuro, e os fundos ----------
{
  const LARG = 2400;
  const xadrez = (w, h, t = 24) => {
    const b = Buffer.alloc(w * h * 3);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) b.fill(((x / t) ^ (y / t)) & 1 ? 205 : 245, (y * w + x) * 3, (y * w + x) * 3 + 3);
    return sharp(b, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer();
  };
  const escuro = (w, h) => sharp({ create: { width: w, height: h, channels: 3, background: '#1b2633' } }).png().toBuffer();
  const camadas = [];
  let y = 0;
  const linha = async (lista, altura, fundoFn) => {
    let x = 0;
    for (const f of lista) {
      const im = await sharp(f.file).resize({ height: altura, width: Math.floor(LARG / lista.length) - 10, fit: 'inside' }).toBuffer({ resolveWithObject: true });
      const cw = Math.floor(LARG / lista.length) - 10;
      camadas.push({ input: await fundoFn(cw, altura + 20), left: x, top: y });
      camadas.push({ input: im.data, left: x + Math.round((cw - im.info.width) / 2), top: y + 10 + Math.round((altura - im.info.height) / 2) });
      x += cw + 10;
    }
    y += altura + 30;
  };
  const so = (pasta) => feitos.filter((f) => f.pasta === pasta);
  await linha([...so('logos'), ...so('navios')], 420, xadrez);
  await linha([...so('logos'), ...so('navios')], 420, escuro);
  await linha(so('cartas'), 400, xadrez);
  await linha(so('cartas'), 400, escuro);
  await linha(fundos, 180, escuro);
  await sharp({ create: { width: LARG, height: y, channels: 3, background: '#0f151d' } }).composite(camadas).png().toFile(path.join(OUT, 'catalogo.png'));
  console.log('catalogo.png', `${LARG}×${y}`);
}
console.log(`${feitos.length} PNGs e ${fundos.length} fundos em ${OUT}`);
