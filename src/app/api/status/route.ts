import { llmConfigured } from "@/lib/concierge/engine";
import { paypalConfigured } from "@/lib/server/paypal";
import { ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export function GET() {
  return ok({
    paypal: paypalConfigured() ? "sandbox" : "not_configured",
    paypalClientId: paypalConfigured() ? process.env.PAYPAL_CLIENT_ID : null,
    llm: llmConfigured() ? `gemini:${process.env.GEMINI_MODEL || "gemini-2.5-flash"}` : "offline",
    operatorProtected: Boolean(process.env.OPERATOR_PASSCODE),
  });
}
