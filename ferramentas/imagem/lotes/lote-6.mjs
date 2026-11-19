// Sexta leva: placas de idioma (Ícones Piratas das Línguas Mundiais.png, gerada no ChatGPT, fundo branco, grade 3×2).
// Entrada: Imagens/Novas/Ícones Piratas das Línguas Mundiais.png → saida/origem/idiomas.png → Real-ESRGAN 4×
// Saída em ferramentas/imagem/saida/lote-6/: idiomas/{pt,en,es,fr,de,it}.png (placa inteira),
// idiomas/bandeira-{id}.png (retângulo do pano da bandeira, 3:2) e catalogo-6.png.
// Depois de conferir o catálogo, copie a pasta idiomas/ para assets/ e rode exportar-web.mjs.
// uso: node lotes/lote-6.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { recortar, itensDe, mascaraDoItem, reduzir } from '../recorte-branco.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(here, '../../..');
const OUT = path.resolve(here, '../saida/lote-6');
const ORIG = path.resolve(here, '../saida/origem');
const ESRGAN = path.join(RAIZ, 'ferramentas/realesrgan');
fs.mkdirSync(path.join(OUT, 'idiomas'), { recursive: true });
fs.mkdirSync(ORIG, { recursive: true });

// ---------- ampliação ----------
const de = path.join(ORIG, 'idiomas.png'), para = path.join(ORIG, 'idiomas-4x.png');
if (!fs.existsSync(de)) fs.copyFileSync(path.join(RAIZ, 'Imagens/Novas/Ícones Piratas das Línguas Mundiais.png'), de);
if (!fs.existsSync(para)) {
  const t = Date.now();
  const r = spawnSync(path.join(ESRGAN, 'realesrgan-ncnn-vulkan.exe'), ['-i', de, '-o', para, '-n', 'realesrgan-x4plus-anime', '-s', '4'], { cwd: ESRGAN, encoding: 'utf8' });
  if (r.status !== 0 || !fs.existsSync(para)) throw new Error(`Real-ESRGAN falhou: ${r.stderr || r.error}`);
  console.log(`ampliado em ${((Date.now() - t) / 1000).toFixed(1)} s`);
}

// ordem da grade (linha a linha, da esquerda para a direita)
const IDS = ['pt', 'en', 'es', 'fr', 'de', 'it'];
// retângulo (1×) dentro do pano de cada bandeira: [x, y, w, h], proporção 3:2
const PANO = {
  pt: [156, 128, 240, 160],
  en: [644, 118, 240, 160],
  es: [1160, 132, 240, 160],
  fr: [140, 628, 240, 160],
  de: [642, 632, 240, 160],
  it: [1160, 628, 240, 160],
};

// ---------- recorte das placas ----------
const { src, label, grade, up } = await itensDe('idiomas', { linhas: 2, colunas: 3 });
const pecas = [];
for (let i = 0; i < IDS.length; i++) {
  const it = grade[Math.floor(i / 3)][i % 3];
  const { img } = await recortar(up, it, mascaraDoItem(label, src.W, src.H, it), src.W);
  const red = await reduzir(img);
  const arq = path.join(OUT, 'idiomas', `${IDS[i]}.png`);
  await sharp(red.buf).png({ compressionLevel: 9 }).toFile(arq);
  console.log(IDS[i], `${img.w}×${img.h}`, `proporção ${(img.w / img.h).toFixed(3)}`, `peças juntadas: ${it.ids.length}`);
  pecas.push({ id: IDS[i], buf: red.buf, w: red.w, h: red.h });
}

// ---------- panos (direto da imagem ampliada) ----------
const panos = [];
for (const id of IDS) {
  const [x, y, w, h] = PANO[id];
  const buf = await sharp(para).extract({ left: x * 4, top: y * 4, width: w * 4, height: h * 4 }).resize(540, 360, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toBuffer();
  await sharp(buf).toFile(path.join(OUT, 'idiomas', `bandeira-${id}.png`));
  panos.push(buf);
}

// ---------- catálogo: placas sobre xadrez e sobre escuro, panos embaixo ----------
const C = 420, L = 3 * C + 80;
const xadrez = Buffer.alloc(L * 2 * C * 3);
for (let y = 0; y < 2 * C; y++)
  for (let x = 0; x < L; x++) xadrez.fill(((x >> 4) + (y >> 4)) % 2 ? 200 : 255, (y * L + x) * 3, (y * L + x) * 3 + 3);
const comps = [
  { input: await sharp(xadrez, { raw: { width: L, height: 2 * C, channels: 3 } }).png().toBuffer(), left: 20, top: 20 },
  { input: await sharp({ create: { width: L, height: 2 * C, channels: 3, background: '#1b1009' } }).png().toBuffer(), left: L + 40, top: 20 },
];
for (let i = 0; i < pecas.length; i++) {
  const p = await sharp(pecas[i].buf).resize(C - 20, C - 20, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const cx = 30 + (i % 3) * C, cy = 30 + Math.floor(i / 3) * C;
  comps.push({ input: p, left: cx, top: cy }, { input: p, left: L + 40 + cx - 20, top: cy });
}
for (let i = 0; i < panos.length; i++) comps.push({ input: await sharp(panos[i]).resize(270, 180).png().toBuffer(), left: 20 + i * 290, top: 2 * C + 40 });
await sharp({ create: { width: 2 * L + 60, height: 2 * C + 240, channels: 3, background: '#0f151d' } })
  .composite(comps)
  .png()
  .toFile(path.join(OUT, 'catalogo-6.png'));
console.log('catálogo:', path.join(OUT, 'catalogo-6.png'));
