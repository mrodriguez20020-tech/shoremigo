/**
 * "Live proof" event log. Components record what the REAL systems returned
 * (PayPal ids/statuses, Gemini model + tool calls, LastBoard numbers) so
 * judges can open a drawer and see the evidence behind each screen.
 *
 * Only data already returned to this browser is recorded; no secrets, no PII
 * beyond what the page itself shows. Kept in sessionStorage (this tab only).
 */
export type ProofSource = "paypal" | "gemini" | "lastboard" | "match" | "system";

export interface ProofEvent {
  id: string;
  at: number;
  source: ProofSource;
  title: string;
  detail: Record<string, string | number | boolean | null>;
  /** "live" = came from an external API response; "engine" = deterministic server logic; "fallback" = degraded path */
  kind: "live" | "engine" | "fallback";
}

const KEY = "sm.proof.v1";
const MAX = 60;
type Listener = (events: ProofEvent[]) => void;
const listeners = new Set<Listener>();
let cache: ProofEvent[] | null = null;

function load(): ProofEvent[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache!;
}

export function proofEvents(): ProofEvent[] {
  return typeof window === "undefined" ? [] : load();
}

export function recordProof(e: Omit<ProofEvent, "id" | "at">) {
  if (typeof window === "undefined") return;
  const next = [{ ...e, id: Math.random().toString(36).slice(2), at: Date.now() }, ...load()].slice(0, MAX);
  cache = next;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l(next));
}

export function clearProof() {
  cache = [];
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l([]));
}

export function onProof(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
