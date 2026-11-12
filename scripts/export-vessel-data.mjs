// Generates src/lib/domain/vessel.generated.ts from the WP-02 canonical design-control outputs:
// design/aurora-tide/vessel.json (spec), manifest.json (derived slots, cabin metrics) and the massing GLB
// (side profile and deck outlines are sliced from the GLB solids, so the app draws the same geometry).
//   node scripts/export-vessel-data.mjs          write the adapter
//   node scripts/export-vessel-data.mjs --check  exit 1 if the committed adapter is stale
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const D = path.join(root, "design/aurora-tide");
const OUT = path.join(root, "src/lib/domain/vessel.generated.ts");
const r2 = (v) => Math.round(v * 100) / 100;

function parseGlb(buf) {
  const jsonLen = buf.readUInt32LE(12), gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));
  const binStart = 20 + jsonLen + 8, bin = buf.subarray(binStart, binStart + buf.readUInt32LE(20 + jsonLen));
  const acc = (i) => { const a = gltf.accessors[i], bv = gltf.bufferViews[a.bufferView], n = a.count * (a.type === "VEC3" ? 3 : 1); const ab = bin.buffer.slice(bin.byteOffset + bv.byteOffset, bin.byteOffset + bv.byteOffset + bv.byteLength); return a.componentType === 5125 ? new Uint32Array(ab, 0, n) : new Float32Array(ab, 0, n); };
  return gltf.meshes.map((m) => {
    const p = m.primitives[0], idx = acc(p.indices), pos = acc(p.attributes.POSITION);
    const v = (i) => [pos[i * 3], -pos[i * 3 + 2], pos[i * 3 + 1]]; // glTF (x, z, -y) -> vessel (x, y, z)
    const tris = []; for (let t = 0; t < idx.length; t += 3) tris.push([v(idx[t]), v(idx[t + 1]), v(idx[t + 2])]);
    return { name: m.name, material: gltf.materials[p.material].name, tris };
  });
}
function sliceX(tris, x0) {
  const pts = [];
  for (const t of tris) {
    const d = t.map((p) => p[0] - x0), seg = [];
    for (let e = 0; e < 3; e++) { const a = t[e], b = t[(e + 1) % 3], da = d[e], db = d[(e + 1) % 3]; if (da === 0) seg.push([a[1], a[2]]); if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const s = da / (da - db); seg.push([a[1] + s * (b[1] - a[1]), a[2] + s * (b[2] - a[2])]); } }
    if (seg.length >= 2) pts.push(seg[0], seg[1]);
  }
  return pts; // [y, z] points on the cut
}
const yAtZ = (pts, z0) => { const ys = []; for (let i = 0; i < pts.length; i += 2) { const a = pts[i], b = pts[i + 1]; if ((a[1] - z0) * (b[1] - z0) > 0) continue; if (a[1] === b[1]) { ys.push(a[0], b[0]); continue; } const s = (z0 - a[1]) / (b[1] - a[1]); ys.push(a[0] + s * (b[0] - a[0])); } return ys; };
const xRange = (m) => { let a = Infinity, b = -Infinity; for (const t of m.tris) for (const p of t) { a = Math.min(a, p[0]); b = Math.max(b, p[0]); } return [a, b]; };
const samples = (a, b, step) => { const s = []; const n = Math.max(2, Math.ceil((b - a) / step)); for (let i = 0; i <= n; i++) s.push(a + ((b - a) * i) / n); s[0] += 1e-4; s[n] -= 1e-4; return s; };

