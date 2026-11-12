"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { CABIN_7214, VESSEL_SOURCE } from "@/lib/domain/ship";

/*
 * Cabin 7214: an interactive spatial schematic built from the provisional WP-02 floor plan.
 * Frame: u along the ship (0 = aft bulkhead centreline … 4.6 forward), w outboard from the corridor wall
 * (0) to the balcony edge, z up. Every surface below is derived from CABIN_7214.layout; the view is a
 * real perspective projection from the six planned viewpoints (eye height 1.6 m). It is a schematic
 * spatial preview, not a photoreal render.
 */

type V3 = [number, number, number];
type Light = "daylight" | "golden hour" | "evening";
type Face = { pts: V3[]; color: string; alpha?: number; glow?: boolean; kind: "floor" | "solid" | "glass" };

const L = CABIN_7214.layout;
const E = CABIN_7214.envelope;
const M = CABIN_7214.metrics;
const U0 = 0.05, U1 = E.moduleWidth - 0.05, WG = E.interiorDepth, WB = E.interiorDepth + E.balconyDepth - 0.05, CEIL = E.clearCeiling;
const r = (k: keyof typeof L.items) => L.items[k].r as readonly [number, number, number, number];

const VIEW_NAMES: Record<string, string> = {
  "V1-entry": "Entrance", "V2-bedside": "Bedside", "V3-living": "Living area",
  "V4-bathroom": "Bathroom", "V5-balcony-out": "Balcony · sea", "V6-balcony-in": "Balcony · looking in",
};

const ZONES = [
  { id: "entrance", name: "Entrance & wardrobe", view: "V1-entry", rect: [2.63, U1, 0, 2.4] },
  { id: "bathroom", name: "Bathroom", view: "V4-bathroom", rect: [U0, 2.55, 0, 2.32] },
  { id: "bedroom", name: "King bedroom", view: "V2-bedside", rect: [U0, U1, 2.4, 4.6] },
  { id: "living", name: "Seating area", view: "V3-living", rect: [U0, U1, 4.6, WG - 0.05] },
  { id: "balcony", name: "Panoramic balcony", view: "V5-balcony-out", rect: [U0, U1, WG + 0.05, WB] },
] as const;
type ZoneId = (typeof ZONES)[number]["id"];

const dim = (k: keyof typeof L.items) => { const [a, b, c, d] = r(k); return `${(b - a).toFixed(2)} × ${(d - c).toFixed(2)} m`; };
const ZONE_INFO: Record<ZoneId, { lines: string[] }> = {
  entrance: { lines: [`Entry door ${(L.entryDoor.u1 - L.entryDoor.u0).toFixed(2)} m clear onto a 1.22 m passage`, `Full-height wardrobe with sliding doors (${dim("wardrobe")})`, "Bathroom door on the left, bedroom straight ahead"] },
  bathroom: { lines: [`${M.bathroomM2.toFixed(2)} m² beside the entry, pocket sliding door`, `Walk-in shower (${dim("shower")}), vanity and WC`] },
  bedroom: { lines: [`King bed ${dim("bed")}, headboard on the bathroom wall, facing the sea`, "Nightstands both sides; desk and stool near the glazing"] },
  living: { lines: ["Sofa, armchair and coffee table at the glazing", `Four 1.15 m sliding glass panels; ${(L.balconyDoorway.u1 - L.balconyDoorway.u0).toFixed(2)} m doorway`] },
  balcony: { lines: [`Private balcony ${M.balconyM2.toFixed(2)} m², ${M.balconyDepthClear.toFixed(2)} m clear`, "Glass balustrade, privacy screens, two chairs and a side table"] },
};

const PALETTE: Record<Light, { skyTop: string; skyLow: string; seaTop: string; seaLow: string; light: number; warm: string; lamps: boolean }> = {
  daylight: { skyTop: "#7cc2e2", skyLow: "#e8f3f2", seaTop: "#2e9ab0", seaLow: "#0f5d78", light: 1, warm: "rgba(255,248,232,0)", lamps: false },
  "golden hour": { skyTop: "#4a5a8c", skyLow: "#f7b47a", seaTop: "#c98a68", seaLow: "#334a6a", light: 0.86, warm: "rgba(255,170,90,0.14)", lamps: false },
  evening: { skyTop: "#0b1530", skyLow: "#2b3b66", seaTop: "#1b2c4c", seaLow: "#08142a", light: 0.5, warm: "rgba(255,190,120,0.10)", lamps: true },
};
// material colours: light oak, warm ivory, champagne hardware, sea-glass accents
const MAT = { oak: "#c9a57c", oakDark: "#9c7a55", ivory: "#efe8dc", wall: "#e9e1d3", ceiling: "#f4efe6", tile: "#dfe3df", teak: "#a77d55", seaGlass: "#7fc8bd", champagne: "#d7bd8c", linen: "#f8f5ef", fabric: "#d9cfc0", glass: "#a9d3df", bulkhead: "#ded5c5" };

