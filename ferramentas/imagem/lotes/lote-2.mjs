// Segunda leva de imagens do ChatGPT: 5 fundos, brasão, bandeira da gaivota, folha de ícones e folha de interface.
// Entradas: Imagens/Novas/*.png → cópias com nome simples em ferramentas/imagem/saida/origem/ → Real-ESRGAN 4× (*-4x.png)
// Saída em ferramentas/imagem/saida/lote-2/: fundos/, itens/, icones/, ui/ e catalogo-2.png
// uso: node preparar-novas-2.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { recortar, itensDe, mascaraDoItem } from '../recorte-branco.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(here, '../../..');
const NOVAS = path.join(RAIZ, 'Imagens/Novas');
// saída numa pasta de rascunho: depois de conferir o catálogo, copie as peças usadas para assets/
const OUT = path.resolve(here, '../saida/lote-2');
const ORIG = path.resolve(here, '../saida/origem');
const ESRGAN = path.join(RAIZ, 'ferramentas/realesrgan');
for (const d of ['fundos/antigos', 'itens', 'icones', 'ui']) fs.mkdirSync(path.join(OUT, d), { recursive: true });

const FONTES = {
  'bg-baia': 'Baía Pirata Tropical com Ilha Caveira.png',
  'bg-mesa': 'Mesa Pirata de Aventuras.png',
  'bg-porto': 'Pôr do Sol no Porto Pirata.png',
  'bg-tempestade': 'Tempestade do Kraken no Mar Sombrio.png',
  'bg-tesouro': 'Tesouro Tropical ao Pôr do Sol.png',
  brasao: 'Brasão Pirata com Coroa e Espadas.png',
  gaivota: 'Gaivota Alegre na Bandeira Voadora.png',
  icones: 'Grade de Ícones Dourados para Jogo.png',
  ui: 'Elementos de UI Pirata em Madeira.png',
};

// cópia com nome simples + ampliação 4×
for (const [nome, arq] of Object.entries(FONTES)) {
  const de = path.join(ORIG, `${nome}.png`), para = path.join(ORIG, `${nome}-4x.png`);
  if (!fs.existsSync(de)) fs.copyFileSync(path.join(NOVAS, arq), de);
  if (fs.existsSync(para)) continue;
  const t = Date.now();
  const r = spawnSync(path.join(ESRGAN, 'realesrgan-ncnn-vulkan.exe'), ['-i', de, '-o', para, '-n', 'realesrgan-x4plus-anime', '-s', '4'], { cwd: ESRGAN, encoding: 'utf8' });
  if (r.status !== 0 || !fs.existsSync(para)) throw new Error(`Real-ESRGAN falhou em ${nome}: ${r.stderr || r.error}`);
  console.log(`ampliado ${nome} em ${((Date.now() - t) / 1000).toFixed(1)} s`);
}

// ---------- fundos (os antigos vão para fundos/antigos) ----------
const FUNDOS = { 'fundo-inicio': 'bg-baia', 'fundo-partida': 'bg-mesa', 'fundo-salao': 'bg-porto', 'fundo-derrota': 'bg-tempestade', 'fundo-vitoria': 'bg-tesouro' };
const fundos = [];
for (const [saida, fonte] of Object.entries(FUNDOS)) {
  const file = path.join(OUT, 'fundos', `${saida}.jpg`);
  const antigo = path.join(OUT, 'fundos/antigos', `${saida}.jpg`);
  if (fs.existsSync(file) && !fs.existsSync(antigo)) fs.renameSync(file, antigo);
  await sharp(path.join(ORIG, `${fonte}-4x.png`)).resize(1920, 1080, { fit: 'cover', position: 'centre', kernel: 'lanczos3' }).jpeg({ quality: 90, mozjpeg: true }).toFile(file);
  fundos.push({ file });
  console.log(saida.padEnd(16), '1920×1080', `${Math.round(fs.statSync(file).size / 1024)} KB`);
}

async function reduzir(img, lado) {
  const k = lado / Math.max(img.w, img.h);
  if (k >= 1) return img;
  const w = Math.round(img.w * k), h = Math.round(img.h * k);
  return { buf: await sharp(img.buf).resize(w, h, { kernel: 'lanczos3' }).png().toBuffer(), w, h };
}
const feitos = [];
async function gravar(pasta, nome, img) {
  const file = path.join(OUT, pasta, `${nome}.png`);
  await sharp(img.buf).png({ compressionLevel: 9 }).toFile(file);
  feitos.push({ pasta, nome, file });
  console.log(`${pasta}/${nome}`.padEnd(28), `${img.w}×${img.h}`);
}

// ---------- itens isolados ----------
for (const [fonte, saida, bolsoes] of [['brasao', 'brasao-almirante', true], ['gaivota', 'bandeira-gaivota', false]]) {
  const { src, label, grade, up } = await itensDe(fonte);
  const it = grade[0][0];
  const { img, removidos } = await recortar(up, it, mascaraDoItem(label, src.W, src.H, it), src.W, { bolsoes });
  await gravar('itens', saida, await reduzir(img, 1400));
  if (bolsoes) console.log('   bolsões removidos:', removidos.length);
}

