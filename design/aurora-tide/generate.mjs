// Aurora Tide canonical design-control generator (WP-02).
// Zero dependencies. Reads vessel.json and derives EVERY view from that one geometry,
// so elevations, plan, bow/stern, three-quarter view and the GLB massing model cannot disagree.
// Output is a technical design reference (massing + arrangement), NOT a photoreal render.
//
//   node design/aurora-tide/generate.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const specRaw = fs.readFileSync(path.join(here, "vessel.json"), "utf8");
const V = JSON.parse(specRaw);
const out = (p) => path.join(here, p);
fs.mkdirSync(out("sheets"), { recursive: true });
fs.mkdirSync(out("model"), { recursive: true });

const sha = (buf) => "sha256:" + crypto.createHash("sha256").update(buf).digest("hex");
// Identity (D-W02-9): three distinct hashes.
// specId: the canonical specification (vessel.json content; key order as authored, whitespace-insensitive).
const specId = sha(JSON.stringify(V));
// generatorId: this generator's source, line endings normalised so Windows and Linux checkouts agree.
const generatorId = sha(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/\r\n/g, "\n"));
// massingModelId: the produced massing geometry itself (assigned once the prisms exist). It changes whenever the
// generated geometry changes, even when a generator change leaves specId untouched.
let massingModelId = "pending";

const P = V.principal, H = V.hull, S = V.superstructure, C = V.identity.palette;
const B2 = P.beam / 2;
const deckZ = Object.fromEntries(V.decks.map((d) => [d.deck, d.z]));
const DH = 2.9; // deck height (proposal)
const top = (d) => deckZ[d] + DH;

// ---------- hull plan & profile functions ----------
function halfBreadth(x) {
  const [m0, m1] = H.parallelMidbody;
  if (x <= m0) return B2 * (H.transomWidthFactor + (1 - H.transomWidthFactor) * Math.sin((x / m0) * Math.PI / 2));
  if (x <= m1) return B2;
  const t = Math.min(1, (x - m1) / (P.lengthOverall - m1));
  return B2 * Math.max(0, 1 - Math.pow(t, 1.7));
}
const SHEER = [[0, 11.0], [30, 12.6], [100, 12.9], [130, 14.3], [P.lengthOverall, H.bowSheerTopZ]];
function sheer(x) {
  for (let i = 1; i < SHEER.length; i++) {
    const [x0, z0] = SHEER[i - 1], [x1, z1] = SHEER[i];
    if (x <= x1) return z0 + ((x - x0) / (x1 - x0)) * (z1 - z0);
  }
  return SHEER.at(-1)[1];
}
const bowX = (z) => H.bowRakeWaterlineX + ((z - P.waterlineZ) / (H.bowSheerTopZ - P.waterlineZ)) * (H.bowRakeTopX - H.bowRakeWaterlineX);

// ---------- SVG helpers ----------
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
const poly = (pts, fill, stroke = "none", sw = 1, extra = "") =>
  `<polygon points="${pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
const line = (x1, y1, x2, y2, stroke, sw = 1, extra = "") => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
const text = (x, y, s, size = 12, fill = "#0d2f43", extra = "") => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" fill="${fill}" ${extra}>${esc(s)}</text>`;

// ---------- side elevation (port or starboard) ----------
function elevation(side) {
  const W = 2400, Hh = 900, k = 13.2, ox = 120, oy = 700; // 13.2 px per metre
  const flip = side === "starboard";
  const X = (x) => (flip ? ox + (P.lengthOverall - x) * k : ox + x * k);
  const Z = (z) => oy - z * k;
  let b = "";
  // water
  b += `<rect x="0" y="${Z(P.waterlineZ)}" width="${W}" height="${Hh - Z(P.waterlineZ)}" fill="#d7e8ec"/>`;
  // hull above baseline (full profile drawn, below-water part lighter)
  const hullPts = [];
  for (let x = 0; x <= H.bowRakeTopX; x += 2) hullPts.push([X(Math.min(x, P.lengthOverall)), Z(sheer(x))]);
  hullPts.push([X(H.bowRakeTopX), Z(H.bowSheerTopZ)], [X(bowX(P.waterlineZ)), Z(P.waterlineZ)], [X(146), Z(0.6)], [X(8), Z(0)], [X(H.sternRakeWaterlineX), Z(P.waterlineZ)], [X(0), Z(sheer(0))]);
  b += poly(hullPts, C.hull, "#0b1a2b", 1.5);
  b += `<rect x="0" y="${Z(P.waterlineZ)}" width="${W}" height="${Hh - Z(P.waterlineZ)}" fill="#d7e8ec" fill-opacity="0.62"/>`;
  b += line(X(H.sternRakeWaterlineX), Z(H.bootTopLineZ), X(bowX(H.bootTopLineZ)), Z(H.bootTopLineZ), C.seaGlass, 3);
  b += line(X(30), Z(H.seaGlassSheerStripeZ), X(128), Z(H.seaGlassSheerStripeZ + 0.3), C.seaGlass, 3);
  // hull windows
  for (const r of H.windowRows) {
    const from = r.deck === 3 ? 30 : 20, to = r.deck === 3 ? 140 : 132, step = r.deck === 3 ? 7.5 : 3.2;
    for (let x = from; x <= to; x += step) b += `<rect x="${X(x) - (flip ? 9 : 0)}" y="${Z(r.z + 0.7)}" width="${r.deck === 3 ? 6 : 9}" height="${r.deck === 3 ? 6 : 11}" fill="#2c4566" stroke="#7f95ad" stroke-width="0.6"/>`;
  }
  // T1 aft terrace on deck 4
  b += poly([[X(S.aftTerraceT1.aftX), Z(deckZ[4] + 1.1)], [X(S.aftTerraceT1.wallX), Z(deckZ[4] + 1.1)], [X(S.aftTerraceT1.wallX), Z(deckZ[4])], [X(S.aftTerraceT1.aftX), Z(deckZ[4])]], "none", "#7a6a55", 1, 'stroke-dasharray="3 2"');
  // entertainment-lounge glazing: only over the lounge's own extent and below the deck 5 floor
  { const lg = deck4Layout().lounge; b += `<rect x="${Math.min(X(lg.xAft), X(lg.xFwd))}" y="${Z(deckZ[4] + 2.7)}" width="${Math.abs(X(lg.xFwd) - X(lg.xAft))}" height="${1.2 * k}" fill="${C.glazing}"/>`; }
  // superstructure levels
  for (const L of S.levels) {
    const z0 = deckZ[L.deck], z1 = z0 + DH;
    const a = L.aftWallX, f = L.foreX;
    b += poly([[X(a + 1.2), Z(z1)], [X(f - 1.6), Z(z1)], [X(f), Z(z0)], [X(a), Z(z0)]], C.superstructure, "#b9b2a4", 1);
    // terrace deck plate + rail
    if (L.terraceAftX < a) {
      b += `<rect x="${Math.min(X(L.terraceAftX), X(a))}" y="${Z(z0) - 3}" width="${Math.abs(X(a) - X(L.terraceAftX))}" height="5" fill="${C.superstructure}" stroke="#b9b2a4"/>`;
      b += line(X(L.terraceAftX), Z(z0 + 1.1), X(a), Z(z0 + 1.1), "#8e8676", 1.2);
      b += text(X((L.terraceAftX + a) / 2) - 10, Z(z0 + 1.6), L.terrace ?? "", 11, "#5a5246");
    }
  }
  // glazing bands
  for (const g of S.glazingBands) {
    const z0 = deckZ[g.deck];
    b += `<rect x="${Math.min(X(g.fromX), X(g.toX))}" y="${Z(z0 + 2.3)}" width="${Math.abs(X(g.toX) - X(g.fromX))}" height="${1.5 * k}" fill="${C.glazing}"/>`;
    for (let x = g.fromX; x < g.toX; x += 1.15) b += line(X(x), Z(z0 + 2.3), X(x), Z(z0 + 0.8), "#3a4b55", 0.5);
  }
  // lifeboat bay
  const lb = S.lifeboatBay;
  b += `<rect x="${Math.min(X(lb.fromX), X(lb.toX))}" y="${Z(deckZ[5] + DH)}" width="${Math.abs(X(lb.toX) - X(lb.fromX))}" height="${DH * k}" fill="#d8d2c6"/>`;
  for (let i = 0; i < lb.boatsPerSide; i++) {
    const cx = lb.fromX + 1.5 + i * (lb.boatLength + 1.6);
    b += `<rect x="${Math.min(X(cx), X(cx + lb.boatLength))}" y="${Z(deckZ[5] + 2.2)}" width="${lb.boatLength * k}" height="${1.6 * k}" rx="${0.8 * k}" fill="${C.lifeboat}" stroke="#b5561c"/>`;
  }
  // funnel
  const F = S.funnel, fb = top(8) + (F.casingBase ? F.casingBase.height : 0);
  if (F.casingBase) b += poly([[X(F.casingBase.fromX), Z(top(8))], [X(F.casingBase.toX), Z(top(8))], [X(F.casingBase.toX - 3), Z(fb)], [X(F.casingBase.fromX + 6), Z(fb)]], C.superstructure, "#b9b2a4", 1) + line(X(F.casingBase.fromX + 2), Z(top(8) + 0.6), X(F.casingBase.toX - 1), Z(top(8) + 0.6), C.seaGlass, 3);
  b += poly([[X(F.x), Z(fb)], [X(F.x + F.length), Z(fb)], [X(F.x + F.length - 4), Z(F.topZ - 1.2)], [X(F.x + 2), Z(F.topZ - 1.2)]], C.funnelCasing, "#0e1826", 1);
  for (let i = 0; i < 6; i++) b += line(X(F.x + 1.5), Z(fb + 1 + i * 0.9), X(F.x + F.length - 2.5 - i * 0.4), Z(fb + 1 + i * 0.9), "#33465e", 0.8);
  for (let i = 0; i < F.exhausts; i++) b += `<rect x="${Math.min(X(F.x + 3 + i * 2.4), X(F.x + 4.2 + i * 2.4))}" y="${Z(F.topZ + 1.2)}" width="${1.2 * k}" height="${2.4 * k}" fill="${C.exhaust}"/>`;
  // radome platform + radomes + mast
  if (S.radomePlatformHeight) { const px0 = Math.min(...S.radomes.map((r) => r.x)) - 4, px1 = Math.max(...S.radomes.map((r) => r.x)) + 4; b += poly([[X(px0), Z(top(9))], [X(px1), Z(top(9))], [X(px1 - 1), Z(top(9) + S.radomePlatformHeight)], [X(px0 + 1), Z(top(9) + S.radomePlatformHeight)]], C.superstructure, "#b9b2a4", 1); }
  for (const r of S.radomes) b += `<circle cx="${X(r.x)}" cy="${Z(top(9) + (S.radomePlatformHeight ?? 0) + r.diameter / 2)}" r="${(r.diameter / 2) * k}" fill="#ffffff" stroke="#b9b2a4"/>`;
  b += line(X(S.mast.x), Z(top(9)), X(S.mast.x), Z(S.mast.topZ), "#d9d4c8", 4) + line(X(S.mast.x - 2.5), Z(S.mast.topZ - 2.5), X(S.mast.x + 2.5), Z(S.mast.topZ - 2.5), "#d9d4c8", 3);
  // deck datum labels
  for (const d of V.decks) {
    b += line(30, Z(d.z), 100, Z(d.z), "#9aa8ad", 0.6, 'stroke-dasharray="4 3"');
    b += text(16, Z(d.z) - 3, `D${d.deck} ${d.name}`, 10, "#4b5d63");
  }
  b += text(X(P.lengthOverall) + (flip ? -110 : 8), Z(P.waterlineZ) - 4, "DWL", 11, "#0d5c78");
  // dimension line
  b += line(X(0), Z(-1.8), X(P.lengthOverall), Z(-1.8), "#0d2f43", 1) + text((X(0) + X(P.lengthOverall)) / 2 - 60, Z(-1.8) + 18, `LOA ${P.lengthOverall} m (proposed)`, 13);
  b += text(W - 520, 60, `${side.toUpperCase()} ELEVATION${flip ? " (MIRROR OF PORT — starboard unseen in A-02)" : " (matches A-02 visible side)"}`, 16, "#0d2f43", 'font-weight="700"');
  return sheet({ title: `${side} elevation`, sub: "bow " + (flip ? "left" : "right"), w: W, h: Hh + 0, body: b, scaleNote: "1 m = 13.2 px" });
}

