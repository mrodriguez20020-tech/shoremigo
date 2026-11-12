import { describe, expect, it } from "vitest";
import { EXCURSIONS, POLICY, getPort } from "@/lib/domain/catalog";
import { checkFeasibility } from "@/lib/domain/feasibility";
import { toMin } from "@/lib/domain/time";
import type { Excursion, PortCall } from "@/lib/domain/types";

// Exact-minute boundaries of the LastBoard rule, checked for every catalog excursion:
//   ready <= departs (fixed) / departs <= latestStart (flexible)   and   back <= allAboard(+ext) - buffer
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const portOf = (ex: Excursion) => getPort(ex.portId)!;
const roomy = (p: PortCall): PortCall => ({ ...p, allAboard: "23:30" });
const rank = { ok: 0, tight: 1, infeasible: 2 } as const;

describe.each(EXCURSIONS.map((ex) => [ex.id, ex] as const))("LastBoard boundaries · %s", (_id, ex) => {
  it("return cut-off: back exactly at the cut-off passes, one minute later fails, a 1-minute all-aboard extension restores it", () => {
    const base = checkFeasibility(roomy(portOf(ex)), ex, POLICY);
    expect(base.status).not.toBe("infeasible");
    const exact: PortCall = { ...portOf(ex), allAboard: hhmm(base.timeline.backAtPier + POLICY.returnBufferMin) };
    const atLimit = checkFeasibility(exact, ex, POLICY);
    expect(atLimit.timeline.backAtPier).toBe(atLimit.timeline.latestBack);
    expect(atLimit.status).toBe("tight");
    const oneLate: PortCall = { ...exact, allAboard: hhmm(toMin(exact.allAboard) - 1) };
    expect(checkFeasibility(oneLate, ex, POLICY).status).toBe("infeasible");
    expect(checkFeasibility(oneLate, ex, POLICY, { delayMin: 0, allAboardExtensionMin: 1 }).status).toBe("tight");
  });

  it("start: the last minute that still makes the departure passes, the next minute fails", () => {
    const port = roomy(portOf(ex));
    const ready0 = checkFeasibility(port, ex, POLICY).timeline.readyAtMeetingPoint;
    const lastStart = ex.startMode === "fixed" ? toMin(ex.start) : toMin(ex.latestStart ?? ex.start);
    const maxDelay = lastStart - ready0;
    if (maxDelay < 0) return; // never reachable even on time (not the case in the demo catalog)
    const edge = checkFeasibility(port, ex, POLICY, { delayMin: maxDelay });
    expect(edge.status).not.toBe("infeasible");
    expect(edge.timeline.departs).toBe(lastStart);
    const late = checkFeasibility(port, ex, POLICY, { delayMin: maxDelay + 1 });
    expect(late.status).toBe("infeasible");
    expect(late.reasons[0]).toMatch(/departs at|last departure/);
  });

  it("a later ship never makes an excursion more feasible (monotonic in delay)", () => {
    const port = portOf(ex);
    let worst = 0;
    for (let d = 0; d <= 360; d += 5) {
      const r = rank[checkFeasibility(port, ex, POLICY, { delayMin: d }).status];
      expect(r).toBeGreaterThanOrEqual(worst);
      worst = r;
    }
  });
});

describe("LastBoard margin threshold", () => {
  it(`exactly ${POLICY.tightSlackMin} minutes of margin is ok; one minute less is tight`, () => {
    const ex = EXCURSIONS.find((e) => e.startMode === "flexible")!;
    const base = checkFeasibility(roomy(portOf(ex)), ex, POLICY);
    const at = (slack: number): PortCall => ({ ...portOf(ex), allAboard: hhmm(base.timeline.backAtPier + POLICY.returnBufferMin + slack) });
    expect(checkFeasibility(at(POLICY.tightSlackMin), ex, POLICY)).toMatchObject({ status: "ok", slackMin: POLICY.tightSlackMin });
    expect(checkFeasibility(at(POLICY.tightSlackMin - 1), ex, POLICY)).toMatchObject({ status: "tight", slackMin: POLICY.tightSlackMin - 1 });
  });

  it("rejects non-finite delays", () => {
    const ex = EXCURSIONS[0];
    expect(() => checkFeasibility(portOf(ex), ex, POLICY, { delayMin: Number.NaN })).toThrow();
    expect(() => checkFeasibility(portOf(ex), ex, POLICY, { delayMin: Number.POSITIVE_INFINITY })).toThrow();
  });
});
