// Funções comuns para recortar itens de imagens geradas com IA e tirar o fundo.
import sharp from 'sharp';

/** pixels RGB crus de um arquivo */
export async function raw(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height };
}

/** faixas contínuas onde arr[i] > th (com mais de `min` itens) → [[início, fim]…] */
export function runs(arr, th, min = 20) {
  const r = [];
  let s = -1;
  arr.forEach((v, i) => {
    if (v > th && s < 0) s = i;
    if (v <= th && s >= 0) (i - s > min && r.push([s, i - 1]), (s = -1));
  });
  if (s >= 0) r.push([s, arr.length - 1]);
  return r;
}

/**
 * Inundação a partir das bordas por pixels que passam em `isBg(p)` (p = índice do pixel).
 * Devolve a máscara (1 = fundo).
 */
export function inundar(w, h, isBg, { bordas = { top: true, left: true, right: true, bottom: true }, mask } = {}) {
  const bg = mask ?? new Uint8Array(w * h);
  const stack = [];
  const seed = (x, y) => {
    const p = y * w + x;
    if (!bg[p] && isBg(p)) (bg[p] = 1), stack.push(p);
  };
  if (bordas.top) for (let x = 0; x < w; x++) seed(x, 0);
  if (bordas.bottom) for (let x = 0; x < w; x++) seed(x, h - 1);
  for (let y = 0; y < h; y++) (bordas.left && seed(0, y), bordas.right && seed(w - 1, y));
  while (stack.length) {
    const p = stack.pop();
    const x = p % w;
    const y = (p - x) / w;
    if (y > 0) seed(x, y - 1);
    if (y < h - 1) seed(x, y + 1);
    if (x > 0) seed(x - 1, y);
    if (x < w - 1) seed(x + 1, y);
  }
  return bg;
}

/** componentes 4-conectados dos pixels com sel[p] = 1 → { label: Int32Array, comps: [{id, area, x0, y0, x1, y1, pixels?}] } */
export function componentes(sel, w, h, { guardarPixels = false } = {}) {
  const label = new Int32Array(w * h).fill(-1);
  const comps = [];
  const stack = [];
  for (let s = 0; s < w * h; s++) {
    if (!sel[s] || label[s] >= 0) continue;
    const c = { id: comps.length, area: 0, x0: w, y0: h, x1: -1, y1: -1, pixels: guardarPixels ? [] : null };
    label[s] = c.id;
    stack.push(s);
    while (stack.length) {
      const p = stack.pop();
      const x = p % w;
      const y = (p - x) / w;
      c.area++;
      if (guardarPixels) c.pixels.push(p);
      if (x < c.x0) c.x0 = x;
      if (x > c.x1) c.x1 = x;
      if (y < c.y0) c.y0 = y;
      if (y > c.y1) c.y1 = y;
      const nb = [y > 0 ? p - w : -1, y < h - 1 ? p + w : -1, x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1];
      for (const q of nb) if (q >= 0 && sel[q] && label[q] < 0) (label[q] = c.id), stack.push(q);
    }
    comps.push(c);
  }
  return { label, comps };
}