// ---------- transverse views (bow / stern) ----------
function transverse(view) {
  const W = 1200, Hh = 900, k = 22, cx = W / 2, oy = 760;
  const Y = (y) => cx + y * k, Z = (z) => oy - z * k;
  let b = `<rect x="0" y="${Z(P.waterlineZ)}" width="${W}" height="${Hh}" fill="#d7e8ec"/>`;
  const hb = view === "stern" ? B2 * H.transomWidthFactor : B2;
  const sheerZ = view === "stern" ? sheer(0) : H.bowSheerTopZ;
  b += poly([[Y(-hb), Z(sheerZ)], [Y(hb), Z(sheerZ)], [Y(hb * 0.92), Z(P.waterlineZ)], [Y(hb * 0.35), Z(0.4)], [Y(-hb * 0.35), Z(0.4)], [Y(-hb * 0.92), Z(P.waterlineZ)]], C.hull, "#0b1a2b", 1.5);
  b += `<rect x="0" y="${Z(P.waterlineZ)}" width="${W}" height="${Hh}" fill="#d7e8ec" fill-opacity="0.62"/>`;
  b += line(Y(-hb * 0.93), Z(H.bootTopLineZ), Y(hb * 0.93), Z(H.bootTopLineZ), C.seaGlass, 3);
  if (view === "stern") {
    // stepped aft terraces seen end-on: each level's full width, glazing on aft walls
    for (const L of S.levels) {
      const w = B2 - L.sideInset, z0 = deckZ[L.deck];
      b += poly([[Y(-w), Z(z0 + DH)], [Y(w), Z(z0 + DH)], [Y(w), Z(z0)], [Y(-w), Z(z0)]], C.superstructure, "#b9b2a4");
      b += `<rect x="${Y(-w + 1.2)}" y="${Z(z0 + 2.3)}" width="${(2 * w - 2.4) * k}" height="${1.5 * k}" fill="${C.glazing}"/>`;
      b += line(Y(-w), Z(z0 + 1.1), Y(w), Z(z0 + 1.1), "#8e8676", 1.2);
    }
    b += text(Y(-hb) + 6, Z(sheer(0)) + 26, "transom (unseen in A-02: proposal)", 12, "#c9d6d9");
  } else {
    for (const L of S.levels) {
      const w = B2 - L.sideInset - 0.6, z0 = deckZ[L.deck];
      if (z0 + DH <= H.bowSheerTopZ) continue; // hidden behind the raised forecastle
      b += poly([[Y(-w * 0.9), Z(z0 + DH)], [Y(w * 0.9), Z(z0 + DH)], [Y(w), Z(z0)], [Y(-w), Z(z0)]], C.superstructure, "#b9b2a4");
      b += `<rect x="${Y(-w * 0.85)}" y="${Z(z0 + 2.3)}" width="${w * 1.7 * k}" height="${1.4 * k}" fill="${C.glazing}"/>`;
    }
  }
  // funnel, radomes, mast (behind)
  const F = S.funnel;
  b += `<rect x="${Y(-2.8)}" y="${Z(F.topZ - 1.2)}" width="${5.6 * k}" height="${(F.topZ - 1.2 - top(8)) * k}" fill="${C.funnelCasing}"/>`;
  for (const r of S.radomes) b += `<circle cx="${Y(r.y)}" cy="${Z(top(9) + (S.radomePlatformHeight ?? 0) + r.diameter / 2)}" r="${(r.diameter / 2) * k}" fill="#fff" stroke="#b9b2a4"/>`;
  b += line(Y(0), Z(top(9)), Y(0), Z(S.mast.topZ), "#cfc9bc", 5);
  b += line(Y(-B2), Z(-1.5), Y(B2), Z(-1.5), "#0d2f43") + text(Y(-2.6), Z(-1.5) + 18, `Beam ${P.beam} m`, 13);
  b += text(30, 50, `${view.toUpperCase()} VIEW (${view === "bow" ? "looking aft" : "looking forward"}) — not visible in A-02; proposal for approval`, 16, "#0d2f43", 'font-weight="700"');
  return sheet({ title: `${view} view`, sub: "transverse", w: W, h: Hh, body: b, scaleNote: "1 m = 22 px" });
}

