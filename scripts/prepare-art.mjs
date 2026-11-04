// Turns the raw art in /art-src into small WebP data URIs and writes src/assets/art.ts.
// Everything is embedded as text so the single-file build can never lose an image.
import fs from 'node:fs';
import { chromium } from '@playwright/test';

const mime = file => (file.endsWith('.png') ? 'image/png' : file.endsWith('.webp') ? 'image/webp' : 'image/jpeg');
const asDataUrl = file => `data:${mime(file)};base64,${fs.readFileSync(file).toString('base64')}`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><body></body>');
await page.addScriptTag({
  content: `
  window.loadImg = async (url) => {
    const img = new Image(); img.src = url; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0);
    return c;
  };
  window.encode = (canvas, quality) => new Promise(resolve => canvas.toBlob(async blob => {
    const bytes = new Uint8Array(await blob.arrayBuffer()); let s = '';
    for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    resolve('data:image/webp;base64,' + btoa(s));
  }, 'image/webp', quality));
  window.resize = (src, sx, sy, sw, sh, w) => {
    const h = Math.round(sh * w / sw);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
    return c;
  };
  // 3x3 box blur of an alpha plane (anti-aliased edges)
  window.feather = (alpha, w, h) => {
    const out = new Uint8Array(alpha.length);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      let s = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += alpha[(y + dy) * w + x + dx];
      out[y * w + x] = s / 9;
    }
    return out;
  };
  window.erode = (alpha, w, h, times) => {
    let a = alpha;
    for (let t = 0; t < times; t++) {
      const next = a.slice();
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (a[i] && (!a[i - 1] || !a[i + 1] || !a[i - w] || !a[i + w])) next[i] = 0;
      }
      a = next;
    }
    return a;
  };
  // flood fill from the borders over pixels where test(i) is true; returns visited mask
  window.floodFromBorder = (w, h, test) => {
    const N = w * h, seen = new Uint8Array(N), stack = new Int32Array(N); let sp = 0;
    const push = i => { if (!seen[i] && test(i)) { seen[i] = 1; stack[sp++] = i; } };
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    while (sp) {
      const i = stack[--sp], x = i % w;
      if (x > 0) push(i - 1); if (x < w - 1) push(i + 1); if (i >= w) push(i - w); if (i < N - w) push(i + w);
    }
    return seen;
  };
`,
});

const encodeImage = (file, width, quality) =>
  page.evaluate(async ({ url, width, quality }) => {
    const c = await loadImg(url);
    return encode(resize(c, 0, 0, c.width, c.height, width), quality);
  }, { url: asDataUrl(file), width, quality });

const art = {};
art.heroBg = await encodeImage('art-src/hogwarts-night.webp', 1568, 0.78);
art.catStill = await encodeImage('art-src/birthday-cat.png', 498, 0.9);
art.newsprintTex = await encodeImage('art-src/newsprint.jpg', 1000, 0.72);
art.parchmentTex = await encodeImage('art-src/parchment.jpg', 640, 0.74);

