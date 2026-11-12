// Aurora Tide canonical design-control generator (WP-02).
// Zero dependencies. ONE canonical solid model is built from vessel.json; the GLB, the overlay faces and every
// projected drawing (elevations, plan, bow, stern, three-quarter) are views of those same triangles. Arrangement
// drawings (decks 4 and 7, accommodation validation, Cabin 7214) use the same canonical side-line functions.
// Surface markings (windows, stripes, mullions, louvres, datums, labels) are drawn as annotation, not geometry.
// Output is a technical design reference (massing + arrangement), NOT a photoreal render.
//
//   node design/aurora-tide/generate.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const V = JSON.parse(fs.readFileSync(path.join(here, "vessel.json"), "utf8"));
const out = (p) => path.join(here, p);
fs.mkdirSync(out("sheets"), { recursive: true });
fs.mkdirSync(out("model"), { recursive: true });

const sha = (buf) => "sha256:" + crypto.createHash("sha256").update(buf).digest("hex");
// Identity (D-W02-9): specId = vessel.json; generatorId = this source (LF-normalised);
// massingModelId = the generated mesh itself (assigned when the GLB is written).
const specId = sha(JSON.stringify(V));
const generatorId = sha(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/\r\n/g, "\n"));
let massingModelId = "pending";

const P = V.principal, H = V.hull, S = V.superstructure, A = V.accommodation, C = V.identity.palette;
const LOA = P.lengthOverall, B2 = P.beam / 2, WL = P.waterlineZ, ZB = WL - H.visibleBelowWaterline;
const deckZ = Object.fromEntries(V.decks.map((d) => [d.deck, d.z]));
const DH = S.deckHeight;
const LV = Object.fromEntries(S.levels.map((l) => [l.deck, l]));
const T1 = S.aftTerraceT1;
const MOD = A.unitModule;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r3 = (v) => +v.toFixed(3);
function lerp1(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) { const [x0, z0] = pts[i - 1], [x1, z1] = pts[i]; if (x <= x1) return z0 + ((x - x0) / (x1 - x0)) * (z1 - z0); }
  return pts.at(-1)[1];
}

// =====================================================================================================
// CANONICAL GEOMETRY FUNCTIONS (the only place hull/level shapes are defined)
// =====================================================================================================
function planHalfBreadth(x) { // waterplane shape at stem-top height
  const [m0, m1] = H.parallelMidbody;
  if (x <= 0) return B2 * H.transomWidthFactor;
  if (x <= m0) return B2 * (H.transomWidthFactor + (1 - H.transomWidthFactor) * Math.sin((x / m0) * Math.PI / 2));
  if (x <= m1) return B2;
  const t = Math.min(1, (x - m1) / (LOA - m1));
  return B2 * Math.max(0, 1 - Math.pow(t, H.taperExponent));
}
const sheer = (x) => lerp1(H.sheerProfile, x);
const stemX = (z) => H.bowRakeWaterlineX + ((z - WL) / (H.bowSheerTopZ - WL)) * (H.bowRakeTopX - H.bowRakeWaterlineX);
const stemZ = (x) => WL + ((x - H.bowRakeWaterlineX) / (H.bowRakeTopX - H.bowRakeWaterlineX)) * (H.bowSheerTopZ - WL);
const sternZ = (x) => WL + ((x - H.sternRakeWaterlineX) / (H.sternRakeTopX - H.sternRakeWaterlineX)) * (T1.deckZ - WL);
const sternX = (z) => H.sternRakeWaterlineX + ((z - WL) / (T1.deckZ - WL)) * (H.sternRakeTopX - H.sternRakeWaterlineX);
// Hull half-breadth at (x, z): bow waterplanes are compressed so each ends on the raked stem.
function hullHB(x, z) {
  const t0 = H.bowTaperStartX, xb = Math.min(LOA, stemX(z));
  if (x <= t0) return planHalfBreadth(x);
  if (x >= xb) return 0;
  return planHalfBreadth(t0 + ((x - t0) * (LOA - t0)) / (xb - t0));
}
const hullTop = (x) => (x <= T1.wallX ? T1.deckZ : sheer(x)); // terrace T1 deck aft of its glazed wall
const hullBottom = (x) => Math.max(ZB, stemZ(x), sternZ(x));
// Superstructure side line of a level at x: the hull breadth at that level's deck height, minus its inset
// (deck 5 also has the lifeboat-bay recess).
function levelWall(deck, x) {
  let w = hullHB(x, deckZ[deck]) - LV[deck].sideInset;
  const b = S.lifeboatBay;
  if (deck === b.deck) w -= b.recessDepth * clamp((x - b.fromX) / 0.02, 0, 1) * clamp((b.toX - x) / 0.02, 0, 1);
  return w;
}
function levelHeight(deck, x) {
  const L = LV[deck], R = S.levelRake;
  return (DH - 0.05) * clamp(Math.min((x - L.aftWallX) / R.aft, (L.foreX - x) / R.fore), 0, 1);
}
const deck4Side = (x) => hullHB(x, deckZ[4]) - A.deck4.hullLining;
// deck 4 enclosure (lounge + band between hull top and the deck 5 floor) ends where the sheer reaches deck 5
const ENCLOSURE_END = (() => { let x = T1.wallX; while (sheer(x) < deckZ[5] - 1e-9 && x < LOA) x += 0.01; return r3(x); })();
const sideLine = (deck, x) => (deck === 4 ? deck4Side(x) : levelWall(deck, x));

// =====================================================================================================
// SOLID BUILDERS (closed, consistently outward-oriented triangle meshes)
// =====================================================================================================
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
const triArea = (t) => Math.hypot(...cross(sub(t[1], t[0]), sub(t[2], t[0]))) / 2;
const triNormal = (t) => norm(cross(sub(t[1], t[0]), sub(t[2], t[0])));
function finish(name, mat, tris, role) {
  tris = tris.filter((t) => triArea(t) > 1e-9);
  const vol = tris.reduce((s, t) => s + dot(t[0], cross(t[1], t[2])), 0) / 6;
  if (vol < 0) tris = tris.map(([a, b, c]) => [a, c, b]);
  return { name, mat, role, tris };
}
function stations(a, f, step, extra = []) {
  const s = new Set();
  for (let x = a; x < f - 1e-9; x += step) s.add(r3(x));
  s.add(r3(f));
  for (const e of extra) if (e >= a - 1e-9 && e <= f + 1e-9) s.add(r3(e));
  return [...s].sort((p, q) => p - q);
}
// Loft: a closed solid through rings (polygons in the y–z plane) at increasing x stations.
function loft(name, mat, xs, ringAt, role = "authoritative") {
  const rings = xs.map((x) => ({ x, r: ringAt(x) }));
  const n = rings[0].r.length, tris = [];
  const p3 = (x, [y, z]) => [x, y, z];
  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i], b = rings[i + 1];
    for (let j = 0; j < n; j++) {
      const j1 = (j + 1) % n, a0 = p3(a.x, a.r[j]), a1 = p3(a.x, a.r[j1]), b0 = p3(b.x, b.r[j]), b1 = p3(b.x, b.r[j1]);
      tris.push([a0, b0, b1], [a0, b1, a1]);
    }
  }
  for (const [R, first] of [[rings[0], true], [rings.at(-1), false]]) {
    let ar = 0; for (let j = 0; j < n; j++) { const [y0, z0] = R.r[j], [y1, z1] = R.r[(j + 1) % n]; ar += y0 * z1 - y1 * z0; }
    if (Math.abs(ar) < 1e-9) continue; // collapsed end: the side faces already close it
    const c = [R.r.reduce((s, p) => s + p[0], 0) / n, R.r.reduce((s, p) => s + p[1], 0) / n];
    for (let j = 0; j < n; j++) { const t = [p3(R.x, c), p3(R.x, R.r[j]), p3(R.x, R.r[(j + 1) % n])]; tris.push(first ? t : [t[0], t[2], t[1]]); }
  }
  return finish(name, mat, tris, role);
}
const rectRing = (y0, y1, z0, z1) => [[y0, z0], [y1, z0], [y1, z1], [y0, z1]];
const box = (name, mat, x0, x1, y0, y1, z0, z1, role) => loft(name, mat, [x0, x1], () => rectRing(y0, y1, z0, z1), role);
function sphere(name, mat, c, r, nLat = 8, nLon = 16) {
  const pt = (i, j) => { const th = (Math.PI * i) / nLat, ph = (2 * Math.PI * j) / nLon; return [c[0] + r * Math.sin(th) * Math.cos(ph), c[1] + r * Math.sin(th) * Math.sin(ph), c[2] + r * Math.cos(th)]; };
  const tris = [];
  for (let i = 0; i < nLat; i++) for (let j = 0; j < nLon; j++) {
    const a = pt(i, j), b = pt(i + 1, j), cc = pt(i + 1, j + 1), d = pt(i, j + 1);
    if (i > 0) tris.push([a, b, d]);
    if (i < nLat - 1) tris.push([b, cc, d]);
  }
  return finish(name, mat, tris, "authoritative");
}

