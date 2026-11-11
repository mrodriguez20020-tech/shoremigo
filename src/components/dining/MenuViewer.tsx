"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { LOCAL_FLAVOURS, type Venue } from "@/lib/domain/dining";
import { fmtUsd } from "@/lib/domain/time";
import { DishArt } from "./DishArt";

const TAG_LABEL: Record<string, string> = {
  local: "Local specialty",
  "vegetarian-option": "Vegetarian option",
  "non-alcoholic": "Non-alcoholic",
  "contains-alcohol": "Contains alcohol (18+/legal age)",
};

/** Accessible tabbed menu. Prices are samples; 0 = included in the (demo) fare. */
export function MenuViewer({ venue, initial }: { venue: Venue; initial?: string }) {
  const [tab, setTab] = useState(initial ?? venue.sections[0].id);
  const section = venue.sections.find((s) => s.id === tab) ?? venue.sections[0];
  return (
    <div className="surface rounded-[28px] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{venue.where}</p>
          <h3 className="font-display mt-1 text-3xl">{venue.name}</h3>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">{venue.atmosphere}</p>
          <p className="mt-1 text-xs text-ink-soft">{venue.hours}</p>
        </div>
        <span className="demo-tag">{venue.status === "sample" ? "Sample menu · illustrative prices" : "Guide"}</span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label={`${venue.name} menu sections`}>
        {venue.sections.map((s) => (
          <button
            key={s.id}
            role="tab"
            id={`tab-${venue.id}-${s.id}`}
            aria-selected={tab === s.id}
            aria-controls={`panel-${venue.id}`}
            onClick={() => setTab(s.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === s.id ? "bg-accent text-accent-ink" : "bg-white/10 text-ink-soft hover:text-ink"}`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={section.id}
          id={`panel-${venue.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${venue.id}-${section.id}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="mt-5"
        >
          {section.note && <p className="mb-3 text-xs text-ink-soft">{section.note}</p>}
          <ul className="divide-y divide-[var(--surface-line)]">
            {section.items.map((it) => {
              const dish = it.dishId ? LOCAL_FLAVOURS.find((d) => d.id === it.dishId) : undefined;
              return (
                <li key={it.name} className="flex gap-4 py-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                    <DishArt tone={dish?.tone ?? ["#65d6cf", "#0d2f43"]} kind={dish?.kind ?? (section.id === "drinks" || section.id === "coffee" ? "drink" : section.id.includes("dessert") || section.id === "sweets" ? "sweet" : "main")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-semibold">{it.name}</p>
                      <p className="shrink-0 font-semibold text-accent">{it.priceCents === 0 ? "Included" : fmtUsd(it.priceCents)}</p>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-soft">{it.description}</p>
                    {it.tags && (
                      <p className="mt-1.5 flex flex-wrap gap-1.5">
                        {it.tags.map((t) => (
                          <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-ink-soft uppercase">
                            {TAG_LABEL[t]}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </AnimatePresence>
      <p className="mt-4 text-[11px] leading-relaxed text-ink-soft">
        Sample menu at a fictional demo venue: prices in {venue.currency} are illustrative and this venue cannot be booked. Always confirm ingredients and allergens with
        staff; ShoreMigo makes no dietary or allergen guarantees.
      </p>
    </div>
  );
}