const envelope = await page.evaluate(async ({ url, width }) => {
  const c = await loadImg(url);
  const w = c.width, h = c.height, N = w * h;
  const ctx = c.getContext('2d');
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  // 1) Cut the envelope out of its black backdrop
  const bg = floodFromBorder(w, h, i => Math.max(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]) < 42);
  let alpha = new Uint8Array(N);
  for (let i = 0; i < N; i++) alpha[i] = bg[i] ? 0 : 255;
  alpha = feather(erode(alpha, w, h, 2), w, h);

  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (alpha[y * w + x] > 12) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }

  // 2) Find the wax seal (deep red, low green) inside the envelope
  // Burgundy wax: blue >= green (brown paper stains have green > blue), very low green.
  const isWax = i => { const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2]; return r > 60 && g < 100 && r > g * 1.9 && b >= g * 0.8; };
  const bx0 = minX + (maxX - minX) * 0.3, bx1 = minX + (maxX - minX) * 0.7;
  const by0 = minY + (maxY - minY) * 0.3, by1 = minY + (maxY - minY) * 0.85;
  let sx0 = w, sy0 = h, sx1 = 0, sy1 = 0;
  for (let y = Math.floor(by0); y <= by1; y++) for (let x = Math.floor(bx0); x <= bx1; x++) {
    if (isWax(y * w + x)) { if (x < sx0) sx0 = x; if (x > sx1) sx1 = x; if (y < sy0) sy0 = y; if (y > sy1) sy1 = y; }
  }
  const scx = (sx0 + sx1) / 2, scy = (sy0 + sy1) / 2, sr = Math.max(sx1 - sx0, sy1 - sy0) / 2;

  // 3) Extract the seal on its own with a hole-filled organic alpha
  const S = Math.ceil(sr * 2.5), ox = Math.round(scx - S / 2), oy = Math.round(scy - S / 2);
  const wax = new Uint8Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const gx = ox + x, gy = oy + y;
    if (gx >= 0 && gy >= 0 && gx < w && gy < h && isWax(gy * w + gx)) wax[y * S + x] = 1;
  }
  // dilate twice so the crest relief is enclosed, then fill holes
  let grown = wax;
  for (let t = 0; t < 3; t++) {
    const next = grown.slice();
    for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) {
      const i = y * S + x;
      if (!grown[i] && (grown[i - 1] || grown[i + 1] || grown[i - S] || grown[i + S])) next[i] = 1;
    }
    grown = next;
  }
  const outside = floodFromBorder(S, S, i => !grown[i]);
  let sealAlpha = new Uint8Array(S * S);
  for (let i = 0; i < S * S; i++) sealAlpha[i] = outside[i] ? 0 : 255;
  sealAlpha = feather(erode(sealAlpha, S, S, 3), S, S);
  const sealCanvas = document.createElement('canvas'); sealCanvas.width = S; sealCanvas.height = S;
  const sealCtx = sealCanvas.getContext('2d');
  const sealData = sealCtx.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const gx = ox + x, gy = oy + y, i = y * S + x;
    if (gx < 0 || gy < 0 || gx >= w || gy >= h) continue;
    const j = (gy * w + gx) * 4;
    sealData.data[i * 4] = px[j]; sealData.data[i * 4 + 1] = px[j + 1]; sealData.data[i * 4 + 2] = px[j + 2];
    sealData.data[i * 4 + 3] = sealAlpha[i];
  }
  sealCtx.putImageData(sealData, 0, 0);
  const seal = await encode(resize(sealCanvas, 0, 0, S, S, 240), 0.9);

  // 4) Final cropped envelope with alpha
  for (let i = 0; i < N; i++) px[i * 4 + 3] = alpha[i];
  ctx.putImageData(data, 0, 0);
  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  const image = await encode(resize(c, minX, minY, bw, bh, width), 0.9);
  return {
    image, seal,
    width, height: Math.round(bh * width / bw),
    sealX: (scx - minX) / bw, sealY: (scy - minY) / bh, sealR: sr / bw,
  };
}, { url: asDataUrl('art-src/envelope.jpg'), width: 900 });

art.envelopeImg = envelope.image;
art.sealImg = envelope.seal;

