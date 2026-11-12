"use client";

import { useState } from "react";
import { type CulinaryItem, photoFor } from "@/lib/culinary/catalog";
import { fmtUsd } from "@/lib/domain/time";
import { CulinaryCollection, CulinaryTrigger } from "./CulinaryCollection";
import { CulinaryMedia } from "./CulinaryMedia";

export function CulinaryGallery({ items, filterable = false }: { items: CulinaryItem[]; filterable?: boolean }) {
  const [region, setRegion] = useState("All flavours");
  const regions = ["All flavours", ...new Set(items.map((d) => d.region))];
  const visible = region === "All flavours" ? items : items.filter((d) => d.region === region);
  return <>
    {filterable && <div className="culinary-filters" role="group" aria-label="Filter dish guide by region">{regions.map((r) => <button type="button" key={r} aria-pressed={region === r} onClick={() => setRegion(r)}>{r}</button>)}</div>}
    <CulinaryCollection items={visible}>
      <div className="culinary-grid">
        {visible.map((item, i) => <article className="culinary-card" key={item.id}>
          <CulinaryTrigger item={item}>
            <div className="culinary-card-media"><CulinaryMedia item={item} /><span className="culinary-expand" aria-hidden>↗</span></div>
            <div className="culinary-card-copy">
              <p className="culinary-kicker">{item.sample ? "Sample menu · USD" : item.region}</p>
              <div className="culinary-card-title"><h3>{item.name}</h3><span aria-hidden>{String(i + 1).padStart(2, "0")}</span></div>
              <p>{item.description}</p>
              {item.priceCents !== undefined && <p className="culinary-card-price">{fmtUsd(item.priceCents)} <span>· sample</span></p>}
              {item.tags?.includes("contains-alcohol") && <p className="culinary-alcohol">Contains alcohol · legal drinking age only</p>}
              <span className="culinary-card-link">Explore the dish <span aria-hidden>→</span></span>
              {photoFor(item.id) && <small className="culinary-card-credit">Photo: {photoFor(item.id)!.author} · {photoFor(item.id)!.license}</small>}
            </div>
          </CulinaryTrigger>
        </article>)}
      </div>
    </CulinaryCollection>
  </>;
}