// ---------- ícones: grade 4×4 ----------
{
  const NOMES = ['mais', 'menos', 'copiar', 'link', 'ampulheta', 'olho', 'olho-riscado', 'canhao', 'mapa', 'cadeado', 'embaralhar', 'visto', 'play', 'pausa', 'sair', 'engrenagem'];
  const { src, label, grade, up } = await itensDe('icones', { linhas: 4, colunas: 4, minArea: 20000, juntar: 12 });
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      const it = grade[r][c];
      const { img } = await recortar(up, it, mascaraDoItem(label, src.W, src.H, it), src.W);
      await gravar('icones', NOMES[r * 4 + c], await reduzir(img, 512));
    }
}

// ---------- interface: peças identificadas pelo centro aproximado (coordenadas da folha 1536×1024) ----------
{
  const PECAS = [
    ['interruptor-ligado', 200, 130], ['interruptor-desligado', 550, 130], ['caixa', 830, 130], ['caixa-marcada', 1040, 130],
    ['radio', 1240, 130], ['radio-marcado', 1425, 130], ['campo', 360, 375], ['seletor', 1010, 375], ['seta', 1425, 375],
    ['faixa', 570, 655], ['escotilha', 1325, 680], ['abas', 580, 915],
  ];
  const det = await (async () => {
    const { raw, componentes } = await import('./recorte.mjs');
    const { agrupar, brancura } = await import('./recorte-branco.mjs');
    const s1 = await raw(path.join(ORIG, 'ui.png'));
    const sel = new Uint8Array(s1.W * s1.H);
    for (let p = 0; p < sel.length; p++) if (brancura(s1.data, p * 3) > 45) sel[p] = 1;
    const { label: lb, comps } = componentes(sel, s1.W, s1.H);
    const itens = agrupar(comps, 3000, 12);
    const u = await raw(path.join(ORIG, 'ui-4x.png'));
    return { s1, lb, itens, u };
  })();
  console.log('peças de interface encontradas:', det.itens.length);
  const usados = new Set();
  for (const [nome, cx, cy] of PECAS) {
    let best = null, bd = Infinity;
    det.itens.forEach((it, i) => {
      if (usados.has(i)) return;
      const d = Math.hypot((it.x0 + it.x1) / 2 - cx, (it.y0 + it.y1) / 2 - cy);
      if (d < bd) (bd = d), (best = i);
    });
    if (best == null || bd > 160) { console.log('   não achei', nome); continue; }
    usados.add(best);
    const it = det.itens[best];
    const { img, removidos } = await recortar(det.u, it, mascaraDoItem(det.lb, det.s1.W, det.s1.H, it), det.s1.W, { bolsoes: true });
    await gravar('ui', nome, await reduzir(img, 1600));
    if (removidos.length) console.log('   bolsões removidos:', removidos.length);
  }
}

// ---------- catálogo ----------
{
  const LARG = 2400;
  const xadrez = (w, h, t = 20) => {
    const b = Buffer.alloc(w * h * 3);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) b.fill(((x / t) ^ (y / t)) & 1 ? 205 : 245, (y * w + x) * 3, (y * w + x) * 3 + 3);
    return sharp(b, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer();
  };
  const escuro = (w, h) => sharp({ create: { width: w, height: h, channels: 3, background: '#1b2633' } }).png().toBuffer();
  const camadas = [];
  let y = 0;
  const linha = async (lista, altura, fundoFn) => {
    let x = 0;
    const cw = Math.floor(LARG / lista.length) - 10;
    for (const f of lista) {
      const im = await sharp(f.file).resize({ height: altura, width: cw, fit: 'inside' }).toBuffer({ resolveWithObject: true });
      camadas.push({ input: await fundoFn(cw, altura + 20), left: x, top: y });
      camadas.push({ input: im.data, left: x + Math.round((cw - im.info.width) / 2), top: y + 10 + Math.round((altura - im.info.height) / 2) });
      x += cw + 10;
    }
    y += altura + 30;
  };
  const so = (p) => feitos.filter((f) => f.pasta === p);
  await linha(so('icones').slice(0, 8), 200, escuro);
  await linha(so('icones').slice(8), 200, escuro);
  await linha(so('ui').slice(0, 6), 180, xadrez);
  await linha(so('ui').slice(6), 220, xadrez);
  await linha(so('ui').slice(6), 220, escuro);
  await linha(so('itens'), 360, xadrez);
  await linha(so('itens'), 360, escuro);
  await linha(fundos, 220, escuro);
  await sharp({ create: { width: LARG, height: y, channels: 3, background: '#0f151d' } }).composite(camadas).png().toFile(path.join(OUT, 'catalogo-2.png'));
  console.log('catalogo-2.png', `${LARG}×${y}`);
}
