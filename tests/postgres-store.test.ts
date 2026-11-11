import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createFakePayPal } from "./fake-paypal";

/**
 * Runs the booking service against a real Postgres (the adapter used on Vercel).
 * Skipped unless PG_TEST_URL is set, e.g. a local PGlite socket server or a
 * throwaway Supabase/Neon database:  PG_TEST_URL=postgres://... npx vitest run tests/postgres-store.test.ts
 */
const url = process.env.PG_TEST_URL;

describe.skipIf(!url)("Postgres store adapter", () => {
  let svc: typeof import("@/lib/server/bookings");
  let store: typeof import("@/lib/server/store");
  const guest = { firstName: "Ana", lastName: "Rivera", email: "ana@example.com" };

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.PAYPAL_CLIENT_ID = "test-client";
    process.env.PAYPAL_CLIENT_SECRET = "test-secret";
    const { default: postgres } = await import("postgres");
    const sql = postgres(url!, { prepare: false, max: 1, ssl: /localhost|127\.0\.0\.1/.test(url!) ? false : "require" });
    await sql`drop table if exists shoremigo_state`;
    await sql.end();
    vi.stubGlobal("fetch", createFakePayPal().fetchImpl);
    store = await import("@/lib/server/store");
    svc = await import("@/lib/server/bookings");
  });
  afterAll(() => {
    vi.unstubAllGlobals();
    delete process.env.DATABASE_URL;
  });

  it("creates the table and persists a booking + PayPal capture", async () => {
    const b = await svc.createBooking({ excursionId: "coz-palancar-snorkel", guests: 2, ...guest });
    const order = await svc.startCheckout(b.id);
    const paid = await svc.completeCheckout(b.id, order.id);
    expect(paid).toMatchObject({ status: "confirmed", paidCents: 17800 });
    expect(await svc.getBooking(b.id)).toMatchObject({ status: "confirmed" });
  });

  it("rolls back when the transaction callback throws", async () => {
    const before = await store.read((db) => db.bookings.length);
    await expect(
      store.tx((db) => {
        db.bookings.push({ id: "ghost" } as never);
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(await store.read((db) => db.bookings.length)).toBe(before);
  });

  it("does not oversell under concurrent requests", async () => {
    const results = await Promise.allSettled([1, 2, 3].map(() => svc.createBooking({ excursionId: "coz-punta-sur", guests: 5, ...guest })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  });

  it("enforces operator inventory rules", async () => {
    await expect(svc.updateInventory({ excursionId: "coz-punta-sur", capacity: 3 })).rejects.toMatchObject({ code: "would_oversell" });
    await svc.updateInventory({ excursionId: "coz-cacao", open: false });
    await expect(svc.createBooking({ excursionId: "coz-cacao", guests: 1, ...guest })).rejects.toMatchObject({ code: "closed" });
  });
});
