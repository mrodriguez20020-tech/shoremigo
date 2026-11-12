"use client";

import { useState } from "react";

const PHOTOS = {
  reef: {
    title: "A moment beneath the surface",
    location: "Abaco Islands, Bahamas",
    alt: "Sea turtle swimming above a coral reef in clear blue water",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a4/Sea_Turtle_over_Coral_Reef_in_the_Abacos%2C_Bahamas.jpg/1280px-Sea_Turtle_over_Coral_Reef_in_the_Abacos%2C_Bahamas.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Sea_Turtle_over_Coral_Reef_in_the_Abacos,_Bahamas.jpg",
    author: "Elh733",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    description: "A real encounter with a sea turtle in Bahamian waters. An editorial glimpse of the marine world, not a photograph of a listed ShoreMigo excursion."
  },
  canopy: {
    title: "Where the forest meets the falls",
    location: "Dunn’s River Falls, Ocho Rios, Jamaica",
    alt: "Water flowing over terraced rocks beneath tropical foliage at Dunn’s River Falls",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Dunn%27s_River_Falls.jpg/1280px-Dunn%27s_River_Falls.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Dunn%27s_River_Falls.jpg",
    author: "Thank You (23 Millions+) views / Prayitno",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    description: "The real cascades of Dunn’s River Falls. Destination photography for inspiration; the fictional tour inventory is not represented as a verified supplier experience."
  }
} as const;

export function DiscoveryPhoto({ id }: { id: keyof typeof PHOTOS }) {
  const photo = PHOTOS[id];
  const [failed, setFailed] = useState(false);
  return (
    <section className="bg-[#081e27] px-5 pb-16 sm:px-10" aria-label="Destination photography">
      <figure className="mx-auto max-w-[1100px] overflow-hidden rounded-[26px] border border-white/15 bg-[#102c36]">
        {!failed && (
          <div className="relative aspect-[16/9] overflow-hidden bg-[#102c36]">
            {/* External openly licensed editorial photography; deliberately not imported into the MIT source license. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.image} alt={photo.alt} width={1280} height={720} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-full w-full object-cover" />
          </div>
        )}
        <figcaption className="p-6 text-white sm:p-8" data-migo-avoid>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Through the lens · {photo.location}</p>
          <h2 className="font-display mt-2 text-3xl sm:text-4xl">{photo.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80">{photo.description}</p>
          <p className="mt-4 text-xs text-white/70">
            <a className="underline underline-offset-4" href={photo.source} target="_blank" rel="noreferrer">Photo: {photo.author}</a>{" · "}
            <a className="underline underline-offset-4" href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>{" · Resized thumbnail; displayed with responsive cropping."}
          </p>
        </figcaption>
      </figure>
    </section>
  );
}
