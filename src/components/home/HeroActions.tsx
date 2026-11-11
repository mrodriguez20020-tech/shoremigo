"use client";

import { useState } from "react";
import { PORTS } from "@/lib/domain/catalog";
import { useCompanion } from "@/components/migo/CompanionProvider";
import { useTide } from "@/components/transition/TideTransition";

export function HeroActions() {
  const [port, setPort] = useState("cozumel");
  const { go } = useTide();
  const { openConcierge } = useCompanion();
  return (
    <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center" data-migo-avoid>
      <form
        className="surface flex items-center gap-2 rounded-full p-1.5 pl-5"
        onSubmit={(e) => {
          e.preventDefault();
          go(`/excursions?port=${port}`);
        }}
      >
        <label htmlFor="hero-port" className="sr-only">
          Choose your port
        </label>
        <span className="text-xs font-bold tracking-[0.2em] text-ink-soft uppercase">Port</span>
        <select id="hero-port" value={port} onChange={(e) => setPort(e.target.value)} className="min-w-0 flex-1 cursor-pointer bg-transparent py-2 pr-2 font-semibold text-ink outline-none [&>option]:text-navy">
          {PORTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Explore tours
        </button>
      </form>
      <button className="btn btn-ghost" onClick={() => openConcierge()}>
        Talk to Migo
      </button>
    </div>
  );
}
