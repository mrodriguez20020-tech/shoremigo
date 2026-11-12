import { converse, offlineConverse, type ChatTurn } from "@/lib/concierge/engine";
import { body, fail, ok } from "@/lib/server/http";
import { getVerifiedBookingId } from "@/lib/server/session";
import { safePageContext } from "@/lib/concierge/grounding";
import { conciergeThrottled } from "@/lib/server/throttle";

export async function POST(req: Request) {
  try {
    const client = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    if (conciergeThrottled(client)) return ok({ error: "Migo needs a short breather. Please try again in a minute.", code: "rate_limited" }, { status: 429 });
    const { history, page } = await body<{ history: ChatTurn[]; page: string }>(req);
    const clean = (Array.isArray(history) ? history : [])
      .filter((t) => (t?.role === "user" || t?.role === "assistant") && typeof t.text === "string")
      .map((t) => ({ role: t.role, text: t.text.slice(0, 1200) }))
      .slice(-12);
    if (!clean.length || clean.at(-1)!.role !== "user") return ok({ error: "Send a message" }, { status: 400 });
    const ctx = { verifiedBookingId: await getVerifiedBookingId(), page: safePageContext(page) };
    try {
      return ok(await converse(clean, ctx));
    } catch (e) {
      // LLM outage: fall back to the deterministic concierge and say so in the UI.
      console.error("LLM failed, using offline concierge", e);
      return ok({ ...(await offlineConverse(clean, ctx)), degraded: true });
    }
  } catch (e) {
    return fail(e);
  }
}
