// WP-02 independent verification. Run after generate.mjs:  node design/aurora-tide/verify.mjs
// Shares no code with generate.mjs: it parses the written GLB, SVG sheets, manifest and spec, and recomputes
// geometric relationships from those outputs. Exit code 1 on any failure; writes review/verify-report.json.
// These are internal-consistency checks of a fictional design, not naval-architecture or safety certification.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const rd = (p) => fs.readFileSync(path.join(here, p));
const V = JSON.parse(rd("vessel.json"));
const M = JSON.parse(rd("manifest.json"));
const OV = JSON.parse(rd("review/concept-overlay.json"));
const sha = (b) => "sha256:" + crypto.createHash("sha256").update(b).digest("hex");
const results = [];
const check = (group, name, ok, detail = "") => results.push({ group, name, ok: !!ok, detail: String(detail) });
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// ---------------------------------------------------------------- GLB parse
const glbBuf = rd("model/aurora-tide-massing.glb");
const jsonLen = glbBuf.readUInt32LE(12), gltf = JSON.parse(glbBuf.slice(20, 20 + jsonLen).toString("utf8"));
const binStart = 20 + jsonLen + 8, bin = glbBuf.slice(binStart, binStart + glbBuf.readUInt32LE(20 + jsonLen));
const acc = (i) => { const a = gltf.accessors[i], bv = gltf.bufferViews[a.bufferView], n = a.count * (a.type === "VEC3" ? 3 : 1); const ab = bin.buffer.slice(bin.byteOffset + bv.byteOffset, bin.byteOffset + bv.byteOffset + bv.byteLength); return a.componentType === 5125 ? new Uint32Array(ab, 0, n) : new Float32Array(ab, 0, n); };
const meshes = gltf.meshes.map((m) => {
  const pr = m.primitives[0], idx = acc(pr.indices), pos = acc(pr.attributes.POSITION), nor = acc(pr.attributes.NORMAL);
  const vtx = (i) => [pos[i * 3], -pos[i * 3 + 2], pos[i * 3 + 1]]; // glTF (x, z, -y) back to vessel (x, y, z)
  const tris = []; for (let t = 0; t < idx.length; t += 3) tris.push([vtx(idx[t]), vtx(idx[t + 1]), vtx(idx[t + 2])]);
  return { name: m.name, material: gltf.materials[pr.material].name, idx, pos, nor, tris };
});
const byName = Object.fromEntries(meshes.map((m) => [m.name, m]));
const allTris = meshes.flatMap((m) => m.tris);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dotp = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// ---------------------------------------------------------------- A. identity
check("identity", "specId = sha256(vessel.json)", M.specId === sha(JSON.stringify(V)));
check("identity", "generatorId = sha256(generate.mjs, LF)", M.generatorId === sha(rd("generate.mjs").toString("utf8").replace(/\r\n/g, "\n")));
for (const [rel, h] of Object.entries(M.files)) { const b = rd(rel); check("identity", `file hash ${rel}`, sha(rel.endsWith(".svg") ? b.toString("utf8").replace(/\r\n/g, "\n") : b) === h); }
const recomputedModelId = sha(JSON.stringify(meshes.map((m) => [m.name, m.material, Array.from(m.pos, (c) => Math.round(c * 1000))])));
check("identity", "massingModelId recomputed from GLB positions = manifest", recomputedModelId === M.massingModelId, recomputedModelId.slice(7, 19));
check("identity", "GLB embedded ids = manifest", gltf.asset.extras.massingModelId === M.massingModelId && gltf.asset.extras.specId === M.specId && gltf.asset.extras.generatorId === M.generatorId);
const sheets = fs.readdirSync(path.join(here, "sheets")).filter((f) => f.endsWith(".svg"));
for (const f of sheets) {
  const s = rd("sheets/" + f).toString("utf8"), ids = [...s.matchAll(/data-model-id="([^"]+)"/g)].map((m) => m[1]);
  check("identity", `sheet ${f} carries the current model id`, s.includes(`model ${M.massingModelId.slice(7, 19)}`) && ids.every((i) => i === M.massingModelId));
}
check("identity", "overlay measured the current model", OV.massingModelId === M.massingModelId);
check("identity", "overlay measured every GLB triangle (incl. radomes)", OV.faceCount === allTris.length, `${OV.faceCount} vs ${allTris.length}`);
check("identity", "overlay seeded, camera + inputs recorded", Number.isInteger(OV.seed) && typeof OV.camera?.az === "number" && /^sha256:/.test(OV.conceptSha256) && /^sha256:/.test(OV.facesSha256));
check("identity", "review camera identity covers projection, transform, framing, crop", M.cameraId === sha(JSON.stringify(M.reviewCamera)) && ["projection", "transform", "framing", "crop"].every((k) => k in M.reviewCamera) && /not the production/i.test(M.reviewCamera.purpose));
check("identity", "production identity contract binds spec, model, sources, film camera", /specId/.test(M.identity.productionIdentityContract) && /bill of materials/.test(M.identity.productionIdentityContract) && /camera/.test(M.identity.productionIdentityContract));

