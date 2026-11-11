import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { EXCURSIONS, POLICY, VEHICLES, excursionsForPort, getExcursion, getPort } from "@/lib/domain/catalog";
import { checkFeasibility } from "@/lib/domain/feasibility";
import { planRescue } from "@/lib/domain/rescue";
import type { AuditEvent, Booking, Disruption, PaymentRecord, RescueProposal } from "@/lib/domain/types";
import { paypalToCents } from "@/lib/domain/time";
import { type DbShape, read, tx } from "./store";
import * as paypal from "./paypal";

export class DomainError extends Error {
  constructor(
    message: string,
    public code: string,
    public status = 400,
  ) {
    super(message);
  }
}

const now = () => new Date().toISOString();

export function audit(db: DbShape, e: Omit<AuditEvent, "id" | "at">) {
  db.audit.push({ id: randomUUID(), at: now(), ...e });
}

function holdActive(b: Booking) {
  return b.status === "pending_payment" && Date.now() - Date.parse(b.createdAt) < POLICY.holdMinutes * 60_000;
}

export function seatsTaken(db: DbShape, excursionId: string, excludeBookingId?: string) {
  return db.bookings
    .filter((b) => b.id !== excludeBookingId && b.excursionId === excursionId)
    .filter((b) => b.status === "confirmed" || b.status === "rebooked" || b.status === "disrupted" || holdActive(b))
    .reduce((n, b) => n + b.guests, 0);
}

/** Effective capacity: operator override if set, else the catalog default. */
export function capacityOf(db: DbShape, excursionId: string) {
  return db.inventory?.[excursionId]?.capacity ?? getExcursion(excursionId)?.capacity ?? 0;
}

export function isOnSale(db: DbShape, excursionId: string) {
  return db.inventory?.[excursionId]?.open !== false;
}

export function seatsLeft(db: DbShape, excursionId: string, excludeBookingId?: string) {
  const ex = getExcursion(excursionId);
  if (!ex || !isOnSale(db, excursionId)) return 0;
  return Math.max(0, capacityOf(db, excursionId) - seatsTaken(db, excursionId, excludeBookingId));
}

/** Operator inventory read model: confirmed vs held seats, sale state, next hold expiry. */
export function inventoryRows(db: DbShape) {
  return EXCURSIONS.map((ex) => {
    const live = db.bookings.filter((b) => b.excursionId === ex.id);
    const confirmed = live.filter((b) => b.status === "confirmed" || b.status === "rebooked" || b.status === "disrupted").reduce((n, b) => n + b.guests, 0);
    const holds = live.filter(holdActive);
    const held = holds.reduce((n, b) => n + b.guests, 0);
    const expiries = holds.map((b) => Date.parse(b.createdAt) + POLICY.holdMinutes * 60_000).sort((a, z) => a - z);
    return {
      excursionId: ex.id,
      catalogCapacity: ex.capacity,
      capacity: capacityOf(db, ex.id),
      open: isOnSale(db, ex.id),
      confirmed,
      held,
      holds: holds.length,
      nextHoldExpiresAt: expiries[0] ? new Date(expiries[0]).toISOString() : null,
      seatsLeft: seatsLeft(db, ex.id),
      vehicleSeats: VEHICLES[ex.vehicleId]?.seats ?? null,
    };
  });
}

export const MAX_CAPACITY = 60;

/**
 * Operator changes capacity and/or sale state. Capacity can never drop below
 * seats already confirmed or held (that would oversell), nor exceed the
 * assigned vehicle. Runs inside the serialized transaction and is audited.
 */
