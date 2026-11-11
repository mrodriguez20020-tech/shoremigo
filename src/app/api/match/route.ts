import { EXCURSIONS } from "@/lib/domain/catalog";
import { adventureMatch } from "@/lib/domain/match";
import type { Category } from "@/lib/domain/types";
import { availabilitySnapshot } from "@/lib/server/bookings";
import { body, fail, ok } from "@/lib/server/http";

const CATS: Category[] = ["snorkel", "culture", "nature", "adventure", "sail", "food"];

/** Migo's Adventure Match: deterministic, explainable, inventory- and schedule-aware. */
export async function POST(req: Request) {
  try {
    const b = await body<{ portId: string; vibes: string[]; energy: number; guests: number; budgetUsd: number; maxMinutes: number }>(req);
    const vibes = (Array.isArray(b.vibes) ? b.vibes : []).filter((v): v is Category => CATS.includes(v as Category));
    const energy = Math.min(3, Math.max(1, Math.round(Number(b.energy) || 2))) as 1 | 2 | 3;
    const num = (v: unknown) => (v === undefined || v === null || v === "" || !Number.isFinite(Number(v)) ? undefined : Number(v));
    const snap = await availabilitySnapshot();
    const results = adventureMatch(
      {
        vibes,
        energy,
        portId: typeof b.portId === "string" && b.portId ? b.portId : undefined,
        guests: num(b.guests),
        budgetUsd: num(b.budgetUsd),
        maxMinutes: num(b.maxMinutes),
      },
      EXCURSIONS.map((e) => {
        const s = snap.find((x) => x.excursionId === e.id)!;
        return { excursion: e, seatsLeft: s.seatsLeft, feasibility: s.feasibility.status };
      }),
    );
    return ok({ results });
  } catch (e) {
    return fail(e);
  }
}
