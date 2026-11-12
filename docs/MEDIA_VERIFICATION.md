# Media verification — `feat/shoremigo-product-completion`

Run 2026-11-12 against the production build (`next build` + `next start`, isolated data dir), headless Chrome.
Method: bounded per-route and per-asset timeouts (navigation 30–60 s, video playback 20 s), 2–4 routes concurrently, one retry, assets that passed were not retested. Raw output: `work/media-inventory.json`, `work/media-verify-2.json` (untracked).

## Inventory

| Asset group | Host | Count | Status | Evidence |
|---|---|---|---|---|
| Excursion editorial photographs (12 excursions; list + detail) | thumb.wikimedia.org | 12 | VERIFIED | decoded, naturalWidth > 0 on `/excursions` and each `/excursions/<id>` |
| Discovery photographs (reef, canopy) | thumb.wikimedia.org | 2 | VERIFIED | decoded at 1280 px |
| Culinary editorial photographs (remote) | upload/thumb.wikimedia.org | 4 | VERIFIED | decoded on `/taste` |
| Local images (posters, culinary webp, ship/cabin art) | same origin | 16 | VERIFIED | decoded |
| Discovery film — reef (Underwater_Videos.webm) | upload.wikimedia.org | 1 | VERIFIED | opt-in load, readyState 4, 1280×960, currentTime advanced |
| Discovery film — canopy (Leafcutter_ants_on_the_move.webm) | upload.wikimedia.org | 1 | VERIFIED | opt-in load, readyState 4, 1920×1080, currentTime advanced |
| Home cinematic film (day / sunset) | same origin | 0 delivered | REQUIRES REPLACEMENT (by design) | `public/cinematic/film/manifest.json` status `awaiting-production-media`; backdrop correctly holds `poster-only`; poster decoded (1254 px) = FALLBACK VERIFIED |

No asset FAILED. No EXTERNAL HOST UNAVAILABLE after retry. (Pass 1 reported one home "video timeout": the verifier forced `play()` on an intentionally source-less `<video>`; re-checked through the component's own `data-media-state`.)

## Fallback (Wikimedia blocked)

Defect found and fixed: with the host unreachable, all 12 excursion slots, the discovery photos and culinary photos showed **broken images** instead of the designed fallback. Cause: SSR `<img>` failed before hydration, so React's `onError` never fired. Fix: `src/lib/client/useImageFallback.ts` (ref callback inspects `complete && naturalWidth === 0` on attach, plus `onError`), used by `ExcursionPhoto`, `DiscoveryPhoto`, `CulinaryMedia`.

After fix — FALLBACK VERIFIED: `/excursions` 12/12 illustration, detail 1/1 illustration, discovery photo shows "Photograph temporarily unavailable" with credit retained, film shows "Video temporarily unavailable" after play, `/taste` 0 broken (local photographs unaffected). Regression test: `tests/browser/media-fallback.spec.ts` (3 tests).

## Residual risk

All editorial media is hotlinked from Wikimedia (no self-hosting, CC BY/BY-SA attribution shown). Availability depends on that host; the fallback above keeps every page usable and honest. Some photographs are destination-representative, not the exact listed location (e.g. coz-afternoon-reef: Abacos; roa-canopy: Costa Rica; roa-garifuna: Belize) and are labeled with their true location.