// ---------------------------------------------------------------- B. mesh validity
let zeroNormals = 0, badLen = 0, zeroArea = 0, windingMismatch = 0, badIdx = 0, nonManifold = 0, negVol = 0, minArea = Infinity;
for (const m of meshes) {
  const nv = m.pos.length / 3;
  for (const i of m.idx) if (i >= nv) badIdx++;
  for (let i = 0; i < m.pos.length; i++) if (!Number.isFinite(m.pos[i]) || !Number.isFinite(m.nor[i])) badLen++;
  for (let v = 0; v < nv; v++) { const l = Math.hypot(m.nor[v * 3], m.nor[v * 3 + 1], m.nor[v * 3 + 2]); if (l < 1e-6) zeroNormals++; else if (Math.abs(l - 1) > 1e-4) badLen++; }
  const edges = new Map(), key = (p) => p.map((c) => c.toFixed(4)).join(",");
  let vol = 0;
  for (let t = 0; t < m.idx.length; t += 3) {
    const [a, b, c] = [m.idx[t], m.idx[t + 1], m.idx[t + 2]].map((i) => [m.pos[i * 3], m.pos[i * 3 + 1], m.pos[i * 3 + 2]]);
    const cr = cross(sub(b, a), sub(c, a)), area = Math.hypot(...cr) / 2;
    minArea = Math.min(minArea, area);
    if (area <= 1e-9) { zeroArea++; continue; }
    const n = [m.nor[m.idx[t] * 3], m.nor[m.idx[t] * 3 + 1], m.nor[m.idx[t] * 3 + 2]];
    if (dotp(n, cr.map((v) => v / (2 * area))) < 0.99) windingMismatch++;
    vol += dotp(a, cross(b, c)) / 6;
    const ks = [key(a), key(b), key(c)];
    for (let e = 0; e < 3; e++) { const p = ks[e], q = ks[(e + 1) % 3]; if (p === q) continue; const k = p < q ? p + "|" + q : q + "|" + p, d = p < q ? 1 : -1; const r = edges.get(k) ?? [0, 0]; r[d > 0 ? 0 : 1]++; edges.set(k, r); }
  }
  for (const [, [f, b]] of edges) if (f !== 1 || b !== 1) nonManifold++;
  if (vol <= 0) negVol++;
}
check("mesh", "all indices valid", badIdx === 0, badIdx);
check("mesh", "positions/normals finite, normals unit length", badLen === 0, badLen);
check("mesh", "no zero-length normals", zeroNormals === 0, zeroNormals);
check("mesh", "no zero-area triangles", zeroArea === 0, `${zeroArea} (min area ${minArea.toExponential(2)} m²)`);
check("mesh", "normals agree with triangle winding", windingMismatch === 0, windingMismatch);
check("mesh", "every solid closed and consistently oriented (each edge used once per direction)", nonManifold === 0, `${nonManifold} bad edges`);
check("mesh", "every solid has positive volume (outward normals)", negVol === 0, negVol);

// ---------------------------------------------------------------- geometric helpers on the GLB
function sliceX(tris, x0) { // segments of the mesh cut by the plane x = x0, as [[y,z],[y,z]]
  const segs = [];
  for (const t of tris) {
    const d = t.map((p) => p[0] - x0), pts = [];
    for (let e = 0; e < 3; e++) { const a = t[e], b = t[(e + 1) % 3], da = d[e], db = d[(e + 1) % 3]; if (da === 0) pts.push([a[1], a[2]]); if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const s = da / (da - db); pts.push([a[1] + s * (b[1] - a[1]), a[2] + s * (b[2] - a[2])]); } }
    if (pts.length >= 2) segs.push([pts[0], pts[1]]);
  }
  return segs;
}
function yAtZ(segs, z0) { const ys = []; for (const [a, b] of segs) { if ((a[1] - z0) * (b[1] - z0) > 0) continue; if (a[1] === b[1]) { ys.push(a[0], b[0]); continue; } const s = (z0 - a[1]) / (b[1] - a[1]); ys.push(a[0] + s * (b[0] - a[0])); } return ys; }
function closestOnTri(p, [a, b, c]) { // Ericson, Real-Time Collision Detection 5.1.5
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a), d1 = dotp(ab, ap), d2 = dotp(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = sub(p, b), d3 = dotp(ab, bp), d4 = dotp(ac, bp); if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return [a[0] + v * ab[0], a[1] + v * ab[1], a[2] + v * ab[2]]; }
  const cp = sub(p, c), d5 = dotp(ab, cp), d6 = dotp(ac, cp); if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return [a[0] + w * ac[0], a[1] + w * ac[1], a[2] + w * ac[2]]; }
  const va = d3 * d6 - d5 * d4; if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / (d4 - d3 + (d5 - d6)); return [b[0] + w * (c[0] - b[0]), b[1] + w * (c[1] - b[1]), b[2] + w * (c[2] - b[2])]; }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den; return [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w];
}
const distToMesh = (p, tris) => { let best = Infinity; for (const t of tris) { const q = closestOnTri(p, t); const d = Math.hypot(...sub(p, q)); if (d < best) best = d; } return best; };
function insideMesh(p, tris) { // ray parity along +z
  let n = 0;
  for (const [a, b, c] of tris) {
    const d = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]); if (Math.abs(d) < 1e-12) continue;
    const l1 = ((b[0] - p[0]) * (c[1] - p[1]) - (c[0] - p[0]) * (b[1] - p[1])) / d, l2 = ((c[0] - p[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (c[1] - p[1])) / d, l3 = 1 - l1 - l2;
    if (l1 < 0 || l2 < 0 || l3 < 0) continue; if (l1 * a[2] + l2 * b[2] + l3 * c[2] > p[2]) n++;
  }
  return n % 2 === 1;
}
const uniq = (tris) => { const s = new Map(); for (const t of tris) for (const p of t) s.set(p.map((c) => c.toFixed(4)).join(","), p); return [...s.values()]; };

