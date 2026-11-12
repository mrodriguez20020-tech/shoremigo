import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { build } from "../scripts/export-vessel-data.mjs";
import { VESSEL_DATA } from "../src/lib/domain/vessel.generated";
import { CABIN_CATEGORIES, DECKS, DEMO_CABIN, DEMO_SHIP, SLOTS, AMENITIES, FUTURE_CONCEPTS } from "../src/lib/domain/ship";

describe("generated vessel adapter (WP-02 canonical spec)", () => {
  it("is regenerated from vessel.json, manifest.json and the GLB without drift", () => {
    const committed = fs.readFileSync("src/lib/domain/vessel.generated.ts", "utf8").replace(/\r\n/g, "\n");
    expect(committed).toBe(build());
  });
  it("carries the approved design basis", () => {
    expect(VESSEL_DATA.vessel).toMatchObject({ lengthM: 158, decks: 9, staterooms: 104, guests: 208, airDraftAboveDWL: 32.1 });
    expect(DECKS.map((d) => d.deck)).toEqual([9, 8, 7, 6, 5, 4, 3]);
    expect(SLOTS).toHaveLength(104);
    expect(DEMO_SHIP.facts.flat().join(" ")).not.toMatch(/1,900|14 \(|11 shown/);
  });
  it("places Signature Cabin 7214 on deck 7 port with the measured plan", () => {
    expect(DEMO_CABIN).toMatchObject({ number: "7214", deck: 7 });
    const c = VESSEL_DATA.cabin7214;
    expect(c.location).toMatchObject({ deck: 7, side: "port", xFrom: 97.6, xTo: 102.2 });
    expect(c.neighbours).toEqual({ aft: 7212, forward: 7302 });
    expect(c.metrics.balconyM2).toBe(9);
    expect(c.viewpoints).toHaveLength(6);
    expect(SLOTS.find((s) => s.num === 7214)).toMatchObject({ deck: 7, side: "port", balconyDepth: 2.1 });
  });
  it("offers only the approved categories and keeps the tapered-balcony variant", () => {
    expect(CABIN_CATEGORIES.map((c) => c.name)).toEqual(["Oceanview Stateroom", "Premium Balcony Stateroom", "Signature Cabin 7214"]);
    expect(CABIN_CATEGORIES.reduce((n, c) => n + (c.id === "signature-7214" ? 0 : c.count), 0)).toBe(104);
    for (const n of [7305, 7306]) expect(SLOTS.find((s) => s.num === n)).toMatchObject({ balconyDepth: 1.86, balconyM2: 7.92 });
    expect(FUTURE_CONCEPTS.map((f) => f.name)).toEqual(["Tidekeeper Suite"]);
    const text = JSON.stringify({ CABIN_CATEGORIES, AMENITIES, DECKS });
    expect(text).not.toMatch(/Interior Stateroom|Theatre|splash|9214/i);
  });
});
