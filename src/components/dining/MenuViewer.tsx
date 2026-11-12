"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { type Venue } from "@/lib/domain/dining";
import { menuItemForGallery } from "@/lib/culinary/catalog";
import { fmtUsd } from "@/lib/domain/time";
import { DishArt } from "./DishArt";
import { CulinaryCollection, CulinaryTrigger } from "./CulinaryCollection";

const TAG_LABEL: Record<string, string> = {
  local: "Local specialty", "vegetarian-option": "Vegetarian option",
  "non-alcoholic": "Non-alcoholic", "contains-alcohol": "Contains alcohol (18+/legal age)",
};

/** Public venue/initial API preserved for Ships & Rooms. All source prices/tags stay untouched. */
export function MenuViewer({ venue, initial }: { venue: Venue; initial?: string }) {
  const [tab, setTab] = useState(initial ?? venue.sections[0].id);
  const section = venue.sections.find((s) => s.id === tab) ?? venue.sections[0];
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const items = venue.sections.flatMap((s) => s.items.map((it) => menuItemForGallery(it, s.id, venue.name)));
  function navigate(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (e.key === "ArrowRight") next = (index + 1) % venue.sections.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + venue.sections.length) % venue.sections.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = venue.sections.length - 1;
    else return;
    e.preventDefault(); setTab(venue.sections[next].id); tabs.current[next]?.focus();
  }
  return <CulinaryCollection items={items}>
    <div className="surface culinary-menu rounded-[28px] p-5 sm:p-7" data-migo-avoid>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="eyebrow">{venue.where}</p><h3 className="font-display mt-1 text-3xl">{venue.name}</h3><p className="mt-2 max-w-xl text-sm text-ink-soft">{venue.atmosphere}</p><p className="mt-2 text-xs text-ink-soft">{venue.hours}</p></div>
        <span className="demo-tag">{venue.status === "sample" ? "Sample menu · illustrative prices" : "Guide"}</span>
      </div>
      <div className="culinary-menu-tabs" role="tablist" aria-label={`${venue.name} menu sections`} aria-orientation="horizontal">
        {venue.sections.map((s, index) => <button key={s.id} type="button" ref={(el) => { tabs.current[index] = el; }} role="tab" id={`${id}-tab-${s.id}`} aria-selected={section.id === s.id} aria-controls={`${id}-panel-${s.id}`} tabIndex={section.id === s.id ? 0 : -1} onClick={() => setTab(s.id)} onKeyDown={(e) => navigate(e, index)}>{s.title}</button>)}
      </div>
      {venue.sections.map((s) => <div key={s.id} id={`${id}-panel-${s.id}`} role="tabpanel" aria-labelledby={`${id}-tab-${s.id}`} tabIndex={0} hidden={section.id !== s.id} className="culinary-menu-panel">
        {s.note && <p className="mb-3 text-xs text-ink-soft">{s.note}</p>}
        <ul className="divide-y divide-[var(--surface-line)]">
          {s.items.map((it) => {
            const item = menuItemForGallery(it, s.id, venue.name);
            return <li key={it.name} className="flex gap-3 py-5 sm:gap-4">
              <CulinaryTrigger item={item} className="culinary-menu-image"><DishArt tone={item.tone} kind={item.kind} /><span className="sr-only">Original illustration</span></CulinaryTrigger>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3"><p className="font-semibold">{it.name}</p><p className="shrink-0 font-semibold text-accent">{it.priceCents === 0 ? "Included" : fmtUsd(it.priceCents)}</p></div>
                <p className="mt-1 text-sm text-ink-soft">{it.description}</p>
                {it.tags && <p className="mt-2 flex flex-wrap gap-1.5">{it.tags.map((t) => <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-ink-soft uppercase">{TAG_LABEL[t]}</span>)}</p>}
              </div>
            </li>;
          })}
        </ul>
      </div>)}
      <p className="mt-4 text-[11px] leading-relaxed text-ink-soft">Sample menu at a fictional demo venue: prices in {venue.currency} are illustrative and this venue cannot be booked. Original illustrations are not photographs of a serving. Confirm ingredients and allergens with staff; ShoreMigo makes no dietary or allergen guarantees.</p>
    </div>
  </CulinaryCollection>;
}
