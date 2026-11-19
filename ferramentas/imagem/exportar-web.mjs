// Gera apps/web/public/img a partir de assets/, com a mesma estrutura de pastas,
// em WebP e no tamanho de uso. A pasta de saída é apagada e recriada.
// Uso: node exportar-web.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const origem = path.join(raiz, 'assets');
const destino = path.join(raiz, 'apps/web/public/img');

// largura máxima por pasta (a primeira que casar com o caminho relativo)
const LARGURAS = [
  [/^fundos\//, 1920],
  [/^cartas\//, 480],
  [/^personagens\//, 256],
  [/^navios\/navio-afundado/, 420],
  [/^navios\//, 320],
  [/^bandeiras\//, 180],
  [/^logos\//, 1000],
  [/^idiomas\/bandeira-/, 160],
  [/^idiomas\//, 480],
  [/^itens\//, 320],
  [/^interface\/icones\//, 128],
  [/^interface\/botoes\//, 600],
  [/^interface\/(molduras|decoracoes)\//, 1100],
  [/^interface\/controles\//, 800],
];
const IGNORAR = [/^personagens\/vetor\//, /\.json$/];

function arquivos(dir, base = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const rel = base ? `${base}/${e.name}` : e.name;
    return e.isDirectory() ? arquivos(path.join(dir, e.name), rel) : [rel];
  });
}

fs.rmSync(destino, { recursive: true, force: true });
let total = 0;
let n = 0;
for (const rel of arquivos(origem)) {
  if (!/\.(png|jpe?g)$/i.test(rel) || IGNORAR.some((r) => r.test(rel))) continue;
  const largura = LARGURAS.find(([r]) => r.test(rel))?.[1] ?? 1000;
  const saida = path.join(destino, rel.replace(/\.(png|jpe?g)$/i, '.webp'));
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  const img = sharp(path.join(origem, rel));
  const meta = await img.metadata();
  await img
    .resize({ width: Math.min(largura, meta.width), withoutEnlargement: true })
    .webp({ quality: rel.startsWith('fundos/') ? 78 : 86, alphaQuality: 100, effort: 5 })
    .toFile(saida);
  total += fs.statSync(saida).size;
  n++;
}
console.log('ok', n, 'imagens,', Math.round(total / 1024), 'KB');
