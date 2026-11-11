import { cookies } from "next/headers";
import { body, ok } from "@/lib/server/http";
import { operatorCookieValue } from "@/lib/server/session";

export async function POST(req: Request) {
  const { passcode } = await body<{ passcode: string }>(req);
  if (!process.env.OPERATOR_PASSCODE) return ok({ ok: true, demo: true });
  if (passcode !== process.env.OPERATOR_PASSCODE) return ok({ error: "Incorrect passcode" }, { status: 401 });
  (await cookies()).set("sm_op", operatorCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return ok({ ok: true });
}
