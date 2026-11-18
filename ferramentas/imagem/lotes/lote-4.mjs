// Quarta leva: logo "Pistas Piratas" (Placa Pirata Pistas Piratas.png, gerada no ChatGPT, fundo branco).
// Entrada: Imagens/Novas/Placa Pirata Pistas Piratas.png → saida/origem/logo-pistas.png → Real-ESRGAN 4×
// Saída em ferramentas/imagem/saida/lote-4/: logos/logo-pistas-piratas.png e catalogo-4.png
// Depois de conferir o catálogo, copie a logo para assets/logos/ e rode exportar-web.mjs.
// uso: node lotes/lote-4.mjs [--bolsoes]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { recortar, itensDe, mascaraDoItem, reduzir } from '../recorte-branco.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(here, '../../..');
const OUT = path.resolve(here, '../saida/lote-4');
const ORIG = path.resolve(here, '../saida/origem');
const ESRGAN = path.join(RAIZ, 'ferramentas/realesrgan');
fs.mkdirSync(path.join(OUT, 'logos'), { recursive: true });
fs.mkdirSync(ORIG, { recursive: true });

// ---------- ampliação ----------
const de = path.join(ORIG, 'logo-pistas.png'), para = path.join(ORIG, 'logo-pistas-4x.png');
if (!fs.existsSync(de)) fs.copyFileSync(path.join(RAIZ, 'Imagens/Novas/Placa Pirata Pistas Piratas.png'), de);
if (!fs.existsSync(para)) {
  const t = Date.now();
  const r = spawnSync(path.join(ESRGAN, 'realesrgan-ncnn-vulkan.exe'), ['-i', de, '-o', para, '-n', 'realesrgan-x4plus-anime', '-s', '4'], { cwd: ESRGAN, encoding: 'utf8' });
  if (r.status !== 0 || !fs.existsSync(para)) throw new Error(`Real-ESRGAN falhou: ${r.stderr || r.error}`);
  console.log(`ampliado em ${((Date.now() - t) / 1000).toFixed(1)} s`);
}

// ---------- recorte ----------
// sem bolsões por padrão: a caveira, os ossos e o contorno das letras são claros e não podem furar
const bolsoes = process.argv.includes('--bolsoes');
const { src, label, grade, up } = await itensDe('logo-pistas');
const it = grade[0][0];
const { img, removidos } = await recortar(up, it, mascaraDoItem(label, src.W, src.H, it), src.W, { bolsoes });
const red = await reduzir(img);
const arquivo = path.join(OUT, 'logos', 'logo-pistas-piratas.png');
await sharp(red.buf).png({ compressionLevel: 9 }).toFile(arquivo);
console.log('logo-pistas-piratas', `${img.w}×${img.h} → ${red.w}×${red.h}`, `proporção ${(red.w / red.h).toFixed(3)}`, `peças juntadas: ${it.ids.length}`);
for (const b of removidos) console.log('   bolsão', JSON.stringify(b));

// ---------- catálogo: sobre xadrez e sobre escuro ----------
const L = 1200, A = Math.round((L * red.h) / red.w);
const peca = await sharp(red.buf).resize(L, A).png().toBuffer();
const xadrez = Buffer.alloc(L * A * 3);
for (let y = 0; y < A; y++)
  for (let x = 0; x < L; x++) xadrez.fill(((x >> 5) + (y >> 5)) % 2 ? 200 : 255, (y * L + x) * 3, (y * L + x) * 3 + 3);
const fundoX = await sharp(xadrez, { raw: { width: L, height: A, channels: 3 } }).png().toBuffer();
const fundoE = await sharp({ create: { width: L, height: A, channels: 3, background: '#1b1009' } }).png().toBuffer();
await sharp({ create: { width: L * 2 + 60, height: A + 40, channels: 3, background: '#0f151d' } })
  .composite([
    { input: fundoX, left: 20, top: 20 },
    { input: peca, left: 20, top: 20 },
    { input: fundoE, left: L + 40, top: 20 },
    { input: peca, left: L + 40, top: 20 },
  ])
  .png()
  .toFile(path.join(OUT, 'catalogo-4.png'));
console.log('catálogo:', path.join(OUT, 'catalogo-4.png'));