// ---------- plan + deck 7 arrangement ----------
function plan(arrangement) {
  const W = 2400, Hh = 760, k = 13.2, ox = 120, cy = 360;
  const X = (x) => ox + x * k, Y = (y) => cy - y * k;
  let b = "";
  const outline = [];
  for (let x = 0; x <= P.lengthOverall; x += 1) outline.push([X(x), Y(halfBreadth(x))]);
  for (let x = P.lengthOverall; x >= 0; x -= 1) outline.push([X(x), Y(-halfBreadth(x))]);
  b += poly(outline, arrangement ? "#e9e4d8" : C.hull, "#0b1a2b", 1.5);
  if (!arrangement) {
    for (const L of S.levels) {
      const w = (x) => Math.max(0, halfBreadth(x) - L.sideInset);
      const pts = [];
      for (let x = L.aftWallX; x <= L.foreX; x += 1) pts.push([X(x), Y(w(x))]);
      for (let x = L.foreX; x >= L.aftWallX; x -= 1) pts.push([X(x), Y(-w(x))]);
      b += poly(pts, C.superstructure, "#a39c8e", 1, `fill-opacity="${0.55 + L.deck * 0.04}"`);
      b += text(X(L.aftWallX) + 4, Y(w(L.aftWallX)) + 14, `D${L.deck}`, 10, "#5a5246");
    }
    const F = S.funnel;
    b += `<rect x="${X(F.x)}" y="${Y(3)}" width="${F.length * k}" height="${6 * k}" rx="${3 * k}" fill="${C.funnelCasing}"/>`;
    for (const r of S.radomes) b += `<circle cx="${X(r.x)}" cy="${Y(r.y)}" r="${(r.diameter / 2) * k}" fill="#fff" stroke="#999"/>`;
    b += `<circle cx="${X(S.mast.x)}" cy="${Y(0)}" r="6" fill="#cfc9bc"/>`;
    b += text(40, 46, "PLAN (TOP) — superstructure footprints stepped by deck; terraces aft (proposal from A-02 three-quarter view)", 16, "#0d2f43", 'font-weight="700"');
    return sheet({ title: "plan view", sub: "top down, bow right", w: W, h: Hh, body: b, scaleNote: "1 m = 13.2 px" });
  }
  // deck 7 arrangement
  const L7 = S.levels.find((l) => l.deck === 7);
  const wall = (x) => halfBreadth(x) - L7.sideInset;
  const m = V.accommodation.unitModule;
  b += poly([...Array.from({ length: 112 }, (_, i) => [X(L7.aftWallX + i), Y(wall(L7.aftWallX + i))]), ...Array.from({ length: 112 }, (_, i) => [X(L7.foreX - i), Y(-wall(L7.foreX - i))])], C.superstructure, "#a39c8e");
  // terrace T4 + pool
  b += `<rect x="${X(L7.terraceAftX)}" y="${Y(B2 - 1)}" width="${(L7.aftWallX - L7.terraceAftX) * k}" height="${(P.beam - 2) * k}" fill="${C.deckTeak}" fill-opacity="0.55"/>`;
  b += text(X(L7.terraceAftX) + 4, Y(0) + 4, "T4 pool terrace", 11, "#4d3b25");
  // corridor
  b += `<rect x="${X(L7.aftWallX + 2)}" y="${Y(0.9)}" width="${(L7.foreX - L7.aftWallX - 10) * k}" height="${1.8 * k}" fill="#cfc6b4"/>`;
  // cores
  const cores = [[44, 52, "stair/lift core"], [86, 92, "stair/lift core"], [118, 124, "service core"]];
  for (const [a, f, lbl] of cores) { b += `<rect x="${X(a)}" y="${Y(4)}" width="${(f - a) * k}" height="${8 * k}" fill="#b7ae9c"/>`; b += text(X(a) + 2, Y(-4.6) + 12, lbl, 9, "#4b4436"); }
  // staterooms: port (even, y>0) and starboard (odd)
  let idx = { port: 0, stbd: 0 }, lastZone = 0;
  globalThis.cabinLocations = {};
  const isCore = (x0, x1) => cores.some(([a, f]) => x1 > a && x0 < f);
  for (let x = L7.aftWallX + 3; x + m.width <= L7.foreX - 8; x += m.width) {
    if (isCore(x, x + m.width)) continue;
    const zone = x < 60 ? 1 : x < 100 ? 2 : 3;
    if (zone !== lastZone) { idx = { port: 0, stbd: 0 }; lastZone = zone; }
    for (const side of ["port", "stbd"]) {
      idx[side]++;
      const sgn = side === "port" ? 1 : -1;
      const num = 7000 + zone * 100 + (side === "port" ? idx.port * 2 : idx.stbd * 2 - 1);
      const outer = wall(x + m.width / 2), inner = 0.9;
      const y0 = sgn > 0 ? Y(outer) : Y(-inner), hgt = (outer - inner) * k;
      const target = num === 7214;
      globalThis.cabinLocations[num] = { deck: 7, side: side === "port" ? "port" : "starboard", xFrom: +x.toFixed(2), xTo: +(x + m.width).toFixed(2), outboardHalfBreadth: +outer.toFixed(2) };
      b += `<rect x="${X(x)}" y="${y0}" width="${m.width * k}" height="${hgt}" fill="${target ? "#40c7c5" : "#f7f3ea"}" stroke="#a39c8e" stroke-width="0.8"/>`;
      if (target || idx[side] % 3 === 1) b += text(X(x) + 3, (sgn > 0 ? Y(outer) : Y(-outer)) + (sgn > 0 ? 12 : -4), String(num), 9, target ? "#032029" : "#7c7466", target ? 'font-weight="700"' : "");
    }
  }
  b += text(40, 46, "DECK 7 'MERIDIAN' ARRANGEMENT — schematic. Highlighted: Signature Cabin 7214 (Premium Balcony Stateroom, port, zone 2 midship; D-W02-1).", 15, "#0d2f43", 'font-weight="700"');
  b += text(40, 70, `Module ${m.width} m × ${m.depthInterior} m interior + ${m.balconyDepth} m balcony (proposal). Numbering convention assumed: even = port, zone 1 aft / 2 midship / 3 forward.`, 12, "#4b5d63");
  return sheet({ title: "deck 7 arrangement", sub: "schematic cabin layout", w: W, h: Hh, body: b, scaleNote: "1 m = 13.2 px" });
}

// ---------- derived accommodation (same module/core rule as the deck 7 sheet) ----------
const CORES = [[44, 52], [86, 92], [118, 124]];
const DECK4_CABIN_FROM = S.aftTerraceT1.wallX + 11, DECK4_CABIN_TO = 132;
function cabinsOnDeck(fromX, toX) {
  const m = V.accommodation.unitModule; let n = 0;
  for (let x = fromX + 3; x + m.width <= toX - 8; x += m.width) if (!CORES.some(([a, f]) => x + m.width > a && x < f)) n += 2;
  return n;
}
function derivedCapacity() {
  const lv = Object.fromEntries(S.levels.map((l) => [l.deck, l]));
  const g5 = S.glazingBands.find((b) => b.deck === 5);
  const decks = { 4: cabinsOnDeck(DECK4_CABIN_FROM, DECK4_CABIN_TO), 5: cabinsOnDeck(g5.fromX, g5.toX + 2), 6: cabinsOnDeck(lv[6].aftWallX, lv[6].foreX), 7: cabinsOnDeck(lv[7].aftWallX, lv[7].foreX) };
  const staterooms = Object.values(decks).reduce((a, b) => a + b, 0);
  return { rule: "4.6 m modules both sides of a central corridor, 3 m aft clearance, 8 m forward clearance, three vertical cores skipped", perDeck: decks, staterooms, guestsDoubleOccupancy: staterooms * 2 };
}