// =====================================================================================================
// THE CANONICAL MODEL
// =====================================================================================================
const SOLIDS = [];
{
  // hull: lofted from the transom rake, sheer, T1 recess, bow taper and raked stem; stops 1.2 m below the DWL
  const K = 6;
  const xs = stations(0, LOA, 2, [0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, T1.aftX, T1.wallX, T1.wallX + 0.05, H.parallelMidbody[0], ...Array.from({ length: 51 }, (_, i) => H.bowTaperStartX + i), H.bowRakeWaterlineX]);
  SOLIDS.push(loft("hull", "hull", xs, (x) => {
    const z0 = hullBottom(x), z1 = Math.max(z0, hullTop(x)), port = [];
    for (let k = 0; k <= K; k++) { const z = z0 + ((z1 - z0) * k) / K; port.push([hullHB(x, z), z]); }
    return [...port, ...port.slice().reverse().map(([y, z]) => [-y, z])];
  }));
  // terrace T1: teak deck on the hull top inside a bulwark that rises to the sheer line
  const bt = T1.bulwarkThickness, hb4 = (x) => hullHB(x, T1.deckZ);
  SOLIDS.push(loft("terraceT1", "teak", stations(T1.aftX, T1.wallX, 1), (x) => rectRing(-(hb4(x) - bt - 0.01), hb4(x) - bt - 0.01, T1.deckZ, T1.deckZ + 0.05)));
  for (const s of [1, -1]) SOLIDS.push(loft(`bulwarkT1${s > 0 ? "P" : "S"}`, "hull", stations(0, T1.wallX + 0.05, 1), (x) => { const h = hb4(x); return s > 0 ? rectRing(h - bt, h, T1.deckZ, sheer(x)) : rectRing(-h, -h + bt, T1.deckZ, sheer(x)); }));
  SOLIDS.push(loft("bulwarkT1Transom", "hull", [0, bt], (x) => rectRing(-(hb4(x) - bt), hb4(x) - bt, T1.deckZ, sheer(x))));
  // deck 4 enclosure: entertainment lounge aft + the band between the hull top and the deck 5 floor
  const encW = (x) => hb4(x) - 0.02;
  SOLIDS.push(loft("deck4Enclosure", "superstructure", stations(T1.wallX, ENCLOSURE_END, 1, [T1.wallX + 0.05]), (x) => rectRing(-encW(x), encW(x), hullTop(x) - 0.05, deckZ[5])));
  // superstructure levels 5–8 (raked end walls, sides follow the hull at their own deck height)
  for (const L of S.levels.filter((l) => l.enclosed !== false)) {
    const b = S.lifeboatBay, extra = [L.aftWallX + S.levelRake.aft, L.foreX - S.levelRake.fore];
    if (L.deck === b.deck) extra.push(b.fromX, b.fromX + 0.02, b.toX - 0.02, b.toX);
    SOLIDS.push(loft(`deck${L.deck}`, "superstructure", stations(L.aftWallX, L.foreX, 1, extra), (x) => { const w = levelWall(L.deck, x); return rectRing(-w, w, deckZ[L.deck], deckZ[L.deck] + levelHeight(L.deck, x)); }));
    if (L.terraceAftX < L.aftWallX) SOLIDS.push(loft(L.terrace ? `terrace${L.terrace}` : `terraceD${L.deck}`, "teak", stations(L.terraceAftX, L.aftWallX + 0.3, 1), (x) => { const w = levelWall(L.deck, x); return rectRing(-w, w, deckZ[L.deck] - 0.25, deckZ[L.deck]); }));
  }
  // deck 9: open sun deck (teak plate + glass windscreen), not an enclosed level
  const L9 = LV[9], SD = S.sunDeck, z9 = deckZ[8] + DH - 0.05, zp = z9 + SD.plateThickness;
  SOLIDS.push(loft("sunDeck9", "teak", stations(L9.aftWallX, L9.foreX, 2), (x) => { const w = levelWall(9, x); return rectRing(-w, w, z9, zp); }));
  for (const s of [1, -1]) SOLIDS.push(loft(`windscreen9${s > 0 ? "P" : "S"}`, "glazing", stations(L9.aftWallX, L9.foreX, 2), (x) => { const w = levelWall(9, x); return s > 0 ? rectRing(w - SD.windscreenThickness, w, zp, zp + SD.windscreenHeight) : rectRing(-w, -w + SD.windscreenThickness, zp, zp + SD.windscreenHeight); }));
  for (const [nm, x0, x1, xw] of [["windscreen9Aft", L9.aftWallX, L9.aftWallX + SD.windscreenThickness, L9.aftWallX], ["windscreen9Fwd", L9.foreX - SD.windscreenThickness, L9.foreX, L9.foreX]]) { const w = levelWall(9, xw) - SD.windscreenThickness; SOLIDS.push(box(nm, "glazing", x0, x1, -w, w, zp, zp + SD.windscreenHeight)); }
  // panoramic glazing: panels follow the local wall line of their level on both sides
  const G = S.glazingPanel;
  for (const g of S.glazingBands) for (const s of [1, -1]) {
    SOLIDS.push(loft(`glazing${g.deck}${s > 0 ? "P" : "S"}`, "glazing", stations(g.fromX, g.toX, 1), (x) => {
      const w = levelWall(g.deck, x), za = deckZ[g.deck] + G.fromDeck, zb = deckZ[g.deck] + G.toDeck, i = w + G.offsetFromWall, o = i + G.thickness;
      return s > 0 ? rectRing(i, o, za, zb) : rectRing(-o, -i, za, zb);
    }));
  }
  // entertainment-lounge glazing: on the enclosure sides above the hull top, and the glazed aft wall onto T1
  const lg = deck4Layout().lounge;
  for (const s of [1, -1]) SOLIDS.push(loft(`glazingLounge${s > 0 ? "P" : "S"}`, "glazing", stations(T1.wallX + 0.05, lg.xFwd, 1), (x) => {
    const i = encW(x) + G.offsetFromWall, o = i + G.thickness, za = sheer(x) + 0.1, zb = deckZ[5] - 0.1;
    return s > 0 ? rectRing(i, o, za, zb) : rectRing(-o, -i, za, zb);
  }));
  { const w = hb4(T1.wallX) - 0.3; SOLIDS.push(box("glazingLoungeAft", "glazing", T1.wallX - G.offsetFromWall - G.thickness, T1.wallX - G.offsetFromWall, -w, w, T1.deckZ + 0.1, deckZ[5] - 0.1)); }
  // lifeboats in the deck 5 recess, slightly proud of the shell (davits omitted)
  const lb = S.lifeboatBay;
  for (let i = 0; i < lb.boatsPerSide; i++) for (const s of [1, -1]) {
    const x0 = lb.fromX + 1.5 + i * (lb.boatLength + 1.6), xm = x0 + lb.boatLength / 2;
    const yIn = levelWall(5, xm) + 0.2, yOut = hullHB(xm, deckZ[5]) + lb.boatOutboardOfShell;
    SOLIDS.push(box(`lifeboat${i}${s > 0 ? "P" : "S"}`, "lifeboat", x0, x0 + lb.boatLength, s > 0 ? yIn : -yOut, s > 0 ? yOut : -yIn, deckZ[5] + 0.6, deckZ[5] + 2.2));
  }
  // funnel casing base, funnel (stadium plan, raked ends), exhausts
  const F = S.funnel, cb = F.casingBase, top8 = deckZ[8] + DH - 0.05;
  SOLIDS.push(loft("funnelCasingBase", "superstructure", stations(cb.fromX, cb.toX, 1, [cb.fromX + cb.rake.aft, cb.toX - cb.rake.fore]), (x) => rectRing(-cb.halfWidth, cb.halfWidth, top8 - 0.05, top8 + cb.height * clamp(Math.min((x - cb.fromX) / cb.rake.aft, (cb.toX - x) / cb.rake.fore), 0, 1))));
  const fx1 = F.x + F.length, fTop = F.topZ - 1.2;
  SOLIDS.push(loft("funnel", "funnel", stations(F.x, fx1, 0.5, [F.x + F.topRake.aft, fx1 - F.topRake.fore]), (x) => {
    const d = Math.min(x - F.x, fx1 - x), r = F.halfWidth, hw = d >= r ? r : Math.sqrt(Math.max(0, r * r - (r - d) * (r - d)));
    return rectRing(-hw, hw, top8 - 0.05, top8 + (fTop - top8) * clamp(Math.min((x - F.x) / F.topRake.aft, (fx1 - x) / F.topRake.fore), 0, 1) + 0.05);
  }));
  for (let i = 0; i < F.exhausts; i++) SOLIDS.push(box(`exhaust${i}`, "exhaust", F.x + 3 + i * 2.4, F.x + 4.2 + i * 2.4, -0.6, 0.6, fTop - 0.05, F.topZ + 1.2));
  // radome mast house on the sun deck, radomes on it, mast and yard
  const MH = S.radomeMastHouse;
  SOLIDS.push(box("radomeMastHouse", "superstructure", MH.fromX, MH.toX, -MH.halfWidth, MH.halfWidth, zp - 0.05, MH.topZ));
  S.radomes.forEach((rd, i) => SOLIDS.push(sphere(`radome${i}`, "radome", [rd.x, rd.y, MH.topZ + rd.diameter / 2 - 0.05], rd.diameter / 2)));
  SOLIDS.push(box("mast", "superstructure", S.mast.x - 0.4, S.mast.x + 0.4, -0.4, 0.4, zp - 0.05, S.mast.topZ));
  SOLIDS.push(box("mastYard", "superstructure", S.mast.x - 0.15, S.mast.x + 0.15, -S.mast.yardHalfSpan, S.mast.yardHalfSpan, S.mast.topZ - 2.7, S.mast.topZ - 2.3));
}
const OMITTED = [
  "underwater hull below DWL − 1.2 m", "railings and terrace balustrades (except the D9 glass windscreen)", "umbrellas, loungers and planters",
  "lifeboat davits and liferaft canisters", "anchors, mooring gear and shell doors", "hull windows, mullions, stripes and funnel louvres (drawn as markings)",
  "sculpted swept funnel casing (simplified to a raked block)", "aft-wall glazing of the terrace levels", "cabin balconies as recesses (the side glazing band stands for balcony glass)",
];
const ALL_TRIS = SOLIDS.flatMap((s) => s.tris.map((t) => ({ t, mat: s.mat, name: s.name })));

