import { clearDisruption, simulateDisruption } from "@/lib/server/bookings";
import { body, fail, ok } from "@/lib/server/http";
import { isOperator } from "@/lib/server/session";

export async function POST(req: Request) {
  try {
    if (!(await isOperator(req))) return ok({ error: "Operator access required" }, { status: 401 });
    const { portId, delayMin, allAboardExtensionMin } = await body<{ portId: string; delayMin: number; allAboardExtensionMin: number }>(req);
    return ok(await simulateDisruption(String(portId), Number(delayMin), "operator", Number(allAboardExtensionMin ?? 0)));
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request) {
  try {
    if (!(await isOperator(req))) return ok({ error: "Operator access required" }, { status: 401 });
    const portId = new URL(req.url).searchParams.get("portId");
    if (!portId) return ok({ error: "portId required" }, { status: 400 });
    await clearDisruption(portId);
    return ok({ cleared: true });
  } catch (e) {
    return fail(e);
  }
}