// ---------- deck 4: oceanview staterooms + boutique entertainment lounge aft (D-W02-7) ----------
// The lounge occupies exactly the space aft of the first deck-4 stateroom that the capacity rule already leaves
// free (terrace T1 wall → first module), so it displaces no staterooms and changes no capacity.
function deck4Layout() {
  const m = V.accommodation.unitModule, T1 = S.aftTerraceT1, lining = 0.3, bulkhead = 0.1;
  const w = (x) => halfBreadth(x) - lining;
  const firstModuleX = DECK4_CABIN_FROM + 3; // same start rule as cabinsOnDeck()
  const xAft = T1.wallX, xFwd = firstModuleX - bulkhead / 2;
  const integ = (a, f, width) => { let s = 0; const dx = 0.05; for (let x = a; x < f - 1e-9; x += dx) s += width(Math.min(f, x + dx / 2)) * Math.min(dx, f - x); return s; };
  const gross = integ(xAft, xFwd, (x) => 2 * w(x));
  const barBand = { xAft: xFwd - 3.0, xFwd, note: "bar + back-of-house; acoustic buffer to staterooms" };
  const stage = { xAft: xAft + 0.4, xFwd: xAft + 2.8, halfWidth: 2.5 };
  const apron = { xAft: xAft, xFwd: stage.xFwd + 1.2, halfWidth: 3.7 }; // stage + 1.2 m apron + side access, kept clear of seating
  const barArea = integ(barBand.xAft, barBand.xFwd, (x) => 2 * w(x));
  const apronArea = (apron.xFwd - apron.xAft) * 2 * apron.halfWidth;
  const circulation = 0.15;
  const seatingNet = (gross - barArea - apronArea) * (1 - circulation);
  const m2PerSeat = 1.8;
  const cabins = [];
  let idx = { port: 0, stbd: 0 }, lastZone = 0;
  for (let x = firstModuleX; x + m.width <= DECK4_CABIN_TO - 8; x += m.width) {
    if (CORES.some(([a, f]) => x + m.width > a && x < f)) continue;
    const zone = x < 60 ? 1 : x < 100 ? 2 : 3;
    if (zone !== lastZone) { idx = { port: 0, stbd: 0 }; lastZone = zone; }
    for (const side of ["port", "stbd"]) {
      idx[side]++;
      cabins.push({ num: 4000 + zone * 100 + (side === "port" ? idx.port * 2 : idx.stbd * 2 - 1), side, xFrom: +x.toFixed(2), xTo: +(x + m.width).toFixed(2), outboard: +w(x + m.width / 2).toFixed(2) });
    }
  }
  const lounge = {
    deck: 4, xAft: +xAft.toFixed(2), xFwd: +xFwd.toFixed(2), lengthM: +(xFwd - xAft).toFixed(2),
    widthAftM: +(2 * w(xAft)).toFixed(2), widthFwdM: +(2 * w(xFwd)).toFixed(2),
    grossM2: +gross.toFixed(1), barAndBackOfHouseM2: +barArea.toFixed(1), stageM2: +((stage.xFwd - stage.xAft) * 2 * stage.halfWidth).toFixed(1),
    seatingNetM2: +seatingNet.toFixed(1), seatedTarget: Math.floor(seatingNet / m2PerSeat),
    basis: `fictional design target: ${m2PerSeat} m² per seated guest after a ${circulation * 100} % circulation allowance; not a certified occupancy`,
    stateroomsDisplaced: 0,
  };
  return { lounge, barBand, stage, apron, cabins, lining, w };
}
function deck4Plan() {
  const D = deck4Layout(), L = D.lounge, W = 2400, Hh = 1400, k = 13.2, ox = 120, cy = 300;
  const X = (x) => ox + x * k, Y = (y) => cy - y * k;
  let b = "";
  const outline = [];
  for (let x = 0; x <= P.lengthOverall; x += 1) outline.push([X(x), Y(halfBreadth(x))]);
  for (let x = P.lengthOverall; x >= 0; x -= 1) outline.push([X(x), Y(-halfBreadth(x))]);
  b += poly(outline, "#e9e4d8", "#0b1a2b", 1.5);
  const T1 = S.aftTerraceT1;
  b += `<rect x="${X(T1.aftX)}" y="${Y(D.w(T1.aftX))}" width="${(T1.wallX - T1.aftX) * k}" height="${2 * D.w(T1.aftX) * k}" fill="${C.deckTeak}" fill-opacity="0.55"/>` + text(X(T1.aftX) + 3, Y(0) + 4, "T1", 11, "#4d3b25");
  const lp = [];
  for (let x = L.xAft; x <= L.xFwd + 1e-9; x += 0.5) lp.push([X(x), Y(D.w(x))]);
  for (let x = L.xFwd; x >= L.xAft - 1e-9; x -= 0.5) lp.push([X(x), Y(-D.w(x))]);
  b += poly(lp, "#40c7c5", "#0d5c78", 1.5, 'fill-opacity="0.75"');
  b += text(X(L.xAft), Y(halfBreadth(L.xAft)) - 10, "ENTERTAINMENT LOUNGE", 11, "#032029", 'font-weight="700"');
  b += `<rect x="${X(DECK4_CABIN_FROM + 3)}" y="${Y(0.9)}" width="${(D.cabins.at(-1).xTo - DECK4_CABIN_FROM - 3) * k}" height="${1.8 * k}" fill="#cfc6b4"/>`;
  for (const [a, f] of CORES) b += `<rect x="${X(a)}" y="${Y(4)}" width="${(f - a) * k}" height="${8 * k}" fill="#b7ae9c"/>`;
  for (const c of D.cabins) {
    const sgn = c.side === "port" ? 1 : -1, y0 = sgn > 0 ? Y(c.outboard) : Y(-0.9), hgt = (c.outboard - 0.9) * k;
    b += `<rect x="${X(c.xFrom)}" y="${y0}" width="${(c.xTo - c.xFrom) * k}" height="${hgt}" fill="#f7f3ea" stroke="#a39c8e" stroke-width="0.8"/>`;
    if ((c.num % 100) <= 2) b += text(X(c.xFrom) + 3, (sgn > 0 ? Y(c.outboard) + 12 : Y(-c.outboard) - 4), String(c.num), 9, "#7c7466");
  }
  b += text(40, 40, `DECK 4 'OCEANVIEW' ARRANGEMENT: ${D.cabins.length} oceanview staterooms + boutique entertainment lounge aft (D-W02-7). Schematic; no staterooms displaced.`, 15, "#0d2f43", 'font-weight="700"');
  b += text(40, 62, "Lounge = the space the capacity rule already leaves between the terrace T1 glazed wall and the first stateroom module. Theatre and kids' splash zone removed.", 12, "#4b5d63");
  // enlarged lounge plan (1 m = 34 px), aft at left
  const k2 = 24, ox2 = 200, cy2 = 800;
  const X2 = (x) => ox2 + (x - L.xAft) * k2, Y2 = (y) => cy2 - y * k2;
  const lp2 = [];
  for (let x = L.xAft; x <= L.xFwd + 1e-9; x += 0.25) lp2.push([X2(x), Y2(D.w(x))]);
  for (let x = L.xFwd; x >= L.xAft - 1e-9; x -= 0.25) lp2.push([X2(x), Y2(-D.w(x))]);
  b += poly(lp2, "#f6f1e6", "#6f6758", 3);
  b += text(ox2, Y2(D.w(L.xFwd)) - 30, `ENLARGED: entertainment lounge (deck 4 aft) · x ${L.xAft}–${L.xFwd} m · 1 m = ${k2} px`, 15, "#0d2f43", 'font-weight="700"');
  b += `<rect x="${X2(L.xAft) - 6}" y="${Y2(D.w(L.xAft))}" width="6" height="${2 * D.w(L.xAft) * k2}" fill="#7fb7c8"/>` + text(X2(L.xAft) - 140, Y2(0) - 8, "glazed aft wall", 12, "#24525f") + text(X2(L.xAft) - 140, Y2(0) + 8, "→ terrace T1", 12, "#24525f");
  const bb = D.barBand, rect2 = (x0, x1, hw, fill, stroke = "#8d8473") => `<rect x="${X2(x0)}" y="${Y2(hw)}" width="${(x1 - x0) * k2}" height="${2 * hw * k2}" fill="${fill}" stroke="${stroke}"/>`;
  const hwF = D.w(bb.xAft);
  b += rect2(bb.xAft, bb.xFwd, hwF, "#d9c4a0") + text(X2(bb.xFwd) + 12, Y2(hwF) + 22, "BAR + BACK-OF-HOUSE (3.0 m band)", 13, "#4d3b25", 'font-weight="700"') + text(X2(bb.xFwd) + 12, Y2(hwF) + 40, "acoustic buffer to the staterooms forward; entry from the deck 4 corridor on the centreline", 11, "#5b4a33");
  b += `<rect x="${X2(bb.xAft)}" y="${Y2(0.9)}" width="${(bb.xFwd - bb.xAft) * k2}" height="${1.8 * k2}" fill="#cfc6b4"/>` + text(X2(bb.xAft) + 4, Y2(0) + 4, "entry", 11, "#4b4436");
  b += rect2(D.apron.xAft, D.apron.xFwd, D.apron.halfWidth, "none", "#9a8f7c").replace("/>", ' stroke-dasharray="5 4"/>');
  b += rect2(D.stage.xAft, D.stage.xFwd, D.stage.halfWidth, "#c9a77d") + text(X2(D.stage.xAft) + 4, Y2(0) + 5, "STAGE", 12, "#3d3529", 'font-weight="700"');
  b += text(X2(D.apron.xFwd) + 14, Y2(6.5), "LOUNGE SEATING", 15, "#3d3529", 'font-weight="700"');
  b += text(X2(D.apron.xFwd) + 14, Y2(6.5) + 18, "conversational groups", 12, "#5b5345") + text(X2(D.apron.xFwd) + 14, Y2(6.5) + 34, `≈ ${L.seatedTarget} seated (design target)`, 12, "#5b5345");
  // metrics block
  const mx = 1500; let my = 760;
  const rows = [
    ["Gross floor", `${L.grossM2} m²`], ["Length × width", `${L.lengthM} m × ${L.widthAftM}–${L.widthFwdM} m`],
    ["Bar + back-of-house", `${L.barAndBackOfHouseM2} m²`], ["Performance platform", `${L.stageM2} m²`],
    ["Net seating area", `${L.seatingNetM2} m²`], ["Seated target", `≈ ${L.seatedTarget} guests (~${Math.round((100 * L.seatedTarget) / V.accommodation.guestsDoubleOccupancy)} % of ~${V.accommodation.guestsDoubleOccupancy})`],
    ["Staterooms displaced", "0 (capacity unchanged)"],
  ];
  b += text(mx, my, "LOUNGE METRICS (computed)", 15, "#0d2f43", 'font-weight="700"'); my += 26;
  for (const [a, v] of rows) { b += text(mx, my, a, 13, "#4b5d63") + text(mx + 230, my, v, 13, "#0d2f43", 'font-weight="700"'); my += 22; }
  my += 14;
  for (const s of ["Not engineered or certified: acoustic separation, fire/escape", "(second escape via terrace T1 assumed) and occupancy need", "naval-architect review before any real-world claim."]) { b += text(mx, my, s, 12, "#9a5b2b"); my += 18; }
  return sheet({ title: "deck 4 arrangement + entertainment lounge", sub: "schematic, bow right", w: W, h: Hh, body: b, scaleNote: "plan 1 m = 13.2 px; enlargement 1 m = 24 px" });
}