function box(u0: number, u1: number, w0: number, w1: number, z0: number, z1: number, color: string, top?: string): Face[] {
  const p = (u: number, w: number, z: number): V3 => [u, w, z];
  return [
    { pts: [p(u0, w0, z1), p(u1, w0, z1), p(u1, w1, z1), p(u0, w1, z1)], color: top ?? color, kind: "solid" },
    { pts: [p(u0, w0, z0), p(u1, w0, z0), p(u1, w0, z1), p(u0, w0, z1)], color, kind: "solid" },
    { pts: [p(u1, w1, z0), p(u0, w1, z0), p(u0, w1, z1), p(u1, w1, z1)], color, kind: "solid" },
    { pts: [p(u0, w1, z0), p(u0, w0, z0), p(u0, w0, z1), p(u0, w1, z1)], color, kind: "solid" },
    { pts: [p(u1, w0, z0), p(u1, w1, z0), p(u1, w1, z1), p(u1, w0, z1)], color, kind: "solid" },
  ];
}
/** Vertical wall in a u or w plane, tiled so painter sorting stays stable inside the room. */
function wall(a: [number, number], b: [number, number], z0: number, z1: number, color: string, kind: Face["kind"] = "solid", alpha?: number): Face[] {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(len / 0.5)), m = Math.max(1, Math.ceil((z1 - z0) / 0.6)), out: Face[] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    const t0 = i / n, t1 = (i + 1) / n, h0 = z0 + ((z1 - z0) * j) / m, h1 = z0 + ((z1 - z0) * (j + 1)) / m;
    const P = (t: number, z: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, z];
    out.push({ pts: [P(t0, h0), P(t1, h0), P(t1, h1), P(t0, h1)], color, kind, alpha });
  }
  return out;
}
function plane(u0: number, u1: number, w0: number, w1: number, z: number, color: string, kind: Face["kind"] = "floor", step = 0.5): Face[] {
  const out: Face[] = [], nu = Math.max(1, Math.ceil((u1 - u0) / step)), nw = Math.max(1, Math.ceil((w1 - w0) / step));
  for (let i = 0; i < nu; i++) for (let j = 0; j < nw; j++) {
    const a = u0 + ((u1 - u0) * i) / nu, b = u0 + ((u1 - u0) * (i + 1)) / nu, c = w0 + ((w1 - w0) * j) / nw, d = w0 + ((w1 - w0) * (j + 1)) / nw;
    out.push({ pts: [[a, c, z], [b, c, z], [b, d, z], [a, d, z]], color: (i + j) % 2 && kind === "floor" ? shade(color, 0.97) : color, kind });
  }
  return out;
}
function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

