// Concept-overlay comparison for WP-02 (measured, not eyeballed).
// Fits a perspective camera so the canonical massing silhouette best matches the transparent
// A-02 concept (public/cinematic/aurora-tide.webp), reports intersection-over-union (IoU),
// and writes an overlay sheet: concept + projected feature edges + discrepancy map
// (red = in the concept but missing from the model, blue = model where the concept has nothing).
//
//   WP02_FACES_OUT=work/faces.json node design/aurora-tide/generate.mjs
//   PLAYWRIGHT_CHROMIUM_PATH=/path/to/chrome node design/aurora-tide/overlay.mjs work/faces.json
// Requires the repo's dev dependency @playwright/test (playwright-core) and a Chromium build.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const facesPath = process.argv[2];
if (!facesPath) throw new Error("usage: node overlay.mjs <faces.json>");
const { geometryId, faces } = JSON.parse(fs.readFileSync(facesPath, "utf8"));
const conceptPath = path.resolve(here, "../../public/cinematic/aurora-tide.webp");
const concept = "data:image/webp;base64," + fs.readFileSync(conceptPath).toString("base64");

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH, headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.setContent("<html><body style='margin:0;background:#f7f5ef'></body></html>");

const result = await page.evaluate(async ({ concept, faces }) => {
  const img = new Image();
  img.src = concept;
  await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight, SW = 350, SH = Math.round((350 * H) / W);
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  // concept alpha mask (small) and bbox
  const cs = mk(SW, SH), cx = cs.getContext("2d");
  cx.drawImage(img, 0, 0, SW, SH);
  const ca = cx.getImageData(0, 0, SW, SH).data;
  const cmask = new Uint8Array(SW * SH);
  let bx0 = SW, bx1 = 0, by0 = SH, by1 = 0;
  for (let i = 0; i < SW * SH; i++) if (ca[i * 4 + 3] > 128) { cmask[i] = 1; const x = i % SW, y = (i / SW) | 0; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
  const cArea = cmask.reduce((a, b) => a + b, 0);

  const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((v) => v / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const target = [79, 0, 14];
  function camera(p) {
    const az = (p.az * Math.PI) / 180, el = (p.el * Math.PI) / 180;
    const f = norm([Math.cos(el) * Math.cos(az), Math.cos(el) * Math.sin(az), -Math.sin(el)]);
    const C = target.map((t, i) => t - f[i] * p.dist);
    let r = norm(cross(f, [0, 0, 1])); if (r[0] < 0) r = r.map((v) => -v);
    let u = cross(r, f); if (u[2] < 0) u = u.map((v) => -v);
    const roll = (p.roll * Math.PI) / 180, cr = Math.cos(roll), sr = Math.sin(roll);
    return (q) => { const d = [q[0] - C[0], q[1] - C[1], q[2] - C[2]]; const z = dot(d, f); const x = dot(d, r) / z, y = -dot(d, u) / z; return [x * cr - y * sr, x * sr + y * cr]; };
  }
  // project, fit bbox to concept bbox, rasterise silhouette at (w,h,scaleFactor)
  function render(p, w, h, k, ctx) {
    const pr = camera(p);
    const pf = faces.map((f) => f.v.map(pr));
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const f of pf) for (const [x, y] of f) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const s = ((bx1 - bx0) * k) / (x1 - x0);
    const ox = bx0 * k - x0 * s, oy = by1 * k - y1 * s; // align left and bottom (hull keel line) edges
    const T = ([x, y]) => [ox + x * s, oy + y * s];
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#000";
    for (const f of pf) { ctx.beginPath(); f.forEach((pt, i) => { const [a, b] = T(pt); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }); ctx.closePath(); ctx.fill(); }
    return { T, pf };
  }
  const ms = mk(SW, SH), mx = ms.getContext("2d", { willReadFrequently: true });
  function iou(p) {
    render(p, SW, SH, 1, mx);
    const d = mx.getImageData(0, 0, SW, SH).data;
    let inter = 0, m = 0;
    for (let i = 0; i < SW * SH; i++) { const v = d[i * 4 + 3] > 128 ? 1 : 0; m += v; if (v && cmask[i]) inter++; }
    return inter / (cArea + m - inter);
  }
  // coarse grid + local refinement
  let best = { p: null, s: -1 };
  for (let az = -60; az <= -10; az += 5) for (let el = 6; el <= 36; el += 5) for (const dist of [180, 260, 380, 600, 1200]) {
    const p = { az, el, dist, roll: 0 }, s = iou(p);
    if (s > best.s) best = { p, s };
  }
  let step = { az: 3, el: 3, dist: 0.25, roll: 1.5 };
  for (let it = 0; it < 6; it++) {
    for (let n = 0; n < 60; n++) {
      const p = { az: best.p.az + (Math.random() * 2 - 1) * step.az, el: best.p.el + (Math.random() * 2 - 1) * step.el, dist: best.p.dist * (1 + (Math.random() * 2 - 1) * step.dist), roll: best.p.roll + (Math.random() * 2 - 1) * step.roll };
      const s = iou(p);
      if (s > best.s) best = { p, s };
    }
    step = { az: step.az * 0.6, el: step.el * 0.6, dist: step.dist * 0.6, roll: step.roll * 0.6 };
  }
  // full-resolution overlay
  const k = W / SW;
  const out = mk(W, H + 170), ox = out.getContext("2d");
  ox.fillStyle = "#f7f5ef"; ox.fillRect(0, 0, W, H + 170);
  ox.drawImage(img, 0, 0, W, H);
  const fm = mk(W, H), fx = fm.getContext("2d", { willReadFrequently: true });
  const { T, pf } = render(best.p, W, H, k, fx);
  const md = fx.getImageData(0, 0, W, H).data;
  const big = mk(W, H), bgx = big.getContext("2d", { willReadFrequently: true }); bgx.drawImage(img, 0, 0, W, H);
  const cd = bgx.getImageData(0, 0, W, H).data;
  const heat = ox.createImageData(W, H);
  let missing = 0, excess = 0, both = 0;
  const cols = { missing: new Float64Array(10), excess: new Float64Array(10) };
  for (let i = 0; i < W * H; i++) {
    const m = md[i * 4 + 3] > 128, c = cd[i * 4 + 3] > 128, x = i % W, band = Math.min(9, Math.floor((x / W) * 10));
    if (c && !m) { heat.data.set([230, 40, 40, 150], i * 4); missing++; cols.missing[band]++; }
    else if (m && !c) { heat.data.set([40, 90, 230, 150], i * 4); excess++; cols.excess[band]++; }
    else if (m && c) both++;
  }
  const hc = mk(W, H); hc.getContext("2d").putImageData(heat, 0, 0); ox.drawImage(hc, 0, 0);
  // feature edges of key parts
  ox.lineWidth = 1.2; ox.strokeStyle = "rgba(10,20,30,0.55)";
  for (let i = 0; i < pf.length; i++) {
    const name = faces[i].name;
    if (!/^(deck|glazing|lifeboat|funnel|exhaust|forecastle|radome|mast)/.test(name)) continue;
    ox.beginPath(); pf[i].forEach((pt, j) => { const [a, b] = T(pt); j ? ox.lineTo(a, b) : ox.moveTo(a, b); }); ox.closePath(); ox.stroke();
  }
  const score = both / (both + missing + excess);
  return { png: out.toDataURL("image/png"), W, H, camera: best.p, iouSmall: best.s, iouFull: score, missingPx: missing, excessPx: excess, overlapPx: both, bands: { missing: [...cols.missing], excess: [...cols.excess] } };
}, { concept, faces });

// annotate (title strip) in a second pass
const pctBands = result.bands.missing.map((m, i) => ({ band: `${i * 10}-${i * 10 + 10}% (stern→bow)`, missingPct: +((100 * m) / (result.overlapPx + result.missingPx)).toFixed(1), excessPct: +((100 * result.bands.excess[i]) / (result.overlapPx + result.missingPx)).toFixed(1) }));
const annotated = await page.evaluate(async ({ png, W, H, iou, cam, gid }) => {
  const img = new Image(); img.src = png; await img.decode();
  const c = document.createElement("canvas"); c.width = W; c.height = H + 170; const x = c.getContext("2d");
  x.drawImage(img, 0, 0);
  x.fillStyle = "#0d2f43"; x.fillRect(0, H, W, 170);
  x.fillStyle = "#f2eee5"; x.font = "bold 26px Helvetica, Arial"; x.fillText(`AURORA TIDE (fictional) · concept overlay · silhouette IoU ${(iou * 100).toFixed(1)}%`, 24, H + 44);
  x.font = "17px Helvetica, Arial"; x.fillStyle = "#c9d6d9";
  x.fillText("Base: approved concept A-02. Red = in the concept, missing from the canonical massing. Blue = massing where the concept has nothing. Dark lines = massing feature edges.", 24, H + 80);
  x.fillText(`Fitted perspective camera: azimuth ${cam.az.toFixed(1)}°, elevation ${cam.el.toFixed(1)}°, distance ${cam.dist.toFixed(0)} m, roll ${cam.roll.toFixed(1)}° · geometry ${gid.slice(0, 23)}…`, 24, H + 110);
  x.fillText("The concept is a generated image (not a calibrated photo); the massing omits railings, umbrellas, planters and fine detail by design. Use the map to find structural deviations.", 24, H + 140);
  return c.toDataURL("image/png");
}, { png: result.png, W: result.W, H: result.H, iou: result.iouFull, cam: result.camera, gid: geometryId });
await browser.close();

fs.mkdirSync(path.join(here, "review"), { recursive: true });
fs.writeFileSync(path.join(here, "review/concept-overlay.png"), Buffer.from(annotated.split(",")[1], "base64"));
const report = { geometryId, concept: "public/cinematic/aurora-tide.webp", camera: result.camera, silhouetteIoU: +result.iouFull.toFixed(4), coarseIoU: +result.iouSmall.toFixed(4), pixels: { overlap: result.overlapPx, missingFromModel: result.missingPx, modelExcess: result.excessPx }, byLengthBand: pctBands };
fs.writeFileSync(path.join(here, "review/concept-overlay.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ iou: report.silhouetteIoU, camera: report.camera, missing: result.missingPx, excess: result.excessPx }));