// ---------------------------------------------------------------- C. glazing attachment
const S = V.superstructure, G = S.glazingPanel, maxGap = G.offsetFromWall + G.thickness + 0.002;
const hostOf = (n) => (n.startsWith("glazingLounge") ? "deck4Enclosure" : n.startsWith("windscreen9") ? "sunDeck9" : `deck${n.match(/^glazing(\d)/)[1]}`);
let glazingWorst = 0, glazingInside = 0, glazingMeshes = 0;
for (const m of meshes.filter((q) => q.material === "glazing")) {
  glazingMeshes++;
  const host = byName[hostOf(m.name)];
  if (!host) { check("glazing", `${m.name} has a host wall`, false); continue; }
  const verts = uniq(m.tris);
  if (m.name.startsWith("windscreen")) { // rests on the sun-deck plate: base on the plate top, footprint within the plate
    const zb = Math.min(...verts.map((p) => p[2])), base = verts.filter((p) => p[2] < zb + 1e-4);
    const gap = Math.max(...base.map((p) => distToMesh(p, host.tris)));
    const outside = verts.filter((p) => { const ys = sliceX(host.tris, Math.min(Math.max(p[0], 40.0001), 115.9999)).flat().map((q) => Math.abs(q[0])); return Math.abs(p[1]) > Math.max(...ys) + 1e-3; }).length;
    check("glazing", `${m.name} rests on ${host.name} (base on the plate, footprint inside it)`, gap <= 1e-3 && outside === 0, `gap ${gap.toFixed(4)} m, outside ${outside}`);
    continue;
  }
  let worst = 0, inside = 0;
  for (const p of verts) { worst = Math.max(worst, distToMesh(p, host.tris)); if (insideMesh(p, host.tris)) inside++; }
  glazingWorst = Math.max(glazingWorst, worst); glazingInside += inside;
  check("glazing", `${m.name} attached to ${host.name} (every vertex within ${maxGap.toFixed(3)} m of the wall surface, none inside it)`, worst <= maxGap && inside === 0, `max ${worst.toFixed(4)} m, inside ${inside}`);
}
check("glazing", "three principal panoramic bands + deck 8 band present on both sides", [5, 6, 7, 8].every((d) => byName[`glazing${d}P`] && byName[`glazing${d}S`]));

