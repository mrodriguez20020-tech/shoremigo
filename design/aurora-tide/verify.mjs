// WP-02 design-control invariants. Run after generate.mjs:  node design/aurora-tide/verify.mjs
// Checks that the recorded decisions, derived figures and generated files agree. Exit code 1 on any failure.
// These are internal-consistency checks of a fictional design, not naval-architecture or safety certification.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const V = JSON.parse(fs.readFileSync(path.join(here, "vessel.json"), "utf8"));
const M = JSON.parse(fs.readFileSync(path.join(here, "manifest.json"), "utf8"));
const sha = (b) => "sha256:" + crypto.createHash("sha256").update(b).digest("hex");
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });

// identity
check("specId matches vessel.json", M.specId === sha(JSON.stringify(V)));
check("generatorId matches generate.mjs (LF-normalised)", M.generatorId === sha(fs.readFileSync(path.join(here, "generate.mjs"), "utf8").replace(/\r\n/g, "\n")));
for (const [rel, h] of Object.entries(M.files)) {
  const buf = fs.readFileSync(path.join(here, rel));
  const asText = rel.endsWith(".svg") ? buf.toString("utf8").replace(/\r\n/g, "\n") : buf;
  check(`file hash ${rel}`, sha(asText) === h);
}

// capacity (D-W02-3/6)
const per = M.derivedCapacity.perDeck;
check("derived staterooms = 104", M.derivedCapacity.staterooms === 104, String(M.derivedCapacity.staterooms));
check("derived guests = 208", M.derivedCapacity.guestsDoubleOccupancy === 208);
check("vessel.json capacity = derived", V.accommodation.staterooms === M.derivedCapacity.staterooms && V.accommodation.guestsDoubleOccupancy === M.derivedCapacity.guestsDoubleOccupancy);
check("breakdown per deck = derived", V.accommodation.breakdown.every((b) => per[b.deck] === b.count), JSON.stringify(per));
check("no Interior Stateroom offered", !V.accommodation.offering.some((o) => /interior/i.test(o.type)));
check("Tidekeeper Suite is a future concept, not offered", !V.accommodation.offering.some((o) => /tidekeeper|suite/i.test(o.type)) && V.accommodation.futureConcepts.some((c) => /tidekeeper/i.test(c.type)));
check("no stateroom type named 'Suite' in the breakdown", !V.accommodation.breakdown.some((b) => /suite/i.test(b.type)));

// Cabin 7214 (D-W02-1/8)
const c = M.cabin7214, loc = V.cabin7214.location, tg = V.cabin7214.designTargets;
check("7214 computed location = vessel.json", c.location && c.location.deck === 7 && c.location.side === "port" && c.location.xFrom === loc.xFrom && c.location.xTo === loc.xTo, JSON.stringify(c.location));
check(`7214 net interior = target ${tg.netInteriorM2} m²`, c.metrics.netInteriorFloorM2 === tg.netInteriorM2, String(c.metrics.netInteriorFloorM2));
check(`7214 balcony = target ${tg.balconyClearM2} m²`, c.metrics.balconyClearM2 === tg.balconyClearM2, String(c.metrics.balconyClearM2));
check(`7214 min clearance ≥ ${tg.minClearanceM} m (fictional design target)`, c.metrics.minClearance >= tg.minClearanceM, String(c.metrics.minClearance));
check("7214 fits the hull (spare > 0)", c.metrics.hullFit && c.metrics.hullFit.spareForStructureAndRisers > 0, JSON.stringify(c.metrics.hullFit));
check("six viewpoints", c.viewpoints.length === 6);

// amenities (D-W02-7)
const am = V.amenityMap;
check("theatre and splash zone removed", ["theatre", "splash"].every((k) => am.removed.some((r) => r.amenity.toLowerCase().includes(k))) && !am.entries.some((e) => /theatre|splash/i.test(e.amenity)));
check("every advertised amenity has a deck and location", am.entries.every((e) => Number.isInteger(e.deck) && e.where));
const lg = M.entertainmentLounge, T1 = V.superstructure.aftTerraceT1;
check("entertainment lounge located on deck 4 aft of first stateroom", lg && lg.deck === 4 && lg.xAft === T1.wallX && lg.xFwd > lg.xAft, JSON.stringify(lg && { xAft: lg.xAft, xFwd: lg.xFwd }));
check("lounge displaces no staterooms", lg.stateroomsDisplaced === 0 && per[4] === 28);
check("lounge listed in amenityMap", am.entries.some((e) => /entertainment lounge/i.test(e.amenity) && e.deck === 4));

// overlay (D-W02-9)
const ovPath = path.join(here, "review/concept-overlay.json");
const ov = JSON.parse(fs.readFileSync(ovPath, "utf8"));
check("overlay is seeded and records its camera", Number.isInteger(ov.seed) && ov.camera && typeof ov.camera.az === "number" && ov.search);
check("overlay was measured on the current massing", ov.massingModelId === M.massingModelId, `${ov.massingModelId?.slice(7, 19)} vs ${M.massingModelId.slice(7, 19)}`);
check("overlay IoU ≥ 0.89", ov.silhouetteIoU >= 0.89, String(ov.silhouetteIoU));

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok || !r.detail ? "" : "  (" + r.detail + ")"}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
