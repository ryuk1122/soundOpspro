const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");

function crcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = crcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  name.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return out;
}

function writePng(file, img) {
  const raw = Buffer.alloc((img.width * 4 + 1) * img.height);
  for (let y = 0; y < img.height; y += 1) {
    const row = y * (img.width * 4 + 1);
    raw[row] = 0;
    img.data.copy(raw, row + 1, y * img.width * 4, (y + 1) * img.width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.width, 0);
  ihdr.writeUInt32BE(img.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, png);
}

function image(width, height, transparent = false) {
  const data = Buffer.alloc(width * height * 4);
  if (!transparent) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 15; data[i + 1] = 17; data[i + 2] = 21; data[i + 3] = 255;
    }
  }
  return { width, height, data };
}

const colors = {
  bg: [15, 17, 21, 255],
  panel: [22, 25, 32, 245],
  panel2: [35, 40, 50, 235],
  amber: [255, 159, 10, 255],
  amberSoft: [255, 198, 85, 220],
  cyan: [45, 212, 191, 255],
  cyanSoft: [56, 189, 248, 210],
  white: [255, 255, 255, 255],
  muted: [156, 163, 175, 255],
};

function blend(img, x, y, rgba, alpha = 1) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= img.width || iy >= img.height) return;
  const i = (iy * img.width + ix) * 4;
  const a = Math.max(0, Math.min(1, (rgba[3] / 255) * alpha));
  const inv = 1 - a;
  img.data[i] = Math.round(rgba[0] * a + img.data[i] * inv);
  img.data[i + 1] = Math.round(rgba[1] * a + img.data[i + 1] * inv);
  img.data[i + 2] = Math.round(rgba[2] * a + img.data[i + 2] * inv);
  img.data[i + 3] = Math.round(255 * a + img.data[i + 3] * inv);
}

function fillBackground(img) {
  const w = img.width;
  const h = img.height;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const nx = x / w;
      const ny = y / h;
      const d1 = Math.hypot(nx - 0.28, ny - 0.18);
      const d2 = Math.hypot(nx - 0.74, ny - 0.78);
      const glowA = Math.max(0, 1 - d1 * 2.1);
      const glowC = Math.max(0, 1 - d2 * 2.0);
      const vignette = Math.max(0, Math.hypot(nx - 0.5, ny - 0.52) - 0.18);
      const r = 15 + glowA * 62 + glowC * 10 - vignette * 18;
      const g = 17 + glowA * 28 + glowC * 54 - vignette * 18;
      const b = 21 + glowA * 3 + glowC * 50 - vignette * 18;
      const i = (y * w + x) * 4;
      img.data[i] = Math.max(0, Math.min(255, Math.round(r)));
      img.data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
      img.data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
      img.data[i + 3] = 255;
    }
  }
}

function roundedRect(img, x, y, w, h, r, rgba, alpha = 1) {
  const minX = Math.floor(x);
  const maxX = Math.ceil(x + w);
  const minY = Math.floor(y);
  const maxY = Math.ceil(y + h);
  for (let py = minY; py <= maxY; py += 1) {
    for (let px = minX; px <= maxX; px += 1) {
      const dx = Math.max(x - px, 0, px - (x + w));
      const dy = Math.max(y - py, 0, py - (y + h));
      const cx = px < x + r ? x + r : px > x + w - r ? x + w - r : px;
      const cy = py < y + r ? y + r : py > y + h - r ? y + h - r : py;
      const corner = Math.hypot(px - cx, py - cy);
      if ((dx === 0 && dy === 0 && corner <= r) || (px >= x + r && px <= x + w - r && py >= y && py <= y + h) || (py >= y + r && py <= y + h - r && px >= x && px <= x + w)) {
        blend(img, px, py, rgba, alpha);
      }
    }
  }
}

function circle(img, cx, cy, radius, rgba, alpha = 1) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      const d2 = (x - cx) ** 2 + (y - cy) ** 2;
      if (d2 <= r2) blend(img, x, y, rgba, alpha);
    }
  }
}

function ring(img, cx, cy, radius, thickness, rgba, alpha = 1) {
  for (let y = Math.floor(cy - radius - thickness); y <= Math.ceil(cy + radius + thickness); y += 1) {
    for (let x = Math.floor(cx - radius - thickness); x <= Math.ceil(cx + radius + thickness); x += 1) {
      const d = Math.hypot(x - cx, y - cy);
      if (Math.abs(d - radius) <= thickness / 2) blend(img, x, y, rgba, alpha);
    }
  }
}

