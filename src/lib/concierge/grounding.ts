/**
 * Price grounding guard (deterministic, server-side).
 *
 * Prices must come from trusted application logic, never from the model. After the model answers,
 * every USD amount in its text is checked against the amounts the approved tools returned in this
 * turn. An amount is grounded if it equals a tool amount, or a tool per-guest amount times a guest
 * count the booking policy allows (the same arithmetic the server performs). Anything else is
 * replaced with neutral wording and reported, so an invented or misremembered price never reaches
 * the customer. Cards always carry the server's own figures.
 */
const USD = /\$\s?(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{2}))?/g;

function toCents(whole: string, cents?: string) {
  return Number(whole.replace(/,/g, "")) * 100 + Number(cents ?? 0);
}

export function amountsIn(value: unknown): Set<number> {
  const out = new Set<number>();
  const json = JSON.stringify(value ?? null);
  for (const m of json.matchAll(USD)) out.add(toCents(m[1], m[2]));
  return out;
}

export function groundPrices(text: string, toolResults: unknown[], maxGuests: number) {
  const base = new Set<number>();
  for (const r of toolResults) for (const a of amountsIn(r)) base.add(a);
  const allowed = new Set<number>(base);
  for (const a of base) for (let g = 2; g <= maxGuests; g++) allowed.add(a * g);
  const corrected: string[] = [];
  const grounded = text.replace(USD, (match, whole: string, cents?: string) => {
    if (allowed.has(toCents(whole, cents))) return match;
    corrected.push(match.trim());
    return "the price shown on the card";
  });
  return { text: grounded, corrected };
}

/** Only a same-site path may be passed to the model as page context (no free text from the client). */
export function safePageContext(page: unknown): string | undefined {
  if (typeof page !== "string") return undefined;
  const p = page.slice(0, 80);
  return /^\/[A-Za-z0-9\-_/]*$/.test(p) ? p : undefined;
}