// =====================================================================================================
// ACCOMMODATION: slots, full-footprint fit, deck 4 lounge
// =====================================================================================================
function slotsOnDeck(deck) {
  const [from, to] = A.slotRanges[String(deck)], out = [];
  let idx = { port: 0, stbd: 0 }, lastZone = 0;
  for (let x = from + A.slotRule.aftClearance; x + MOD.width <= to - A.slotRule.foreClearance + 1e-9; x += MOD.width) {
    if (A.cores.some(([a, f]) => x + MOD.width > a && x < f)) continue;
    const zone = x < A.zoneBoundaries[0] ? 1 : x < A.zoneBoundaries[1] ? 2 : 3;
    if (zone !== lastZone) { idx = { port: 0, stbd: 0 }; lastZone = zone; }
    for (const side of ["port", "starboard"]) {
      idx[side === "port" ? "port" : "stbd"]++;
      const num = deck * 1000 + zone * 100 + (side === "port" ? idx.port * 2 : idx.stbd * 2 - 1);
      out.push({ deck, num, side, zone, xFrom: r3(x), xTo: r3(x + MOD.width) });
    }
  }
  return out;
}
function fitSlot(s) {
  const variant = (A.cabinVariants ?? []).find((q) => q.nums.includes(s.num));
  const balcony = s.deck >= 5, bd = variant?.balconyDepth ?? MOD.balconyDepth;
  const fixed = A.corridorBulkhead + MOD.depthInterior + (balcony ? A.sideStructureAllowance : 0);
  const required = fixed + (balcony ? bd : 0), requiredStandard = fixed + (balcony ? MOD.balconyDepth : 0);
  let minSide = Infinity, atX = s.xFrom;
  for (let x = s.xFrom; x <= s.xTo + 1e-9; x += 0.05) { const w = sideLine(s.deck, x); if (w < minSide) { minSide = w; atX = x; } }
  const available = minSide - A.corridorHalfWidth;
  return { ...s, type: variant ? variant.type : balcony ? "Premium Balcony Stateroom" : "Oceanview Stateroom", variant: variant?.id ?? null, interiorDepth: MOD.depthInterior, balconyDepth: balcony ? bd : 0, balconyClearM2: balcony ? r3((MOD.width - 0.1) * (bd - 0.1)) : 0, required: r3(required), available: r3(available), margin: r3(available - required), standardMargin: r3(available - requiredStandard), worstAtX: r3(atX), fits: available - required >= -1e-9 };
}
const SLOTS = [4, 5, 6, 7].flatMap((d) => slotsOnDeck(d).map(fitSlot));
function capacityReport() {
  const perDeck = {}, failing = SLOTS.filter((s) => !s.fits), variants = SLOTS.filter((s) => s.variant);
  for (const s of SLOTS) perDeck[s.deck] = (perDeck[s.deck] ?? 0) + 1;
  return {
    rule: A.fitRule, slots: SLOTS.length, perDeck, guestsDoubleOccupancy: SLOTS.length * 2,
    fit: SLOTS.length - failing.length, failing: failing.length,
    standardModuleFits: SLOTS.filter((s) => s.standardMargin >= -1e-9).length,
    taperedVariant: { status: "APPROVED (D-W02-11) and applied", rule: "same slot and full 7.2 m interior; balcony reduced to the local forward taper; these cabins only", cabins: variants.map((s) => ({ num: s.num, deck: s.deck, x: [s.xFrom, s.xTo], standardShortfall: r3(-s.standardMargin), balconyDepth: s.balconyDepth, balconyClearM2: s.balconyClearM2, margin: s.margin })) },
  };
}
function deck4Layout() {
  const slots4 = slotsOnDeck(4), firstX = Math.min(...slots4.map((s) => s.xFrom)), bulkhead = 0.1;
  const xAft = T1.wallX, xFwd = firstX - bulkhead / 2, w = deck4Side;
  const integ = (a, f, width) => { let s = 0; const dx = 0.05; for (let x = a; x < f - 1e-9; x += dx) { const h = Math.min(dx, f - x); s += width(x + h / 2) * h; } return s; };
  const gross = integ(xAft, xFwd, (x) => 2 * w(x));
  const barBand = { xAft: xFwd - 3.0, xFwd }, stage = { xAft: xAft + 0.4, xFwd: xAft + 2.8, halfWidth: 2.5 }, apron = { xAft, xFwd: stage.xFwd + 1.2, halfWidth: 3.7 };
  const barArea = integ(barBand.xAft, barBand.xFwd, (x) => 2 * w(x)), apronArea = (apron.xFwd - apron.xAft) * 2 * apron.halfWidth;
  const seatingNet = (gross - barArea - apronArea) * 0.85;
  const lounge = {
    deck: 4, xAft: r3(xAft), xFwd: r3(xFwd), lengthM: r3(xFwd - xAft), widthAftM: +(2 * w(xAft)).toFixed(2), widthFwdM: +(2 * w(xFwd)).toFixed(2),
    grossM2: +gross.toFixed(1), barAndBackOfHouseM2: +barArea.toFixed(1), stageM2: +((stage.xFwd - stage.xAft) * 2 * stage.halfWidth).toFixed(1),
    seatingNetM2: +seatingNet.toFixed(1), seatedTarget: Math.floor(seatingNet / 1.8),
    basis: "fictional design target: 1.8 m² per seated guest after a 15 % circulation allowance; not a certified occupancy",
    stateroomsDisplaced: 0, sideLine: "hull side at deck 4 (z 10) minus 0.3 m lining",
  };
  return { lounge, barBand, stage, apron, slots: slots4, w };
}

// =====================================================================================================
// CABIN 7214: layout from the spec, measured from geometry
// =====================================================================================================
function cabinModel() {
  const c = V.cabin7214, E = c.envelope, Lay = c.layout, T = c.designTargets;
  const U0 = 0.05, U1 = E.moduleWidth - 0.05, WG0 = E.interiorDepth - 0.05, WG1 = E.interiorDepth + 0.05, WBAL = E.interiorDepth + E.balconyDepth - 0.05;
  const R = (r) => ({ u0: r[0], u1: r[1], w0: r[2], w1: r[3] });
  const bd = Lay.bathroomDoor, ed = Lay.entryDoor, dw = Lay.balconyDoorway;
  // obstacles for walking: partitions (openings excluded), furniture, module boundary, glazing frame, balustrade
  const partitions = [
    { id: "bathroomOutboardWall", ...R(Lay.partitions.bathroomOutboardWall.r), tall: true },
    { id: "bathroomForwardWall-a", u0: bd.wallU0, u1: bd.wallU1, w0: 0, w1: bd.w0, tall: true },
    { id: "bathroomForwardWall-b", u0: bd.wallU0, u1: bd.wallU1, w0: bd.w1, w1: 2.32, tall: true },
  ];
  const items = Object.entries(Lay.items).map(([id, it]) => ({ id, ...R(it.r), tall: !!it.tall, zone: it.zone ?? "room" }));
  const frame = [
    { id: "corridorBulkhead-a", u0: -1, u1: ed.u0, w0: -0.12, w1: 0, tall: true }, { id: "corridorBulkhead-b", u0: ed.u1, u1: 6, w0: -0.12, w1: 0, tall: true },
    { id: "glazing-a", u0: -1, u1: dw.u0, w0: WG0, w1: WG1, tall: false }, { id: "glazing-b", u0: dw.u1, u1: 6, w0: WG0, w1: WG1, tall: false },
    { id: "balustrade", u0: -1, u1: 6, w0: WBAL, w1: WBAL + 0.05, tall: false },
    { id: "aftBulkhead", u0: -1, u1: U0, w0: -0.12, w1: WBAL + 0.05, tall: true }, { id: "fwdBulkhead", u0: U1, u1: 6, w0: -0.12, w1: WBAL + 0.05, tall: true },
  ];
  const obstacles = [...partitions, ...items, ...frame];
  const inR = (o, u, w) => u >= o.u0 && u <= o.u1 && w >= o.w0 && w <= o.w1;
  // --- raster + exact Euclidean distance transform; widest-path (maximin) routes ---
  const res = 0.01, gu0 = U0, gu1 = U1, gw0 = -0.3, gw1 = WBAL;
  const NU = Math.round((gu1 - gu0) / res), NW = Math.round((gw1 - gw0) / res);
  const blocked = new Uint8Array(NU * NW);
  for (let j = 0; j < NW; j++) for (let i = 0; i < NU; i++) {
    const u = gu0 + (i + 0.5) * res, w = gw0 + (j + 0.5) * res;
    if (obstacles.some((o) => inR(o, u, w))) blocked[j * NU + i] = 1;
    else if (w < -0.12 && (u < ed.u0 - 0.3 || u > ed.u1 + 0.3)) blocked[j * NU + i] = 1; // corridor stub only in front of the door
  }
  const INF = 1e20, f = new Float64Array(NU * NW);
  for (let k = 0; k < f.length; k++) f[k] = blocked[k] ? 0 : INF;
  const edt1 = (get, set, n) => { // Felzenszwalb–Huttenlocher 1-D squared EDT
    const d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1); let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    const g = Array.from({ length: n }, (_, q) => get(q));
    for (let q = 1; q < n; q++) { let s; do { const p = v[k]; s = (g[q] + q * q - (g[p] + p * p)) / (2 * q - 2 * p); if (s <= z[k]) k--; else break; } while (k >= 0); k++; v[k] = q; z[k] = s; z[k + 1] = INF; }
    k = 0; for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) ** 2 + g[v[k]]; } for (let q = 0; q < n; q++) set(q, d[q]);
  };
  for (let i = 0; i < NU; i++) edt1((q) => f[q * NU + i], (q, val) => { f[q * NU + i] = val; }, NW);
  for (let j = 0; j < NW; j++) edt1((q) => f[j * NU + q], (q, val) => { f[j * NU + q] = val; }, NU);
  const width = (k) => (blocked[k] ? 0 : 2 * (Math.sqrt(f[k]) - 0.5) * res); // diameter of the largest free disc centred on the cell
  const cell = (u, w) => clamp(Math.floor((w - gw0) / res), 0, NW - 1) * NU + clamp(Math.floor((u - gu0) / res), 0, NU - 1);
  function widest(from, to) {
    const best = new Float64Array(NU * NW).fill(-1), prev = new Int32Array(NU * NW).fill(-1), s = cell(...from), t = cell(...to);
    const heap = []; const push = (k, val) => { heap.push([val, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] >= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] > heap[m][0]) m = l; if (r < heap.length && heap[r][0] > heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    best[s] = width(s); push(s, best[s]);
    while (heap.length) {
      const [val, k] = pop(); if (val < best[k]) continue; if (k === t) break;
      const i = k % NU, j = (k / NU) | 0;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= NU || jj >= NW) continue; const kk = jj * NU + ii; if (blocked[kk]) continue; const nv = Math.min(val, width(kk)); if (nv > best[kk]) { best[kk] = nv; prev[kk] = k; push(kk, nv); } }
    }
    let k = t, minW = Infinity, at = null, len = 0; const pathPts = [];
    while (k !== -1) { const wv = width(k); if (wv < minW) { minW = wv; at = k; } if (len % 25 === 0) pathPts.push([gu0 + ((k % NU) + 0.5) * res, gw0 + (((k / NU) | 0) + 0.5) * res]); len++; k = prev[k]; }
    return { bottleneck: +Math.max(0, best[t]).toFixed(2), at: at == null ? null : [r3(gu0 + ((at % NU) + 0.5) * res), r3(gw0 + (((at / NU) | 0) + 0.5) * res)], reached: best[t] > 0, path: pathPts.reverse() };
  }
  const start = [(ed.u0 + ed.u1) / 2, -0.2];
  const routes = [
    ...Lay.routes.primary.map((r) => ({ ...r, kind: "primary", target: T.primaryRouteMinWidth })),
    ...Lay.routes.secondary.map((r) => ({ ...r, kind: "secondary", target: T.secondaryAccessMinWidth })),
  ].map((r) => { const wr = widest(start, r.to); return { id: r.id, kind: r.kind, to: r.to, bottleneck: wr.bottleneck, at: wr.at, target: r.target, ok: wr.reached && wr.bottleneck >= r.target - 1e-9, path: wr.path }; });
  // --- door swing, pocket and entry-zone checks (exact rectangle/arc tests) ---
  const solidObs = obstacles.filter((o) => !o.id.startsWith("corridorBulkhead"));
  let swingHits = [];
  for (let a = 0; a <= 90; a += 1) for (let rr = 0.02; rr <= ed.leaf; rr += 0.02) {
    const u = ed.hingeU + rr * Math.cos((a * Math.PI) / 180), w = rr * Math.sin((a * Math.PI) / 180);
    for (const o of solidObs) if (inR(o, u, w) && !swingHits.includes(o.id)) swingHits.push(o.id);
  }
  const entryZoneHits = solidObs.filter((o) => o.u1 > ed.u0 && o.u0 < ed.u1 && o.w1 > 0 && o.w0 < 0.9).map((o) => o.id);
  const pocketInWall = bd.pocketW0 >= 0 && bd.pocketW1 <= bd.w0 && bd.pocketW1 - bd.pocketW0 >= bd.w1 - bd.w0 - 1e-9;
  // --- viewpoints ---
  const distRect = (o, u, w) => Math.hypot(Math.max(o.u0 - u, 0, u - o.u1), Math.max(o.w0 - w, 0, w - o.w1));
  const segHitsRect = (p, q, o) => { // Liang–Barsky
    let t0 = 0, t1 = 1; const du = q[0] - p[0], dw = q[1] - p[1];
    for (const [pp, qq] of [[-du, p[0] - o.u0], [du, o.u1 - p[0]], [-dw, p[1] - o.w0], [dw, o.w1 - p[1]]]) { if (Math.abs(pp) < 1e-12) { if (qq < 0) return false; } else { const t = qq / pp; if (pp < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t); if (t0 > t1) return false; } }
    return true;
  };
  const tall = obstacles.filter((o) => o.tall && !o.id.startsWith("corridorBulkhead"));
  const viewpoints = Lay.viewpoints.map((vp) => {
    const p = [vp.u, vp.w], qFar = [vp.lookU, vp.lookW];
    const tEnd = (() => { const dw = qFar[1] - p[1]; if (qFar[1] > WBAL) return (WBAL - p[1]) / dw; return 1; })(); // only inside the cabin + balcony
    const q = [p[0] + (qFar[0] - p[0]) * tEnd, p[1] + (qFar[1] - p[1]) * tEnd];
    const clearTall = Math.min(...tall.map((o) => distRect(o, ...p)));
    const clearAny = Math.min(...obstacles.filter((o) => !o.id.startsWith("corridorBulkhead")).map((o) => distRect(o, ...p)));
    const blockedBy = tall.filter((o) => segHitsRect(p, q, o)).map((o) => o.id);
    return { ...vp, clearanceTall: r3(clearTall), clearanceAny: r3(clearAny), sightlineBlockedBy: blockedBy, ok: clearTall >= T.viewpointClearanceTall && clearAny >= T.viewpointClearanceAny && blockedBy.length === 0 };
  });
  // --- areas from the floor polygons ---
  const ra = (o) => (o.u1 - o.u0) * (o.w1 - o.w0);
  const interiorFloor = (U1 - U0) * (WG0 - 0);
  const partitionFootprint = partitions.reduce((s, o) => s + ra(o), 0);
  const bath = { u0: U0, u1: bd.wallU0, w0: 0, w1: Lay.partitions.bathroomOutboardWall.r[2] };
  const wardrobe = items.find((o) => o.id === "wardrobe");
  const net = interiorFloor - partitionFootprint;
  const loc = SLOTS.find((s) => s.num === 7214);
  const neighbours = { aft: SLOTS.find((s) => s.deck === 7 && s.side === "port" && Math.abs(s.xTo - loc.xFrom) < 1e-6)?.num ?? null, forward: SLOTS.find((s) => s.deck === 7 && s.side === "port" && Math.abs(s.xFrom - loc.xTo) < 1e-6)?.num ?? null };
  const metrics = {
    grossModuleM2: +(E.moduleWidth * E.interiorDepth).toFixed(2), interiorFloorM2: +interiorFloor.toFixed(2), partitionFootprintM2: +partitionFootprint.toFixed(2),
    netFloorM2: +net.toFixed(2), bathroomInternalM2: +ra(bath).toFixed(2), wardrobeM2: +ra(wardrobe).toFixed(2), roomExclBathAndWardrobeM2: +(net - ra(bath) - ra(wardrobe)).toFixed(2),
    balconyClearM2: +((U1 - U0) * (WBAL - WG1)).toFixed(2), balconyClearDepth: r3(WBAL - WG1),
    primaryRouteBottleneck: Math.min(...routes.filter((r) => r.kind === "primary").map((r) => r.bottleneck)),
    secondaryAccessBottleneck: Math.min(...routes.filter((r) => r.kind === "secondary").map((r) => r.bottleneck)),
    gridResolution: res,
    hullFit: { slot: [loc.xFrom, loc.xTo], requiredFromCorridorEdge: loc.required, availableFromCorridorEdge: loc.available, margin: loc.margin, rule: "corridor bulkhead 0.12 + interior 7.2 + balcony 2.1 + side structure 0.10, minimum over the full footprint" },
  };
  return { U0, U1, WG0, WG1, WBAL, E, Lay, partitions, items, frame, routes, swingHits, entryZoneHits, pocketInWall, viewpoints, metrics, location: { deck: 7, side: loc.side, zone: loc.zone, xFrom: loc.xFrom, xTo: loc.xTo }, neighbours };
}

