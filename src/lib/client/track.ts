/**
 * Anonymous engagement tracking. Sends only an allow-listed event type and
 * short scalar props (ids, page names, counts). No names, emails, free text,
 * cookies or device fingerprints. Failures are silent by design.
 */
export function track(type: string, props: Record<string, string | number | boolean> = {}) {
  try {
    const body = JSON.stringify({ type, props });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {}
}

export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    method: init?.method ?? (init?.json !== undefined ? "POST" : "GET"),
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? `Request failed (${res.status})`), { code: data.code, status: res.status });
  return data as T;
}
