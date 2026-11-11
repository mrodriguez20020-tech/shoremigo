import { reviewRescue } from "@/lib/server/bookings";
import { body, fail, ok } from "@/lib/server/http";
import { isOperator } from "@/lib/server/session";

/**
 * Operator review step of LastBoard Trip Rescue. The operator checks the
 * operational impact and releases the options; only the customer can then
 * approve a change to their booking or payment.
 */
export async function POST(req: Request) {
  try {
    if (!(await isOperator(req))) return ok({ error: "Operator access required" }, { status: 401 });
    const { proposalId, decision, note } = await body<{ proposalId: string; decision: "approved" | "rejected"; note: string }>(req);
    if (decision !== "approved" && decision !== "rejected") return ok({ error: "decision must be approved or rejected" }, { status: 400 });
    return ok({ proposal: await reviewRescue(String(proposalId), decision, note ? String(note) : undefined) });
  } catch (e) {
    return fail(e);
  }
}
