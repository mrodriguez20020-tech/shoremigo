import { recordEngagement } from "@/lib/server/bookings";
import { body, fail, ok } from "@/lib/server/http";

/** Anonymous engagement events: allow-listed types and props, no PII, no cookies. */
export async function POST(req: Request) {
  try {
    const { type, props } = await body<{ type: string; props: Record<string, unknown> }>(req);
    await recordEngagement(String(type), props && typeof props === "object" ? props : {});
    return ok({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