function buildScene(): Face[] {
  const f: Face[] = [];
  const bd = L.bathroomDoor, ed = L.entryDoor, dw = L.balconyDoorway;
  const bathOut = L.partitions.bathroomOutboardWall.r;
  // floors and ceiling
  f.push(...plane(U0, bd.wallU0, 0, bathOut[2], 0, MAT.tile));
  f.push(...plane(U0, U1, 0, WG - 0.05, 0.001, MAT.oak).filter((q) => !(q.pts[0][0] < bd.wallU0 - 1e-6 && q.pts[0][1] < bathOut[2] - 1e-6)));
  f.push(...plane(U0, U1, WG + 0.05, WB, -0.05, MAT.teak));
  f.push(...plane(U0, U1, 0, WG, CEIL, MAT.ceiling, "solid", 0.6));
  // shell: aft and forward bulkheads, corridor wall with the entry opening, balcony privacy screens
  f.push(...wall([U0, -0.12], [U0, WG], 0, CEIL, MAT.wall), ...wall([U1, WG], [U1, -0.12], 0, CEIL, MAT.wall));
  f.push(...wall([U0, 0], [ed.u0, 0], 0, CEIL, MAT.bulkhead), ...wall([ed.u1, 0], [U1, 0], 0, CEIL, MAT.bulkhead), ...wall([ed.u0, 0], [ed.u1, 0], 2.1, CEIL, MAT.bulkhead));
  f.push(...wall([U0, WG + 0.05], [U0, WB], -0.05, 1.8, MAT.ivory), ...wall([U1, WB], [U1, WG + 0.05], -0.05, 1.8, MAT.ivory));
  // corridor beyond the entry door (centreline corridor, 1.8 m clear), seen only through the door opening
  f.push(...plane(-1, 5.6, -1.92, -0.12, 0.001, MAT.bulkhead, "floor"), ...plane(-1, 5.6, -1.92, -0.12, CEIL, MAT.ceiling, "solid", 0.8), ...wall([5.6, -1.92], [-1, -1.92], 0, CEIL, "#cdbfa8"));
  // bathroom partitions (pocket-door opening kept clear up to 2.1 m)
  f.push(...wall([U0, bathOut[2]], [bathOut[1], bathOut[2]], 0, CEIL, MAT.wall), ...wall([U0, bathOut[3]], [bathOut[1], bathOut[3]], 0, CEIL, MAT.wall));
  for (const u of [bd.wallU0, bd.wallU1]) f.push(...wall([u, 0], [u, bd.w0], 0, CEIL, MAT.wall), ...wall([u, bd.w1], [u, bathOut[2]], 0, CEIL, MAT.wall), ...wall([u, bd.w0], [u, bd.w1], 2.1, CEIL, MAT.wall));
  // furniture
  const [bu0, bu1, bw0, bw1] = r("bed");
  f.push(...box(bu0, bu1, bw0 + 0.08, bw1, 0, 0.55, MAT.linen, MAT.linen), ...box(bu0, bu1, bw0, bw0 + 0.08, 0, 1.15, MAT.oak));
  f.push(...box(bu0 + 0.15, bu0 + 0.85, bw0 + 0.15, bw0 + 0.6, 0.55, 0.7, MAT.ivory), ...box(bu1 - 0.85, bu1 - 0.15, bw0 + 0.15, bw0 + 0.6, 0.55, 0.7, MAT.ivory));
  f.push(...box(bu0, bu1, bw1 - 0.55, bw1, 0.55, 0.6, MAT.seaGlass));
  for (const k of ["nightstandAft", "nightstandFwd"] as const) { const [a, b, c, d] = r(k); f.push(...box(a, b, c, d, 0, 0.55, MAT.oakDark, MAT.oak)); }
  { const [a, b, c, d] = r("sofa"); f.push(...box(a, b, c, d, 0, 0.42, MAT.fabric), ...box(a, a + 0.18, c, d, 0.42, 0.8, MAT.fabric)); }
  { const [a, b, c, d] = r("coffeeTable"); f.push(...box(a, b, c, d, 0.38, 0.42, MAT.oak), ...box(a + 0.05, a + 0.1, c + 0.05, c + 0.1, 0, 0.38, MAT.champagne)); }
  { const [a, b, c, d] = r("armchair"); f.push(...box(a, b, c, d, 0, 0.42, MAT.seaGlass), ...box(a, b, d - 0.15, d, 0.42, 0.8, MAT.seaGlass)); }
  { const [a, b, c, d] = r("desk"); f.push(...box(a, b, c, d, 0.7, 0.75, MAT.oak), ...box(b - 0.06, b, c, d, 0, 0.7, MAT.oakDark)); }
  { const [a, b, c, d] = r("deskStool"); f.push(...box(a, b, c, d, 0, 0.45, MAT.fabric)); }
  { const [a, b, c, d] = r("wardrobe"); f.push(...box(a, b, c, d, 0, 2.3, MAT.oak)); f.push({ pts: [[a - 0.005, c + 0.9, 1.0], [a - 0.005, c + 0.9, 1.3], [a - 0.005, c + 0.92, 1.3], [a - 0.005, c + 0.92, 1.0]], color: MAT.champagne, kind: "solid" }); }
  { const [a, b, c, d] = r("vanity"); f.push(...box(a, b, c, d, 0, 0.85, MAT.ivory, MAT.linen)); }
  { const [a, b, c, d] = r("wc"); f.push(...box(a, b, c, d, 0, 0.42, MAT.linen)); }
  { const [a, b, c, d] = r("shower"); f.push(...plane(a, b, c, d, 0.002, MAT.tile, "floor", 0.4), ...wall([b, c], [b, d], 0, 2.1, MAT.glass, "glass", 0.25), ...wall([a, d], [b, d], 0, 2.1, MAT.glass, "glass", 0.25)); }
  for (const k of ["balconyChairAft", "balconyChairFwd"] as const) { const [a, b, c, d] = r(k); f.push(...box(a, b, c, d, -0.05, 0.4, MAT.ivory), ...box(a, b, d - 0.12, d, 0.4, 0.8, MAT.ivory)); }
  { const [a, b, c, d] = r("balconyTable"); f.push(...box(a, b, c, d, -0.05, 0.55, MAT.champagne)); }
  // glazing line: four 1.15 m panels with champagne mullions; balustrade glass
  for (let i = 0; i <= 4; i++) f.push(...box(i * 1.15 - 0.03, i * 1.15 + 0.03, WG - 0.05, WG + 0.05, 0, CEIL, MAT.champagne));
  f.push(...wall([U0, WG], [dw.u0, WG], 0, CEIL, MAT.glass, "glass", 0.12), ...wall([dw.u1, WG], [U1, WG], 0, CEIL, MAT.glass, "glass", 0.12));
  f.push(...wall([U0, WB], [U1, WB], -0.05, 1.05, MAT.glass, "glass", 0.28), ...box(U0, U1, WB - 0.03, WB + 0.03, 1.02, 1.07, MAT.champagne), ...box(U0, U1, WB - 0.02, WB + 0.02, -0.05, 0.06, MAT.champagne));
  // lamps (glow in the evening state)
  for (const k of ["nightstandAft", "nightstandFwd"] as const) { const [a, b, c, d] = r(k); const cu = (a + b) / 2, cw = (c + d) / 2; f.push({ pts: [[cu - 0.12, cw, 0.6], [cu + 0.12, cw, 0.6], [cu + 0.09, cw, 0.9], [cu - 0.09, cw, 0.9]], color: "#f6e7c8", kind: "solid", glow: true }); }
  return f;
}

