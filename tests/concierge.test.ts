import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = await import("@/lib/server/store");
const { runTool, normalizeArgs } = await import("@/lib/concierge/tools");
const engine = await import("@/lib/concierge/engine");

beforeEach(() => store.__resetStoreForTests());
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;
  delete process.env.GEMINI_FALLBACK_MODELS;
});

describe("LLM argument normalization (bug found in live Gemini testing)", () => {
  it("maps display names and synonyms onto catalog ids", () => {
    expect(normalizeArgs({ port_id: "Cozumel", category: "snorkeling" })).toEqual({ port_id: "cozumel", category: "snorkel" });
    expect(normalizeArgs({ port_id: "Grand Cayman" }).port_id).toBe("grand-cayman");
    expect(normalizeArgs({ port_id: "Roatan" }).port_id).toBe("roatan");
    expect(normalizeArgs({ excursion_id: "Golden Hour Catamaran" }).excursion_id).toBe("och-sunset-sail");
    expect(normalizeArgs({ vibes: ["Sailing", "food"] }).vibes).toEqual(["sail", "food"]);
  });

  it("drops values it cannot resolve instead of guessing", () => {
    expect(normalizeArgs({ port_id: "Atlantis", category: "time travel" })).toEqual({});
  });

  it("search with model-style args returns results", async () => {
    const out = await runTool("search_excursions", { port_id: "Cozumel", category: "snorkeling" }, { verifiedBookingId: null });
    expect((out.result as { count: number }).count).toBe(2);
  });
});

describe("Gemini model fallback", () => {
  it("skips a retired (404) model, retries then skips an overloaded (503) one, and echoes call ids", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "retired-model";
    process.env.GEMINI_FALLBACK_MODELS = "busy-model,good-model";
    const seen: string[] = [];
    const goodBodies: { contents: { parts: { functionResponse?: { id?: string } }[] }[] }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      const m = /models\/([^:]+):/.exec(url)![1];
      seen.push(m);
      if (m === "retired-model") return new Response("{}", { status: 404 });
      if (m === "busy-model") return new Response("{}", { status: 503 });
      goodBodies.push(JSON.parse(String(init.body)));
      const parts =
        goodBodies.length === 1 ? [{ functionCall: { name: "get_policies", args: {}, id: "call_1" } }] : [{ text: "Here are the policies." }];
      return new Response(JSON.stringify({ candidates: [{ content: { role: "model", parts } }] }), { status: 200 });
    });
    const r = await engine.converse([{ role: "user", text: "policies?" }], { verifiedBookingId: null });
    expect(r.engine).toBe("gemini");
    expect(seen).toEqual(["retired-model", "busy-model", "busy-model", "good-model", "good-model"]);
    expect(goodBodies[1].contents.at(-1)!.parts[0].functionResponse!.id).toBe("call_1");
  });

  it("rejects with a clear error when every model fails", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_FALLBACK_MODELS = "x";
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 503 }));
    await expect(engine.converse([{ role: "user", text: "hi" }], { verifiedBookingId: null })).rejects.toThrow(/all models/);
  });
});