function line(img, x1, y1, x2, y2, width, rgba, alpha = 1) {
  const minX = Math.floor(Math.min(x1, x2) - width);
  const maxX = Math.ceil(Math.max(x1, x2) + width);
  const minY = Math.floor(Math.min(y1, y2) - width);
  const maxY = Math.ceil(Math.max(y1, y2) + width);
  const vx = x2 - x1;
  const vy = y2 - y1;
  const len2 = vx * vx + vy * vy;
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const t = Math.max(0, Math.min(1, ((x - x1) * vx + (y - y1) * vy) / len2));
      const px = x1 + t * vx;
      const py = y1 + t * vy;
      const d = Math.hypot(x - px, y - py);
      if (d <= width / 2) blend(img, x, y, rgba, alpha);
    }
  }
}

function drawMark(img, opts = {}) {
  const w = img.width;
  const h = img.height;
  const s = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const scale = opts.scale || 1;
  const size = s * 0.58 * scale;
  const x = cx - size / 2;
  const y = cy - size / 2;

  line(img, cx - size * 0.63, cy + size * 0.36, cx + size * 0.58, cy - size * 0.34, s * 0.026 * scale, colors.cyanSoft, 0.55);
  circle(img, cx - size * 0.63, cy + size * 0.36, s * 0.034 * scale, colors.cyan, 0.9);
  circle(img, cx + size * 0.58, cy - size * 0.34, s * 0.034 * scale, colors.amber, 0.95);

  roundedRect(img, x, y, size, size, s * 0.08 * scale, colors.panel, 1);
  roundedRect(img, x + size * 0.065, y + size * 0.07, size * 0.87, size * 0.86, s * 0.055 * scale, colors.panel2, 0.82);
  ring(img, cx, y + size * 0.31, size * 0.13, s * 0.026 * scale, colors.amber, 1);
  ring(img, cx, y + size * 0.31, size * 0.065, s * 0.018 * scale, colors.muted, 0.45);
  ring(img, cx, y + size * 0.68, size * 0.18, s * 0.03 * scale, colors.amberSoft, 1);
  circle(img, cx, y + size * 0.68, size * 0.075, colors.bg, 0.85);

  const baseY = y + size * 0.49;
  const bars = [0.18, 0.34, 0.55, 0.78, 0.52, 0.31, 0.2];
  const gap = size * 0.075;
  const start = cx - gap * 3;
  for (let i = 0; i < bars.length; i += 1) {
    const bh = size * 0.19 * bars[i];
    roundedRect(img, start + gap * i - s * 0.01, baseY - bh / 2, s * 0.02, bh, s * 0.01, i % 2 ? colors.cyan : colors.amber, 0.95);
  }

  ring(img, cx, cy, size * 0.68, s * 0.012 * scale, colors.cyanSoft, opts.outerAlpha ?? 0.32);
  ring(img, cx, cy, size * 0.78, s * 0.008 * scale, colors.amberSoft, opts.outerAlpha ?? 0.24);
}

function brandIcon(size, transparent = false, markScale = 1) {
  const img = image(size, size, transparent);
  if (!transparent) fillBackground(img);
  drawMark(img, { scale: markScale, outerAlpha: transparent ? 0.2 : 0.34 });
  return img;
}

function removeIfExists(file) {
  if (fs.existsSync(file)) fs.rmSync(file);
}

writePng(path.join(ROOT, "assets/images/icon.png"), brandIcon(1024, false, 1));
writePng(path.join(ROOT, "assets/images/adaptive-icon.png"), brandIcon(1024, true, 1.08));
writePng(path.join(ROOT, "assets/images/favicon.png"), brandIcon(96, false, 0.98));
writePng(path.join(ROOT, "assets/images/splash-image.png"), brandIcon(720, true, 0.92));

const densities = [
  ["mdpi", 48, 108],
  ["hdpi", 72, 162],
  ["xhdpi", 96, 216],
  ["xxhdpi", 144, 324],
  ["xxxhdpi", 192, 432],
];

for (const [density, launcher, foreground] of densities) {
  const dir = path.join(ROOT, `android/app/src/main/res/mipmap-${density}`);
  removeIfExists(path.join(dir, "ic_launcher.webp"));
  removeIfExists(path.join(dir, "ic_launcher_round.webp"));
  removeIfExists(path.join(dir, "ic_launcher_foreground.webp"));
  writePng(path.join(dir, "ic_launcher.png"), brandIcon(launcher, false, 0.92));
  writePng(path.join(dir, "ic_launcher_round.png"), brandIcon(launcher, false, 0.92));
  writePng(path.join(dir, "ic_launcher_foreground.png"), brandIcon(foreground, true, 0.98));
}

const splash = [
  ["mdpi", 200],
  ["hdpi", 300],
  ["xhdpi", 400],
  ["xxhdpi", 600],
  ["xxxhdpi", 800],
];

for (const [density, size] of splash) {
  writePng(path.join(ROOT, `android/app/src/main/res/drawable-${density}/splashscreen_logo.png`), brandIcon(size, true, 0.86));
}

console.log("SoundOps brand assets generated.");