// ---------- massing volumes (shared by the 3/4 view and the GLB) ----------
// Each prism: convex plan polygon (x,y) extruded z0..z1 with a material.
function hullPlan(sampleStep = 2) {
  const pts = [];
  for (let x = 0; x <= P.lengthOverall; x += sampleStep) pts.push([x, halfBreadth(x)]);
  for (let x = P.lengthOverall; x >= 0; x -= sampleStep) pts.push([x, -halfBreadth(x)]);
  return pts;
}
function levelPlan(L) {
  const pts = [], w = (x) => Math.max(0.2, halfBreadth(x) - L.sideInset);
  for (let x = L.aftWallX; x <= L.foreX; x += 2) pts.push([x, w(x)]);
  for (let x = L.foreX; x >= L.aftWallX; x -= 2) pts.push([x, -w(x)]);
  return pts;
}
const rect = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const prisms = [];
prisms.push({ name: "hull", mat: "hull", plan: hullPlan(), z0: P.waterlineZ - (H.visibleBelowWaterline ?? 0), z1: 12.9 });
const fore = hullPlan().filter(([x]) => x >= 128);
prisms.push({ name: "forecastle", mat: "hull", plan: fore, z0: 12.9, z1: H.bowSheerTopZ });
prisms.push({ name: "terraceT1", mat: "teak", plan: hullPlan().filter(([x]) => x <= S.aftTerraceT1.wallX + 30), z0: 12.9 - 0.25, z1: 12.9 });
for (const L of S.levels) {
  prisms.push({ name: `deck${L.deck}`, mat: "superstructure", plan: levelPlan(L), z0: deckZ[L.deck], z1: deckZ[L.deck] + DH - 0.05 });
  const g = S.glazingBands.find((b) => b.deck === L.deck);
  if (g) {
    // thin glazing panels on both side walls (not a full-width box, so no false roof stripes)
    const w = halfBreadth((g.fromX + g.toX) / 2) - L.sideInset;
    for (const s of [1, -1]) prisms.push({ name: `glazing${L.deck}${s > 0 ? "P" : "S"}`, mat: "glazing", plan: rect(g.fromX, g.toX, s > 0 ? w - 0.05 : -w - 0.08, s > 0 ? w + 0.08 : -w + 0.05), z0: deckZ[L.deck] + 0.8, z1: deckZ[L.deck] + 2.3 });
  }
}
const lb = S.lifeboatBay;
for (let i = 0; i < lb.boatsPerSide; i++) for (const s of [1, -1]) {
  // stowed in the recessed bay at the ship's side, slightly proud of the shell
  const x0 = lb.fromX + 1.5 + i * (lb.boatLength + 1.6), yOut = s * (B2 + 0.5), yIn = s * (B2 - 2.4);
  prisms.push({ name: `lifeboat${i}${s > 0 ? "P" : "S"}`, mat: "lifeboat", plan: rect(x0, x0 + lb.boatLength, Math.min(yOut, yIn), Math.max(yOut, yIn)), z0: deckZ[5] + 0.6, z1: deckZ[5] + 2.2 });
}
if (S.funnel.casingBase) { const cb = S.funnel.casingBase; prisms.push({ name: "funnelCasingBase", mat: "superstructure", plan: rect(cb.fromX, cb.toX, -cb.halfWidth, cb.halfWidth), z0: top(8), z1: top(8) + cb.height }); }
prisms.push({ name: "funnel", mat: "funnel", plan: rect(S.funnel.x, S.funnel.x + S.funnel.length, -3, 3), z0: top(8), z1: S.funnel.topZ - 1.2 });
for (let i = 0; i < S.funnel.exhausts; i++) prisms.push({ name: `exhaust${i}`, mat: "exhaust", plan: rect(S.funnel.x + 3 + i * 2.4, S.funnel.x + 4.2 + i * 2.4, -0.6, 0.6), z0: S.funnel.topZ - 1.2, z1: S.funnel.topZ + 1.2 });
if (S.radomePlatformHeight) { const px0 = Math.min(...S.radomes.map((r) => r.x)) - 4, px1 = Math.max(...S.radomes.map((r) => r.x)) + 4; prisms.push({ name: "radomePlatform", mat: "superstructure", plan: rect(px0, px1, -5, 5), z0: top(9), z1: top(9) + S.radomePlatformHeight }); }
prisms.push({ name: "mast", mat: "superstructure", plan: rect(S.mast.x - 0.4, S.mast.x + 0.4, -0.4, 0.4), z0: top(9), z1: S.mast.topZ });

const MAT = { hull: C.hull, superstructure: C.superstructure, glazing: C.glazing, teak: C.deckTeak, lifeboat: C.lifeboat, funnel: C.funnelCasing, exhaust: C.exhaust };
function facesOf(pr) {
  const n = pr.plan.length, f = [];
  // ensure counter-clockwise plan (seen from +z)
  let area = 0;
  for (let i = 0; i < n; i++) { const [a, b] = pr.plan[i], [c, d] = pr.plan[(i + 1) % n]; area += a * d - c * b; }
  const pl = area < 0 ? [...pr.plan].reverse() : pr.plan;
  f.push({ v: pl.map(([x, y]) => [x, y, pr.z1]), mat: pr.mat });
  f.push({ v: [...pl].reverse().map(([x, y]) => [x, y, pr.z0]), mat: pr.mat });
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pl[i], [x1, y1] = pl[(i + 1) % n];
    if (Math.hypot(x1 - x0, y1 - y0) < 1e-6) continue;
    f.push({ v: [[x0, y0, pr.z0], [x1, y1, pr.z0], [x1, y1, pr.z1], [x0, y0, pr.z1]], mat: pr.mat });
  }
  return f;
}
const sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((v) => v / l); };
const faceNormal = (v) => norm(cross(sub(v[1], v[0]), sub(v[2], v[0])));

