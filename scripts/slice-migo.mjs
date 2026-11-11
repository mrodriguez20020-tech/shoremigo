// Slices the supplied 4x2 sticker sheet into individual, trimmed, optimized pose PNG/WebP files.
// Usage: node scripts/slice-migo.mjs "<path to sheet.png>"
import sharp from "sharp";
import { mkdirSync } from "node:fs";
const src = process.argv[2];
if (!src) throw new Error("Pass the sticker sheet path");
const POSES = ["wave", "jump", "walk-a", "walk-b", "think", "concern", "point", "celebrate"];
const img = sharp(src);
const { width, height, channels, hasAlpha } = await img.metadata();
console.log({ width, height, channels, hasAlpha });
const cw = Math.floor(width / 4), ch = Math.floor(height / 2);
mkdirSync("public/migo", { recursive: true });
const meta = {};
for (let i = 0; i < 8; i++) {
  const left = (i % 4) * cw, top = Math.floor(i / 4) * ch;
  const cell = await sharp(src).extract({ left, top, width: cw, height: ch }).ensureAlpha().png().toBuffer();
  // Uniform canvas so poses align (feet on the same baseline): pad to 440x440, bottom-centred.
  const trimmed = sharp(cell).trim({ threshold: 8 });
  const { data, info } = await trimmed.toBuffer({ resolveWithObject: true });
  const W = 440, H = 440;
  const scale = Math.min(1, (W - 8) / info.width, (H - 8) / info.height);
  const rw = Math.round(info.width * scale), rh = Math.round(info.height * scale);
  const resized = await sharp(data).resize(rw, rh).toBuffer();
  const out = sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: resized, left: Math.round((W - rw) / 2), top: H - rh - 4 }]);
  const buf = await out.png().toBuffer();
  await sharp(buf).webp({ quality: 86, alphaQuality: 95 }).toFile(`public/migo/${POSES[i]}.webp`);
  await sharp(buf).png({ compressionLevel: 9 }).toFile(`public/migo/${POSES[i]}.png`);
  meta[POSES[i]] = { w: rw, h: rh, left: Math.round((W - rw) / 2), top: H - rh - 4 };
}
console.log(JSON.stringify(meta));
