import { GUIDES, POLICY, VEHICLES, excursionsForPort, getPort } from "./catalog";
import { checkFeasibility } from "./feasibility";
import { toMin } from "./time";
import type { Disruption, FeasibilityStatus } from "./types";

/**
 * Operator schedule model for one port day. The shape intentionally mirrors
 * Bryntum Scheduler's resources/events/assignments so the in-house timeline
 * can be swapped for Bryntum (licensed package required) by mapping only.
 */
export interface SchedResource {
  id: string;
  name: string;
  kind: "guide" | "vehicle";
}

export interface SchedEvent {
  id: string; // excursion id
  name: string;
  startMin: number;
  endMin: number; // back at pier
  resourceIds: string[]; // guide + vehicle
  booked: number;
  capacity: number;
  status: FeasibilityStatus;
  conflict: boolean; // booked guests on an infeasible run
}

export interface PortSchedule {
  portId: string;
  arriveMin: number;
  scheduledArriveMin: number;
  allAboardMin: number;
  latestBackMin: number;
  delayMin: number;
  resources: SchedResource[];
  events: SchedEvent[];
}

export function buildSchedule(
  portId: string,
  bookedByExcursion: Record<string, number>,
  disruption?: Pick<Disruption, "delayMin" | "allAboardExtensionMin"> | null,
): PortSchedule {
  const port = getPort(portId);
  if (!port) throw new Error(`Unknown port ${portId}`);
  const delay = { delayMin: disruption?.delayMin ?? 0, allAboardExtensionMin: disruption?.allAboardExtensionMin ?? 0 };
  const exs = excursionsForPort(portId);
  const resIds = new Set<string>();
  const events: SchedEvent[] = exs.map((e) => {
    const f = checkFeasibility(port, e, POLICY, delay);
    resIds.add(e.guideId);
    resIds.add(e.vehicleId);
    const booked = bookedByExcursion[e.id] ?? 0;
    return {
      id: e.id,
      name: e.title,
      startMin: f.timeline.departs - e.transferMin,
      endMin: f.timeline.backAtPier,
      resourceIds: [e.guideId, e.vehicleId],
      booked,
      capacity: e.capacity,
      status: f.status,
      conflict: f.status === "infeasible" && booked > 0,
    };
  });
  const resources: SchedResource[] = [...resIds].map((id) =>
    id.startsWith("guide-") ? { id, name: GUIDES[id]?.name ?? id, kind: "guide" as const } : { id, name: VEHICLES[id]?.name ?? id, kind: "vehicle" as const },
  );
  resources.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "guide" ? -1 : 1));
  const allAboardMin = toMin(port.allAboard) + delay.allAboardExtensionMin;
  return {
    portId,
    scheduledArriveMin: toMin(port.arrive),
    arriveMin: toMin(port.arrive) + delay.delayMin,
    allAboardMin,
    latestBackMin: allAboardMin - POLICY.returnBufferMin,
    delayMin: delay.delayMin,
    resources,
    events,
  };
}

/** Double-booked resources: same guide/vehicle on overlapping runs that both have guests. */
export function resourceClashes(s: PortSchedule): { resourceId: string; a: string; b: string }[] {
  const out: { resourceId: string; a: string; b: string }[] = [];
  for (const r of s.resources) {
    const evs = s.events.filter((e) => e.resourceIds.includes(r.id) && e.booked > 0 && e.status !== "infeasible");
    for (let i = 0; i < evs.length; i++)
      for (let j = i + 1; j < evs.length; j++)
        if (evs[i].startMin < evs[j].endMin && evs[j].startMin < evs[i].endMin) out.push({ resourceId: r.id, a: evs[i].id, b: evs[j].id });
  }
  return out;
}
