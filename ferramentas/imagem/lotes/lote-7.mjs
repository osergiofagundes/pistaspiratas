// Sétima leva: ícones do app (manifesto e "Adicionar à tela inicial" do iPhone/iPad).
// A bandeira do Rubi sobre um quadrado de madeira escura com aro dourado. A bandeira ocupa
// o miolo (cerca de 62%), dentro da zona segura dos ícones "maskable" do Android.
// Saída direto em apps/web/public/img/app/icone-{180,192,512}.png
// uso: node lotes/lote-7.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(here, '../../..');
const OUT = path.join(RAIZ, 'apps/web/public/img/app');
fs.mkdirSync(OUT, { recursive: true });

const L = 512;
const fundo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${L}">
  <defs>
    <radialGradient id="g" cx="50%" cy="40%" r="70%">
      <stop offset="0" stop-color="#5A341A"/>
      <stop offset="1" stop-color="#22140A"/>
    </radialGradient>
  </defs>
  <rect width="${L}" height="${L}" fill="url(#g)"/>
  <circle cx="${L / 2}" cy="${L / 2}" r="${L * 0.4}" fill="none" stroke="#C98A3A" stroke-width="14" opacity=".9"/>
</svg>`);
const bandeira = await sharp(path.join(RAIZ, 'assets/bandeiras/bandeira-rubi.png'))
  .resize({ width: Math.round(L * 0.56), height: Math.round(L * 0.56), fit: 'inside' })
  .toBuffer();
const meta = await sharp(bandeira).metadata();
const base = await sharp(fundo)
  .composite([{ input: bandeira, left: Math.round((L - meta.width) / 2), top: Math.round((L - meta.height) / 2) }])
  .png()
  .toBuffer();
for (const t of [512, 192, 180]) {
  await sharp(base).resize(t, t).png({ compressionLevel: 9 }).toFile(path.join(OUT, `icone-${t}.png`));
  console.log('icone', t);
}