describe("concierge tools", () => {
  it("requires booking verification for booking and payment details", async () => {
    for (const t of ["get_my_booking", "get_payment_status", "get_trip_rescue"]) {
      const out = await runTool(t, {}, { verifiedBookingId: null });
      expect(out.result).toMatchObject({ error: "verification_required" });
      expect(out.cards).toEqual([{ type: "verify_booking" }]);
    }
  });

  it("prepare_booking never charges and uses the server's price", async () => {
    const out = await runTool("prepare_booking", { excursion_id: "och-sunset-sail", guests: 2, price: 1 }, { verifiedBookingId: null });
    expect(out.result).toMatchObject({ prepared: true, charged: false, total: "$258.00" });
    expect(out.cards?.[0]).toEqual({ type: "prepare_booking", excursionId: "och-sunset-sail", guests: 2, totalCents: 25800 });
  });

  it("refuses to prepare an infeasible or oversized booking", async () => {
    await store.tx((db) => {
      db.disruptions.push({ portId: "cozumel", delayMin: 90, allAboardExtensionMin: 0, simulated: true, createdAt: "", createdBy: "operator" });
    });
    expect((await runTool("prepare_booking", { excursion_id: "coz-palancar-snorkel", guests: 2 }, { verifiedBookingId: null })).result).toMatchObject({
      error: "infeasible",
    });
    expect((await runTool("prepare_booking", { excursion_id: "coz-cacao", guests: 40 }, { verifiedBookingId: null })).result).toMatchObject({
      error: expect.stringMatching(/guests/),
    });
  });

  it("search returns only catalog data with live feasibility", async () => {
    const out = await runTool("search_excursions", { port_id: "cozumel", category: "snorkel" }, { verifiedBookingId: null });
    const r = out.result as { excursions: { id: string; price_per_guest: string; schedule_fit: string }[] };
    expect(r.excursions.map((e) => e.id).sort()).toEqual(["coz-afternoon-reef", "coz-palancar-snorkel"]);
    expect(r.excursions.find((e) => e.id === "coz-palancar-snorkel")!.price_per_guest).toBe("$89.00");
  });
});

describe("Gemini tool-calling loop", () => {
  it("executes requested tools and returns the model's grounded answer", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const bodies: unknown[] = [];
    let call = 0;
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)));
      call++;
      const parts =
        call === 1
          ? [{ functionCall: { name: "search_excursions", args: { port_id: "ocho-rios", category: "sail" } } }]
          : [{ text: "The Golden Hour Catamaran fits beautifully." }];
      return new Response(JSON.stringify({ candidates: [{ content: { role: "model", parts } }] }), { status: 200 });
    });
    const r = await engine.converse([{ role: "user", text: "sunset sail in Ocho Rios?" }], { verifiedBookingId: null });
    expect(r.engine).toBe("gemini");
    expect(r.toolsUsed).toEqual(["search_excursions"]);
    expect(r.cards[0]).toEqual({ type: "excursions", ids: ["och-sunset-sail"] });
    // second request carried the real tool result back to the model
    const second = bodies[1] as { contents: { parts: { functionResponse?: { response: { content: { excursions: { id: string }[] } } } }[] }[] };
    const fr = second.contents.at(-1)!.parts[0].functionResponse!;
    expect(fr.response.content.excursions[0].id).toBe("och-sunset-sail");
  });

  it("throws on an empty/invalid model response so the API can fall back", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ candidates: [] }), { status: 200 }));
    await expect(engine.converse([{ role: "user", text: "hi" }], { verifiedBookingId: null })).rejects.toThrow(/no content/);
  });

  it("throws on HTTP errors / timeouts", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    vi.stubGlobal("fetch", async () => {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    });
    await expect(engine.converse([{ role: "user", text: "hi" }], { verifiedBookingId: null })).rejects.toThrow();
  });
});

describe("offline concierge (no LLM configured)", () => {
  it("is labeled offline and uses the same approved tools", async () => {
    const r = await engine.converse([{ role: "user", text: "I want to snorkel in Cozumel" }], { verifiedBookingId: null });
    expect(r.engine).toBe("offline");
    expect(r.toolsUsed).toContain("search_excursions");
  });

  it("does not claim payment status without verification", async () => {
    const r = await engine.converse([{ role: "user", text: "was I charged? check my payment status" }], { verifiedBookingId: null });
    expect(r.text).toMatch(/verify/i);
    expect(r.cards).toEqual([{ type: "verify_booking" }]);
  });

  it("prepares, but does not create, a booking on purchase intent", async () => {
    const r = await engine.converse([{ role: "user", text: "book the sunset sail in Ocho Rios for 2 people" }], { verifiedBookingId: null });
    expect(r.cards[0]).toMatchObject({ type: "prepare_booking", guests: 2 });
    expect(await store.read((db) => db.bookings.length)).toBe(0);
  });
});