// ---------- three-quarter view (approved camera family: elevated port-aft, looking toward the bow) ----------
const CAMERA = { name: "review-3q-port-aft", azimuthDeg: -34, elevationDeg: 16, projection: "orthographic", note: "matches A-02 framing family; review camera only" };
const cameraId = sha(JSON.stringify(CAMERA));
function threeQuarter() {
  const W = 2400, Hh = 1200;
  const az = (CAMERA.azimuthDeg * Math.PI) / 180, el = (CAMERA.elevationDeg * Math.PI) / 180;
  const f = norm([Math.cos(el) * Math.cos(az), Math.cos(el) * Math.sin(az), -Math.sin(el)]);
  let r = norm(cross(f, [0, 0, 1])); if (r[0] < 0) r = r.map((v) => -v);
  let u = cross(r, f);
  if (u[2] < 0) u = u.map((v) => -v); // screen-up must point to +z (camera above the waterline)
  const light = norm([0.45, 0.55, 0.7]);
  // Starboard-only parts are fully occluded from this port-side camera; painter sorting cannot hide thin panels, so omit them here (they remain in the GLB).
  const all = prisms.filter((pr) => !/S$/.test(pr.name)).flatMap(facesOf).filter((fc) => dot(faceNormal(fc.v), f) < 0);
  const proj = (p) => [dot(p, r), -dot(p, u)];
  const pts2 = all.flatMap((fc) => fc.v.map(proj));
  const minX = Math.min(...pts2.map((p) => p[0])), maxX = Math.max(...pts2.map((p) => p[0]));
  const minY = Math.min(...pts2.map((p) => p[1])), maxY = Math.max(...pts2.map((p) => p[1]));
  const s = Math.min((W - 240) / (maxX - minX), (Hh - 260) / (maxY - minY));
  const T = (p) => { const [a, b] = proj(p); return [120 + (a - minX) * s, 120 + (b - minY) * s]; };
  all.sort((A, Bf) => dot(Bf.v.reduce((m, p) => sub(m, p.map((c) => -c / Bf.v.length)), [0, 0, 0]), f) - dot(A.v.reduce((m, p) => sub(m, p.map((c) => -c / A.v.length)), [0, 0, 0]), f));
  let b = `<rect width="${W}" height="${Hh}" fill="#e6eef0"/>`;
  for (const fc of all) {
    const n = faceNormal(fc.v), shade = 0.62 + 0.38 * Math.max(0, dot(n, light));
    const base = MAT[fc.mat], rgb = [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16));
    const col = `rgb(${rgb.map((c) => Math.round(Math.min(255, c * shade))).join(",")})`;
    b += poly(fc.v.map(T), col, "rgba(10,20,30,0.18)", 0.6);
  }
  for (const rd of S.radomes) { const [cx, cy] = T([rd.x, rd.y, top(9) + rd.diameter / 2]); b += `<circle cx="${cx}" cy="${cy}" r="${(rd.diameter / 2) * s}" fill="#fbfbf8" stroke="#b9b2a4"/>`; }
  b += text(40, 56, "THREE-QUARTER MASSING — elevated port-aft, looking toward the bow (A-02 framing family). Same geometry as every elevation and the GLB.", 17, "#0d2f43", 'font-weight="700"');
  b += text(40, 82, `Camera ${cameraId.slice(0, 23)}… · orthographic massing for proportion/identity review only — final appearance comes from a production model built to this contract.`, 12, "#4b5d63");
  return sheet({ title: "three-quarter massing", sub: CAMERA.name, w: W, h: Hh, body: b, scaleNote: "orthographic" });
}

// ---------- GLB massing export ----------
function glb() {
  const byMat = {};
  for (const pr of prisms) for (const fc of facesOf(pr)) (byMat[fc.mat] ??= []).push(fc);
  const meshes = [], accessors = [], views = [], chunks = [], materials = [];
  let offset = 0;
  const push = (arr, target) => { const buf = Buffer.from(arr.buffer); views.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, target }); chunks.push(buf); offset += buf.length; while (offset % 4) { chunks.push(Buffer.alloc(1)); offset++; } return views.length - 1; };
  for (const [mat, faces] of Object.entries(byMat)) {
    const pos = [], nor = [];
    for (const fc of faces) {
      // glTF is Y-up: map (x, y, z) -> (x, z, -y)
      const v = fc.v.map(([x, y, z]) => [x, z, -y]);
      const n = faceNormal(fc.v); const nn = [n[0], n[2], -n[1]];
      for (let i = 1; i < v.length - 1; i++) for (const p of [v[0], v[i], v[i + 1]]) { pos.push(...p); nor.push(...nn); }
    }
    const P32 = new Float32Array(pos), N32 = new Float32Array(nor);
    const mn = [0, 1, 2].map((a) => Math.min(...pos.filter((_, i) => i % 3 === a))), mx = [0, 1, 2].map((a) => Math.max(...pos.filter((_, i) => i % 3 === a)));
    const pv = push(P32, 34962), nv = push(N32, 34962);
    accessors.push({ bufferView: pv, componentType: 5126, count: pos.length / 3, type: "VEC3", min: mn, max: mx });
    accessors.push({ bufferView: nv, componentType: 5126, count: nor.length / 3, type: "VEC3" });
    const rgb = [1, 3, 5].map((i) => Math.pow(parseInt(MAT[mat].slice(i, i + 2), 16) / 255, 2.2));
    materials.push({ name: mat, pbrMetallicRoughness: { baseColorFactor: [...rgb, 1], metallicFactor: 0, roughnessFactor: mat === "glazing" ? 0.08 : 0.55 } });
    meshes.push({ name: mat, primitives: [{ attributes: { POSITION: accessors.length - 2, NORMAL: accessors.length - 1 }, material: materials.length - 1 }] });
  }
  const bin = Buffer.concat(chunks);
  const gltf = { asset: { version: "2.0", generator: "ShoreMigo WP-02 massing generator", extras: { specId, fictional: true, status: V.status } }, scene: 0, scenes: [{ nodes: meshes.map((_, i) => i) }], nodes: meshes.map((m, i) => ({ mesh: i, name: m.name })), meshes, materials, accessors, bufferViews: views, buffers: [{ byteLength: bin.length }] };
  let json = Buffer.from(JSON.stringify(gltf));
  while (json.length % 4) json = Buffer.concat([json, Buffer.from(" ")]);
  const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(json.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jh, json, bh, bin]);
}

