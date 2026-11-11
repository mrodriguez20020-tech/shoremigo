import type { Category, Excursion, FeasibilityStatus } from "./types";

export interface MatchInput {
  vibes: Category[];
  energy: 1 | 2 | 3;
  budgetUsd?: number; // per guest
  portId?: string;
  guests?: number;
  /** total time the guest wants to spend, including transfers */
  maxMinutes?: number;
}

export interface MatchCandidate {
  excursion: Excursion;
  seatsLeft: number;
  feasibility: FeasibilityStatus;
}

export interface MatchResult {
  excursionId: string;
  score: number;
  reasons: string[];
}

const LABEL: Record<Category, string> = {
  snorkel: "underwater",
  culture: "culture",
  nature: "nature",
  adventure: "adventure",
  sail: "sailing",
  food: "food",
};

/** Deterministic, explainable Adventure Match. Only feasible, in-stock tours are eligible. */
export function adventureMatch(input: MatchInput, candidates: MatchCandidate[], limit = 3): MatchResult[] {
  return candidates
    .filter((c) => c.feasibility !== "infeasible" && c.seatsLeft >= Math.max(1, input.guests ?? 1))
    .filter((c) => input.maxMinutes === undefined || c.excursion.durationMin + c.excursion.transferMin + c.excursion.returnTransferMin <= input.maxMinutes)
    .filter((c) => !input.portId || c.excursion.portId === input.portId)
    .filter((c) => input.budgetUsd === undefined || c.excursion.priceCents <= input.budgetUsd * 100)
    .map(({ excursion: e, feasibility }) => {
      const reasons: string[] = [];
      let score = 50;
      if (input.vibes.includes(e.category)) {
        score += 40;
        reasons.push(`matches your love of ${LABEL[e.category]}`);
      }
      const diff = Math.abs(e.intensity - input.energy);
      score -= diff * 15;
      if (diff === 0) reasons.push(e.intensity === 1 ? "easy-going pace" : e.intensity === 2 ? "moderate activity" : "high energy, just how you like it");
      if (feasibility === "tight") {
        score -= 10;
        reasons.push("fits the ship's schedule, with a tight margin");
      } else reasons.push("fits comfortably in your port time");
      return { excursionId: e.id, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.excursionId.localeCompare(b.excursionId))
    .slice(0, limit);
}
