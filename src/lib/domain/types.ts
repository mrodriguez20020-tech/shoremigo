/**
 * Core domain types. Everything financial or schedule-related is defined here
 * and computed by deterministic code — never by the LLM.
 */

/** Visual lighting scenes. `neutral` is the calm, distraction-free checkout scene. */
export type SceneId = "day" | "shade" | "sunset" | "night" | "neutral";

export type Category = "snorkel" | "culture" | "nature" | "adventure" | "sail" | "food";

export interface PortCall {
  id: string;
  name: string;
  country: string;
  date: string; // YYYY-MM-DD (port local)
  arrive: string; // HH:MM scheduled arrival, port local time
  allAboard: string; // HH:MM
  tender: boolean; // tender ports need extra disembark time
  blurb: string;
  scene: SceneId;
  art: { from: string; to: string; accent: string };
}

export interface Excursion {
  id: string;
  portId: string;
  title: string;
  tagline: string;
  description: string;
  category: Category;
  /** fixed = departs at `start`; flexible = departs when guests are ready, within window */
  startMode: "fixed" | "flexible";
  start: string; // HH:MM (fixed start, or earliest flexible start)
  latestStart?: string; // HH:MM, flexible only
  durationMin: number;
  transferMin: number; // pier -> meeting point
  returnTransferMin: number; // end point -> pier
  priceCents: number; // per guest, USD
  capacity: number;
  intensity: 1 | 2 | 3;
  guideId: string;
  vehicleId: string;
  highlights: string[];
  art: { from: string; to: string; accent: string; motif: "reef" | "ruins" | "jungle" | "sail" | "cacao" | "falls" | "beach" };
}

export interface Policy {
  disembarkMin: number;
  tenderExtraMin: number;
  returnBufferMin: number;
  tightSlackMin: number;
  holdMinutes: number;
  maxGuests: number;
}

export type FeasibilityStatus = "ok" | "tight" | "infeasible";

export interface Feasibility {
  status: FeasibilityStatus;
  slackMin: number;
  reasons: string[];
  timeline: {
    shipArrive: number; // minutes since midnight, after delay
    readyAtMeetingPoint: number;
    departs: number;
    ends: number;
    backAtPier: number;
    latestBack: number;
    allAboard: number;
  };
}

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "disrupted"
  | "rebooked"
  | "cancelled_refunded"
  | "expired";

export interface PaymentRecord {
  kind: "charge" | "refund";
  provider: "paypal-sandbox";
  orderId?: string;
  captureId?: string;
  refundId?: string;
  amountCents: number;
  currency: "USD";
  status: string; // status string exactly as returned by PayPal
  verifiedAt: string;
  purpose: string;
}

export interface Booking {
  id: string;
  ref: string; // customer-facing reference e.g. SM-7KQ2
  excursionId: string;
  originalExcursionId: string;
  guests: number;
  firstName: string;
  lastName: string;
  email: string;
  unitPriceCents: number;
  totalCents: number;
  /** amount actually captured minus refunded, per PayPal-verified records */
  paidCents: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  pendingOrderId?: string;
  /** Incremented when PayPal refuses a capture, so the next checkout gets a fresh order. */
  checkoutAttempt?: number;
  payments: PaymentRecord[];
}

export interface Disruption {
  portId: string;
  delayMin: number;
  allAboardExtensionMin: number;
  simulated: true;
  createdAt: string;
  createdBy: "customer-demo" | "operator";
}

export type RescueOptionKind = "switch" | "cancel_refund";

export interface RescueOption {
  id: string;
  kind: RescueOptionKind;
  excursionId?: string;
  feasibility?: Feasibility;
  newTotalCents: number;
  /** positive = customer owes; negative = refund due */
  deltaCents: number;
  rank: number;
  why: string;
}

export interface RescueProposal {
  id: string;
  bookingId: string;
  /** the excursion that became infeasible */
  excursionId: string;
  createdAt: string;
  delayMin: number;
  original: Feasibility;
  options: RescueOption[];
  status: "open" | "awaiting_payment" | "resolved" | "dismissed";
  /** Operator must review operational impact (guide/vehicle/seat) before customer can approve. */
  operatorReview: "pending" | "approved" | "rejected";
  operatorNote?: string;
  chosenOptionId?: string;
  supplementOrderId?: string;
  resolution?: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: "customer" | "operator" | "system" | "paypal" | "concierge";
  type: string;
  bookingId?: string;
  detail: Record<string, unknown>;
}
