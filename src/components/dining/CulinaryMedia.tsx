"use client";

import Image from "next/image";
import { useState } from "react";
import { type CulinaryItem, photoFor } from "@/lib/culinary/catalog";
import { DishArt } from "./DishArt";

/** Only verified guide IDs bind to photographs. A sample menu never implies that photographed serving. */
export function CulinaryMedia({ item, expanded = false, priority = false }: { item: CulinaryItem; expanded?: boolean; priority?: boolean }) {
  const photo = photoFor(item.id);
  const [failed, setFailed] = useState(false);
  return (
    <div className="culinary-media" data-media-kind={photo && !failed ? "photograph" : "illustration"}>
      {photo && !failed ? (
        <Image key={photo.id} src={`/culinary/${photo.id}-${expanded ? 2400 : priority ? 1200 : 640}.webp`} alt={`${item.name} — dish guide photograph, not a sample-menu serving`} width={photo.sourceWidth} height={photo.sourceHeight} unoptimized priority={priority} loading={priority ? undefined : "lazy"} onError={() => setFailed(true)} />
      ) : <DishArt tone={item.tone} kind={item.kind} />}
      <span className="culinary-media-label">{photo && !failed ? "Dish guide · photograph" : photo ? "Photo unavailable · illustration" : "Original illustration"}</span>
    </div>
  );
}