type Cam = { u: number; w: number; z: number; lu: number; lw: number; lz: number; fov: number };
// look-at height per viewpoint: the balcony views tilt down to include the deck and balustrade
const FOV: Record<string, number> = { "V5-balcony-out": 92, "V6-balcony-in": 84 };
const LOOK_Z: Record<string, number> = { "V5-balcony-out": -3.2, "V6-balcony-in": 1.15, "V4-bathroom": 1.1 };
const camOf = (id: string): Cam => { const v = CABIN_7214.viewpoints.find((p) => p.id === id)!; return { u: v.u, w: v.w, z: 1.6, lu: v.lookU, lw: v.lookW, lz: LOOK_Z[id] ?? 1.3, fov: FOV[id] ?? 72 }; };

function render(ctx: CanvasRenderingContext2D, W: number, H: number, faces: Face[], cam: Cam, light: Light) {
  const P = PALETTE[light];
  const fwd = [cam.lu - cam.u, cam.lw - cam.w, cam.lz - cam.z], fl = Math.hypot(...fwd); const f = fwd.map((v) => v / fl) as V3;
  let rt: V3 = [f[1], -f[0], 0]; const rl = Math.hypot(...rt); rt = rt.map((v) => v / rl) as V3; // right vector (z-up world)
  const up: V3 = [rt[1] * f[2] - rt[2] * f[1], rt[2] * f[0] - rt[0] * f[2], rt[0] * f[1] - rt[1] * f[0]];
  const focal = (W / 2) / Math.tan((cam.fov * Math.PI) / 360); // horizontal field of view (72° default, wider on the balcony)
  const toCam = (p: V3): V3 => { const d = [p[0] - cam.u, p[1] - cam.w, p[2] - cam.z]; return [d[0] * rt[0] + d[1] * rt[1] + d[2] * rt[2], d[0] * up[0] + d[1] * up[1] + d[2] * up[2], d[0] * f[0] + d[1] * f[1] + d[2] * f[2]]; };
  const scr = (c: V3): [number, number] => [W / 2 + (c[0] / c[2]) * focal, H / 2 - (c[1] / c[2]) * focal];
  // sky and sea: horizon where the view direction is level at eye height
  const horizonDir = toCam([cam.u + f[0] * 1e4, cam.w + f[1] * 1e4, cam.z]);
  const hy = Math.max(-H, Math.min(2 * H, scr(horizonDir)[1]));
  let g = ctx.createLinearGradient(0, 0, 0, hy); g.addColorStop(0, P.skyTop); g.addColorStop(1, P.skyLow); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Math.max(0, hy));
  g = ctx.createLinearGradient(0, hy, 0, H); g.addColorStop(0, P.seaTop); g.addColorStop(1, P.seaLow); ctx.fillStyle = g; ctx.fillRect(0, Math.max(0, hy), W, H);
  if (light === "golden hour") { const sx = W * 0.62; const rg = ctx.createRadialGradient(sx, hy - 6, 2, sx, hy - 6, H * 0.35); rg.addColorStop(0, "rgba(255,226,170,.95)"); rg.addColorStop(1, "rgba(255,180,110,0)"); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); }
  if (light === "evening") { ctx.fillStyle = "rgba(255,255,255,.7)"; for (let i = 0; i < 40; i++) { const x = (i * 97.3) % W, y = ((i * 53.7) % Math.max(1, hy * 0.8)); ctx.fillRect(x, y, 1.2, 1.2); } }
  // project, clip against the near plane, sort far-to-near
  const near = 0.06;
  const proj = faces.map((face) => {
    const cs = face.pts.map(toCam), out: V3[] = [];
    for (let i = 0; i < cs.length; i++) { const a = cs[i], b = cs[(i + 1) % cs.length]; if (a[2] >= near) out.push(a); if ((a[2] >= near) !== (b[2] >= near)) { const t = (near - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, near]); } }
    if (out.length < 3) return null;
    const depth = cs.reduce((s, c) => s + Math.hypot(c[0], c[1], c[2]), 0) / cs.length;
    const n = (() => { const [a, b, c] = face.pts; const u1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], u2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]; const nn = [u1[1] * u2[2] - u1[2] * u2[1], u1[2] * u2[0] - u1[0] * u2[2], u1[0] * u2[1] - u1[1] * u2[0]]; const l = Math.hypot(...nn) || 1; return nn.map((v) => Math.abs(v / l)); })();
    return { face, pts: out.map(scr), depth, n };
  }).filter(Boolean) as { face: Face; pts: [number, number][]; depth: number; n: number[] }[];
  proj.sort((a, b) => { const fa = a.face.kind === "floor" ? 0 : 1, fb = b.face.kind === "floor" ? 0 : 1; return fa - fb || b.depth - a.depth; });
  for (const { face, pts, depth, n } of proj) {
    const orient = 0.82 + 0.18 * n[2] + 0.06 * n[0];
    const k = (face.glow && P.lamps ? 1.25 : P.light * orient) * (1 - Math.min(0.18, depth * 0.012));
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
    const col = shade(face.color, k);
    ctx.globalAlpha = face.alpha ?? 1; ctx.fillStyle = col; ctx.fill();
    if (face.kind !== "glass") { ctx.strokeStyle = col; ctx.lineWidth = 0.6; ctx.stroke(); }
    ctx.globalAlpha = 1;
    if (face.glow && P.lamps) { const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length; const rg = ctx.createRadialGradient(cx, cy, 2, cx, cy, 160 / Math.max(0.8, depth)); rg.addColorStop(0, "rgba(255,214,150,.55)"); rg.addColorStop(1, "rgba(255,214,150,0)"); ctx.fillStyle = rg; ctx.fillRect(cx - 400, cy - 400, 800, 800); }
  }
  ctx.fillStyle = P.warm; ctx.fillRect(0, 0, W, H);
}

