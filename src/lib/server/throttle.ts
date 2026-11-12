import "server-only";

// Per-instance throttle protecting the paid model quota: 20 messages/minute and 300/day per client.
const hits = new Map<string, number[]>();
export function conciergeThrottled(key: string, now = Date.now()) {
  const day = (hits.get(key) ?? []).filter((t) => now - t < 86_400_000);
  const minute = day.filter((t) => now - t < 60_000).length;
  if (minute >= 20 || day.length >= 300) { hits.set(key, day); return true; }
  day.push(now);
  hits.set(key, day);
  if (hits.size > 20_000) hits.clear();
  return false;
}