// ---------------------------------------------------------------- D. cross-output consistency (sheets vs GLB)
function parseRaster(svgText) {
  const g = svgText.match(/<g id="geometry"([^>]*)>([\s\S]*?)<\/g>/); const attrs = Object.fromEntries([...g[1].matchAll(/data-([a-z-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
  const cols = new Map(); // px column -> [minRow, maxRow]
  for (const m of g[2].matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) { const x0 = +m[1], y = +m[2], w = +m[3]; for (let x = x0; x < x0 + w; x++) { const c = cols.get(x); if (!c) cols.set(x, [y, y]); else { c[0] = Math.min(c[0], y); c[1] = Math.max(c[1], y); } } }
  return { attrs, cols };
}
// Two-sided silhouette test per pixel column: (a) no drawn pixel without GLB geometry there (GLB max ≥ drawn − tol),
// (b) no GLB solid at least 1.5 px thick missing from the drawing (thick max ≤ drawn + tol). Sub-pixel slivers at raked
// ends may or may not cover a pixel row, so they are only held to (a).
function compareProfile(name, file, toModelX, toValue, axis, tolPx) {
  const { attrs, cols } = parseRaster(rd("sheets/" + file).toString("utf8")), k = +attrs.k, tol = tolPx / k;
  let worst = 0, n = 0, worstAt = null;
  for (const [px, [top]] of cols) {
    const x = toModelX(px + 0.5, attrs); let all = -Infinity, thick = -Infinity;
    for (const m of meshes) { const vals = sliceX(m.tris, x).flat().map((p) => (axis === "z" ? p[1] : p[0])); if (!vals.length) continue; const lo = Math.min(...vals), hi = Math.max(...vals); all = Math.max(all, hi); if (hi - lo >= 1.5 / k) thick = Math.max(thick, hi); }
    if (all === -Infinity) continue;
    const drawn = toValue(top, attrs), viol = Math.max(0, drawn - tol - all, thick - (drawn + tol)) * k; n++;
    if (viol > worst) { worst = viol; worstAt = x.toFixed(2); }
  }
  check("cross-output", `${name}: drawn silhouette matches the GLB at every pixel column (±${tolPx} px)`, n > 100 && worst === 0, `${n} columns, worst excess ${worst.toFixed(2)} px${worstAt ? " at x " + worstAt : ""}`);
}
compareProfile("port elevation", "01-port-elevation.svg", (px, a) => (px - +a.ox) / +a.k, (row, a) => (+a.oy - (row + 0.5)) / +a.k, "z", 1.5);
compareProfile("starboard elevation", "02-starboard-elevation.svg", (px, a) => V.principal.lengthOverall - (px - +a.ox) / +a.k, (row, a) => (+a.oy - (row + 0.5)) / +a.k, "z", 1.5);
compareProfile("plan (port half-breadth)", "05-plan.svg", (px, a) => (px - +a.ox) / +a.k, (row, a) => (+a.cy - (row + 0.5)) / +a.k, "y", 1.5);
{ // deck 7 arrangement footprint vs GLB deck 7 solid
  const s = rd("sheets/06-deck7-arrangement.svg").toString("utf8"), g = s.match(/<g id="deck7-footprint"([^>]*)>\s*<polygon points="([^"]+)"/);
  const a = Object.fromEntries([...g[1].matchAll(/data-([a-z-]+)="([^"]*)"/g)].map((m) => [m[1], +m[2]]));
  const pts = g[2].trim().split(/\s+/).map((q) => q.split(",").map(Number)).map(([px, py]) => [(px - a.ox) / a.k, (a.cy - py) / a.k]);
  const xs = pts.map((p) => p[0]), L7 = S.levels.find((l) => l.deck === 7);
  check("cross-output", "deck 7 arrangement footprint spans exactly the deck 7 extent (no out-of-bounds samples)", near(Math.min(...xs), L7.aftWallX, 0.01) && near(Math.max(...xs), L7.foreX, 0.01), `${Math.min(...xs).toFixed(2)}–${Math.max(...xs).toFixed(2)}`);
  let worst = 0; const d7 = byName.deck7.tris;
  for (const [x, y] of pts.filter((p) => p[1] > 0 && p[0] > L7.aftWallX + 0.6 && p[0] < L7.foreX - 0.6)) { const ys = yAtZ(sliceX(d7, x), 18.7 + 0.01); if (ys.length) worst = Math.max(worst, Math.abs(Math.max(...ys) - y)); }
  check("cross-output", "deck 7 arrangement side line = GLB deck 7 wall (≤ 0.02 m)", worst <= 0.02, `worst ${worst.toFixed(4)} m`);
}

// ---------------------------------------------------------------- E. datums and authoritative features
const H = V.hull, P = V.principal, WL = P.waterlineZ, hull = byName.hull.tris;
const zs = (m) => m.tris.flat().map((p) => p[2]), xsOf = (m) => m.tris.flat().map((p) => p[0]);
check("datum", "hull modelled to DWL − visibleBelowWaterline", near(Math.min(...zs(byName.hull)), WL - H.visibleBelowWaterline, 1e-3));
const mastTop = Math.max(...zs(byName.mast));
check("datum", "air draft above DWL = mast top − DWL (from the GLB)", near(mastTop - WL, P.airDraft.aboveDWL, 0.01) && near(mastTop, S.mast.topZ, 1e-3), `${(mastTop - WL).toFixed(2)} m`);
const xAtZ = (z, fn) => { let best = fn === "max" ? -Infinity : Infinity; for (const t of hull) for (let e = 0; e < 3; e++) { const a = t[e], b = t[(e + 1) % 3]; if ((a[2] - z) * (b[2] - z) > 0 || a[2] === b[2]) continue; const s = (z - a[2]) / (b[2] - a[2]), x = a[0] + s * (b[0] - a[0]); best = fn === "max" ? Math.max(best, x) : Math.min(best, x); } return best; };
check("datum", "waterline bow on the raked stem (hull ends at bowRakeWaterlineX at the DWL)", near(xAtZ(WL + 1e-6, "max"), H.bowRakeWaterlineX, 0.05), xAtZ(WL + 1e-6, "max").toFixed(2));
check("datum", "stem top at bowRakeTopX", near(Math.max(...xsOf(byName.hull)), H.bowRakeTopX, 1e-3));
check("datum", "transom at the DWL at sternRakeWaterlineX", near(xAtZ(WL + 1e-6, "min"), H.sternRakeWaterlineX, 0.05), xAtZ(WL + 1e-6, "min").toFixed(2));
const t1 = byName.terraceT1, T1 = S.aftTerraceT1;
check("datum", "terrace T1 deck at its spec position and height", near(Math.min(...zs(t1)), T1.deckZ, 1e-3) && near(Math.min(...xsOf(t1)), T1.aftX, 1e-3) && near(Math.max(...xsOf(t1)), T1.wallX, 1e-3));
check("datum", "hull top follows the sheer profile (sampled every 5 m forward of T1)", (() => { for (let x = T1.wallX + 1; x < 156; x += 5) { const ys = sliceX(hull, x); const z = Math.max(...ys.flat().map((p) => p[1])); let ref = H.sheerProfile[0][1]; for (let i = 1; i < H.sheerProfile.length; i++) { const [x0, z0] = H.sheerProfile[i - 1], [x1, z1] = H.sheerProfile[i]; if (x <= x1) { ref = z0 + ((x - x0) / (x1 - x0)) * (z1 - z0); break; } } if (!near(z, ref, 1e-3)) return false; } return true; })());
check("datum", "deck 9 is an open sun deck (no enclosed deck 9 level; plate + windscreen present)", !byName.deck9 && byName.sunDeck9 && Math.max(...zs(byName.sunDeck9)) - Math.min(...zs(byName.sunDeck9)) <= S.sunDeck.plateThickness + 1e-3 && byName.windscreen9P && byName.windscreen9S);
check("datum", "radomes present in the GLB (and therefore in every view and the overlay)", V.superstructure.radomes.every((_, i) => byName[`radome${i}`]));
check("datum", "radome mast house rests on the sun deck (no floating platform)", near(Math.min(...zs(byName.radomeMastHouse)), Math.max(...zs(byName.sunDeck9)) - 0.05, 1e-3));
check("datum", "funnel casing base starts at or forward of the deck 8 aft wall", Math.min(...xsOf(byName.funnelCasingBase)) >= S.levels.find((l) => l.deck === 8).aftWallX - 1e-6);
check("datum", "intentional omissions declared in the GLB", Array.isArray(gltf.asset.extras.omitted) && gltf.asset.extras.omitted.length >= 5);

// ---------------------------------------------------------------- F. deck footprints within the hull
{
  let worst = -Infinity, at = null;
  for (const d of [5, 6, 7, 8]) { const L = S.levels.find((l) => l.deck === d), mt = byName[`deck${d}`].tris; for (let x = L.aftWallX + 0.5; x < L.foreX - 0.5; x += 1) { const ys = sliceX(mt, x).flat().map((p) => Math.abs(p[0])); const hy = sliceX(hull, x).flat().map((p) => Math.abs(p[0])); if (!ys.length || !hy.length) continue; const over = Math.max(...ys) - Math.max(...hy); if (over > worst) { worst = over; at = `D${d} x ${x.toFixed(1)}`; } } }
  check("footprint", "superstructure levels 5–8 never wider than the hull at the same station", worst <= 0.005, `max excess ${worst.toFixed(4)} m at ${at}`);
}

// ---------------------------------------------------------------- G. accommodation (every slot over its full footprint, from the GLB)
const A = V.accommodation, MOD = A.unitModule;
let mism = 0; const failingNow = [], stdShort = [], badVariant = [];
for (const s of M.slots) {
  const sg = s.side === "port" ? 1 : -1; let minSide = Infinity;
  for (let x = s.xFrom; x <= s.xTo + 1e-9; x += 0.05) {
    let side;
    if (s.deck === 4) { const ys = yAtZ(sliceX(hull, x), V.decks.find((d) => d.deck === 4).z + 1e-4).map((y) => y * sg); side = Math.max(...ys) - A.deck4.hullLining; }
    else { const ys = yAtZ(sliceX(byName[`deck${s.deck}`].tris, x), V.decks.find((d) => d.deck === s.deck).z + 1.0).map((y) => y * sg); side = Math.max(...ys); }
    minSide = Math.min(minSide, side);
  }
  const vr = (A.cabinVariants ?? []).find((q) => q.nums.includes(s.num)), bdep = vr?.balconyDepth ?? MOD.balconyDepth;
  const fixedReq = A.corridorBulkhead + MOD.depthInterior + (s.deck >= 5 ? A.sideStructureAllowance : 0);
  const req = fixedReq + (s.deck >= 5 ? bdep : 0), reqStd = fixedReq + (s.deck >= 5 ? MOD.balconyDepth : 0);
  if (minSide - A.corridorHalfWidth - reqStd < -1e-6) stdShort.push(s.num);
  if (vr && !(bdep >= 1.2 && bdep <= MOD.balconyDepth && minSide - A.corridorHalfWidth - req >= -1e-6 && Math.abs((MOD.width - 0.1) * (bdep - 0.1) - s.balconyClearM2) < 0.01)) badVariant.push(s.num);
  const margin = minSide - A.corridorHalfWidth - req;
  if (!near(margin, s.margin, 0.01) || (margin >= -1e-6) !== s.fits) mism++;
  if (margin < -1e-6) failingNow.push(s.num);
}
check("capacity", "104 slots / 208 guests counted", M.slots.length === 104 && M.capacity.guestsDoubleOccupancy === 208);
check("capacity", "per-deck counts = vessel.json breakdown", V.accommodation.breakdown.every((b) => M.slots.filter((s) => s.deck === b.deck).length === b.count));
check("capacity", "every slot's full-footprint margin re-measured from the GLB = manifest (±0.01 m)", mism === 0, `${mism} mismatches`);
check("capacity", "all 104 cabin envelopes fit over their full footprint (re-measured from the GLB)", failingNow.length === 0 && M.capacity.failing === 0 && M.slots.length === 104, failingNow.join(",") || "0 failing");
{
  const vn = (A.cabinVariants ?? []).flatMap((q) => q.nums).sort((a, b) => a - b);
  check("capacity", "tapered balcony applied only to the cabins short with the standard balcony (7305/7306), as approved", JSON.stringify(stdShort.sort((a, b) => a - b)) === JSON.stringify(vn) && V.decisions["D-W02-11"]?.status === "approved", `short with 2.1 m: ${stdShort.join(",")}; variant: ${vn.join(",")}`);
  check("capacity", "variant: full 7.2 m interior kept, balcony 1.2–2.1 m and within the taper, area recorded", badVariant.length === 0 && (A.cabinVariants ?? []).every((q) => q.interiorDepth === MOD.depthInterior), badVariant.join(",") || "ok");
  const s14 = M.slots.find((s) => s.num === 7214);
  check("capacity", "Signature Cabin 7214 keeps the standard 2.1 m balcony (9.0 m²)", !s14.variant && s14.balconyDepth === MOD.balconyDepth && M.cabin7214.metrics.balconyClearM2 === 9);
}
{
  const overl = M.slots.filter((a, i) => M.slots.some((b, j) => j > i && a.deck === b.deck && a.side === b.side && a.xFrom < b.xTo - 1e-6 && b.xFrom < a.xTo - 1e-6)).length;
  const core = M.slots.filter((s) => A.cores.some(([a, f]) => s.xTo > a + 1e-6 && s.xFrom < f - 1e-6)).length;
  const bay = M.slots.filter((s) => s.deck === S.lifeboatBay.deck && s.xTo > S.lifeboatBay.fromX && s.xFrom < S.lifeboatBay.toX).length;
  check("capacity", "no overlapping slots, none in a core, none in the lifeboat bay", overl === 0 && core === 0 && bay === 0, `${overl}/${core}/${bay}`);
}
{
  const lg = M.entertainmentLounge, d4 = M.slots.filter((s) => s.deck === 4);
  check("lounge", "lounge starts at the terrace T1 wall and ends before the first deck 4 slot", near(lg.xAft, T1.wallX, 1e-6) && lg.xFwd < Math.min(...d4.map((s) => s.xFrom)) && !d4.some((s) => s.xFrom < lg.xFwd));
  const w = (x) => 2 * (Math.max(...yAtZ(sliceX(hull, x), V.decks.find((d) => d.deck === 4).z + 1e-4)) - A.deck4.hullLining);
  check("lounge", "lounge widths match the GLB hull at deck 4 (±0.02 m)", near(w(lg.xAft + 1e-4), lg.widthAftM, 0.02) && near(w(lg.xFwd), lg.widthFwdM, 0.02), `${w(lg.xAft + 1e-4).toFixed(2)} / ${w(lg.xFwd).toFixed(2)}`);
  check("lounge", "deck 4 keeps all 28 oceanview slots (none displaced)", d4.length === 28 && lg.stateroomsDisplaced === 0);
  check("lounge", "lounge listed as a located amenity", V.amenityMap.entries.some((e) => /entertainment lounge/i.test(e.amenity) && e.deck === 4));
}

// ---------------------------------------------------------------- H. Cabin 7214 (recomputed from the spec layout)
{
  const c = V.cabin7214, L = c.layout, E = c.envelope, T = c.designTargets;
  const U0 = 0.05, U1 = E.moduleWidth - 0.05, WG0 = E.interiorDepth - 0.05, WG1 = E.interiorDepth + 0.05, WB = E.interiorDepth + E.balconyDepth - 0.05;
  const rect = (r, tall = false, id = "") => ({ u0: r[0], u1: r[1], w0: r[2], w1: r[3], tall, id });
  const bd = L.bathroomDoor, ed = L.entryDoor, dw = L.balconyDoorway;
  const walls = [rect(L.partitions.bathroomOutboardWall.r, true, "bathOut"), rect([bd.wallU0, bd.wallU1, 0, bd.w0], true, "bathFwdA"), rect([bd.wallU0, bd.wallU1, bd.w1, L.partitions.bathroomForwardWall.r[3]], true, "bathFwdB")];
  const furn = Object.entries(L.items).map(([id, it]) => rect(it.r, !!it.tall, id));
  const shell = [rect([-9, ed.u0, -0.12, 0], true, "corrA"), rect([ed.u1, 9, -0.12, 0], true, "corrB"), rect([-9, dw.u0, WG0, WG1], false, "glzA"), rect([dw.u1, 9, WG0, WG1], false, "glzB"), rect([-9, 9, WB, WB + 0.05], false, "bal"), rect([-9, U0, -0.12, 99], true, "aft"), rect([U1, 9, -0.12, 99], true, "fwd")];
  const obs = [...walls, ...furn, ...shell];
  const dRect = (o, u, w) => Math.hypot(Math.max(o.u0 - u, 0, u - o.u1), Math.max(o.w0 - w, 0, w - o.w1));
  // erosion-based reachability at a 0.025 m grid (independent method)
  const res = 0.025, gu0 = U0, gw0 = -0.3, NU = Math.ceil((U1 - U0) / res), NW = Math.ceil((WB - gw0) / res);
  const reach = (width, from, to) => {
    const r = width / 2, free = new Uint8Array(NU * NW);
    for (let j = 0; j < NW; j++) for (let i = 0; i < NU; i++) { const u = gu0 + (i + 0.5) * res, w = gw0 + (j + 0.5) * res; const inCorr = w < -0.12; free[j * NU + i] = (inCorr ? u > ed.u0 - 0.3 && u < ed.u1 + 0.3 && obs.filter((o) => !o.id.startsWith("corr")).every((o) => dRect(o, u, w) >= r) : obs.every((o) => dRect(o, u, w) >= r)) ? 1 : 0; }
    const cell = ([u, w]) => [Math.floor((u - gu0) / res), Math.floor((w - gw0) / res)];
    const [si, sj] = cell(from), [ti, tj] = cell(to);
    // allow the target's own cell neighbourhood (standing point) to be checked at the same width
    if (!free[sj * NU + si] || !free[tj * NU + ti]) return false;
    const seen = new Uint8Array(NU * NW), q = [sj * NU + si]; seen[q[0]] = 1;
    while (q.length) { const k = q.pop(); if (k === tj * NU + ti) return true; const i = k % NU, j = (k / NU) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= NU || jj >= NW) continue; const kk = jj * NU + ii; if (free[kk] && !seen[kk]) { seen[kk] = 1; q.push(kk); } } }
    return false;
  };
  const start = [(ed.u0 + ed.u1) / 2, -0.2];
  for (const r of L.routes.primary) check("cabin7214", `primary route ${r.id} passable at ${T.primaryRouteMinWidth} m width`, reach(T.primaryRouteMinWidth - res, start, r.to));
  const secFail = L.routes.secondary.filter((r) => !reach(T.secondaryAccessMinWidth - res, start, r.to)).map((r) => r.id);
  check("cabin7214", `all ${L.routes.secondary.length} secondary destinations reachable at ${T.secondaryAccessMinWidth} m width`, secFail.length === 0, secFail.join(","));
  check("cabin7214", "manifest route bottlenecks agree with the independent method (±0.03 m)", M.cabin7214.routes.every((r) => r.ok) && M.cabin7214.routes.every((r) => r.bottleneck >= r.target - 0.03));
  const entryHits = [...walls, ...furn].filter((o) => o.u1 > ed.u0 && o.u0 < ed.u1 && o.w1 > 0 && o.w0 < 0.9).map((o) => o.id);
  check("cabin7214", "nothing within 0.9 m inside the entry opening (Codex P1-A)", entryHits.length === 0, entryHits.join(","));
  let swing = []; for (let a = 0; a <= 90; a += 0.5) for (let rr = 0.01; rr <= ed.leaf; rr += 0.01) { const u = ed.hingeU + rr * Math.cos((a * Math.PI) / 180), w = rr * Math.sin((a * Math.PI) / 180); for (const o of [...walls, ...furn]) if (u > o.u0 && u < o.u1 && w > o.w0 && w < o.w1 && !swing.includes(o.id)) swing.push(o.id); }
  check("cabin7214", "entry door swing envelope free of walls and furniture", swing.length === 0, swing.join(","));
  check("cabin7214", "entry opening ≥ 0.9 m and hinge on a jamb", near(ed.u1 - ed.u0, 0.9, 1e-6) && (near(ed.hingeU, ed.u0, 1e-6) || near(ed.hingeU, ed.u1, 1e-6)));
  check("cabin7214", "bathroom pocket door slides inside its wall (no swing)", bd.pocketW0 >= 0 && bd.pocketW1 <= bd.w0 + 1e-9 && bd.pocketW1 - bd.pocketW0 >= bd.w1 - bd.w0 - 1e-9);
  const ovl = (a, b) => a.u0 < b.u1 - 1e-9 && b.u0 < a.u1 - 1e-9 && a.w0 < b.w1 - 1e-9 && b.w0 < a.w1 - 1e-9;
  const clash = []; for (let i = 0; i < furn.length; i++) { for (let j = i + 1; j < furn.length; j++) if (ovl(furn[i], furn[j])) clash.push(`${furn[i].id}/${furn[j].id}`); for (const w of walls) if (ovl(furn[i], w)) clash.push(`${furn[i].id}/${w.id}`); }
  const outOfModule = furn.filter((o) => o.u0 < U0 - 1e-9 || o.u1 > U1 + 1e-9 || o.w0 < 0 || o.w1 > WB || (o.w0 < WG1 && o.w1 > WG0)).map((o) => o.id);
  check("cabin7214", "furniture footprints do not overlap each other or partitions, and stay inside the cabin/balcony", clash.length === 0 && outOfModule.length === 0, [...clash, ...outOfModule].join(","));
  const area = (o) => (o.u1 - o.u0) * (o.w1 - o.w0), interior = (U1 - U0) * WG0, net = interior - walls.reduce((s, o) => s + area(o), 0);
  const bath = (bd.wallU0 - U0) * L.partitions.bathroomOutboardWall.r[2], ward = area(furn.find((o) => o.id === "wardrobe")), bal = (U1 - U0) * (WB - WG1);
  const mm = M.cabin7214.metrics;
  check("cabin7214", "areas recomputed from the floor polygons = manifest", near(net, mm.netFloorM2, 0.006) && near(bath, mm.bathroomInternalM2, 0.006) && near(bal, mm.balconyClearM2, 0.006) && near(net - bath - ward, mm.roomExclBathAndWardrobeM2, 0.006), `net ${net.toFixed(2)}, bath ${bath.toFixed(2)}, balcony ${bal.toFixed(2)}`);
  check("cabin7214", "gross module = moduleWidth × interiorDepth (single convention)", near(mm.grossModuleM2, E.moduleWidth * E.interiorDepth, 0.006));
  const tall = [...walls, ...furn.filter((o) => o.tall)];
  const segHit = (p, q, o) => { const N = 400; for (let i = 0; i <= N; i++) { const u = p[0] + ((q[0] - p[0]) * i) / N, w = p[1] + ((q[1] - p[1]) * i) / N; if (u > o.u0 && u < o.u1 && w > o.w0 && w < o.w1) return true; } return false; };
  const vpBad = L.viewpoints.filter((vp) => { const p = [vp.u, vp.w]; const t = vp.lookW > WB ? (WB - vp.w) / (vp.lookW - vp.w) : 1; const q = [vp.u + (vp.lookU - vp.u) * t, vp.w + (vp.lookW - vp.w) * t]; return Math.min(...tall.map((o) => dRect(o, ...p))) < T.viewpointClearanceTall - 1e-9 || Math.min(...[...walls, ...furn, ...shell.filter((o) => !o.id.startsWith("corr"))].map((o) => dRect(o, ...p))) < T.viewpointClearanceAny - 1e-9 || tall.some((o) => segHit(p, q, o)); }).map((v) => v.id);
  check("cabin7214", "six viewpoints in free space with unobstructed sight lines", L.viewpoints.length === 6 && vpBad.length === 0, vpBad.join(","));
  const s7214 = M.slots.find((s) => s.num === 7214), aft = M.slots.find((s) => s.deck === 7 && s.side === "port" && near(s.xTo, s7214.xFrom, 1e-6)), fwd = M.slots.find((s) => s.deck === 7 && s.side === "port" && near(s.xFrom, s7214.xTo, 1e-6));
  check("cabin7214", "position: deck 7 port, x = vessel.json cabin7214.location", s7214.deck === 7 && s7214.side === "port" && near(s7214.xFrom, c.location.xFrom, 1e-6) && near(s7214.xTo, c.location.xTo, 1e-6), `${s7214.xFrom}–${s7214.xTo}`);
  check("cabin7214", "neighbours derived from the slot list and shown on sheet 08", M.cabin7214.neighbours.aft === aft?.num && M.cabin7214.neighbours.forward === fwd?.num && rd("sheets/08-cabin-7214-plan.svg").toString().includes(`neighbours ${aft?.num} (aft) and ${fwd?.num} (forward)`), `${aft?.num} / ${fwd?.num}`);
  check("cabin7214", "fits the hull over its full footprint (re-measured from the GLB)", s7214.fits && s7214.margin > 0, `margin ${s7214.margin} m`);
}

// ---------------------------------------------------------------- I. captions, stale references, decisions
{
  const all = sheets.map((f) => [f, rd("sheets/" + f).toString("utf8")]);
  const stale = all.filter(([f, s]) => (s.match(/9214/g) ?? []).length > (f.startsWith("08-") ? 1 : 0) || /7216/.test(s) || /decision required on the 9214/i.test(s)).map(([f]) => f);
  check("captions", "no stale 9214/7216 references in sheets (only 'formerly 9214' on sheet 08)", stale.length === 0, stale.join(","));
  const s08 = rd("sheets/08-cabin-7214-plan.svg").toString(), s06 = rd("sheets/06-deck7-arrangement.svg").toString(), loc = V.cabin7214.location;
  check("captions", "sheets 06 and 08 state the computed 7214 position", s08.includes(`x ${loc.xFrom}–${loc.xTo} m`) && s06.includes(`x ${loc.xFrom}–${loc.xTo} m`));
  check("captions", "elevations annotate air draft above DWL (not baseline)", ["01-port-elevation.svg", "02-starboard-elevation.svg"].every((f) => rd("sheets/" + f).toString().includes(`air draft ${P.airDraft.aboveDWL} m above DWL`)));
  check("captions", "no airDraftToMastTop field left in the spec", !("airDraftToMastTop" in P));
}
check("decisions", "no Interior Stateroom offered", !V.accommodation.offering.some((o) => /interior/i.test(o.type)));
check("decisions", "Tidekeeper Suite future concept only, never offered", !V.accommodation.offering.some((o) => /tidekeeper|suite/i.test(o.type)) && V.accommodation.futureConcepts.some((c) => /tidekeeper/i.test(c.type)) && !V.accommodation.breakdown.some((b) => /suite/i.test(b.type)));
check("decisions", "theatre and kids' splash zone removed", ["theatre", "splash"].every((k) => V.amenityMap.removed.some((r) => r.amenity.toLowerCase().includes(k))) && !V.amenityMap.entries.some((e) => /theatre|splash/i.test(e.amenity)));
check("decisions", "every advertised amenity has a deck and a location", V.amenityMap.entries.every((e) => Number.isInteger(e.deck) && e.where));
check("overlay", "silhouette IoU recorded (≈90 % design-control target, informational)", typeof OV.silhouetteIoU === "number", `${(OV.silhouetteIoU * 100).toFixed(2)} %`);

// ---------------------------------------------------------------- report
const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  [${r.group}] ${r.name}${r.detail ? "  (" + r.detail + ")" : ""}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
fs.writeFileSync(path.join(here, "review/verify-report.json"), JSON.stringify({ specId: M.specId, massingModelId: M.massingModelId, generatorId: M.generatorId, passed: results.length - failed.length, total: results.length, results }, null, 2) + "\n");
process.exit(failed.length ? 1 : 0);
