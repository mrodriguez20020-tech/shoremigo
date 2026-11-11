import "server-only";
import { PORTS } from "@/lib/domain/catalog";
import { type Card, TOOL_DECLARATIONS, type ToolContext, runTool } from "./tools";

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export interface ConciergeReply {
  text: string;
  cards: Card[];
  mood: "speaking" | "excited" | "concerned";
  toolsUsed: string[];
  engine: "gemini" | "offline";
  /** model that actually answered (after fallback), for the Live proof drawer */
  model?: string;
  /** tool calls exactly as requested by the model (args before normalization) */
  toolCalls?: { name: string; args: Record<string, unknown> }[];
}

const SYSTEM = `You are Migo, "The Little Tidekeeper": ShoreMigo's AI cruise shore-excursion companion. You are an AI assistant and say so if asked.
Personality: warm, curious, gently playful, concise. Ocean metaphors sparingly. 2–4 short sentences, then a clear next step.
HARD RULES:
- Only state prices, availability, times, meeting points, policies and payment status that came from a tool result in THIS conversation. If you have not called a tool, call one.
- Never invent discounts, scarcity, testimonials, safety guarantees or urgency. Never pressure.
- You cannot charge, refund or change bookings. When the customer wants to book, call prepare_booking; the customer then confirms on the card and pays with PayPal themselves.
- Never say a booking or payment succeeded unless get_my_booking/get_payment_status shows it.
- Booking or payment details require verification; if a tool says verification_required, ask them to verify with booking reference + last name using the card.
- Demo context: the ship "Aurora Tide" and sailing are fictional demo data; ports are real places. Delays are simulations.
Port ids: ${PORTS.map((p) => `${p.id} (${p.name})`).join(", ")}.`;

type GeminiPart = {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown>; id?: string };
  functionResponse?: unknown;
  thoughtSignature?: string;
};
type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

export function llmConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export const DEFAULT_MODEL = "gemini-3.6-flash";
export const DEFAULT_FALLBACKS = ["gemini-3.1-flash-lite", "gemini-3.8-flash"];

/** Primary model first, then fallbacks (deduplicated). Models get retired / overloaded; we degrade gracefully. */
export function modelChain(): string[] {
  const primary = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const extra = process.env.GEMINI_FALLBACK_MODELS ? process.env.GEMINI_FALLBACK_MODELS.split(",").map((s) => s.trim()).filter(Boolean) : DEFAULT_FALLBACKS;
  return [...new Set([primary, ...extra])];
}

// Status codes where trying another model (or retrying) can succeed.
const TRANSIENT = new Set([429, 500, 503, 504]);
const RETIRED = new Set([404]);

async function generate(models: string[], body: unknown): Promise<{ json: { candidates?: { content?: GeminiContent }[] }; model: string }> {
  let lastStatus = 0;
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(Number(process.env.LLM_TIMEOUT_MS) || 20000),
      });
      if (res.ok) return { json: await res.json(), model };
      lastStatus = res.status;
      const text = await res.text();
      console.error("Gemini error", model, res.status, text.slice(0, 300));
      if (RETIRED.has(res.status)) break; // next model
      if (!TRANSIENT.has(res.status)) throw new Error(`LLM request failed (${res.status})`);
      if (attempt === 0) await new Promise((r) => setTimeout(r, 600));
    }
  }
  throw new Error(`LLM request failed (${lastStatus}) on all models`);
}

export async function converse(history: ChatTurn[], ctx: ToolContext): Promise<ConciergeReply> {
  if (!llmConfigured()) return offlineConverse(history, ctx);

  let models = modelChain();
  const contents: GeminiContent[] = history.slice(-12).map((t) => ({ role: t.role === "user" ? "user" : "model", parts: [{ text: t.text }] }));
  if (ctx.page) contents[contents.length - 1].parts.unshift({ text: `[context: customer is viewing ${ctx.page}]` });

  const cards: Card[] = [];
  const toolsUsed: string[] = [];
  const toolCalls: { name: string; args: Record<string, unknown> }[] = [];
  let answeredBy = "";
  let mood: ConciergeReply["mood"] = "speaking";

  for (let step = 0; step < 6; step++) {
    const { json, model } = await generate(models, {
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 700 },
    });
    // Stay on the model that answered for the rest of this conversation turn (thought signatures are model-specific).
    models = [model];
    answeredBy = model;
    const content: GeminiContent | undefined = json.candidates?.[0]?.content;
    if (!content?.parts?.length) throw new Error("LLM returned no content");
    contents.push({ role: "model", parts: content.parts });

    const calls = content.parts.filter((p) => p.functionCall);
    if (!calls.length) {
      const text = content.parts.map((p) => p.text ?? "").join("").trim();
      return { text: text || "I'm here! What would you like to explore?", cards: dedupe(cards), mood, toolsUsed, toolCalls, model: answeredBy, engine: "gemini" };
    }
    const responses: GeminiPart[] = [];
    for (const c of calls) {
      const { name, args, id } = c.functionCall!;
      toolsUsed.push(name);
      toolCalls.push({ name, args: args ?? {} });
      const out = await runTool(name, args ?? {}, ctx);
      if (out.cards) cards.push(...out.cards);
      if (out.mood === "concerned") mood = "concerned";
      else if (out.mood === "excited" && mood !== "concerned") mood = "excited";
      responses.push({ functionResponse: { name, ...(id ? { id } : {}), response: { content: out.result } } });
    }
    contents.push({ role: "user", parts: responses });
  }
  return { text: "Let me keep that simple. Could you tell me which port you're most excited about?", cards: dedupe(cards), mood, toolsUsed, toolCalls, model: answeredBy, engine: "gemini" };
}