// =====================================================================================================
// SVG HELPERS AND PROJECTIONS
// =====================================================================================================
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
function sheet({ title, sub, w, h, body, scaleNote }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="Helvetica, Arial, sans-serif">
<rect width="${w}" height="${h}" fill="#f7f5ef"/>
<g>${body}</g>
<g font-size="15" fill="#0d2f43">
  <rect x="0" y="${h - 64}" width="${w}" height="64" fill="#0d2f43"/>
  <text x="24" y="${h - 36}" fill="#f2eee5" font-size="18" font-weight="700">AURORA TIDE (fictional) · ${esc(title)}</text>
  <text x="24" y="${h - 14}" fill="#c9d6d9" font-size="12">${esc(sub)} · PROPOSED geometry ${esc(V.version)} · spec ${specId.slice(7, 19)} · model ${massingModelId.slice(7, 19)} · design-control drawing, not a render · ${esc(scaleNote ?? "")}</text>
</g>
</svg>`;
}
const poly = (pts, fill, stroke = "none", sw = 1, extra = "") => `<polygon points="${pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
const line = (x1, y1, x2, y2, stroke, sw = 1, extra = "") => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
const text = (x, y, s, size = 12, fill = "#0d2f43", extra = "") => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" fill="${fill}" ${extra}>${esc(s)}</text>`;
const MATCOL = { hull: C.hull, superstructure: C.superstructure, glazing: C.glazing, teak: C.deckTeak, lifeboat: C.lifeboat, funnel: C.funnelCasing, exhaust: C.exhaust, radome: "#fbfbf8" };
const LIGHT = norm([0.45, 0.55, 0.7]);
// Orthographic z-buffer raster of the canonical triangles (zero dependencies, deterministic), written as
// run-length SVG paths (one per colour). f = direction the camera looks along; map: p -> [sx, sy] in sheet px.
// opts.tint = "height" shades by elevation (plan view). The group carries the mapping so outputs can be cross-checked.
function renderGeometry(viewName, W, Hh, f, map, attrs, opts = {}) {
  const zbuf = new Float64Array(W * Hh).fill(Infinity), cbuf = new Int32Array(W * Hh).fill(-1);
  const pal = [], palIdx = new Map();
  for (const T of ALL_TRIS) {
    const n = triNormal(T.t);
    if (dot(n, f) >= -1e-9) continue; // closed solids: back faces never visible
    let shade = 0.72 + 0.28 * Math.max(0, dot(n, LIGHT));
    if (opts.tint === "height") shade = 0.78 + 0.22 * clamp((T.t.reduce((a, p) => a + p[2], 0) / 3 - 8) / 30, 0, 1);
    shade = Math.round(shade * 40) / 40;
    const key = T.mat + ":" + shade;
    if (!palIdx.has(key)) { palIdx.set(key, pal.length); pal.push([1, 3, 5].map((i) => Math.round(Math.min(255, parseInt(MATCOL[T.mat].slice(i, i + 2), 16) * shade)))); }
    const ci = palIdx.get(key);
    const Q = T.t.map((p) => { const [x, y] = map(p); return [x, y, dot(p, f)]; });
    const area = (Q[1][0] - Q[0][0]) * (Q[2][1] - Q[0][1]) - (Q[2][0] - Q[0][0]) * (Q[1][1] - Q[0][1]);
    if (Math.abs(area) < 1e-12) continue;
    const x0 = Math.max(0, Math.floor(Math.min(Q[0][0], Q[1][0], Q[2][0]))), x1 = Math.min(W - 1, Math.ceil(Math.max(Q[0][0], Q[1][0], Q[2][0])));
    const y0 = Math.max(0, Math.floor(Math.min(Q[0][1], Q[1][1], Q[2][1]))), y1 = Math.min(Hh - 1, Math.ceil(Math.max(Q[0][1], Q[1][1], Q[2][1])));
    for (let py = y0; py <= y1; py++) for (let px = x0; px <= x1; px++) {
      const cx = px + 0.5, cy = py + 0.5;
      const w0 = ((Q[1][0] - cx) * (Q[2][1] - cy) - (Q[2][0] - cx) * (Q[1][1] - cy)) / area;
      const w1 = ((Q[2][0] - cx) * (Q[0][1] - cy) - (Q[0][0] - cx) * (Q[2][1] - cy)) / area;
      const w2 = 1 - w0 - w1;
      if (w0 < -1e-9 || w1 < -1e-9 || w2 < -1e-9) continue;
      const d = w0 * Q[0][2] + w1 * Q[1][2] + w2 * Q[2][2], k = py * W + px;
      if (d < zbuf[k] - 1e-9) { zbuf[k] = d; cbuf[k] = ci; }
    }
  }
  const runs = pal.map(() => []);
  for (let py = 0; py < Hh; py++) { let px = 0; while (px < W) { const c = cbuf[py * W + px]; let e = px + 1; while (e < W && cbuf[py * W + e] === c) e++; if (c >= 0) runs[c].push(`M${px} ${py}h${e - px}v1h-${e - px}z`); px = e; } }
  let g = `<g id="geometry" data-view="${viewName}" data-model-id="${massingModelId}" data-raster="${W}x${Hh}" shape-rendering="crispEdges" ${attrs}>`;
  pal.forEach((c, i) => { if (runs[i].length) g += `<path fill="rgb(${c.join(",")})" d="${runs[i].join("")}"/>`; });
  return g + "</g>";
}
const MARKINGS_NOTE = "Markings (windows, stripes, mullions, louvres, datums, labels) are surface annotation, not geometry. Massing omits: " + OMITTED.slice(0, 5).join("; ") + "; …";

// ---------- side elevation ----------
function elevation(side) {
  const W = 2400, Hh = 900, k = 13.2, ox = 120, oy = 700, flip = side === "starboard";
  const X = (x) => (flip ? ox + (LOA - x) * k : ox + x * k), Z = (z) => oy - z * k;
  const f = flip ? [0, 1, 0] : [0, -1, 0]; // port view looks along −y (camera on the port side)
  let b = `<rect x="0" y="${Z(WL)}" width="${W}" height="${Hh - Z(WL)}" fill="#d7e8ec"/>`;
  b += renderGeometry(`${side}-elevation`, W, Hh, f, (p) => [X(p[0]), Z(p[2])], `data-k="${k}" data-ox="${ox}" data-oy="${oy}" data-flip="${flip ? 1 : 0}"`);
  b += `<rect x="0" y="${Z(WL)}" width="${W}" height="${Hh - Z(WL)}" fill="#d7e8ec" fill-opacity="0.55"/>`;
  let m = `<g id="markings">`;
  m += line(X(sternX(H.bootTopLineZ)), Z(H.bootTopLineZ), X(stemX(H.bootTopLineZ)), Z(H.bootTopLineZ), C.seaGlass, 3);
  { const pts = []; for (let x = 30; x <= 128; x += 2) pts.push(`${X(x).toFixed(1)},${Z(sheer(x) - 0.3).toFixed(1)}`); m += `<polyline points="${pts.join(" ")}" fill="none" stroke="${C.seaGlass}" stroke-width="3"/>`; }
  for (const r of H.windowRows) {
    const from = r.deck === 3 ? 30 : 24, to = r.deck === 3 ? 132 : 124, step = r.deck === 3 ? 7.5 : 3.2, hgt = r.deck === 3 ? 0.45 : 0.8, wdt = r.deck === 3 ? 0.45 : 0.7;
    for (let x = from; x <= to; x += step) if (r.z + hgt < sheer(x) - 0.1 && x > sternX(r.z) + 1 && x + wdt < stemX(r.z) - 2) m += `<rect x="${Math.min(X(x), X(x + wdt))}" y="${Z(r.z + hgt)}" width="${wdt * k}" height="${hgt * k}" fill="#2c4566" stroke="#7f95ad" stroke-width="0.6"/>`;
  }
  for (const g of S.glazingBands) for (let x = g.fromX + 1.15; x < g.toX; x += 1.15) m += line(X(x), Z(deckZ[g.deck] + S.glazingPanel.toDeck), X(x), Z(deckZ[g.deck] + S.glazingPanel.fromDeck), "#3a4b55", 0.5);
  const F = S.funnel, top8 = deckZ[8] + DH - 0.05;
  for (let i = 0; i < 6; i++) { const z = top8 + F.casingBase.height + 1 + i * 0.9; m += line(X(F.x + F.topRake.aft * ((z - top8) / (F.topZ - 1.2 - top8)) + 0.6), Z(z), X(F.x + F.length - F.topRake.fore * ((z - top8) / (F.topZ - 1.2 - top8)) - 0.6), Z(z), "#33465e", 0.8); }
  for (const L of S.levels) if (L.terrace && L.terraceAftX < L.aftWallX) m += text(X((L.terraceAftX + L.aftWallX) / 2) - 8, Z(deckZ[L.deck] + 0.6), L.terrace, 11, "#5a5246");
  m += text(X((T1.aftX + T1.wallX) / 2) - 8, Z(T1.deckZ + 0.4), "T1", 11, "#c9d6d9");
  for (const d of V.decks) { m += line(30, Z(d.z), 100, Z(d.z), "#9aa8ad", 0.6, 'stroke-dasharray="4 3"') + text(16, Z(d.z) - 3, `D${d.deck} ${d.name}`, 10, "#4b5d63"); }
  m += text(X(LOA) + (flip ? -110 : 8), Z(WL) - 4, "DWL z 5.4", 11, "#0d5c78");
  m += line(X(0), Z(-1.8), X(LOA), Z(-1.8), "#0d2f43", 1) + text((X(0) + X(LOA)) / 2 - 60, Z(-1.8) + 18, `LOA ${LOA} m (proposed)`, 13);
  const ax = X(S.mast.x) + (flip ? -40 : 40);
  m += line(ax, Z(WL), ax, Z(S.mast.topZ), "#0d2f43", 1) + line(ax - 6, Z(S.mast.topZ), ax + 6, Z(S.mast.topZ), "#0d2f43") + line(ax - 6, Z(WL), ax + 6, Z(WL), "#0d2f43");
  m += text(ax + (flip ? -330 : 8), Z((WL + S.mast.topZ) / 2), `air draft ${P.airDraft.aboveDWL} m above DWL (mast top z ${S.mast.topZ} m above baseline)`, 11, "#0d2f43");
  m += text(W - 620, 60, `${side.toUpperCase()} ELEVATION${flip ? " (MIRROR OF PORT; starboard unseen in A-02)" : " (matches A-02 visible side)"}`, 16, "#0d2f43", 'font-weight="700"');
  m += text(40, 840, MARKINGS_NOTE, 11, "#4b5d63") + "</g>";
  return sheet({ title: `${side} elevation`, sub: `bow ${flip ? "left" : "right"}; projection of the canonical model`, w: W, h: Hh + 40, body: b + m, scaleNote: "1 m = 13.2 px" });
}
// ---------- transverse views ----------
function transverse(view) {
  const W = 1200, Hh = 900, k = 18, cx = W / 2, oy = 790, bow = view === "bow";
  const Y = (y) => (bow ? cx + y * k : cx - y * k), Z = (z) => oy - z * k;
  let b = `<rect x="0" y="${Z(WL)}" width="${W}" height="${Hh}" fill="#d7e8ec"/>`;
  b += renderGeometry(`${view}-view`, W, Hh, bow ? [-1, 0, 0] : [1, 0, 0], (p) => [Y(p[1]), Z(p[2])], `data-k="${k}" data-cx="${cx}" data-oy="${oy}" data-mirror="${bow ? 0 : 1}"`);
  b += `<rect x="0" y="${Z(WL)}" width="${W}" height="${Hh}" fill="#d7e8ec" fill-opacity="0.55"/>`;
  let m = `<g id="markings">` + line(Y(-B2), Z(-1.5), Y(B2), Z(-1.5), "#0d2f43") + text(cx - 50, Z(-1.5) + 18, `Beam ${P.beam} m`, 13);
  m += text(30, 50, `${view.toUpperCase()} VIEW (${bow ? "looking aft; port on the right" : "looking forward; port on the left"}): not visible in A-02; proposal for approval`, 15, "#0d2f43", 'font-weight="700"');
  m += text(30, 74, "Orthographic projection of the canonical model (same triangles as the GLB).", 12, "#4b5d63") + "</g>";
  return sheet({ title: `${view} view`, sub: "transverse projection", w: W, h: Hh, body: b + m, scaleNote: "1 m = 18 px" });
}
// ---------- plan (top projection) ----------
function planSheet() {
  const W = 2400, Hh = 760, k = 13.2, ox = 120, cy = 360;
  const X = (x) => ox + x * k, Y = (y) => cy - y * k;
  let b = renderGeometry("plan", W, Hh, [0, 0, -1], (p) => [X(p[0]), Y(p[1])], `data-k="${k}" data-ox="${ox}" data-cy="${cy}"`, { tint: "height" });
  let m = `<g id="markings">`;
  for (const L of S.levels) m += text(X(L.aftWallX) + 4, Y(levelWall(L.deck, L.aftWallX + 2)) + 14, `D${L.deck}`, 10, "#5a5246");
  m += text(40, 46, "PLAN (TOP): orthographic projection of the canonical model; terraces aft; D9 open sun deck with radome mast house", 16, "#0d2f43", 'font-weight="700"');
  m += text(40, 70, "Port is up (+y). Same triangles as the GLB and every elevation.", 12, "#4b5d63") + "</g>";
  return sheet({ title: "plan view", sub: "top down, bow right", w: W, h: Hh, body: b + m, scaleNote: "1 m = 13.2 px" });
}
// ---------- three-quarter review view ----------
const CAMERA = {
  name: "review-3q-port-aft", purpose: "design review only; NOT the production film camera", projection: "orthographic",
  transform: { azimuthDeg: -34, elevationDeg: 16, rollDeg: 0, up: "+z", target: "model bounds centre" },
  framing: { fit: "model bounds", marginPx: 120, topMarginPx: 140 }, crop: { widthPx: 2400, heightPx: 1200 },
};
const cameraId = sha(JSON.stringify(CAMERA));
function threeQuarter() {
  const W = 2400, Hh = 1200, T = CAMERA.transform;
  const az = (T.azimuthDeg * Math.PI) / 180, el = (T.elevationDeg * Math.PI) / 180;
  const f = norm([Math.cos(el) * Math.cos(az), Math.cos(el) * Math.sin(az), -Math.sin(el)]);
  let r = norm(cross(f, [0, 0, 1])); if (r[0] < 0) r = r.map((v) => -v);
  let u = cross(r, f); if (u[2] < 0) u = u.map((v) => -v);
  const proj = (p) => [dot(p, r), -dot(p, u)];
  const pts = ALL_TRIS.flatMap((T2) => T2.t.map(proj));
  const minX = Math.min(...pts.map((p) => p[0])), maxX = Math.max(...pts.map((p) => p[0])), minY = Math.min(...pts.map((p) => p[1])), maxY = Math.max(...pts.map((p) => p[1]));
  const s = Math.min((W - 2 * CAMERA.framing.marginPx) / (maxX - minX), (Hh - 2 * CAMERA.framing.topMarginPx) / (maxY - minY));
  const map = (p) => { const [a, bb] = proj(p); return [CAMERA.framing.marginPx + (a - minX) * s, CAMERA.framing.topMarginPx + (bb - minY) * s]; };
  let b = `<rect width="${W}" height="${Hh}" fill="#e6eef0"/>` + renderGeometry("three-quarter", W, Hh, f, map, `data-camera-id="${cameraId}"`);
  b += `<g id="markings">` + text(40, 56, "THREE-QUARTER MASSING: elevated port-aft, looking toward the bow (A-02 framing family). Same triangles as every elevation, the plan and the GLB.", 17, "#0d2f43", 'font-weight="700"');
  b += text(40, 82, `Review camera ${cameraId.slice(7, 19)} (orthographic, review only, not the production film camera). Z-buffered flat-shaded raster of the canonical triangles.`, 12, "#4b5d63") + "</g>";
  return sheet({ title: "three-quarter massing", sub: CAMERA.name, w: W, h: Hh, body: b, scaleNote: "orthographic" });
}

// =====================================================================================================
// ARRANGEMENT SHEETS (canonical side lines; no hard-coded sampling)
// =====================================================================================================
const FITCOL = (s) => (!s.fits ? "#f2b8a2" : s.num === 7214 ? "#40c7c5" : s.variant ? "#f3dc9f" : "#f7f3ea");
function deckOutline(X, Y, deck, a, f) {
  const xs = stations(a, f, 0.5), pts = xs.map((x) => [X(x), Y(sideLine(deck, x))]);
  return [...pts, ...xs.slice().reverse().map((x) => [X(x), Y(-sideLine(deck, x))])];
}
function cabinPoly(X, Y, s) {
  const xs = stations(s.xFrom, s.xTo, 0.25), sg = s.side === "port" ? 1 : -1, ci = A.corridorHalfWidth;
  return [...xs.map((x) => [X(x), Y(sg * ci)]), ...xs.slice().reverse().map((x) => [X(x), Y(sg * sideLine(s.deck, x))])];
}
function deck7Sheet() {
  const W = 2400, Hh = 800, k = 13.2, ox = 120, cy = 380, L7 = LV[7];
  const X = (x) => ox + x * k, Y = (y) => cy - y * k;
  const hull = []; for (let x = 0; x <= LOA; x += 1) hull.push([X(x), Y(planHalfBreadth(x))]); for (let x = LOA; x >= 0; x -= 1) hull.push([X(x), Y(-planHalfBreadth(x))]);
  let b = poly(hull, "#ece8de", "#0b1a2b", 1);
  b += `<g id="deck7-footprint" data-k="${k}" data-ox="${ox}" data-cy="${cy}" data-from="${L7.aftWallX}" data-to="${L7.foreX}">` + poly(deckOutline(X, Y, 7, L7.aftWallX, L7.foreX), C.superstructure, "#a39c8e") + "</g>";
  b += poly(deckOutline(X, Y, 7, L7.terraceAftX, L7.aftWallX), C.deckTeak, "none", 1, 'fill-opacity="0.55"') + text(X(L7.terraceAftX) + 4, Y(0) + 4, "T4 pool terrace", 11, "#4d3b25");
  b += `<rect x="${X(L7.aftWallX + 2)}" y="${Y(A.corridorHalfWidth)}" width="${(L7.foreX - L7.aftWallX - 10) * k}" height="${2 * A.corridorHalfWidth * k}" fill="#cfc6b4"/>`;
  for (const [a, f2] of A.cores) b += `<rect x="${X(a)}" y="${Y(4)}" width="${(f2 - a) * k}" height="${8 * k}" fill="#b7ae9c"/>` + text(X(a) + 2, Y(-4.6) + 12, a > 110 ? "service core" : "stair/lift core", 9, "#4b4436");
  for (const s of SLOTS.filter((q) => q.deck === 7)) {
    b += poly(cabinPoly(X, Y, s), FITCOL(s), "#a39c8e", 0.8);
    const sg = s.side === "port" ? 1 : -1;
    if (s.num === 7214 || s.num % 100 <= 2 || !s.fits) b += text(X(s.xFrom) + 3, Y(sg * 2.2) + (sg > 0 ? -2 : 10), String(s.num), 9, s.num === 7214 ? "#032029" : "#5b5345", s.num === 7214 ? 'font-weight="700"' : "");
  }
  const n7 = SLOTS.filter((q) => q.deck === 7), f7 = n7.filter((q) => !q.fits).length, cm = cabinModel();
  b += text(40, 46, `DECK 7 'MERIDIAN' ARRANGEMENT: ${n7.length} Premium Balcony slots; highlighted Signature Cabin 7214 (port, x ${cm.location.xFrom}–${cm.location.xTo} m; neighbours ${cm.neighbours.aft} aft, ${cm.neighbours.forward} forward).`, 15, "#0d2f43", 'font-weight="700"');
  b += text(40, 70, `Cabins drawn over their full footprint to the canonical deck 7 side line. Amber = forward tapered balcony (${(A.cabinVariants ?? []).map((v) => `${v.nums.join("/")}, ${v.balconyDepth.toFixed(2)} m`).join("; ")}, D-W02-11); salmon = not fitting (${f7} on this deck). See sheet 10.`, 12, "#4b5d63");
  return sheet({ title: "deck 7 arrangement", sub: "schematic cabin layout", w: W, h: Hh, body: b, scaleNote: "1 m = 13.2 px" });
}
function accommodationSheet() {
  const W = 2400, Hh = 1640, k = 13.2, ox = 120;
  let b = text(40, 46, "ACCOMMODATION VALIDATION: every counted slot checked over its complete footprint against the canonical side line of its deck", 16, "#0d2f43", 'font-weight="700"');
  b += text(40, 70, A.fitRule, 11, "#4b5d63");
  const rep = capacityReport();
  [7, 6, 5, 4].forEach((deck, row) => {
    const cy = 270 + row * 340, X = (x) => ox + x * k, Y = (y) => cy - y * k;
    const [a, f] = deck === 4 ? [T1.wallX, 132] : [LV[deck].aftWallX, LV[deck].foreX];
    b += poly(deckOutline(X, Y, deck, a, f), deck === 4 ? "#dfe5ea" : C.superstructure, "#a39c8e");
    for (const s of SLOTS.filter((q) => q.deck === deck)) { b += poly(cabinPoly(X, Y, s), FITCOL(s), "#a39c8e", 0.7); if (!s.fits) b += text(X(s.xFrom) + 2, Y((s.side === "port" ? 1 : -1) * 5) + 4, `${s.margin.toFixed(2)}`, 9, "#8a2f12"); else if (s.variant) b += text(X(s.xFrom) + 2, Y((s.side === "port" ? 1 : -1) * 5) + 4, `${s.num}: ${s.balconyDepth} m`, 9, "#6b4f12"); }
    const n = SLOTS.filter((q) => q.deck === deck), bad = n.filter((q) => !q.fits);
    b += text(40, cy - 165, `Deck ${deck}: ${n.length} slots · ${n.filter((q) => !q.variant && q.fits).length} standard module · ${n.filter((q) => q.variant).length} forward tapered balcony (D-W02-11) · ${bad.length} not fitting`, 13, "#0d2f43", 'font-weight="700"');
    if (deck === 4) { const lg = deck4Layout().lounge; b += poly(deckOutline(X, Y, 4, lg.xAft, lg.xFwd), "#40c7c5", "#0d5c78", 1, 'fill-opacity="0.6"') + text(X(lg.xAft) + 2, Y(0) + 4, "lounge", 10, "#032029"); }
  });
  b += text(40, Hh - 120, `Total ${rep.slots} slots (${rep.guestsDoubleOccupancy} guests), ${rep.fit} fitting over their full footprint: ${rep.standardModuleFits} standard module + ${rep.taperedVariant.cabins.length} forward tapered balcony (${rep.taperedVariant.cabins.map((c) => c.num).join("/")}: ${rep.taperedVariant.cabins[0]?.balconyDepth} m, ${rep.taperedVariant.cabins[0]?.balconyClearM2} m², D-W02-11); ${rep.failing} not fitting.`, 13, "#0d2f43", 'font-weight="700"');
  return sheet({ title: "accommodation validation", sub: "decks 7, 6, 5, 4 (top to bottom), bow right", w: W, h: Hh, body: b, scaleNote: "1 m = 13.2 px" });
}
function deck4Sheet() {
  const D = deck4Layout(), L = D.lounge, W = 2400, Hh = 1400, k = 13.2, ox = 120, cy = 300;
  const X = (x) => ox + x * k, Y = (y) => cy - y * k;
  const hull = []; for (let x = 0; x <= LOA; x += 1) hull.push([X(x), Y(planHalfBreadth(x))]); for (let x = LOA; x >= 0; x -= 1) hull.push([X(x), Y(-planHalfBreadth(x))]);
  let b = poly(hull, "#ece8de", "#0b1a2b", 1.2) + poly(deckOutline(X, Y, 4, 0, ENCLOSURE_END), "#e9e4d8", "#8d8473", 0.8);
  b += poly(deckOutline(X, Y, 4, T1.aftX, T1.wallX), C.deckTeak, "none", 1, 'fill-opacity="0.55"') + text(X(T1.aftX) + 3, Y(0) + 4, "T1", 11, "#4d3b25");
  b += poly(deckOutline(X, Y, 4, L.xAft, L.xFwd), "#40c7c5", "#0d5c78", 1.5, 'fill-opacity="0.75"') + text(X(L.xAft), Y(planHalfBreadth(L.xAft)) - 10, "ENTERTAINMENT LOUNGE", 11, "#032029", 'font-weight="700"');
  b += `<rect x="${X(D.slots[0].xFrom)}" y="${Y(A.corridorHalfWidth)}" width="${(D.slots.at(-1).xTo - D.slots[0].xFrom) * k}" height="${2 * A.corridorHalfWidth * k}" fill="#cfc6b4"/>`;
  for (const [a, f] of A.cores) b += `<rect x="${X(a)}" y="${Y(4)}" width="${(f - a) * k}" height="${8 * k}" fill="#b7ae9c"/>`;
  for (const s of SLOTS.filter((q) => q.deck === 4)) { b += poly(cabinPoly(X, Y, s), FITCOL(s), "#a39c8e", 0.8); if (s.num % 100 <= 2) b += text(X(s.xFrom) + 3, Y((s.side === "port" ? 1 : -1) * 2.2) + 4, String(s.num), 9, "#7c7466"); }
  b += text(40, 40, `DECK 4 'OCEANVIEW': ${D.slots.length} oceanview staterooms + boutique entertainment lounge aft (D-W02-7). No staterooms displaced.`, 15, "#0d2f43", 'font-weight="700"');
  b += text(40, 62, `Side line = hull at deck 4 (z ${deckZ[4]}) − ${A.deck4.hullLining} m lining. Lounge = space between the terrace T1 glazed wall and the first stateroom slot. Theatre and kids' splash zone removed.`, 12, "#4b5d63");
  const k2 = 24, ox2 = 200, cy2 = 800, X2 = (x) => ox2 + (x - L.xAft) * k2, Y2 = (y) => cy2 - y * k2;
  b += poly(deckOutline(X2, Y2, 4, L.xAft, L.xFwd), "#f6f1e6", "#6f6758", 3);
  b += text(ox2, Y2(D.w(L.xFwd)) - 30, `ENLARGED: entertainment lounge (deck 4 aft) · x ${L.xAft}–${L.xFwd} m · 1 m = ${k2} px`, 15, "#0d2f43", 'font-weight="700"');
  b += `<rect x="${X2(L.xAft) - 6}" y="${Y2(D.w(L.xAft))}" width="6" height="${2 * D.w(L.xAft) * k2}" fill="#7fb7c8"/>` + text(X2(L.xAft) - 140, Y2(0) - 8, "glazed aft wall", 12, "#24525f") + text(X2(L.xAft) - 140, Y2(0) + 8, "→ terrace T1", 12, "#24525f");
  const bb = D.barBand, hwF = D.w(bb.xAft), rect2 = (x0, x1, hw, fill, stroke = "#8d8473", extra = "") => `<rect x="${X2(x0)}" y="${Y2(hw)}" width="${(x1 - x0) * k2}" height="${2 * hw * k2}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
  b += rect2(bb.xAft, bb.xFwd, hwF, "#d9c4a0") + text(X2(bb.xFwd) + 12, Y2(hwF) + 22, "BAR + BACK-OF-HOUSE (3.0 m band)", 13, "#4d3b25", 'font-weight="700"') + text(X2(bb.xFwd) + 12, Y2(hwF) + 40, "acoustic buffer to the staterooms forward; entry from the deck 4 corridor on the centreline", 11, "#5b4a33");
  b += `<rect x="${X2(bb.xAft)}" y="${Y2(0.9)}" width="${(bb.xFwd - bb.xAft) * k2}" height="${1.8 * k2}" fill="#cfc6b4"/>` + text(X2(bb.xAft) + 4, Y2(0) + 4, "entry", 11, "#4b4436");
  b += rect2(D.apron.xAft, D.apron.xFwd, D.apron.halfWidth, "none", "#9a8f7c", 'stroke-dasharray="5 4"') + rect2(D.stage.xAft, D.stage.xFwd, D.stage.halfWidth, "#c9a77d") + text(X2(D.stage.xAft) + 4, Y2(0) + 5, "STAGE", 12, "#3d3529", 'font-weight="700"');
  b += text(X2(D.apron.xFwd) + 14, Y2(6.5), "LOUNGE SEATING", 15, "#3d3529", 'font-weight="700"') + text(X2(D.apron.xFwd) + 14, Y2(6.5) + 18, "conversational groups", 12, "#5b5345") + text(X2(D.apron.xFwd) + 14, Y2(6.5) + 34, `≈ ${L.seatedTarget} seated (design target)`, 12, "#5b5345");
  const mx = 1500; let my = 760;
  const rows = [["Gross floor", `${L.grossM2} m²`], ["Length × width", `${L.lengthM} m × ${L.widthAftM}–${L.widthFwdM} m`], ["Bar + back-of-house", `${L.barAndBackOfHouseM2} m²`], ["Performance platform", `${L.stageM2} m²`], ["Net seating area", `${L.seatingNetM2} m²`], ["Seated target", `≈ ${L.seatedTarget} guests`], ["Staterooms displaced", "0 (capacity unchanged)"]];
  b += text(mx, my, "LOUNGE METRICS (computed)", 15, "#0d2f43", 'font-weight="700"'); my += 26;
  for (const [a, v] of rows) { b += text(mx, my, a, 13, "#4b5d63") + text(mx + 230, my, v, 13, "#0d2f43", 'font-weight="700"'); my += 22; }
  my += 14; for (const s of ["Not engineered or certified: acoustic separation, fire/escape", "(second escape via terrace T1 assumed) and occupancy need", "naval-architect review before any real-world claim."]) { b += text(mx, my, s, 12, "#9a5b2b"); my += 18; }
  return sheet({ title: "deck 4 arrangement + entertainment lounge", sub: "schematic, bow right", w: W, h: Hh, body: b, scaleNote: "plan 1 m = 13.2 px; enlargement 1 m = 24 px" });
}
function cabinSheet() {
  const M = cabinModel(), k = 96, ox = 170, oy = 150;
  const X = (u) => ox + u * k, Y = (w) => oy + w * k;
  const R = (o, fill, stroke = "#8d8473", sw = 1, extra = "") => `<rect x="${X(o.u0)}" y="${Y(o.w0)}" width="${(o.u1 - o.u0) * k}" height="${(o.w1 - o.w0) * k}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
  const E = M.E, Lay = M.Lay, I = Object.fromEntries(M.items.map((o) => [o.id, o]));
  let b = "";
  b += `<rect x="${X(-0.4)}" y="${Y(-1.1)}" width="${(E.moduleWidth + 0.8) * k}" height="${0.98 * k}" fill="#d8d0c0"/>` + text(X(0.1), Y(-0.5), "CORRIDOR (inboard)", 14, "#5b5345");
  b += `<rect x="${X(M.U0)}" y="${Y(0)}" width="${(M.U1 - M.U0) * k}" height="${M.WG0 * k}" fill="#f6f1e6"/>`;
  b += `<rect x="${X(M.U0)}" y="${Y(M.WG1)}" width="${(M.U1 - M.U0) * k}" height="${(M.WBAL - M.WG1) * k}" fill="#c9a77d" fill-opacity="0.45"/>`;
  b += `<rect x="${X(-0.4)}" y="${Y(M.WBAL + 0.05)}" width="${(E.moduleWidth + 0.8) * k}" height="${0.8 * k}" fill="#d7e8ec"/>` + text(X(0.1), Y(M.WBAL + 0.5), "SEA (port side, outboard)", 14, "#0d5c78");
  for (const o of M.frame) if (o.id.includes("Bulkhead") || o.id.startsWith("corridor")) b += R({ ...o, u0: Math.max(o.u0, -0.05), u1: Math.min(o.u1, E.moduleWidth + 0.05), w1: Math.min(o.w1, M.WBAL + 0.05) }, "#6f6758", "none");
  for (const o of M.partitions) b += R(o, "#6f6758", "none");
  // entry door swing + leaf
  const ed = Lay.entryDoor;
  b += `<path d="M ${X(ed.hingeU + ed.leaf)} ${Y(0)} A ${ed.leaf * k} ${ed.leaf * k} 0 0 1 ${X(ed.hingeU)} ${Y(ed.leaf)}" fill="none" stroke="#8d8473" stroke-dasharray="4 3"/>` + line(X(ed.hingeU), Y(0), X(ed.hingeU), Y(ed.leaf), "#5b5345", 3);
  b += text(X(ed.u0) + 4, Y(-0.18), `entry door ${(ed.u1 - ed.u0).toFixed(2)} m clear`, 11, "#3d3529");
  const bd = Lay.bathroomDoor;
  b += line(X(bd.wallU0 + 0.04), Y(bd.pocketW0), X(bd.wallU0 + 0.04), Y(bd.pocketW1), "#c9a77d", 2, 'stroke-dasharray="3 2"') + text(X(bd.wallU1) + 4, Y((bd.w0 + bd.w1) / 2), "pocket door", 10, "#7c7466");
  b += R(I.shower, "#d3e3e8", "#8aa7b0") + text(X(0.15), Y(0.5), "shower", 11, "#4b5d63");
  b += R(I.vanity, "#ffffff", "#8aa7b0") + text(X(1.55), Y(0.33), "vanity", 11, "#4b5d63");
  b += R(I.wc, "#ffffff", "#8aa7b0") + text(X(0.12), Y(1.7), "WC", 11, "#4b5d63");
  b += text(X(0.9), Y(1.35), "BATHROOM", 14, "#33424a", 'font-weight="700"');
  b += R(I.wardrobe, "#d9c4a0", "#8d8473", 1.5) + text(X(3.9), Y(0.9), "WARDROBE", 11, "#4d3b25", 'font-weight="700"') + text(X(3.9), Y(1.1), "sliding doors", 9, "#5b4a33");
  b += R(I.bed, "#ffffff", "#8d8473", 1.5) + R({ ...I.bed, w1: I.bed.w0 + 0.08 }, "#c4a273", "none");
  b += text(X(I.bed.u0 + 0.45), Y(I.bed.w0 + 1.1), "KING BED", 14, "#3d3529", 'font-weight="700"') + text(X(I.bed.u0 + 0.45), Y(I.bed.w0 + 1.35), "1.93 × 2.03 m, facing the sea", 11, "#5b5345");
  for (const id of ["nightstandAft", "nightstandFwd", "coffeeTable", "desk", "balconyTable"]) b += R(I[id], "#d9c4a0");
  for (const id of ["sofa", "armchair", "deskStool", "balconyChairAft", "balconyChairFwd"]) b += R(I[id], "#e6ddd0");
  b += text(X(1.4), Y(4.95), "LIVING AREA", 14, "#3d3529", 'font-weight="700"') + text(X(0.08), Y(5.0), "sofa", 10, "#3d3529") + text(X(3.58), Y(6.95), "armchair", 10, "#3d3529") + text(X(4.08), Y(4.55), "desk", 10, "#4d3b25");
  for (let i = 0; i < 4; i++) b += `<rect x="${X(i * 1.15) + 2}" y="${Y(M.WG0)}" width="${1.15 * k - 4}" height="${0.1 * k}" fill="${i === 1 || i === 2 ? "#a9d3df" : "#7fb7c8"}" stroke="#3a6878"/>`;
  b += text(X(0.1), Y(M.WG1 + 0.3), `4 × 1.15 m sliding glass panels; doorway u ${Lay.balconyDoorway.u0}–${Lay.balconyDoorway.u1} m`, 12, "#24525f");
  b += `<rect x="${X(M.U0)}" y="${Y(M.WBAL)}" width="${(M.U1 - M.U0) * k}" height="${0.05 * k}" fill="#9ccbd8"/>` + text(X(3.3), Y(M.WBAL - 0.12), "glass balustrade", 11, "#24525f");
  b += text(X(2.45), Y(7.75), "PRIVATE BALCONY", 14, "#4d3b25", 'font-weight="700"');
  // measured route bottlenecks
  for (const r of M.routes) if (r.at) b += `<circle cx="${X(r.at[0])}" cy="${Y(r.at[1])}" r="4" fill="${r.ok ? "#2a8f6a" : "#c0392b"}"/>`;
  for (const vp of M.viewpoints) {
    const ang = Math.atan2(Y(vp.lookW) - Y(vp.w), X(vp.lookU) - X(vp.u)), len = 0.55 * k;
    b += `<circle cx="${X(vp.u)}" cy="${Y(vp.w)}" r="9" fill="#40c7c5" stroke="#032029"/>` + line(X(vp.u), Y(vp.w), X(vp.u) + Math.cos(ang) * len, Y(vp.w) + Math.sin(ang) * len, "#032029", 2.5);
    b += text(X(vp.u) + 12, Y(vp.w) + (vp.id.startsWith("V4") || vp.id.startsWith("V6") ? 20 : -10), vp.id.split("-")[0], 11, "#032029", 'font-weight="700"');
  }
  b += line(X(0), Y(-1.3), X(E.moduleWidth), Y(-1.3), "#0d2f43") + text(X(1.6), Y(-1.4), `${E.moduleWidth} m module`, 12);
  b += line(X(-0.3), Y(0), X(-0.3), Y(E.interiorDepth), "#0d2f43") + text(X(-1.6), Y(3.6), `${E.interiorDepth} m interior`, 12) + line(X(-0.3), Y(E.interiorDepth), X(-0.3), Y(E.interiorDepth + E.balconyDepth), "#0d2f43") + text(X(-1.6), Y(8.3), `${E.balconyDepth} m balcony`, 12);
  const m = M.metrics, px = X(E.moduleWidth) + 130, rows = [
    ["Gross module (to centrelines)", `${m.grossModuleM2} m² (≈${Math.round(m.grossModuleM2 * 10.764)} sq ft)`],
    ["Interior floor (inside bulkheads)", `${m.interiorFloorM2} m²`],
    ["Net floor (− partitions)", `${m.netFloorM2} m²`],
    ["Bathroom internal", `${m.bathroomInternalM2} m²`],
    ["Room excl. bath + wardrobe", `${m.roomExclBathAndWardrobeM2} m²`],
    ["Balcony clear", `${m.balconyClearM2} m² (${m.balconyClearDepth} m deep)`],
    ["Primary route bottleneck", `${m.primaryRouteBottleneck} m (target ${V.cabin7214.designTargets.primaryRouteMinWidth})`],
    ["Secondary access bottleneck", `${m.secondaryAccessBottleneck} m (target ${V.cabin7214.designTargets.secondaryAccessMinWidth})`],
    ["Entry door swing / entry zone", `${M.swingHits.length ? "HITS " + M.swingHits.join(", ") : "clear"} / ${M.entryZoneHits.length ? "HITS " + M.entryZoneHits.join(", ") : "clear"}`],
    [`Hull fit at x ${M.location.xFrom}–${M.location.xTo} m`, `${m.hullFit.requiredFromCorridorEdge} of ${m.hullFit.availableFromCorridorEdge} m (margin ${m.hullFit.margin} m)`],
  ];
  b += text(px, Y(-0.9), "CABIN 7214 · Premium Balcony Stateroom · Deck 7 port", 20, "#0d2f43", 'font-weight="700"');
  b += text(px, Y(-0.55), `x ${M.location.xFrom}–${M.location.xTo} m, zone ${M.location.zone}; neighbours ${M.neighbours.aft} (aft) and ${M.neighbours.forward} (forward); formerly 9214 (D-W02-1)`, 13, "#4b5d63");
  rows.forEach(([kk, vv], i) => { b += text(px, Y(0.1) + i * 32, kk, 13, "#4b5d63") + text(px + 300, Y(0.1) + i * 32, vv, 13, "#0d2f43", 'font-weight="700"'); });
  let yy = Y(3.6);
  b += text(px, yy, "Measured on a 0.01 m grid (exact distance transform, widest path from the corridor). Dots = each route's bottleneck.", 12, "#4b5d63"); yy += 22;
  for (const r of M.routes) { b += text(px, yy, `${r.kind === "primary" ? "▶" : "·"} ${r.id}: ${r.bottleneck} m ${r.ok ? "✓" : "✗"}`, 12, r.ok ? "#2a6f50" : "#c0392b"); yy += 18; }
  yy += 8; b += text(px, yy, "Viewpoints (eye 1.6 m): clearance tall / any, sight line", 12, "#0d2f43", 'font-weight="700"'); yy += 20;
  for (const vp of M.viewpoints) { b += text(px, yy, `${vp.id}: ${vp.clearanceTall} / ${vp.clearanceAny} m, ${vp.sightlineBlockedBy.length ? "blocked by " + vp.sightlineBlockedBy.join(",") : "clear"} ${vp.ok ? "✓" : "✗"}`, 12, vp.ok ? "#2a6f50" : "#c0392b"); yy += 18; }
  yy += 10; b += text(px, yy, "Fictional design targets only; not certified accessibility or maritime-safety values. WP-03 builds V1–V6 from this plan.", 12, "#9a5b2b");
  return sheet({ title: "Cabin 7214 floor plan", sub: "plan, corridor top / sea bottom, aft left", w: 1750, h: 1260, body: b, scaleNote: "1 m = 96 px" });
}

// =====================================================================================================
// GLB (one mesh per solid; indexed; flat normals) + massing identity
// =====================================================================================================
function glb() {
  const meshes = [], accessors = [], views = [], chunks = [], materials = [], matIdx = {}, idParts = [];
  let offset = 0;
  const push = (arr, target) => { const buf = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); views.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, target }); chunks.push(buf); offset += buf.length; while (offset % 4) { chunks.push(Buffer.alloc(1)); offset++; } return views.length - 1; };
  for (const s of SOLIDS) {
    if (!(s.mat in matIdx)) { const rgb = [1, 3, 5].map((i) => Math.pow(parseInt(MATCOL[s.mat].slice(i, i + 2), 16) / 255, 2.2)); matIdx[s.mat] = materials.length; materials.push({ name: s.mat, pbrMetallicRoughness: { baseColorFactor: [...rgb, 1], metallicFactor: 0, roughnessFactor: s.mat === "glazing" ? 0.08 : 0.55 } }); }
    const pos = new Float32Array(s.tris.length * 9), nor = new Float32Array(s.tris.length * 9), idx = new Uint32Array(s.tris.length * 3);
    s.tris.forEach((t, i) => {
      const v = t.map(([x, y, z]) => [x, z, -y]); // glTF is Y-up: (x, y, z) -> (x, z, -y)
      const n = triNormal(v);
      v.forEach((p, j) => { pos.set(p, i * 9 + j * 3); nor.set(n, i * 9 + j * 3); idx[i * 3 + j] = i * 3 + j; });
    });
    idParts.push([s.name, s.mat, Array.from(pos, (c) => Math.round(c * 1000))]);
    const mn = [0, 1, 2].map((a) => { let m = Infinity; for (let i = a; i < pos.length; i += 3) m = Math.min(m, pos[i]); return m; });
    const mx = [0, 1, 2].map((a) => { let m = -Infinity; for (let i = a; i < pos.length; i += 3) m = Math.max(m, pos[i]); return m; });
    const iv = push(idx, 34963), pv = push(pos, 34962), nv = push(nor, 34962);
    accessors.push({ bufferView: iv, componentType: 5125, count: idx.length, type: "SCALAR" }, { bufferView: pv, componentType: 5126, count: pos.length / 3, type: "VEC3", min: mn, max: mx }, { bufferView: nv, componentType: 5126, count: nor.length / 3, type: "VEC3" });
    const a0 = accessors.length - 3;
    meshes.push({ name: s.name, extras: { role: s.role }, primitives: [{ indices: a0, attributes: { POSITION: a0 + 1, NORMAL: a0 + 2 }, material: matIdx[s.mat] }] });
  }
  massingModelId = sha(JSON.stringify(idParts));
  const bin = Buffer.concat(chunks);
  const gltf = { asset: { version: "2.0", generator: "ShoreMigo WP-02 canonical massing generator", extras: { specId, generatorId, massingModelId, fictional: true, status: V.status, omitted: OMITTED } }, scene: 0, scenes: [{ nodes: meshes.map((_, i) => i) }], nodes: meshes.map((m, i) => ({ mesh: i, name: m.name })), meshes, materials, accessors, bufferViews: views, buffers: [{ byteLength: bin.length }] };
  let json = Buffer.from(JSON.stringify(gltf)); while (json.length % 4) json = Buffer.concat([json, Buffer.from(" ")]);
  const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(json.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jh, json, bh, bin]);
}

