#!/usr/bin/env node
/**
 * Live HTTP smoke test against a RUNNING ShoreMigo server. No mocks: every
 * check goes through the real API routes, and — when keys are configured —
 * to the real Gemini API and PayPal SANDBOX.
 *
 *   node scripts/smoke.mjs [baseUrl] [--operator-passcode=xxx]
 *
 * Exit code 1 if any check fails. Prints evidence (status codes, PayPal order
 * ids/statuses, Gemini tool traces). Never prints secrets.
 *
 * Buyer approval in PayPal is a human step; this script verifies everything
 * around it, including that capture is REFUSED before approval.
 */
const base = (process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3000").replace(/\/$/, "");
const passcode = process.argv.find((a) => a.startsWith("--operator-passcode="))?.split("=")[1];

let cookie = "";
const results = [];
async function call(method, path, body, extraHeaders = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(90_000),
  });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  let json = {};
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, json };
}
function check(name, ok, evidence) {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${evidence ? `\n      ${evidence}` : ""}`);
}

const guest = { firstName: "Smoke", lastName: "Tester", email: "smoke.tester@example.com" };

(async () => {
  console.log(`ShoreMigo smoke test → ${base}\n`);

  const status = await call("GET", "/api/status");
  check("status endpoint", status.status === 200, `paypal=${status.json.paypal} llm=${status.json.llm} operatorProtected=${status.json.operatorProtected}`);
  const paypalOn = status.json.paypal === "sandbox";
  const llmOn = String(status.json.llm).startsWith("gemini");

  const avail = await call("GET", "/api/availability");
  check("availability snapshot", avail.status === 200 && avail.json.items?.length > 0, `${avail.json.items?.length} excursions`);

  // ── Adventure Match ───────────────────────────────
  const match = await call("POST", "/api/match", { portId: "cozumel", vibes: ["snorkel"], energy: 2, guests: 2 });
  check(
    "Adventure Match returns feasible, in-stock tours",
    match.status === 200 && match.json.results?.length > 0,
    `top: ${match.json.results?.map((r) => r.excursionId).join(", ")}`,
  );

  // ── AI concierge (real Gemini when configured) ────
  const ai = await call("POST", "/api/concierge", { history: [{ role: "user", text: "Find me a reef snorkel in Cozumel for 2 people that fits the ship schedule." }], page: "/" });
  check(
    `concierge responds (engine=${ai.json.engine}${ai.json.degraded ? ", DEGRADED→offline fallback" : ""})`,
    ai.status === 200 && typeof ai.json.text === "string",
    `tools=${JSON.stringify(ai.json.toolsUsed)} cards=${JSON.stringify(ai.json.cards?.map((c) => c.type))}\n      reply: ${String(ai.json.text).slice(0, 220)}`,
  );
  if (llmOn) check("Gemini answered live (not degraded) and used a structured tool", ai.json.engine === "gemini" && !ai.json.degraded && ai.json.toolsUsed?.length > 0);

  const aiBook = await call("POST", "/api/concierge", { history: [{ role: "user", text: "Book the Golden Hour Catamaran in Ocho Rios for 2 guests." }] });
  const prep = aiBook.json.cards?.find((c) => c.type === "prepare_booking");
  check("purchase intent → prepared (uncharged) booking card with server price", !!prep && prep.totalCents === 25800, JSON.stringify(prep ?? aiBook.json.text?.slice(0, 160)));

  const aiPriv = await call("POST", "/api/concierge", { history: [{ role: "user", text: "What is my booking status and was my payment captured?" }] });
  check("booking/payment info gated behind verification", aiPriv.json.cards?.some((c) => c.type === "verify_booking") || /verif/i.test(aiPriv.json.text ?? ""), String(aiPriv.json.text).slice(0, 160));

  // ── Validation & schedule safety ─────────────────
  const bad = await call("POST", "/api/bookings", { excursionId: "coz-cacao", guests: 99, ...guest });
  check("rejects invalid guest count", bad.status === 400, `${bad.status} ${bad.json.code}`);
  const tamper = await call("POST", "/api/bookings", { excursionId: "coz-cacao", guests: 1, totalCents: 1, unitPriceCents: 1, ...guest });
  check("ignores client-supplied price", tamper.status === 201 && tamper.json.booking.totalCents === 6500, `total=${tamper.json.booking?.totalCents}`);

  // ── Unauthorized changes ─────────────────────────
  cookie = "";
  const u1 = await call("POST", "/api/trip/delay", { delayMin: 90 });
  const u2 = await call("POST", "/api/trip/rescue/approve", { optionId: "opt-cancel", confirm: true });
  const u3 = await call("GET", "/api/trip");
  check("trip mutations refused without booking verification", u1.status === 401 && u2.status === 401 && u3.json.verified === false, `${u1.status}/${u2.status}`);
  const forged = await call("GET", "/api/trip", undefined, { Cookie: "sm_trip=" + tamper.json.booking?.id + ".0.forged" });
  check("forged session cookie rejected", forged.json.verified === false);
  const wrongName = await call("POST", "/api/trip/verify", { ref: tamper.json.booking?.ref, lastName: "Someone-Else" });
  check("verification requires matching last name", wrongName.status === 404);
  const unpaid = await call("POST", "/api/trip/verify", { ref: tamper.json.booking?.ref, lastName: guest.lastName });
  check("unpaid (pending) bookings cannot be opened as trips", unpaid.status === 404);
  cookie = "";

  if (status.json.operatorProtected) {
    const op = await call("GET", "/api/operator/overview");
    check("operator API requires passcode", op.status === 401, `${op.status}`);
    const opDis = await call("POST", "/api/operator/disruption", { portId: "cozumel", delayMin: 90 });
    check("operator disruption refused without passcode", opDis.status === 401);
  } else {
    check("operator API is UNPROTECTED (set OPERATOR_PASSCODE before deploying)", false);
  }
  const opHeaders = passcode ? { "x-operator-passcode": passcode } : {};

  // Invalid schedule: delay Ocho Rios so the sunset sail can't be booked, then clear.
  const dis = await call("POST", "/api/operator/disruption", { portId: "ocho-rios", delayMin: 360 }, opHeaders);
  if (dis.status === 200) {
    const inf = await call("POST", "/api/bookings", { excursionId: "och-dunns", guests: 2, ...guest });
    check("refuses booking a tour the delayed ship can't make", inf.status === 409 && inf.json.code === "infeasible", `${inf.status} ${inf.json.code}`);
    await call("DELETE", "/api/operator/disruption?portId=ocho-rios", undefined, opHeaders);
  } else check("operator disruption call (needs --operator-passcode)", false, `${dis.status}`);

  // ── PayPal sandbox (live) ────────────────────────
  const b = await call("POST", "/api/bookings", { excursionId: "coz-palancar-snorkel", guests: 2, ...guest });
  const id = b.json.booking?.id;
  check("booking created (pending payment, seats held)", b.status === 201, `ref=${b.json.booking?.ref} total=${b.json.booking?.totalCents}`);
  const order = await call("POST", `/api/bookings/${id}/order`);
  if (!paypalOn) {
    check("checkout honestly reports PayPal not configured (no fake payment)", order.status === 503 && order.json.code === "paypal_not_configured", `${order.status} ${order.json.code}`);
  } else {
    check("PayPal sandbox order created", order.status === 200 && !!order.json.orderId, `orderId=${order.json.orderId} status=${order.json.status}`);
    const again = await call("POST", `/api/bookings/${id}/order`);
    check("repeated order creation is idempotent (same PayPal-Request-Id → same order)", again.json.orderId === order.json.orderId, `second=${again.json.orderId}`);
    const early = await call("POST", `/api/bookings/${id}/capture`, { orderId: order.json.orderId });
    check("capture REFUSED before buyer approval (real PayPal rejection)", early.status >= 400, `${early.status} ${early.json.code}: ${early.json.error}`);
    const bk = await call("GET", `/api/bookings/${id}`);
    check("booking stays unpaid after rejected capture", bk.json.booking?.status === "pending_payment" && bk.json.booking?.paidCents === 0);
    const mismatch = await call("POST", `/api/bookings/${id}/capture`, { orderId: "NOT-THIS-BOOKINGS-ORDER" });
    check("capture with someone else's order id refused", mismatch.status === 409, `${mismatch.status} ${mismatch.json.code}`);
    console.log(`\n      → To finish live: open ${base}/checkout/${id} and approve with a SANDBOX buyer account.`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error("Smoke test crashed:", e.message);
  process.exit(1);
});
