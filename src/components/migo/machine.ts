import type { MigoEvent } from "./bus";

/**
 * Migo's behavior state machine (pure, unit-tested).
 *
 * mode       — where he is: roaming the shore lane, attending the concierge
 *              panel, docked out of the way (checkout), or hidden by the user.
 * expression — what he is doing; maps to a pose clip in the renderer.
 */
export type MigoMode = "roam" | "attend" | "docked" | "hidden";
export type MigoExpression =
  | "idle"
  | "walking"
  | "greeting"
  | "curious"
  | "listening"
  | "thinking"
  | "suggesting"
  | "excited"
  | "celebrating"
  | "concerned"
  | "guiding";

export interface MigoState {
  mode: MigoMode;
  expression: MigoExpression;
  /** expression to return to when a transient reaction ends */
  rest: MigoExpression;
  /** ms timestamp until which a transient reaction holds */
  holdUntil: number;
  inCheckout: boolean;
  formFocus: boolean;
  /** a page (e.g. operator console) asked Migo to stay docked */
  pageDock: boolean;
  panelOpen: boolean;
  userHidden: boolean;
}

export const initialMigo: MigoState = {
  mode: "roam",
  expression: "idle",
  rest: "walking",
  holdUntil: 0,
  inCheckout: false,
  formFocus: false,
  pageDock: false,
  panelOpen: false,
  userHidden: false,
};

export type MigoAction = MigoEvent | { type: "tick"; now: number } | { type: "user:hide" } | { type: "user:show" };

const HOLD = {
  greeting: 2800,
  excited: 2200,
  celebrating: 4200,
  curious: 1600,
  suggesting: 3500,
  concerned: 5000,
};

function mode(s: MigoState): MigoMode {
  if (s.userHidden) return "hidden";
  if (s.panelOpen) return "attend";
  if (s.inCheckout || s.formFocus || s.pageDock) return "docked";
  return "roam";
}

function react(s: MigoState, expression: MigoExpression, now: number, holdMs: number): MigoState {
  return { ...s, expression, holdUntil: now + holdMs };
}

export function migoReducer(s: MigoState, a: MigoAction, now = Date.now()): MigoState {
  let n: MigoState = s;
  switch (a.type) {
    case "app:arrived":
      n = react(s, "greeting", now, HOLD.greeting);
      break;
    case "user:poke":
      n = react(s, "curious", now, HOLD.curious);
      break;
    case "excursion:selected":
      // Stay quiet in checkout.
      n = s.inCheckout ? s : react(s, "excited", now, HOLD.excited);
      break;
    case "match:completed":
      n = react(s, a.count > 0 ? "suggesting" : "concerned", now, HOLD.suggesting);
      break;
    case "concierge:opened":
      n = { ...s, panelOpen: true, expression: "listening", rest: "listening", holdUntil: 0 };
      break;
    case "concierge:closed":
      n = { ...s, panelOpen: false, expression: "idle", rest: s.inCheckout ? "idle" : "walking", holdUntil: now + 600 };
      break;
    case "concierge:typing":
      n = s.panelOpen ? { ...s, expression: "listening", holdUntil: 0 } : s;
      break;
    case "concierge:thinking":
      n = { ...s, expression: "thinking", holdUntil: Number.MAX_SAFE_INTEGER };
      break;
    case "concierge:replied":
      n = react(
        { ...s, holdUntil: 0 },
        a.mood === "concerned" ? "concerned" : a.mood === "excited" ? "excited" : "suggesting",
        now,
        a.mood === "concerned" ? HOLD.concerned : HOLD.suggesting,
      );
      break;
    case "concierge:error":
      n = react({ ...s, holdUntil: 0 }, "concerned", now, 2500);
      break;
    case "checkout:entered":
      n = { ...s, inCheckout: true, rest: "idle", expression: "idle", holdUntil: 0 };
      break;
    case "checkout:left":
      n = { ...s, inCheckout: false, rest: "walking" };
      break;
    case "form:focus":
      n = { ...s, formFocus: true };
      break;
    case "form:blur":
      n = { ...s, formFocus: false };
      break;
    case "dock:request":
      n = { ...s, pageDock: true };
      break;
    case "dock:release":
      n = { ...s, pageDock: false };
      break;
    case "booking:verified":
      n = react({ ...s, inCheckout: false, rest: "walking" }, "celebrating", now, HOLD.celebrating);
      break;
    case "disruption:detected":
      n = react(s, "concerned", now, HOLD.concerned);
      break;
    case "rescue:guiding":
      n = { ...s, expression: "guiding", rest: "guiding", holdUntil: 0 };
      break;
    case "rescue:resolved":
      n = react({ ...s, rest: "walking" }, "celebrating", now, HOLD.celebrating);
      break;
    case "user:hide":
      n = { ...s, userHidden: true };
      break;
    case "user:show":
      n = react({ ...s, userHidden: false }, "greeting", now, 1500);
      break;
    case "tick":
      if (s.holdUntil && now >= s.holdUntil) n = { ...s, expression: s.panelOpen ? "listening" : s.rest, holdUntil: 0 };
      break;
    case "scene:changed":
      break;
  }
  const m = mode(n);
  if (m !== n.mode) n = { ...n, mode: m };
  // Never walk while docked or attending.
  if (n.mode !== "roam" && n.expression === "walking") n = { ...n, expression: "idle" };
  return n;
}
