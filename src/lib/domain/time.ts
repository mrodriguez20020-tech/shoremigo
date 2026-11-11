export function toMin(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) throw new Error(`Invalid time: ${hhmm}`);
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 23 || mm > 59) throw new Error(`Invalid time: ${hhmm}`);
  return h * 60 + mm;
}

export function fmtMin(min: number): string {
  const day = Math.floor(min / 1440);
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}${day > 0 ? " (+1)" : ""}`;
}

export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function fmtUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/** PayPal wants "12.34" strings. Integer cents in, exact string out. */
export function centsToPaypal(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) throw new Error(`Invalid cents: ${cents}`);
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

export function paypalToCents(value: string): number {
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!m) throw new Error(`Invalid PayPal amount: ${value}`);
  return Number(m[1]) * 100 + Number((m[2] ?? "0").padEnd(2, "0"));
}