// Generic cut-out: removes a flat black ('dark') or white ('light') studio backdrop, un-mixes the
// backdrop colour from soft edges, crops, and reports a few landmarks (fractions of the crop).
await page.addScriptTag({
  content: `
  window.cutout = async (url, mode, width, quality) => {
    const c = await loadImg(url);
    const w = c.width, h = c.height, N = w * h;
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    const test = mode === 'dark'
      ? i => Math.max(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]) < 40
      : i => { const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2]; const mn = Math.min(r, g, b), mx = Math.max(r, g, b); return mn > 222 && mx - mn < 24; };
    const bg = floodFromBorder(w, h, test);
    let alpha = new Uint8Array(N);
    for (let i = 0; i < N; i++) alpha[i] = bg[i] ? 0 : 255;
    alpha = feather(feather(erode(alpha, w, h, 2), w, h), w, h);

    const backdrop = mode === 'dark' ? 0 : 255;
    let minX = w, minY = h, maxX = 0, maxY = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, a = alpha[i] / 255;
      if (a > 0 && a < 1) for (let k = 0; k < 3; k++) {
        px[i * 4 + k] = Math.max(0, Math.min(255, (px[i * 4 + k] - backdrop * (1 - a)) / a));
      }
      px[i * 4 + 3] = alpha[i];
      if (alpha[i] > 12) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
    ctx.putImageData(data, 0, 0);
    const bw = maxX - minX + 1, bh = maxY - minY + 1;

    // Top landmark: the first row that is solidly opaque for >= 1.5% of the width (skips stray wick hairs).
    let topX = 0.5, topY = 0;
    for (let y = minY; y <= maxY; y++) {
      let count = 0, sum = 0;
      for (let x = minX; x <= maxX; x++) if (alpha[y * w + x] > 160) { count++; sum += x; }
      if (count >= w * 0.015) { topX = (sum / count - minX) / bw; topY = (y - minY) / bh; break; }
    }
    // Right landmark: the right-most opaque column (e.g. the tip of a wand).
    let rightY = 0.5;
    for (let x = maxX; x >= minX; x--) {
      let count = 0, sum = 0;
      for (let y = minY; y <= maxY; y++) if (alpha[y * w + x] > 140) { count++; sum += y; }
      if (count) { rightY = (sum / count - minY) / bh; break; }
    }
    const image = await encode(resize(c, minX, minY, bw, bh, width), quality);
    return { image, width, height: Math.round(bh * width / bw), topX, topY, rightY };
  };
`,
});

const cake = await page.evaluate(({ url }) => cutout(url, 'dark', 620, 0.88), { url: asDataUrl('art-src/cake.jpg') });
const wand = await page.evaluate(({ url }) => cutout(url, 'light', 820, 0.9), { url: asDataUrl('art-src/wand.jpg') });
art.cakeImg = cake.image;
art.wandImg = wand.image;
art.brassTex = await encodeImage('art-src/brass.jpg', 640, 0.74);

const video = `data:video/mp4;base64,${fs.readFileSync('art-src/enchanted-cat.mp4').toString('base64')}`;
fs.mkdirSync('src/assets', { recursive: true });

let source = '// Generated by scripts/prepare-art.mjs from /art-src. Embedded as text so the build is self-contained.\n';
for (const [name, value] of Object.entries(art)) source += `export const ${name} = '${value}';\n`;
source += `export const catVideo = '${video}';\n`;
source += `export const envelopeMeta = ${JSON.stringify({
  width: envelope.width, height: envelope.height,
  sealX: +envelope.sealX.toFixed(4), sealY: +envelope.sealY.toFixed(4), sealR: +envelope.sealR.toFixed(4),
})} as const;\n`;
source += `export const cakeMeta = ${JSON.stringify({
  width: cake.width, height: cake.height, candleX: +cake.topX.toFixed(4), candleY: +cake.topY.toFixed(4),
})} as const;\n`;
source += `export const wandMeta = ${JSON.stringify({ width: wand.width, height: wand.height, tipY: +wand.rightY.toFixed(4) })} as const;\n`;
fs.writeFileSync('src/assets/art.ts', source);
fs.mkdirSync('artifacts', { recursive: true });
const save = (name, dataUrl) => fs.writeFileSync(`artifacts/${name}.webp`, Buffer.from(dataUrl.split(',')[1], 'base64'));
save('preview-cake', art.cakeImg);
save('preview-wand', art.wandImg);
console.log('cake meta', cake.width, cake.height, cake.topX.toFixed(3), cake.topY.toFixed(3));
console.log('wand meta', wand.width, wand.height, wand.rightY.toFixed(3));

// Preview files for visual inspection (ignored by git)
fs.mkdirSync('artifacts', { recursive: true });

save('preview-envelope', art.envelopeImg);
save('preview-seal', art.sealImg);

for (const [name, value] of Object.entries(art)) console.log(name.padEnd(14), `${(value.length / 1024).toFixed(0)} KB`);
console.log('catVideo'.padEnd(14), `${(video.length / 1024).toFixed(0)} KB`);
console.log('envelope meta', envelope.width, envelope.height, envelope.sealX.toFixed(3), envelope.sealY.toFixed(3), envelope.sealR.toFixed(3));
await browser.close();
