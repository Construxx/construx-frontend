import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function generatePng(width, height, isMaskable = false) {
  // PNG Signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // Raw Scanlines: each row starts with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * (isMaskable ? 0.48 : 0.44);
  const innerRadius = radius * 0.65;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // No filter

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background: Dark Slate #0B0F14
      let r = 11, g = 15, b = 20, a = 255;

      // Card / rounded badge surface
      if (Math.abs(dx) < radius && Math.abs(dy) < radius) {
        r = 18; g = 24; b = 33; // #121821
      }

      // Draw stylized construction Amber 'C' ring
      if (dist >= innerRadius && dist <= radius) {
        const angle = Math.atan2(dy, dx); // -PI to PI
        // Leave opening on the right (approx -0.4 to 0.4 rad)
        if (angle < -0.4 || angle > 0.4) {
          // Amber gradient #F5A524 to #EA580C
          const t = (angle + Math.PI) / (2 * Math.PI);
          r = Math.round(245 * (1 - t) + 234 * t);
          g = Math.round(165 * (1 - t) + 88 * t);
          b = Math.round(36 * (1 - t) + 12 * t);
          a = 255;
        }
      }

      // Central core dot (crane anchor)
      if (dist < innerRadius * 0.28) {
        r = 59; g = 130; b = 246; // Info Blue #3B82F6
        a = 255;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), generatePng(192, 192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), generatePng(512, 512));
fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180));

console.log('Successfully generated PWA PNG icons!');