export function Cabin7214Experience() {
  const reduced = useReducedMotion();
  const canvas = useRef<HTMLCanvasElement>(null);
  const faces = useMemo(buildScene, []);
  const [view, setView] = useState("V1-entry");
  const [light, setLight] = useState<Light>("daylight");
  const [zone, setZone] = useState<ZoneId>("entrance");
  const cam = useRef<Cam>(camOf("V1-entry"));
  const anim = useRef(0);

  const draw = useCallback(() => {
    const c = canvas.current; if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = c.clientWidth, H = c.clientHeight;
    if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render(ctx, W, H, faces, cam.current, light);
  }, [faces, light]);

  useEffect(() => {
    const target = camOf(view), from = { ...cam.current };
    cancelAnimationFrame(anim.current);
    if (reduced) { cam.current = target; draw(); return; }
    const t0 = performance.now(), dur = 900;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / dur), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      cam.current = Object.fromEntries(Object.keys(from).map((k) => [k, from[k as keyof Cam] + (target[k as keyof Cam] - from[k as keyof Cam]) * e])) as Cam;
      draw();
      if (t < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(anim.current);
  }, [view, reduced, draw]);

  useEffect(() => { draw(); const ro = new ResizeObserver(() => draw()); if (canvas.current) ro.observe(canvas.current); return () => ro.disconnect(); }, [draw]);

  const views = CABIN_7214.viewpoints;
  const pick = (id: string) => { setView(id); const z = ZONES.find((q) => q.view === id) ?? ZONES.find((q) => id.startsWith("V6") && q.id === "balcony"); if (z) setZone(z.id); };
  const pickZone = (id: ZoneId) => { setZone(id); setView(ZONES.find((q) => q.id === id)!.view); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = views.findIndex((v) => v.id === view), n = (i + (e.key === "ArrowRight" ? 1 : -1) + views.length) % views.length;
    pick(views[n].id);
  };
  const vp = views.find((v) => v.id === view)!;
  const zoneDef = ZONES.find((q) => q.id === zone)!;

  // floor plan (u across, w downward toward the sea)
  const k = 46, ox = 22, oy = 18, X = (u: number) => ox + u * k, Y = (w: number) => oy + w * k;
  const rect = (q: readonly number[]) => ({ x: X(q[0]), y: Y(q[2]), width: (q[1] - q[0]) * k, height: (q[3] - q[2]) * k });

  return (
    <div className="cabin-experience grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start" data-cabin="7214">
      <div className="surface overflow-hidden rounded-[28px]">
        <div className="relative aspect-[16/9] w-full bg-[#081e27]" tabIndex={0} onKeyDown={onKey} aria-label={`Cabin 7214 spatial view: ${VIEW_NAMES[view]}. Use the left and right arrow keys to change viewpoint.`} role="group">
          <canvas ref={canvas} className="h-full w-full" aria-hidden data-view={view} data-light={light} />
          <span className="demo-tag absolute left-4 top-4">Interactive schematic · from the provisional plan</span>
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
            <div className="rounded-2xl bg-[#081e27]/80 px-4 py-3 backdrop-blur" aria-live="polite">
              <p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">{vp.id.split("-")[0]} · {VIEW_NAMES[view]}</p>
              <p className="mt-0.5 max-w-md text-sm text-white/85">{vp.note}</p>
            </div>
            <div className="flex gap-1 rounded-full bg-[#081e27]/80 p-1 backdrop-blur" role="radiogroup" aria-label="Lighting">
              {(["daylight", "golden hour", "evening"] as Light[]).map((l) => (
                <button key={l} role="radio" aria-checked={light === l} onClick={() => setLight(l)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${light === l ? "bg-accent text-accent-ink" : "text-white/80"}`}>
                  {l === "golden hour" ? "Sunset" : l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 p-4" role="tablist" aria-label="Cabin 7214 viewpoints">
          {views.map((v) => (
            <button key={v.id} role="tab" aria-selected={view === v.id} onClick={() => pick(v.id)} className={`btn !py-1.5 text-xs ${view === v.id ? "btn-primary" : "btn-ghost"}`}>
              {v.id.split("-")[0]} · {VIEW_NAMES[v.id]}
            </button>
          ))}
        </div>
      </div>

      <aside className="surface rounded-[28px] p-5">
        <p className="eyebrow">Cabin {CABIN_7214.number} · Deck {CABIN_7214.location.deck} port</p>
        <h3 className="font-display mt-1 text-2xl">{CABIN_7214.class}</h3>
        <svg viewBox={`0 0 ${X(E.moduleWidth) + 22} ${Y(E.interiorDepth + E.balconyDepth) + 22}`} className="mt-4 w-full" role="group" aria-label="Cabin 7214 floor plan: choose a zone">
          <rect x={X(0)} y={Y(0)} width={E.moduleWidth * k} height={E.interiorDepth * k} fill="#f6f1e6" opacity=".12" />
          <rect x={X(0)} y={Y(WG + 0.05)} width={E.moduleWidth * k} height={(WB - WG - 0.05) * k} fill="#c9a77d" opacity=".25" />
          {ZONES.map((z) => (
            <rect key={z.id} {...rect(z.rect)} role="button" tabIndex={0} aria-label={z.name} aria-pressed={zone === z.id}
              onClick={() => pickZone(z.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), pickZone(z.id))}
              className="cursor-pointer outline-none" fill={zone === z.id ? "#40c7c5" : "transparent"} fillOpacity={zone === z.id ? 0.28 : 0} stroke={zone === z.id ? "#40c7c5" : "transparent"} />
          ))}
          {Object.entries(L.items).map(([id, it]) => <rect key={id} {...rect(it.r)} fill={id === "bed" ? "#f8f5ef" : id === "wardrobe" ? "#c9a57c" : "#d9cfc0"} opacity=".85" pointerEvents="none" />)}
          {[L.partitions.bathroomOutboardWall.r, [L.bathroomDoor.wallU0, L.bathroomDoor.wallU1, 0, L.bathroomDoor.w0], [L.bathroomDoor.wallU0, L.bathroomDoor.wallU1, L.bathroomDoor.w1, 2.32]].map((q, i) => <rect key={i} {...rect(q)} fill="#e9e1d3" pointerEvents="none" />)}
          <line x1={X(0)} y1={Y(WG)} x2={X(E.moduleWidth)} y2={Y(WG)} stroke="#a9d3df" strokeWidth="3" />
          <path d={`M ${X(L.entryDoor.hingeU + L.entryDoor.leaf)} ${Y(0)} A ${L.entryDoor.leaf * k} ${L.entryDoor.leaf * k} 0 0 1 ${X(L.entryDoor.hingeU)} ${Y(L.entryDoor.leaf)}`} fill="none" stroke="#e8c895" strokeDasharray="3 3" pointerEvents="none" />
          {views.map((v) => {
            const a = Math.atan2(v.lookW - v.w, v.lookU - v.u), on = v.id === view;
            return (
              <g key={v.id} pointerEvents="none">
                {on && <path d={`M ${X(v.u)} ${Y(v.w)} L ${X(v.u) + Math.cos(a - 0.6) * 60} ${Y(v.w) + Math.sin(a - 0.6) * 60} L ${X(v.u) + Math.cos(a + 0.6) * 60} ${Y(v.w) + Math.sin(a + 0.6) * 60} Z`} fill="#e8c895" opacity=".35" />}
                <circle cx={X(v.u)} cy={Y(v.w)} r={on ? 7 : 5} fill={on ? "#e8c895" : "#7fc8bd"} stroke="#081e27" />
              </g>
            );
          })}
          <text x={X(0.1)} y={Y(-0.12) - 4} fontSize="10" fill="currentColor" opacity=".6">corridor</text>
          <text x={X(0.1)} y={Y(E.interiorDepth + E.balconyDepth) + 14} fontSize="10" fill="currentColor" opacity=".6">sea</text>
        </svg>
        <div className="mt-4" aria-live="polite" data-migo-avoid>
          <p className="font-display text-xl">{zoneDef.name}</p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
            {ZONE_INFO[zone].lines.map((t) => <li key={t} className="flex gap-2"><span className="text-accent">◆</span>{t}</li>)}
          </ul>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm" data-migo-avoid>
          <div><dt className="text-[10px] font-bold tracking-[0.18em] text-ink-soft uppercase">Interior (net)</dt><dd className="font-semibold">{M.netFloorM2.toFixed(2)} m²</dd></div>
          <div><dt className="text-[10px] font-bold tracking-[0.18em] text-ink-soft uppercase">Balcony</dt><dd className="font-semibold">{M.balconyM2.toFixed(2)} m²</dd></div>
          <div><dt className="text-[10px] font-bold tracking-[0.18em] text-ink-soft uppercase">Neighbours</dt><dd className="font-semibold">{CABIN_7214.neighbours.aft} · {CABIN_7214.neighbours.forward}</dd></div>
          <div><dt className="text-[10px] font-bold tracking-[0.18em] text-ink-soft uppercase">Materials</dt><dd className="font-semibold capitalize">{CABIN_7214.materials.slice(0, 2).join(", ")}</dd></div>
        </dl>
        <p className="mt-4 text-[11px] leading-relaxed text-ink-soft">
          Built from the provisional Cabin 7214 plan ({VESSEL_SOURCE.specVersion}, under independent review). A schematic spatial preview, not a photoreal render or a bookable cabin.
        </p>
      </aside>
    </div>
  );
}
