// Generates EduFarm PWA icons with zero dependencies (pure-Node PNG encoder).
// Design: deep-green rounded square + white block "E" (matches design system).
// Re-run: node web/scripts/make-icons.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(ROOT, { recursive: true });

const GREEN = [11, 77, 46, 255]; // --green-900
const WHITE = [255, 255, 255, 255];

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([td, data])));
  return Buffer.concat([len, td, data, crc]);
}
function png(width, height, px) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    Buffer.from(px.subarray(y * width * 4, (y + 1) * width * 4)).copy(raw, y * (1 + width * 4) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

// Block-letter "E" on a 100-unit grid: stem + top/mid/bottom bars.
function drawE(px, size, ox, oy, s, color) {
  const r = (x, y, w, h) => {
    for (let j = Math.floor(y * s); j < Math.floor((y + h) * s); j++)
      for (let i = Math.floor(x * s); i < Math.floor((x + w) * s); i++) {
        const px_ = ox + i, py = oy + j;
        if (px_ < 0 || py < 0 || px_ >= size || py >= size) continue;
        px.set(color, (py * size + px_) * 4);
      }
  };
  const bar = 16; // stem width
  const arm = 15; // arm height
  r(18, 14, bar, 72); // stem
  r(18, 14, 64, arm); // top
  r(18, 42.5, 54, arm); // mid
  r(18, 71, 64, arm); // bottom
}

function roundedSquare(px, size, radius, color) {
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const cx = Math.min(Math.max(x, radius), size - 1 - radius);
      const cy = Math.min(Math.max(y, radius), size - 1 - radius);
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= radius * radius) px.set(color, (y * size + x) * 4);
    }
}

function makeIcon(size, { maskable = false } = {}) {
  const px = new Uint8Array(size * size * 4); // transparent base
  const radius = Math.round(size * 0.225);
  roundedSquare(px, size, radius, GREEN);
  // Maskable: keep the mark inside the 80% safe zone (extra padding).
  const pad = maskable ? 0.16 : 0.06;
  const inner = size * (1 - pad * 2);
  const s = inner / 100;
  drawE(px, size, Math.round(size * pad), Math.round(size * pad), s, WHITE);
  return png(size, size, px);
}

const jobs = [
  ["icon-192.png", makeIcon(192)],
  ["icon-512.png", makeIcon(512)],
  ["maskable-512.png", makeIcon(512, { maskable: true })],
  ["apple-touch-icon.png", makeIcon(180)],
];
for (const [name, buf] of jobs) {
  writeFileSync(join(ROOT, name), buf);
  console.log(`wrote icons/${name} (${buf.length} bytes)`);
}