// =====================================================================================================
// WRITE
// =====================================================================================================
const model = glb(); // first: assigns massingModelId, which every sheet footer and geometry group carries
fs.writeFileSync(out("model/aurora-tide-massing.glb"), model);
const files = {
  "sheets/01-port-elevation.svg": elevation("port"),
  "sheets/02-starboard-elevation.svg": elevation("starboard"),
  "sheets/03-bow.svg": transverse("bow"),
  "sheets/04-stern.svg": transverse("stern"),
  "sheets/05-plan.svg": planSheet(),
  "sheets/06-deck7-arrangement.svg": deck7Sheet(),
  "sheets/07-three-quarter-massing.svg": threeQuarter(),
  "sheets/08-cabin-7214-plan.svg": cabinSheet(),
  "sheets/09-deck4-lounge.svg": deck4Sheet(),
  "sheets/10-accommodation-validation.svg": accommodationSheet(),
};
const cm = cabinModel(), cap = capacityReport();
const manifest = {
  specId, generatorId, massingModelId, cameraId, reviewCamera: CAMERA, specVersion: V.version, status: V.status, generatedFrom: "design/aurora-tide/vessel.json",
  identity: {
    specId: "sha256 of vessel.json content (key order as authored, whitespace-insensitive)",
    generatorId: "sha256 of generate.mjs with line endings normalised to LF",
    massingModelId: "sha256 of [solid name, material, GLB float32 positions rounded to 1 mm] for every solid in GLB order; recomputable from the GLB alone",
    cameraId: "sha256 of the review camera (projection, transform, framing, crop); review only",
    productionIdentityContract: "A future production model id must bind: the approved specId and massingModelId it was built to, the production mesh/scene file hashes, every source asset in the bill of materials (licence + sha256), and the production film camera identity (intrinsics, extrinsics, sensor/crop and object-fit masks per WP-01). Review-camera identity is not the production camera identity.",
  },
  canonicalModel: { representation: "closed triangle solids built once in generate.mjs from vessel.json; the GLB, overlay faces and sheets 01–05, 07 are views of the same triangles; sheets 06, 08–10 use the same side-line functions", solids: SOLIDS.map((s) => ({ name: s.name, material: s.mat, role: s.role, triangles: s.tris.length })), intentionallyOmitted: OMITTED, enclosureEndX: ENCLOSURE_END },
  datums: { baseline: "z 0 (keel)", designWaterlineZ: WL, modelledFromZ: ZB, mastTopZ: S.mast.topZ, airDraftAboveDWL: r3(S.mast.topZ - WL), stemAtDWL_X: r3(stemX(WL)), stemTopX: H.bowRakeTopX, transomAtDWL_X: r3(sternX(WL)), terraceT1: { deckZ: T1.deckZ, x: [T1.aftX, T1.wallX] } },
  files: {},
  capacity: cap,
  slots: SLOTS,
  cabin7214: { location: cm.location, neighbours: cm.neighbours, metrics: cm.metrics, routes: cm.routes.map(({ path: _p, ...r }) => r), doors: { entrySwingHits: cm.swingHits, entryZoneHits: cm.entryZoneHits, bathroomPocketInWall: cm.pocketInWall }, viewpoints: cm.viewpoints },
  entertainmentLounge: deck4Layout().lounge,
  note: "Hashes identify this proposal revision. The approved specId/massingModelId pair is frozen only after the P1 defects are independently re-reviewed and the owner approves (vessel.json 1.0.0).",
};
manifest.files["model/aurora-tide-massing.glb"] = sha(model);
for (const [rel, content] of Object.entries(files)) { fs.writeFileSync(out(rel), content); manifest.files[rel] = sha(content); }
fs.writeFileSync(out("manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ specId: specId.slice(0, 19), massingModelId: massingModelId.slice(0, 19), solids: SOLIDS.length, tris: ALL_TRIS.length, glbBytes: model.length, slots: cap.slots, fail: cap.failing, variants: cap.taperedVariant.cabins.length, cabin: { net: cm.metrics.netFloorM2, prim: cm.metrics.primaryRouteBottleneck, sec: cm.metrics.secondaryAccessBottleneck } }));

if (process.env.WP02_FACES_OUT) { // overlay input: exactly the GLB triangles
  const faces = ALL_TRIS.map((T) => ({ name: T.name, mat: T.mat, v: T.t }));
  fs.writeFileSync(process.env.WP02_FACES_OUT, JSON.stringify({ specId, massingModelId, faces }));
  console.log("faces exported:", faces.length);
}