export async function updateInventory(input: { excursionId?: string; capacity?: unknown; open?: unknown }) {
  const ex = input.excursionId ? getExcursion(String(input.excursionId)) : undefined;
  if (!ex) throw new DomainError("Unknown excursion", "unknown_excursion", 404);
  const hasCap = input.capacity !== undefined && input.capacity !== null && input.capacity !== "";
  const hasOpen = typeof input.open === "boolean";
  if (!hasCap && !hasOpen) throw new DomainError("Nothing to update", "bad_input");
  const cap = hasCap ? Number(input.capacity) : undefined;
  const limit = Math.min(MAX_CAPACITY, VEHICLES[ex.vehicleId]?.seats ?? MAX_CAPACITY);
  if (cap !== undefined && (!Number.isInteger(cap) || cap < 0 || cap > limit))
    throw new DomainError(`Capacity must be a whole number from 0 to ${limit} (vehicle limit).`, "bad_capacity");
  return tx((db) => {
    db.inventory ??= {};
    const before = { capacity: capacityOf(db, ex.id), open: isOnSale(db, ex.id) };
    if (cap !== undefined) {
      const committed = seatsTaken(db, ex.id);
      if (cap < committed)
        throw new DomainError(`${committed} seats are already confirmed or held. Capacity can’t go below that.`, "would_oversell", 409);
    }
    const next = { ...db.inventory[ex.id], updatedAt: now() };
    if (cap !== undefined) next.capacity = cap;
    if (hasOpen) next.open = input.open as boolean;
    db.inventory[ex.id] = next;
    const after = { capacity: capacityOf(db, ex.id), open: isOnSale(db, ex.id) };
    audit(db, { actor: "operator", type: "inventory.updated", detail: { excursionId: ex.id, before: JSON.stringify(before), after: JSON.stringify(after) } });
    return inventoryRows(db).find((r) => r.excursionId === ex.id)!;
  });
}

export function activeDisruption(db: DbShape, portId: string): Disruption | undefined {
  return db.disruptions.find((d) => d.portId === portId);
}

function newRef() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(5);
  return "SM-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

// ───────────────────────── Read models ─────────────────────────

export function availabilitySnapshot() {
  return read((db) =>
    EXCURSIONS.map((ex) => {
      const port = getPort(ex.portId)!;
      const d = activeDisruption(db, port.id);
      return {
        excursionId: ex.id,
        seatsLeft: seatsLeft(db, ex.id),
        capacity: capacityOf(db, ex.id),
        onSale: isOnSale(db, ex.id),
        feasibility: checkFeasibility(port, ex, POLICY, { delayMin: d?.delayMin ?? 0, allAboardExtensionMin: d?.allAboardExtensionMin }),
        disruption: d ?? null,
      };
    }),
  );
}

export function getBooking(id: string) {
  return read((db) => db.bookings.find((b) => b.id === id) ?? null);
}

export function findBookingByRef(ref: string, lastName: string) {
  return read(
    (db) =>
      db.bookings.find(
        (b) =>
          b.ref.toUpperCase() === ref.trim().toUpperCase() &&
          b.lastName.trim().toLowerCase() === lastName.trim().toLowerCase() &&
          b.status !== "pending_payment" &&
          b.status !== "expired",
      ) ?? null,
  );
}

export function openRescueFor(bookingId: string) {
  return read((db) => db.rescues.filter((r) => r.bookingId === bookingId && (r.status === "open" || r.status === "awaiting_payment")).at(-1) ?? null);
}

// ───────────────────────── Booking creation ─────────────────────────

export interface CreateBookingInput {
  excursionId: string;
  guests: number;
  firstName: string;
  lastName: string;
  email: string;
}