function dedupe(cards: Card[]) {
  const seen = new Set<string>();
  return cards.filter((c) => {
    const k = JSON.stringify(c);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Deterministic fallback used when no LLM key is configured (or for tests).
 * It calls the same approved tools and is labeled "offline" in the UI.
 */
export async function offlineConverse(history: ChatTurn[], ctx: ToolContext): Promise<ConciergeReply> {
  const q = (history.at(-1)?.text ?? "").toLowerCase();
  const port = PORTS.find((p) => q.includes(p.name.toLowerCase()) || q.includes(p.id));
  const cat = (["snorkel", "culture", "nature", "adventure", "sail", "food"] as const).find((c) => q.includes(c)) ??
    (/reef|swim|turtle|fish/.test(q) ? "snorkel" : /sunset|boat|catamaran/.test(q) ? "sail" : /chocolate|eat|cacao|lunch/.test(q) ? "food" : /zip|thrill|climb/.test(q) ? "adventure" : undefined);
  const used: string[] = [];
  const call = async (n: string, a: Record<string, unknown>) => {
    used.push(n);
    return runTool(n, a, ctx);
  };
  const done = (text: string, o: { cards?: Card[]; mood?: ConciergeReply["mood"] } = {}): ConciergeReply => ({
    text,
    cards: o.cards ?? [],
    mood: o.mood ?? "speaking",
    toolsUsed: used,
    engine: "offline",
  });

  if (/are you (an? )?(ai|bot|human|real)/.test(q)) return done("I'm Migo, ShoreMigo's AI assistant. I can find tours that fit your ship's schedule and get a booking ready for you to confirm.");
  if (/rescue|delay|late|missed/.test(q)) {
    const r = await call("get_trip_rescue", {});
    const res = r.result as { open_proposal?: boolean; error?: string };
    if (res.error) return done("I can check that once you verify your booking with your reference and last name.", { cards: r.cards });
    return res.open_proposal
      ? done("Your excursion no longer fits after the delay. I've lined up alternatives that do. Nothing changes until you approve one.", { cards: r.cards, mood: "concerned" })
      : done("Good news: there's no open Trip Rescue for your booking right now.");
  }
  if (/my booking|my trip|booking status|reservation/.test(q)) {
    const r = await call("get_my_booking", {});
    const res = r.result as { error?: string; ref?: string; status?: string };
    if (res.error) return done("Happy to look. First, please verify with your booking reference and last name.", { cards: r.cards });
    return done(`Booking ${res.ref} is currently ${res.status?.replace("_", " ")}.`, { cards: r.cards, mood: r.mood === "concerned" ? "concerned" : "speaking" });
  }
  if (/\b(paid|paypal|charged|payment status|my payment)\b/.test(q)) {
    const r = await call("get_payment_status", {});
    const res = r.result as { error?: string; payments?: { kind: string; amount: string; recorded_status: string }[] };
    if (res.error) return done("I can share payment details after you verify your booking.", { cards: r.cards });
    const lines = (res.payments ?? []).map((p) => `${p.kind} ${p.amount}: ${p.recorded_status}`).join("; ");
    return done(lines ? `Here's what PayPal (sandbox) shows: ${lines}.` : "There are no payments on this booking yet.");
  }
  if (/polic|cancel|refund|rules|terms/.test(q)) {
    const r = await call("get_policies", {});
    const p = (r.result as { policies: string[] }).policies;
    return done(`Here are the essentials: ${p[0]} ${p[3]}`);
  }
  if (/meet|pickup|pick up|where do/.test(q) && port) {
    const r = await call("search_excursions", { port_id: port.id });
    return done(`In ${port.name}, every tour meets at the ShoreMigo flag near the pier exit. Open any tour for the exact spot.`, { cards: r.cards });
  }
  if (/book|reserve|sign me up|i('| a)?ll take/.test(q)) {
    const s = await call("search_excursions", { port_id: port?.id, category: cat });
    const first = (s.result as { excursions: { id: string; schedule_fit: string; seats_left: number }[] }).excursions.find((e) => e.schedule_fit !== "infeasible" && e.seats_left > 0);
    if (!first) return done("I couldn't find an available tour for that. Want me to widen the search?");
    const guests = Number(/(\d)\s*(guests|people|of us|adults|persons)/.exec(q)?.[1] ?? 2);
    const p = await call("prepare_booking", { excursion_id: first.id, guests });
    return done("I've prepared a booking for you. Check the details on the card, and when you're happy, continue to secure PayPal checkout. Nothing is charged until you approve it there.", { cards: p.cards, mood: "excited" });
  }
  if (cat || port || /recommend|suggest|what should|ideas|explore|tour|excursion/.test(q)) {
    const r = await call("search_excursions", { port_id: port?.id, category: cat });
    const list = (r.result as { excursions: { title: string; schedule_fit: string }[] }).excursions.filter((e) => e.schedule_fit !== "infeasible");
    if (!list.length) return done("Nothing matches that and fits the ship's schedule. Shall I try another port or style?");
    return done(`Ooh, I found ${list.length} that fit your port time${port ? ` in ${port.name}` : ""}. ${list[0].title} is a lovely place to start.`, { cards: r.cards, mood: "excited" });
  }
  return done("Ahoy! I'm Migo, your AI shore companion. Tell me a port, or what you love (reefs, culture, sunsets, thrills), and I'll find tours that fit your ship's schedule.");
}