// ---------- Cabin 7214 floor plan (inside the approved envelope) ----------
// Local frame: u = across the cabin (0 = aft bulkhead, 4.6 = forward bulkhead), w = from corridor (0) outboard to the sea.
function cabinLayout() {
  const c = V.cabin7214, E = c.envelope, Pt = c.partitions;
  const hb = Pt.cabinDividingBulkhead / 2, cw = Pt.corridorBulkhead, bw = Pt.bathroomWall;
  const U0 = hb, U1 = E.moduleWidth - hb, W0 = cw, WG = E.interiorDepth, WB = WG + E.balconyDepth;
  const bath = { u0: U0, u1: 2.55, w0: W0, w1: 2.32 };
  const wardrobe = { u0: 3.85, u1: U1, w0: W0, w1: 2.4 };
  const bed = { u0: (E.moduleWidth - 1.93) / 2, u1: (E.moduleWidth + 1.93) / 2, w0: 2.45, w1: 2.45 + 2.03 };
  const items = {
    bath, wardrobe, bed,
    sofa: { u0: U0, u1: U0 + 0.85, w0: 4.9, w1: 6.9 },
    table: { u0: 1.3, u1: 2.2, w0: 5.6, w1: 6.2 },
    armchair: { u0: 3.5, u1: 4.25, w0: 6.1, w1: 6.85 },
    desk: { u0: 4.05, u1: U1, w0: 4.6, w1: 5.8 },
    nightstandA: { u0: bed.u0 - 0.5, u1: bed.u0 - 0.05, w0: 2.45, w1: 2.9 },
    nightstandB: { u0: bed.u1 + 0.05, u1: bed.u1 + 0.5, w0: 2.45, w1: 2.9 },
  };
  const area = (r) => (r.u1 - r.u0) * (r.w1 - r.w0);
  const clear = {
    passageWidth: +(wardrobe.u0 - (bath.u1 + bw)).toFixed(2),
    bedSideAft: +(bed.u0 - U0).toFixed(2),
    bedSideForwardToDesk: +(items.desk.u0 - bed.u1).toFixed(2),
    bedFootToCoffeeTable: +(items.table.w0 - bed.w1).toFixed(2), // sofa sits beside the bed footprint (no u overlap), so the table is the real constraint
  };
  const metrics = {
    grossInteriorM2: +(E.moduleWidth * E.interiorDepth).toFixed(1),
    netInteriorFloorM2: +((U1 - U0) * (WG - W0)).toFixed(1),
    bathroomM2: +area(bath).toFixed(1),
    roomExcludingBathAndWardrobeM2: +((U1 - U0) * (WG - W0) - area(bath) - area(wardrobe)).toFixed(1),
    balconyClearM2: +((U1 - U0) * (E.balconyDepth - 0.1)).toFixed(1),
    clearances: clear,
    minClearance: Math.min(...Object.values(clear)),
    hullFit: (() => {
      const loc = globalThis.cabinLocations?.[7214];
      if (!loc) return null;
      const available = +(loc.outboardHalfBreadth - 0.9).toFixed(2); // corridor half-width 0.9 m
      return { availableFromCorridorToShipSide: available, required: +(cw + E.interiorDepth + E.balconyDepth).toFixed(2), spareForStructureAndRisers: +(available - (cw + E.interiorDepth + E.balconyDepth)).toFixed(2) };
    })(),
  };
  const viewpoints = [
    { id: "V1-entry", u: 3.2, w: 0.8, lookU: 2.3, lookW: 9.3, note: "from the door: passage, bed and the sea through the sliding doors" },
    { id: "V2-bedside", u: 3.9, w: 3.3, lookU: 1.5, lookW: 7.2, note: "living area and glazing beyond" },
    { id: "V3-living", u: 2.6, w: 6.7, lookU: 2.3, lookW: 2.4, note: "looking back to the bed and wardrobe wall" },
    { id: "V4-bathroom", u: 3.0, w: 1.0, lookU: 1.0, lookW: 1.2, note: "through the bathroom door" },
    { id: "V5-balcony-out", u: 2.3, w: 8.4, lookU: 2.3, lookW: 30, note: "open sea over the glass balustrade" },
    { id: "V6-balcony-in", u: 2.3, w: 9.0, lookU: 2.3, lookW: 2.0, note: "back into the cabin through the open doors" },
  ];
  return { items, metrics, viewpoints, U0, U1, W0, WG, WB, E };
}
function cabinPlan() {
  const L = cabinLayout(), k = 96, ox = 160, oy = 120; // 96 px per metre; corridor at top, sea at bottom
  const X = (u) => ox + u * k, Y = (w) => oy + w * k;
  const R = (r, fill, stroke = "#8d8473", sw = 1, extra = "") => `<rect x="${X(r.u0)}" y="${Y(r.w0)}" width="${(r.u1 - r.u0) * k}" height="${(r.w1 - r.w0) * k}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
  const { items: I, E } = L;
  let b = "";
  b += `<rect x="${X(-0.6)}" y="${Y(-1.1)}" width="${(E.moduleWidth + 1.2) * k}" height="${1.1 * k}" fill="#d8d0c0"/>` + text(X(0.1), Y(-0.45), "CORRIDOR (inboard)", 14, "#5b5345");
  b += `<rect x="${X(0)}" y="${Y(0)}" width="${E.moduleWidth * k}" height="${E.interiorDepth * k}" fill="#f6f1e6"/>`;
  b += `<rect x="${X(0)}" y="${Y(E.interiorDepth)}" width="${E.moduleWidth * k}" height="${E.balconyDepth * k}" fill="#c9a77d" fill-opacity="0.45"/>`;
  b += `<rect x="${X(0)}" y="${Y(E.interiorDepth + E.balconyDepth)}" width="${E.moduleWidth * k}" height="${0.9 * k}" fill="#d7e8ec"/>` + text(X(0.1), Y(E.interiorDepth + E.balconyDepth + 0.55), "SEA (port side, outboard)", 14, "#0d5c78");
  // bulkheads
  b += `<rect x="${X(-0.05)}" y="${Y(-0.12)}" width="${0.1 * k}" height="${(E.interiorDepth + E.balconyDepth + 0.12) * k}" fill="#6f6758"/>`;
  b += `<rect x="${X(E.moduleWidth - 0.05)}" y="${Y(-0.12)}" width="${0.1 * k}" height="${(E.interiorDepth + E.balconyDepth + 0.12) * k}" fill="#6f6758"/>`;
  b += `<rect x="${X(0)}" y="${Y(-0.12)}" width="${3.55 * k}" height="${0.12 * k}" fill="#6f6758"/><rect x="${X(4.45)}" y="${Y(-0.12)}" width="${0.15 * k}" height="${0.12 * k}" fill="#6f6758"/>`;
  b += `<path d="M ${X(3.55)} ${Y(0)} A ${0.9 * k} ${0.9 * k} 0 0 1 ${X(4.45)} ${Y(0.9)}" fill="none" stroke="#8d8473" stroke-dasharray="4 3"/>` + text(X(3.6), Y(-0.2), "entry door 0.9", 11, "#3d3529");
  // bathroom
  b += R(I.bath, "#e7eef0", "#6f6758", 3) + text(X(0.3), Y(1.4), "BATHROOM", 14, "#33424a", 'font-weight="700"') + text(X(0.3), Y(1.6), `${(I.bath.u1 - I.bath.u0).toFixed(2)} × ${(I.bath.w1 - I.bath.w0).toFixed(2)} m`, 12, "#4b5d63");
  b += `<rect x="${X(0.2)}" y="${Y(0.25)}" width="${1.0 * k}" height="${0.9 * k}" fill="#d3e3e8" stroke="#8aa7b0"/>` + text(X(0.3), Y(0.65), "shower", 11, "#4b5d63");
  b += `<rect x="${X(1.5)}" y="${Y(0.2)}" width="${0.9 * k}" height="${0.5 * k}" fill="#fff" stroke="#8aa7b0"/>` + text(X(1.58), Y(0.5), "vanity", 11, "#4b5d63");
  b += `<ellipse cx="${X(1.9)}" cy="${Y(1.85)}" rx="${0.2 * k}" ry="${0.3 * k}" fill="#fff" stroke="#8aa7b0"/>` + text(X(2.05), Y(1.9), "WC", 11, "#4b5d63");
  b += `<rect x="${X(2.55)}" y="${Y(0.5)}" width="${0.08 * k}" height="${0.8 * k}" fill="#f6f1e6"/>` + text(X(2.68), Y(0.95), "door", 10, "#7c7466");
  // wardrobe + passage
  b += R(I.wardrobe, "#d9c4a0", "#8d8473", 1.5) + text(X(3.9), Y(1.3), "WARDROBE", 12, "#4d3b25", 'font-weight="700"') + text(X(3.9), Y(1.55), "full height", 10, "#5b4a33");
  b += text(X(2.75), Y(1.9), `passage ${L.metrics.clearances.passageWidth} m`, 11, "#5b5345");
  // bedroom
  b += R(I.bed, "#ffffff", "#8d8473", 1.5) + `<rect x="${X(I.bed.u0)}" y="${Y(I.bed.w0)}" width="${(I.bed.u1 - I.bed.u0) * k}" height="${0.08 * k}" fill="#c4a273"/>`;
  b += `<rect x="${X(I.bed.u0 + 0.1)}" y="${Y(I.bed.w0 + 0.15)}" width="${0.8 * k}" height="${0.45 * k}" rx="8" fill="#f1ece2" stroke="#d6cdbd"/><rect x="${X(I.bed.u1 - 0.9)}" y="${Y(I.bed.w0 + 0.15)}" width="${0.8 * k}" height="${0.45 * k}" rx="8" fill="#f1ece2" stroke="#d6cdbd"/>`;
  b += text(X(I.bed.u0 + 0.45), Y(I.bed.w0 + 1.2), "KING BED", 14, "#3d3529", 'font-weight="700"') + text(X(I.bed.u0 + 0.45), Y(I.bed.w0 + 1.45), "1.93 × 2.03 m", 11, "#5b5345");
  b += R(I.nightstandA, "#d9c4a0") + R(I.nightstandB, "#d9c4a0");
  // living
  b += R(I.sofa, "#e6ddd0", "#8d8473", 1.5) + text(X(0.1), Y(5.9), "sofa", 11, "#3d3529", 'transform="rotate(-90 ' + X(0.45) + " " + Y(5.95) + ')"');
  b += R(I.table, "#d9c4a0") + text(X(1.35), Y(5.95), "table", 10, "#4d3b25");
  b += R(I.armchair, "#e6ddd0") + text(X(3.55), Y(6.55), "armchair", 10, "#3d3529");
  b += R(I.desk, "#d9c4a0") + text(X(4.08), Y(5.25), "desk", 10, "#4d3b25", 'transform="rotate(-90 ' + X(4.3) + " " + Y(5.2) + ')"');
  b += text(X(1.4), Y(4.75), "LIVING AREA", 14, "#3d3529", 'font-weight="700"');
  // glazing: 4 panels on the mullion rhythm
  for (let i = 0; i < 4; i++) b += `<rect x="${X(i * 1.15) + 2}" y="${Y(E.interiorDepth - 0.05)}" width="${1.15 * k - 4}" height="${0.1 * k}" fill="#7fb7c8" stroke="#3a6878"/>`;
  b += text(X(0.1), Y(E.interiorDepth + 0.35), "panoramic sliding glass doors · 4 × 1.15 m panels", 12, "#24525f");
  // balcony
  b += `<rect x="${X(0.02)}" y="${Y(E.interiorDepth + E.balconyDepth - 0.05)}" width="${(E.moduleWidth - 0.04) * k}" height="${0.06 * k}" fill="#9ccbd8"/>` + text(X(2.9), Y(E.interiorDepth + E.balconyDepth - 0.18), "glass balustrade", 11, "#24525f");
  b += `<rect x="${X(0.9)}" y="${Y(7.85)}" width="${0.6 * k}" height="${0.6 * k}" rx="6" fill="#efe6d8" stroke="#8d8473"/><rect x="${X(2.6)}" y="${Y(7.85)}" width="${0.6 * k}" height="${0.6 * k}" rx="6" fill="#efe6d8" stroke="#8d8473"/><circle cx="${X(2.05)}" cy="${Y(8.15)}" r="${0.22 * k}" fill="#d9c4a0" stroke="#8d8473"/>`;
  b += text(X(0.1), Y(E.interiorDepth + 0.95), "PRIVATE BALCONY", 14, "#4d3b25", 'font-weight="700"') + text(X(3.2), Y(E.interiorDepth + 0.6), "privacy screens →", 10, "#5b5345");
  // viewpoints
  for (const vp of L.viewpoints) {
    const ang = Math.atan2(Y(vp.lookW) - Y(vp.w), X(vp.lookU) - X(vp.u));
    const len = 0.55 * k;
    b += `<circle cx="${X(vp.u)}" cy="${Y(vp.w)}" r="9" fill="#40c7c5" stroke="#032029"/>`;
    b += line(X(vp.u), Y(vp.w), X(vp.u) + Math.cos(ang) * len, Y(vp.w) + Math.sin(ang) * len, "#032029", 2.5);
    b += text(X(vp.u) + 12, Y(vp.w) + (vp.id === "V4-bathroom" ? 22 : -10), vp.id, 11, "#032029", 'font-weight="700"');
  }
  // dimensions + metrics panel
  b += line(X(0), Y(-1.35), X(E.moduleWidth), Y(-1.35), "#0d2f43") + text(X(1.7), Y(-1.45), `${E.moduleWidth} m module`, 12);
  b += line(X(-0.35), Y(0), X(-0.35), Y(E.interiorDepth), "#0d2f43") + text(X(-1.55), Y(3.6), `${E.interiorDepth} m interior`, 12);
  b += line(X(-0.35), Y(E.interiorDepth), X(-0.35), Y(E.interiorDepth + E.balconyDepth), "#0d2f43") + text(X(-1.55), Y(8.3), `${E.balconyDepth} m balcony`, 12);
  const m = L.metrics, px = X(E.moduleWidth) + 120;
  const rows = [
    ["Gross interior", `${m.grossInteriorM2} m² (≈${Math.round(m.grossInteriorM2 * 10.764)} sq ft)`],
    ["Net interior floor (after partitions)", `${m.netInteriorFloorM2} m²`],
    ["Bathroom (internal)", `${m.bathroomM2} m²`],
    ["Room (excl. bath + wardrobe)", `${m.roomExcludingBathAndWardrobeM2} m²`],
    ["Balcony (clear)", `${m.balconyClearM2} m² (≈${Math.round(m.balconyClearM2 * 10.764)} sq ft)`],
    ["Clear ceiling", `${E.clearCeiling} m (deck height ${E.deckHeight} m)`],
    ["Min. circulation clearance", `${m.minClearance} m`],
    ["Partitions", `cabin 0.10 · corridor 0.12 · bathroom 0.08 m`],
    ["Hull fit at x 99.0–103.6 m", m.hullFit ? `${m.hullFit.required} m needed of ${m.hullFit.availableFromCorridorToShipSide} m (spare ${m.hullFit.spareForStructureAndRisers} m)` : "n/a"],
  ];
  b += text(px, Y(-0.9), "CABIN 7214 · Premium Balcony Stateroom · Deck 7 port", 20, "#0d2f43", 'font-weight="700"');
  b += text(px, Y(-0.55), "(formerly 9214; owner decision D-W02-1)", 13, "#4b5d63");
  rows.forEach(([kk, vv], i) => { b += text(px, Y(0.1) + i * 34, kk, 13, "#4b5d63") + text(px + 330, Y(0.1) + i * 34, vv, 13, "#0d2f43", 'font-weight="700"'); });
  b += text(px, Y(3.5), "Materials: light oak · warm ivory · champagne hardware · sea-glass accents", 13, "#4b5d63");
  b += text(px, Y(3.85), "Lighting states for every viewpoint: daylight · golden hour · evening", 13, "#4b5d63");
  b += text(px, Y(4.3), "Viewpoints (eye height 1.6 m): one connected space; renders must come from these", 13, "#0d2f43", 'font-weight="700"');
  L.viewpoints.forEach((vp, i) => { b += text(px, Y(4.65) + i * 26, `${vp.id}: ${vp.note}`, 12, "#4b5d63"); });
  b += text(px, Y(7.6), "Plan only. Spatial renders/walkthrough belong to WP-03 and must use this layout.", 12, "#9a5b2b");
  return sheet({ title: "Cabin 7214 floor plan", sub: "plan, corridor top / sea bottom, aft left", w: 1700, h: 1220, body: b, scaleNote: "1 m = 96 px" });
}

// ---------- massing identity (geometry only; independent of drawing code and spec prose) ----------
massingModelId = sha(JSON.stringify(prisms.map((pr) => [pr.name, facesOf(pr).map((f) => [f.mat, f.v.map((p) => p.map((c) => Math.round(c * 1000)))])])));

// ---------- write everything + manifest ----------
const files = {
  "sheets/01-port-elevation.svg": elevation("port"),
  "sheets/02-starboard-elevation.svg": elevation("starboard"),
  "sheets/03-bow.svg": transverse("bow"),
  "sheets/04-stern.svg": transverse("stern"),
  "sheets/05-plan.svg": plan(false),
  "sheets/06-deck7-arrangement.svg": plan(true),
  "sheets/07-three-quarter-massing.svg": threeQuarter(),
};
files["sheets/08-cabin-7214-plan.svg"] = cabinPlan(); // after plan(true) so cabin locations exist
files["sheets/09-deck4-lounge.svg"] = deck4Plan();
const manifest = {
  specId, generatorId, massingModelId, cameraId, camera: CAMERA, specVersion: V.version, status: V.status, generatedFrom: "design/aurora-tide/vessel.json",
  identity: "specId = vessel.json; generatorId = generate.mjs source (LF-normalised); massingModelId = the generated massing geometry (face vertices rounded to 1 mm, with materials). A generator change that alters geometry changes massingModelId even when specId is unchanged. File hashes below identify each output byte-for-byte. A production model will get its own id, recorded against the specId it was built to.",
  files: {},
};
for (const [rel, content] of Object.entries(files)) { fs.writeFileSync(out(rel), content); manifest.files[rel] = sha(content); }
const model = glb();
fs.writeFileSync(out("model/aurora-tide-massing.glb"), model);
manifest.files["model/aurora-tide-massing.glb"] = sha(model);
manifest.derivedCapacity = derivedCapacity();
manifest.cabin7214 = { location: globalThis.cabinLocations?.[7214] ?? null, ...(() => { const l = cabinLayout(); return { metrics: l.metrics, viewpoints: l.viewpoints }; })() };
manifest.deck7CabinCount = Object.keys(globalThis.cabinLocations ?? {}).length;
{
  const d4 = deck4Layout();
  if (d4.cabins.length !== manifest.derivedCapacity.perDeck[4]) throw new Error(`deck 4 sheet (${d4.cabins.length}) disagrees with capacity rule (${manifest.derivedCapacity.perDeck[4]})`);
  manifest.entertainmentLounge = d4.lounge;
}
manifest.note = "Hashes identify this proposal revision. The approved canonical specId/massingModelId pair is frozen only after owner approval of vessel.json.";
fs.writeFileSync(out("manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ specId, massingModelId, generatorId, cameraId, prisms: prisms.length, glbBytes: model.length, files: Object.keys(manifest.files).length }));

// Optional: export massing faces (plus radomes as 16-gon prisms) for the concept-overlay fit.
if (process.env.WP02_FACES_OUT) {
  const extra = S.radomes.map((r, i) => {
    const pts = Array.from({ length: 16 }, (_, j) => [r.x + (r.diameter / 2) * Math.cos((j / 16) * 2 * Math.PI), r.y + (r.diameter / 2) * Math.sin((j / 16) * 2 * Math.PI)]);
    return { name: `radome${i}`, mat: "superstructure", plan: pts, z0: top(9) + (S.radomePlatformHeight ?? 0), z1: top(9) + (S.radomePlatformHeight ?? 0) + r.diameter };
  });
  const faces = [...prisms, ...extra].flatMap((pr) => facesOf(pr).map((f) => ({ name: pr.name, mat: f.mat, v: f.v })));
  fs.writeFileSync(process.env.WP02_FACES_OUT, JSON.stringify({ specId, massingModelId, faces }));
  console.log("faces exported:", faces.length);
}
