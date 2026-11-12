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
// Geometry identity = canonical JSON (key order as authored, whitespace-insensitive).
const geometryId = sha(JSON.stringify(V));

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
const SHEER = [[0, 11.0], [30, 12.6], [100, 12.9], [130, 15.5], [P.lengthOverall, H.bowSheerTopZ]];
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
  <text x="24" y="${h - 14}" fill="#c9d6d9" font-size="12">${esc(sub)} · PROPOSED geometry ${esc(V.version)} · ${geometryId.slice(0, 23)}… · design-control drawing, not a render · ${esc(scaleNote ?? "")}</text>
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
  b += `<rect x="${Math.min(X(S.aftTerraceT1.wallX), X(30))}" y="${Z(deckZ[4] + 2.4)}" width="${Math.abs(X(30) - X(S.aftTerraceT1.wallX))}" height="${1.4 * k}" fill="${C.glazing}"/>`;
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
  const F = S.funnel, fb = top(8);
  b += poly([[X(F.x), Z(fb)], [X(F.x + F.length), Z(fb)], [X(F.x + F.length - 4), Z(F.topZ - 1.2)], [X(F.x + 2), Z(F.topZ - 1.2)]], C.funnelCasing, "#0e1826", 1);
  for (let i = 0; i < 6; i++) b += line(X(F.x + 1.5), Z(fb + 1 + i * 0.9), X(F.x + F.length - 2.5 - i * 0.4), Z(fb + 1 + i * 0.9), "#33465e", 0.8);
  for (let i = 0; i < F.exhausts; i++) b += `<rect x="${Math.min(X(F.x + 3 + i * 2.4), X(F.x + 4.2 + i * 2.4))}" y="${Z(F.topZ + 1.2)}" width="${1.2 * k}" height="${2.4 * k}" fill="${C.exhaust}"/>`;
  // radomes + mast
  for (const r of S.radomes) b += `<circle cx="${X(r.x)}" cy="${Z(top(9) + r.diameter / 2)}" r="${(r.diameter / 2) * k}" fill="#ffffff" stroke="#b9b2a4"/>`;
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
  for (const r of S.radomes) b += `<circle cx="${Y(r.y)}" cy="${Z(top(9) + r.diameter / 2)}" r="${(r.diameter / 2) * k}" fill="#fff" stroke="#b9b2a4"/>`;
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
  b += text(40, 46, "DECK 7 'MERIDIAN' ARRANGEMENT — schematic. Highlighted: Option A location for the demo cabin (7214, port, zone 2 midship). Owner decision required on the 9214 number.", 15, "#0d2f43", 'font-weight="700"');
  b += text(40, 70, `Module ${m.width} m × ${m.depthInterior} m interior + ${m.balconyDepth} m balcony (proposal). Numbering convention assumed: even = port, zone 1 aft / 2 midship / 3 forward.`, 12, "#4b5d63");
  return sheet({ title: "deck 7 arrangement", sub: "schematic cabin layout", w: W, h: Hh, body: b, scaleNote: "1 m = 13.2 px" });
}

// ---------- derived accommodation (same module/core rule as the deck 7 sheet) ----------
const CORES = [[44, 52], [86, 92], [118, 124]];
function cabinsOnDeck(fromX, toX) {
  const m = V.accommodation.unitModule; let n = 0;
  for (let x = fromX + 3; x + m.width <= toX - 8; x += m.width) if (!CORES.some(([a, f]) => x + m.width > a && x < f)) n += 2;
  return n;
}
function derivedCapacity() {
  const lv = Object.fromEntries(S.levels.map((l) => [l.deck, l]));
  const g5 = S.glazingBands.find((b) => b.deck === 5);
  const decks = { 4: cabinsOnDeck(S.aftTerraceT1.wallX + 11, 132), 5: cabinsOnDeck(g5.fromX, g5.toX + 2), 6: cabinsOnDeck(lv[6].aftWallX, lv[6].foreX), 7: cabinsOnDeck(lv[7].aftWallX, lv[7].foreX) };
  const staterooms = Object.values(decks).reduce((a, b) => a + b, 0);
  return { rule: "4.6 m modules both sides of a central corridor, 3 m aft clearance, 8 m forward clearance, three vertical cores skipped", perDeck: decks, staterooms, guestsDoubleOccupancy: staterooms * 2 };
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
prisms.push({ name: "hull", mat: "hull", plan: hullPlan(), z0: P.waterlineZ, z1: 12.9 });
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
prisms.push({ name: "funnel", mat: "funnel", plan: rect(S.funnel.x, S.funnel.x + S.funnel.length, -3, 3), z0: top(8), z1: S.funnel.topZ - 1.2 });
for (let i = 0; i < S.funnel.exhausts; i++) prisms.push({ name: `exhaust${i}`, mat: "exhaust", plan: rect(S.funnel.x + 3 + i * 2.4, S.funnel.x + 4.2 + i * 2.4, -0.6, 0.6), z0: S.funnel.topZ - 1.2, z1: S.funnel.topZ + 1.2 });
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
  const gltf = { asset: { version: "2.0", generator: "ShoreMigo WP-02 massing generator", extras: { geometryId, fictional: true, status: V.status } }, scene: 0, scenes: [{ nodes: meshes.map((_, i) => i) }], nodes: meshes.map((m, i) => ({ mesh: i, name: m.name })), meshes, materials, accessors, bufferViews: views, buffers: [{ byteLength: bin.length }] };
  let json = Buffer.from(JSON.stringify(gltf));
  while (json.length % 4) json = Buffer.concat([json, Buffer.from(" ")]);
  const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(json.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jh, json, bh, bin]);
}

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
const manifest = { geometryId, cameraId, camera: CAMERA, specVersion: V.version, status: V.status, generatedFrom: "design/aurora-tide/vessel.json", files: {} };
for (const [rel, content] of Object.entries(files)) { fs.writeFileSync(out(rel), content); manifest.files[rel] = sha(content); }
const model = glb();
fs.writeFileSync(out("model/aurora-tide-massing.glb"), model);
manifest.files["model/aurora-tide-massing.glb"] = sha(model);
manifest.derivedCapacity = derivedCapacity();
manifest.cabin7214 = globalThis.cabinLocations?.[7214] ?? null;
manifest.deck7CabinCount = Object.keys(globalThis.cabinLocations ?? {}).length;
manifest.note = "Hashes identify this proposal revision. The approved canonical geometryId is issued only after owner approval of vessel.json.";
fs.writeFileSync(out("manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ geometryId, cameraId, prisms: prisms.length, glbBytes: model.length, files: Object.keys(manifest.files).length }));