export function build() {
  const V = JSON.parse(fs.readFileSync(path.join(D, "vessel.json"), "utf8"));
  const M = JSON.parse(fs.readFileSync(path.join(D, "manifest.json"), "utf8"));
  const meshes = parseGlb(fs.readFileSync(path.join(D, "model/aurora-tide-massing.glb")));
  const byName = Object.fromEntries(meshes.map((m) => [m.name, m]));
  const deckZ = Object.fromEntries(V.decks.map((d) => [d.deck, d.z]));

  // port-side elevation silhouette of every port-visible solid (min/max z at each station)
  const order = (n) => [/^hull|^bulwark/, /^deck4Enclosure/, /^terrace/, /^deck\d/, /^sunDeck/, /^windscreen/, /^funnelCasing/, /^funnel$/, /^exhaust/, /^radomeMast/, /^radome\d/, /^mast/, /^glazing/, /^lifeboat/].findIndex((r) => r.test(n));
  const profile = meshes
    .filter((m) => !/S$/.test(m.name) && order(m.name) >= 0)
    .sort((a, b) => order(a.name) - order(b.name))
    .map((m) => {
      const [a, b] = xRange(m), top = [], bot = [];
      for (const x of samples(a, b, /^radomed/.test(m.name) ? 0.25 : /^(exhaust|mast|lifeboat)/.test(m.name) ? 0.5 : 1.5)) { const zs = sliceX(m.tris, x).map((p) => p[1]); if (!zs.length) continue; top.push([r2(x), r2(Math.max(...zs))]); bot.push([r2(x), r2(Math.min(...zs))]); }
      return { solid: m.name, material: m.material, points: [...top, ...bot.reverse()] };
    });

  // plan outlines (port half-breadth along x) at each deck
  const planLine = (mesh, z, a, b, inset = 0) => samples(a, b, 1.5).map((x) => { const ys = (z == null ? sliceX(mesh.tris, x).map((p) => p[0]) : yAtZ(sliceX(mesh.tris, x), z)); return ys.length ? [r2(x), r2(Math.max(...ys) - inset)] : null; }).filter(Boolean);
  const hull = byName.hull, L = Object.fromEntries(V.superstructure.levels.map((l) => [l.deck, l]));
  const outlines = {
    hull: planLine(hull, null, ...xRange(hull)),
    3: planLine(hull, deckZ[3] + 0.01, ...xRange(hull)),
    4: planLine(hull, deckZ[4] + 0.01, V.superstructure.aftTerraceT1.aftX, 140, V.accommodation.deck4.hullLining),
    ...Object.fromEntries([5, 6, 7, 8].map((d) => [d, planLine(byName[`deck${d}`], deckZ[d] + 1.0, L[d].aftWallX, L[d].foreX)])),
    9: planLine(byName.sunDeck9, null, L[9].aftWallX, L[9].foreX),
  };

  const slots = M.slots;
  const countBy = (pred) => slots.filter(pred).length;
  const c = V.cabin7214, cm = M.cabin7214;
  const data = {
    source: { specId: M.specId, massingModelId: M.massingModelId, specVersion: V.version, status: V.status, generatedFrom: "design/aurora-tide/{vessel.json,manifest.json,model/aurora-tide-massing.glb}" },
    vessel: {
      name: V.identity.name, type: V.identity.type, fictional: true, lengthM: V.principal.lengthOverall, beamM: V.principal.beam, draftM: V.principal.draft,
      waterlineZ: V.principal.waterlineZ, airDraftAboveDWL: V.principal.airDraft.aboveDWL, decks: V.decks.length, staterooms: M.capacity.slots, guests: M.capacity.guestsDoubleOccupancy, crew: V.accommodation.crew,
      palette: V.identity.palette,
    },
    decks: V.decks.map((d) => ({ deck: d.deck, name: d.name, z: d.z, visible: d.visible, use: d.use, observed: d.observedFeature ?? null })),
    amenities: V.amenityMap.entries.map((e) => ({ name: e.amenity, deck: e.deck, where: e.where, provisional: !!e.status })),
    removedAmenities: V.amenityMap.removed.map((r) => ({ name: r.amenity, replacement: r.replacement })),
    lounge: M.entertainmentLounge,
    cores: V.accommodation.cores, corridorHalfWidth: V.accommodation.corridorHalfWidth,
    categories: [
      { id: "oceanview", name: "Oceanview Stateroom", decks: [4], count: countBy((s) => s.deck === 4), interiorM2: c.envelope.moduleWidth * c.envelope.interiorDepth, balconyM2: 0, beds: "King or twin (illustrative)", available: true },
      { id: "premium-balcony", name: "Premium Balcony Stateroom", decks: [5, 6, 7], count: countBy((s) => s.deck >= 5), interiorM2: c.envelope.moduleWidth * c.envelope.interiorDepth, balconyM2: cm.metrics.balconyClearM2, beds: "King bed", available: true, variants: V.accommodation.cabinVariants.map((v) => ({ cabins: v.nums, name: v.type, balconyDepth: v.balconyDepth, balconyM2: slots.find((s) => s.num === v.nums[0]).balconyClearM2 })) },
      { id: "signature-7214", name: "Signature Cabin 7214", decks: [7], count: 1, interiorM2: cm.metrics.netFloorM2, balconyM2: cm.metrics.balconyClearM2, beds: "King bed", available: true },
    ],
    futureConcepts: V.accommodation.futureConcepts.map((f) => ({ name: f.type, status: f.status })),
    removedCategories: V.accommodation.removed.map((r) => r.type),
    slots: slots.map((s) => ({ num: s.num, deck: s.deck, side: s.side, xFrom: s.xFrom, xTo: s.xTo, type: s.type, balconyDepth: s.balconyDepth, balconyM2: s.balconyClearM2 })),
    profile, outlines,
    cabin7214: {
      number: "7214", formerNumber: c.formerDesignation, class: c.class, location: cm.location, neighbours: cm.neighbours,
      envelope: { moduleWidth: c.envelope.moduleWidth, interiorDepth: c.envelope.interiorDepth, balconyDepth: c.envelope.balconyDepth, clearCeiling: c.envelope.clearCeiling },
      layout: { entryDoor: c.layout.entryDoor, bathroomDoor: c.layout.bathroomDoor, balconyDoorway: c.layout.balconyDoorway, partitions: c.layout.partitions, items: c.layout.items },
      viewpoints: c.layout.viewpoints.map((v) => ({ id: v.id, u: v.u, w: v.w, lookU: v.lookU, lookW: v.lookW, note: v.note })),
      metrics: { grossModuleM2: cm.metrics.grossModuleM2, netFloorM2: cm.metrics.netFloorM2, bathroomM2: cm.metrics.bathroomInternalM2, roomM2: cm.metrics.roomExclBathAndWardrobeM2, balconyM2: cm.metrics.balconyClearM2, balconyDepthClear: cm.metrics.balconyClearDepth, primaryRoute: cm.metrics.primaryRouteBottleneck, secondaryAccess: cm.metrics.secondaryAccessBottleneck },
      materials: c.programme.materials, lightingStates: c.programme.lightingStates,
    },
  };
  return `// GENERATED by scripts/export-vessel-data.mjs from the WP-02 canonical design-control outputs. Do not edit by hand.
// Provisional design-control data for the FICTIONAL Aurora Tide (spec ${V.version}); not a production model or render.
/* eslint-disable */
export const VESSEL_DATA = ${JSON.stringify(data)} as const;
export type VesselData = typeof VESSEL_DATA;
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const text = build();
  if (process.argv.includes("--check")) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8").replace(/\r\n/g, "\n") : "";
    if (cur !== text) { console.error("vessel.generated.ts is stale: run node scripts/export-vessel-data.mjs"); process.exit(1); }
    console.log("vessel adapter up to date");
  } else { fs.writeFileSync(OUT, text); console.log("wrote", path.relative(root, OUT), (text.length / 1024).toFixed(1), "KB"); }
}
