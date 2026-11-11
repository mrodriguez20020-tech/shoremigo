"use client";

import { useState } from "react";
import { fmtUsd } from "@/lib/domain/time";
import { migo } from "@/components/migo/bus";
import { useTide } from "@/components/transition/TideTransition";
import { api, track } from "@/lib/client/track";

export function ReserveForm({
  excursionId,
  unitCents,
  seatsLeft,
  feasible,
  initialGuests,
  maxGuests,
}: {
  excursionId: string;
  unitCents: number;
  seatsLeft: number;
  feasible: boolean;
  initialGuests: number;
  maxGuests: number;
}) {
  const { go } = useTide();
  const [guests, setGuests] = useState(Math.min(initialGuests, Math.max(1, seatsLeft)));
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const max = Math.min(maxGuests, seatsLeft);
  const blocked = !feasible || seatsLeft < 1;

  const focusProps = { onFocus: () => migo.emit({ type: "form:focus" }), onBlur: () => migo.emit({ type: "form:blur" }) };

  return (
    <form
      className="mt-6 grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr(null);
        try {
          const r = await api<{ booking: { id: string } }>("/api/bookings", { json: { excursionId, guests, firstName: first, lastName: last, email } });
          track("booking.started", { excursionId, count: guests });
          migo.emit({ type: "form:blur" });
          go(`/checkout/${r.booking.id}`);
        } catch (x) {
          setErr((x as Error).message);
          setBusy(false);
        }
      }}
    >
      <div className="flex items-center justify-between rounded-2xl border border-line p-3">
        <span className="font-semibold">Guests</span>
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-ghost !h-9 !w-9 !p-0" onClick={() => setGuests((g) => Math.max(1, g - 1))} aria-label="Fewer guests" disabled={guests <= 1}>
            −
          </button>
          <output className="w-6 text-center text-lg font-bold" aria-live="polite">
            {guests}
          </output>
          <button type="button" className="btn btn-ghost !h-9 !w-9 !p-0" onClick={() => setGuests((g) => Math.min(max, g + 1))} aria-label="More guests" disabled={guests >= max}>
            +
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">First name</span>
          <input required className="field" value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" maxLength={60} {...focusProps} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Last name</span>
          <input required className="field" value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" maxLength={60} {...focusProps} />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-semibold">Email</span>
        <input required type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={120} {...focusProps} />
      </label>
      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-ink-soft">Total</span>
        <span className="font-display text-3xl">{fmtUsd(unitCents * guests)}</span>
      </div>
      {err && (
        <p className="rounded-xl bg-warm/15 px-3 py-2 text-sm" role="alert">
          {err}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full !py-4 text-base" disabled={busy || blocked}>
        {blocked ? (feasible ? "Sold out" : "Doesn't fit the ship's schedule") : busy ? "Holding your seats…" : "Continue to secure checkout"}
      </button>
      <p className="text-center text-xs text-ink-soft">Seats are held for 15 minutes while you pay with PayPal (sandbox). Nothing is charged until you approve in PayPal.</p>
    </form>
  );
}
