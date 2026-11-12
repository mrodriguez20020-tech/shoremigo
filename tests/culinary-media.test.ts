import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { PHOTO_CREDITS, DRINK_ITEMS, DESSERT_ITEMS, menuItemForGallery, photoFor } from "@/lib/culinary/catalog";
import { DEMO_VENUE } from "@/lib/domain/dining";

describe("culinary provenance and subject boundaries", () => {
  it("binds delivered photographs to recorded commercial licenses, authors and byte identities", () => {
    expect(PHOTO_CREDITS.length).toBe(3);
    for (const p of PHOTO_CREDITS) {
      expect(p.author.length).toBeGreaterThan(2);
      expect(p.license).toMatch(/^CC BY/);
      expect(p.source).toMatch(/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
      expect(Math.max(p.sourceWidth, p.sourceHeight)).toBeGreaterThanOrEqual(2400);
      for (const d of p.derivatives) {
        const bytes = readFileSync(`public${d.path}`);
        expect(createHash("sha256").update(bytes).digest("hex")).toBe(d.sha256);
        expect(bytes.length).toBe(d.bytes);
      }
    }
  });
  it("does not map a photographed guide serving to a differently specified sample menu", () => {
    const item = DEMO_VENUE.sections.find((s) => s.id === "mains")!.items.find((i) => i.dishId === "cochinita")!;
    const gallery = menuItemForGallery(item, "mains");
    expect(gallery.name).toBe("Cochinita pibil tacos");
    expect(gallery.priceCents).toBe(1500);
    expect(photoFor(gallery.id)).toBeUndefined();
    expect(photoFor("cochinita")).toBeDefined();
  });
  it("preserves alcohol labels, vegetarian options and source prices", () => {
    expect(DESSERT_ITEMS.find((d) => d.name === "Caribbean black cake")?.tags).toContain("contains-alcohol");
    expect(DRINK_ITEMS.find((d) => d.name === "Island rum punch")).toMatchObject({ priceCents: 1000, tags: ["contains-alcohol"] });
    const baleada = menuItemForGallery(DEMO_VENUE.sections[0].items[0], "breakfast");
    expect(baleada).toMatchObject({ priceCents: 700, tags: ["local", "vegetarian-option"] });
  });
});
