import { it,expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import manifest from "../docs/migo/ASSET_MANIFEST.json";

it("preserves all eight approved source-image bytes from the integration reference",()=>{
 expect(manifest.rigAvailable).toBe(false);expect(manifest.files).toHaveLength(8);
 for(const asset of manifest.files)expect(createHash('sha256').update(readFileSync(asset.path)).digest('hex')).toBe(asset.sha256);
});
