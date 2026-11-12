"use client";

import { useState } from "react";
import type { Excursion } from "@/lib/domain/types";
import { ExcursionArt } from "./ExcursionArt";

const entries = [
  ["coz-palancar-snorkel","Palancar_reef.jpg","ea","Johnnie Flashlite","by-sa/4.0","Palancar Reef, Cozumel, Mexico","Coral formations at Palancar Reef",1280],
  ["coz-afternoon-reef","Sea_Turtle_over_Coral_Reef_in_the_Abacos,_Bahamas.jpg","a4","Elh733","by-sa/4.0","Abaco Islands, Bahamas","Sea turtle swimming over a coral reef",1280],
  ["coz-cacao","Elaboración_del_chocolate.jpg","85","Julia Estrada","by-sa/4.0","Chocolate making, Mexico","Traditional cacao and chocolate preparation",1280],
  ["coz-punta-sur","Faro_de_Celarain_en_la_isla_de_Cozumel,_México.jpg","a8","Saúl Peláez S.","by-sa/3.0","Celarain Lighthouse, Cozumel, Mexico","Celarain lighthouse above the Caribbean coast",1280],
  ["roa-canopy","Costa_Rican_Three-Toed_Sloth.jpg","3f","Urak-Tou","by/4.0","Cloud rainforest, Costa Rica","A three-toed sloth among rainforest branches",1280],
  ["roa-west-bay","Coral_cluster_near_Roatán_Honduras.jpeg","f2","DJ Cane","by-sa/4.0","West Bay, Roatán, Honduras","Coral cluster in West Bay",1280],
  ["roa-garifuna","GarifunaDrummers.jpg","c0","Mike Murga","by/2.0","Garifuna drummers, Belize","Garifuna musicians playing traditional drums",1280],
  ["gcm-stingray","Stingray_CIty_in_Grand_Cayman.jpg","0c","Kfulgham84","by-sa/3.0","Stingray City Sandbar, Grand Cayman","Stingrays in the shallow waters of Stingray City",1280],
  ["gcm-seven-mile","Seven_Mile_Beach_Facing_West.jpg","be","Coolcaesar","by/4.0","Seven Mile Beach, Grand Cayman","Turquoise water and sand at Seven Mile Beach",1280],
  ["och-dunns","Dunn's_River_Falls.jpg","6e","Thank You (23 Millions+) views","by/2.0","Dunn’s River Falls, Jamaica","Terraced waterfall in tropical greenery",1280],
  ["och-sunset-sail","Catamaran_at_Sunset.jpg","57","Mattstone911","by-sa/3.0","Negril, Jamaica","Catamaran anchored against a sunset",960],
  ["och-blue-hole","Blue_Hole_~_Ocho_Rios.jpg","a2","Thank You (23 Millions+) views","by/2.0","Blue Hole, Ocho Rios, Jamaica","Natural pools at Blue Hole",1280]
] as const;

const PHOTOS = Object.fromEntries(entries.map(([id,file,hash,author,license,location,alt,width]) => {
  const encoded = encodeURIComponent(file);
  return [id, {author,location,alt,license: "CC " + license.replace("by-sa","BY-SA").replace("by","BY").replace("/"," "),licenseUrl:"https://creativecommons.org/licenses/"+license+"/",source:"https://commons.wikimedia.org/wiki/File:"+encoded, image:"https://thumb.wikimedia.org/wikipedia/commons/thumb/"+hash[0]+"/"+hash+"/"+encoded+"/"+width+"px-"+encoded}];
}));

export function ExcursionPhoto({ excursionId, art, className = "" }: { excursionId: string; art: Excursion["art"]; className?: string }) {
  const photo = PHOTOS[excursionId];
  const [failed, setFailed] = useState(false);
  return <div className={`relative overflow-hidden ${className}`} data-excursion-media={photo && !failed ? "photograph" : "illustration"}>
    <ExcursionArt art={art} className="absolute inset-0 h-full w-full" />
    {photo && !failed && <>
      {/* Wikimedia's resized, openly licensed editorial image; fallback is always present. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.image} alt={photo.alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-8 text-[10px] leading-snug text-white">
        <span className="block font-semibold">Editorial photo · {photo.location}</span>
        <span>{photo.author} · {photo.license}</span>
      </div>
    </>}
    {(!photo || failed) && <span className="absolute bottom-2 left-3 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white">Original illustration · demo excursion</span>}
  </div>;
}

export function ExcursionPhotoCredit({ excursionId }: { excursionId: string }) {
  const photo = PHOTOS[excursionId];
  if (!photo) return null;
  return <p className="mt-3 text-xs leading-relaxed text-ink-soft">
    Editorial photography: {photo.location}. Not a photograph of the fictional tour or operator. <a href={photo.source} target="_blank" rel="noreferrer" className="underline underline-offset-2">{photo.author} · source</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">{photo.license}</a> · resized thumbnail, responsive crop.
  </p>;
}