export function validateBookingInput(i: Partial<CreateBookingInput>): CreateBookingInput {
  const ex = i.excursionId ? getExcursion(i.excursionId) : undefined;
  if (!ex) throw new DomainError("Unknown excursion", "unknown_excursion", 404);
  const guests = Number(i.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > POLICY.maxGuests)
    throw new DomainError(`Guests must be between 1 and ${POLICY.maxGuests}`, "bad_guests");
  const firstName = String(i.firstName ?? "").trim();
  const lastName = String(i.lastName ?? "").trim();
  const email = String(i.email ?? "").trim();
  if (!firstName || firstName.length > 60) throw new DomainError("First name is required", "bad_name");
  if (!lastName || lastName.length > 60) throw new DomainError("Last name is required", "bad_name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) throw new DomainError("A valid email is required", "bad_email");
  return { excursionId: ex.id, guests, firstName, lastName, email };
}

export async function createBooking(raw: Partial<CreateBookingInput>) {
  const input = validateBookingInput(raw);
  return tx((db) => {
    const ex = getExcursion(input.excursionId)!;
    const port = getPort(ex.portId)!;
    const d = activeDisruption(db, port.id);
    const f = checkFeasibility(port, ex, POLICY, { delayMin: d?.delayMin ?? 0, allAboardExtensionMin: d?.allAboardExtensionMin });
    if (f.status === "infeasible") throw new DomainError("This excursion doesn't fit the ship's schedule.", "infeasible", 409);
    if (!isOnSale(db, ex.id)) throw new DomainError("This excursion is not on sale right now.", "closed", 409);
    if (seatsLeft(db, ex.id) < input.guests) throw new DomainError("Not enough seats left on this excursion.", "sold_out", 409);
    const total = ex.priceCents * input.guests;
    const b: Booking = {
      id: randomUUID(),
      ref: newRef(),
      excursionId: ex.id,
      originalExcursionId: ex.id,
      guests: input.guests,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      unitPriceCents: ex.priceCents,
      totalCents: total,
      paidCents: 0,
      status: "pending_payment",
      createdAt: now(),
      updatedAt: now(),
      payments: [],
    };
    db.bookings.push(b);
    audit(db, { actor: "customer", type: "booking.created", bookingId: b.id, detail: { excursionId: ex.id, guests: b.guests, totalCents: total } });
    return b;
  });
}

// ───────────────────────── PayPal checkout ─────────────────────────

export async function startCheckout(bookingId: string) {
  const b = await getBooking(bookingId);
  if (!b) throw new DomainError("Booking not found", "not_found", 404);
  if (b.status !== "pending_payment") throw new DomainError("This booking is not awaiting payment.", "bad_state", 409);
  if (!holdActive(b)) {
    await tx((db) => {
      const x = db.bookings.find((y) => y.id === bookingId)!;
      x.status = "expired";
      x.updatedAt = now();
      audit(db, { actor: "system", type: "booking.expired", bookingId, detail: {} });
    });
    throw new DomainError("Your seat hold expired. Please start again.", "expired", 409);
  }
  // Reuse the pending order only if PayPal says it is still waiting for the buyer.
  // After a declined or refused capture the old order (and its idempotency key) is
  // spent: PayPal answers ORDER_ALREADY_CAPTURED, so start a fresh order instead.
  let attempt = b.checkoutAttempt ?? 0;
  if (b.pendingOrderId) {
    let reusable: paypal.PayPalOrder | null = null;
    try {
      const existing = await paypal.getOrder(b.pendingOrderId);
      if (existing.status === "CREATED" || existing.status === "PAYER_ACTION_REQUIRED") reusable = existing;
    } catch {
      reusable = null;
    }
    if (reusable) return reusable;
    const stale = b.pendingOrderId;
    attempt = await tx((db) => {
      const x = db.bookings.find((y) => y.id === bookingId)!;
      x.checkoutAttempt = (x.checkoutAttempt ?? 0) + 1;
      x.pendingOrderId = undefined;
      x.updatedAt = now();
      audit(db, { actor: "system", type: "paypal.order.replaced", bookingId, detail: { staleOrderId: stale, attempt: x.checkoutAttempt } });
      return x.checkoutAttempt;
    });
  }
  const ex = getExcursion(b.excursionId)!;
  const order = await paypal.createOrder({
    amountCents: b.totalCents,
    customId: b.id,
    description: `ShoreMigo ${b.ref}: ${ex.title} x${b.guests}`,
    requestId: attempt ? `create-${b.id}-r${attempt}` : `create-${b.id}`,
  });
  await tx((db) => {
    const x = db.bookings.find((y) => y.id === bookingId)!;
    x.pendingOrderId = order.id;
    x.updatedAt = now();
    audit(db, { actor: "paypal", type: "paypal.order.created", bookingId, detail: { orderId: order.id, status: order.status, amountCents: b.totalCents } });
  });
  return order;
}

async function captureVerified(orderId: string, requestId: string, expected: { customId: string; amountCents: number }) {
  let order: paypal.PayPalOrder;
  try {
    order = await paypal.captureOrder(orderId, requestId);
  } catch (e) {
    // Idempotency: if already captured, read the real state rather than assume.
    if (e instanceof paypal.PayPalError && JSON.stringify(e.body).includes("ORDER_ALREADY_CAPTURED")) {
      order = await paypal.getOrder(orderId);
    } else throw e;
  }
  return { order, check: paypal.verifyCapturedOrder(order, expected) };
}

export async function completeCheckout(bookingId: string, orderId: string) {
  const b = await getBooking(bookingId);
  if (!b) throw new DomainError("Booking not found", "not_found", 404);
  if (b.status === "confirmed" && b.payments.some((p) => p.orderId === orderId)) return b; // idempotent replay
  if (b.status !== "pending_payment" || b.pendingOrderId !== orderId) throw new DomainError("Order does not match this booking.", "order_mismatch", 409);

  let captured: Awaited<ReturnType<typeof captureVerified>>;
  try {
    captured = await captureVerified(orderId, `capture-${orderId}`, { customId: b.id, amountCents: b.totalCents });
  } catch (e) {
    // PayPal refused the capture (declined card, compliance hold, not approved...). Record it; the booking stays unpaid.
    const err = e as { code?: string; message?: string; body?: { details?: { issue?: string }[]; debug_id?: string } };
    const code = err.body?.details?.[0]?.issue ?? err.code ?? "error";
    await tx((db) => {
      audit(db, { actor: "paypal", type: "paypal.capture.failed", bookingId, detail: { orderId, code, debugId: err.body?.debug_id ?? null, message: String(err.message ?? "").slice(0, 160) } });
      // INSTRUMENT_DECLINED: PayPal lets the buyer pick another funding source on the same order.
      // Anything else (compliance hold, not approved...) leaves this order unusable: start a fresh one next time.
      if (code !== "INSTRUMENT_DECLINED" && code !== "ORDER_NOT_APPROVED") {
        const x = db.bookings.find((y) => y.id === bookingId);
        if (x && x.pendingOrderId === orderId) {
          x.pendingOrderId = undefined;
          x.checkoutAttempt = (x.checkoutAttempt ?? 0) + 1;
          x.updatedAt = now();
        }
      }
    });
    throw e;
  }
  const { order, check } = captured;
  return tx((db) => {
    const x = db.bookings.find((y) => y.id === bookingId)!;
    if (!check.ok || !check.capture) {
      audit(db, { actor: "paypal", type: "paypal.capture.rejected", bookingId, detail: { orderId, status: order.status, problems: check.problems } });
      throw new DomainError(`Payment could not be verified: ${check.problems.join(", ")}`, "payment_unverified", 402);
    }
    const rec: PaymentRecord = {
      kind: "charge",
      provider: "paypal-sandbox",
      orderId,
      captureId: check.capture.id,
      amountCents: paypalToCents(check.capture.amount.value),
      currency: "USD",
      status: check.capture.status,
      verifiedAt: now(),
      purpose: "booking",
    };
    x.payments.push(rec);
    x.paidCents += rec.amountCents;
    x.status = "confirmed";
    x.pendingOrderId = undefined;
    x.updatedAt = now();
    audit(db, { actor: "paypal", type: "paypal.capture.verified", bookingId, detail: { orderId, captureId: rec.captureId, amountCents: rec.amountCents, status: rec.status } });
    audit(db, { actor: "system", type: "booking.confirmed", bookingId, detail: { ref: x.ref } });
    return x;
  });
}

// ───────────────────────── Disruption & Trip Rescue ─────────────────────────

export async function simulateDisruption(portId: string, delayMin: number, by: Disruption["createdBy"], allAboardExtensionMin = 0) {
  const port = getPort(portId);
  if (!port) throw new DomainError("Unknown port", "unknown_port", 404);
  if (!Number.isInteger(delayMin) || delayMin < 15 || delayMin > 360) throw new DomainError("Delay must be 15–360 minutes", "bad_delay");
  return tx((db) => {
    db.disruptions = db.disruptions.filter((d) => d.portId !== portId);
    const d: Disruption = { portId, delayMin, allAboardExtensionMin, simulated: true, createdAt: now(), createdBy: by };
    db.disruptions.push(d);
    audit(db, { actor: by === "operator" ? "operator" : "customer", type: "disruption.simulated", detail: { portId, delayMin, allAboardExtensionMin } });

    const affected: string[] = [];
    for (const b of db.bookings) {
      const ex = getExcursion(b.excursionId)!;
      if (ex.portId !== portId || (b.status !== "confirmed" && b.status !== "rebooked")) continue;
      const f = checkFeasibility(port, ex, POLICY, { delayMin, allAboardExtensionMin });
      if (f.status !== "infeasible") continue;
      const options = planRescue({
        booking: b,
        port,
        original: ex,
        candidates: excursionsForPort(portId),
        seatsLeft: (id) => seatsLeft(db, id, b.id),
        policy: POLICY,
        delay: { delayMin, allAboardExtensionMin },
      });
      db.rescues.forEach((r) => {
        if (r.bookingId === b.id && (r.status === "open" || r.status === "awaiting_payment")) r.status = "dismissed";
      });
      const proposal: RescueProposal = {
        id: randomUUID(),
        bookingId: b.id,
        excursionId: ex.id,
        createdAt: now(),
        delayMin,
        original: f,
        options,
        status: "open",
        operatorReview: process.env.RESCUE_SKIP_OPERATOR_REVIEW === "true" ? "approved" : "pending",
      };
      db.rescues.push(proposal);
      b.status = "disrupted";
      b.updatedAt = now();
      affected.push(b.id);
      audit(db, { actor: "system", type: "rescue.proposed", bookingId: b.id, detail: { proposalId: proposal.id, options: options.map((o) => o.id) } });
    }
    return { disruption: d, affected };
  });
}

export function clearDisruption(portId: string) {
  return tx((db) => {
    db.disruptions = db.disruptions.filter((d) => d.portId !== portId);
    audit(db, { actor: "operator", type: "disruption.cleared", detail: { portId } });
  });
}

/** Refund across one or more captures, each refund verified against PayPal's response. */
async function refundVerified(b: Booking, amountCents: number, purpose: string, proposalId: string) {
  const records: PaymentRecord[] = [];
  let remaining = amountCents;
  const charges = b.payments.filter((p) => p.kind === "charge" && p.captureId);
  for (const c of charges) {
    if (remaining <= 0) break;
    const alreadyRefunded = b.payments.filter((p) => p.kind === "refund" && p.captureId === c.captureId).reduce((n, p) => n + p.amountCents, 0);
    const refundable = c.amountCents - alreadyRefunded;
    const amt = Math.min(refundable, remaining);
    if (amt <= 0) continue;
    const r = await paypal.refundCapture(c.captureId!, amt, `refund-${proposalId}-${c.captureId}`);
    records.push({
      kind: "refund",
      provider: "paypal-sandbox",
      captureId: c.captureId,
      refundId: r.id,
      amountCents: r.amount ? paypalToCents(r.amount.value) : amt,
      currency: "USD",
      status: r.status,
      verifiedAt: now(),
      purpose,
    });
    remaining -= amt;
  }
  if (remaining > 0) throw new DomainError("Refund exceeds captured amount", "refund_exceeds", 409);
  return records;
}

/** Operator reviews the operational impact (seats, guide, vehicle) and releases or rejects the proposal. */
export async function reviewRescue(proposalId: string, decision: "approved" | "rejected", note?: string) {
  return tx((db) => {
    const p = db.rescues.find((r) => r.id === proposalId);
    if (!p || p.status !== "open") throw new DomainError("No open proposal with that id.", "no_proposal", 404);
    p.operatorReview = decision;
    p.operatorNote = note?.slice(0, 280);
    if (decision === "rejected") {
      // Rejected switch options are withdrawn; the full-refund option always remains.
      p.options = p.options.filter((o) => o.kind === "cancel_refund");
      p.operatorReview = "approved";
    }
    audit(db, { actor: "operator", type: `rescue.operator_${decision}`, bookingId: p.bookingId, detail: { proposalId, note: p.operatorNote ?? null } });
    return p;
  });
}

export async function approveRescue(bookingId: string, optionId: string, actor: "customer" | "operator") {
  const [b, proposal] = await Promise.all([getBooking(bookingId), openRescueFor(bookingId)]);
  if (!b || !proposal) throw new DomainError("No open rescue proposal for this booking.", "no_proposal", 404);
  if (proposal.status !== "open") throw new DomainError("This proposal is awaiting payment.", "bad_state", 409);
  if (proposal.operatorReview !== "approved")
    throw new DomainError("The operator is still reviewing these options. You'll be able to choose shortly.", "awaiting_operator", 409);
  const opt = proposal.options.find((o) => o.id === optionId);
  if (!opt) throw new DomainError("Unknown option", "bad_option");

  // Re-validate seats at approval time (inventory may have moved).
  if (opt.kind === "switch") {
    const left = await read((db) => seatsLeft(db, opt.excursionId!, b.id));
    if (left < b.guests) throw new DomainError("That alternative just filled up. Please choose another option.", "sold_out", 409);
  }

  if (opt.deltaCents > 0) {
    const order = await paypal.createOrder({
      amountCents: opt.deltaCents,
      customId: `${b.id}:rescue:${proposal.id}`,
      description: `ShoreMigo ${b.ref}: Trip Rescue top-up`,
      requestId: `rescue-create-${proposal.id}-${opt.id}`,
    });
    await tx((db) => {
      const p = db.rescues.find((r) => r.id === proposal.id)!;
      p.status = "awaiting_payment";
      p.chosenOptionId = opt.id;
      p.supplementOrderId = order.id;
      audit(db, { actor, type: "rescue.approved.topup_required", bookingId, detail: { optionId, deltaCents: opt.deltaCents, orderId: order.id } });
    });
    return { kind: "payment_required" as const, orderId: order.id, amountCents: opt.deltaCents };
  }

  const refunds = opt.deltaCents < 0 ? await refundVerified(b, -opt.deltaCents, opt.kind === "cancel_refund" ? "cancellation" : "price difference", proposal.id) : [];
  const allCompleted = refunds.every((r) => r.status === "COMPLETED");

  return tx((db) => {
    const x = db.bookings.find((y) => y.id === bookingId)!;
    const p = db.rescues.find((r) => r.id === proposal.id)!;
    for (const r of refunds) {
      x.payments.push(r);
      x.paidCents -= r.amountCents;
      audit(db, { actor: "paypal", type: "paypal.refund.verified", bookingId, detail: { refundId: r.refundId, captureId: r.captureId, amountCents: r.amountCents, status: r.status } });
    }
    if (!allCompleted) {
      // Refund accepted by PayPal but not yet COMPLETED (e.g. PENDING). We record the
      // exact status and never describe it as completed; operator can re-verify.
      audit(db, { actor: "system", type: "rescue.refund_not_completed", bookingId, detail: { statuses: refunds.map((r) => r.status) } });
    }
    if (opt.kind === "cancel_refund") {
      x.status = "cancelled_refunded";
      x.totalCents = 0;
    } else {
      const ex = getExcursion(opt.excursionId!)!;
      x.excursionId = ex.id;
      x.unitPriceCents = ex.priceCents;
      x.totalCents = opt.newTotalCents;
      x.status = "rebooked";
    }
    x.updatedAt = now();
    p.status = "resolved";
    p.chosenOptionId = opt.id;
    p.resolution = opt.kind === "cancel_refund" ? "cancelled with full refund" : `switched to ${opt.excursionId}`;
    audit(db, { actor, type: "rescue.resolved", bookingId, detail: { optionId, deltaCents: opt.deltaCents } });
    return { kind: "resolved" as const, booking: x, refunds, refundsCompleted: allCompleted };
  });
}

export async function completeRescueTopUp(bookingId: string, orderId: string) {
  const [b, proposal] = await Promise.all([getBooking(bookingId), openRescueFor(bookingId)]);
  if (!b || !proposal || proposal.status !== "awaiting_payment" || proposal.supplementOrderId !== orderId)
    throw new DomainError("No matching top-up for this booking.", "order_mismatch", 409);
  const opt = proposal.options.find((o) => o.id === proposal.chosenOptionId)!;
  const { order, check } = await captureVerified(orderId, `rescue-capture-${orderId}`, {
    customId: `${b.id}:rescue:${proposal.id}`,
    amountCents: opt.deltaCents,
  });
  return tx((db) => {
    const x = db.bookings.find((y) => y.id === bookingId)!;
    const p = db.rescues.find((r) => r.id === proposal.id)!;
    if (!check.ok || !check.capture) {
      audit(db, { actor: "paypal", type: "paypal.capture.rejected", bookingId, detail: { orderId, status: order.status, problems: check.problems } });
      throw new DomainError(`Top-up could not be verified: ${check.problems.join(", ")}`, "payment_unverified", 402);
    }
    const amt = paypalToCents(check.capture.amount.value);
    x.payments.push({
      kind: "charge",
      provider: "paypal-sandbox",
      orderId,
      captureId: check.capture.id,
      amountCents: amt,
      currency: "USD",
      status: check.capture.status,
      verifiedAt: now(),
      purpose: "rescue top-up",
    });
    x.paidCents += amt;
    const ex = getExcursion(opt.excursionId!)!;
    x.excursionId = ex.id;
    x.unitPriceCents = ex.priceCents;
    x.totalCents = opt.newTotalCents;
    x.status = "rebooked";
    x.updatedAt = now();
    p.status = "resolved";
    p.resolution = `switched to ${ex.id} with top-up`;
    audit(db, { actor: "paypal", type: "paypal.capture.verified", bookingId, detail: { orderId, captureId: check.capture.id, amountCents: amt } });
    audit(db, { actor: "system", type: "rescue.resolved", bookingId, detail: { optionId: opt.id, deltaCents: opt.deltaCents } });
    return x;
  });
}

/** Operator tool: re-read every payment on a booking from PayPal and report drift. */
export async function reverifyPayments(bookingId: string) {
  const b = await getBooking(bookingId);
  if (!b) throw new DomainError("Booking not found", "not_found", 404);
  const results: { captureId?: string; recorded: string; paypal: string; amountMatches: boolean }[] = [];
  for (const p of b.payments.filter((x) => x.kind === "charge" && x.captureId)) {
    const cap = await paypal.getCapture(p.captureId!);
    results.push({ captureId: p.captureId, recorded: p.status, paypal: cap.status, amountMatches: paypalToCents(cap.amount.value) === p.amountCents });
  }
  await tx((db) => audit(db, { actor: "operator", type: "paypal.reverified", bookingId, detail: { results } }));
  return results;
}

// ───────────────────────── Engagement (anonymous) ─────────────────────────

export const ENGAGEMENT_TYPES = [
  "welcome.shown",
  "welcome.dismissed",
  "match.started",
  "match.completed",
  "recommendation.shown",
  "recommendation.clicked",
  "concierge.opened",
  "concierge.message",
  "booking.started",
  "checkout.viewed",
  "checkout.captured",
  "checkout.abandoned",
  "rescue.viewed",
  "rescue.approved",
  "proactive.disabled",
] as const;

export async function recordEngagement(type: string, props: Record<string, unknown>) {
  if (!(ENGAGEMENT_TYPES as readonly string[]).includes(type)) throw new DomainError("Unknown event type", "bad_event");
  // Only short scalar props, keyed by allow-listed names. No names, emails or free text.
  const allowed = ["excursionId", "portId", "category", "page", "step", "count", "intensity", "scene"];
  const clean: Record<string, string | number | boolean> = {};
  for (const k of allowed) {
    const v = props[k];
    if (typeof v === "number" || typeof v === "boolean") clean[k] = v;
    else if (typeof v === "string" && v.length <= 48 && /^[\w.\-/ ]*$/.test(v)) clean[k] = v;
  }
  return tx((db) => {
    db.engagement.push({ at: now(), type, props: clean });
    if (db.engagement.length > 5000) db.engagement.splice(0, db.engagement.length - 5000);
  });
}
