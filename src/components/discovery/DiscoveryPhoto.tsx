"use client";

import { useEffect, useRef, useState } from "react";

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
    author: "Thank You (23 Millions+) views",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    description: "The real cascades of Dunn’s River Falls. Destination photography for inspiration; the fictional tour inventory is not represented as a verified supplier experience."
  }
} as const;

const FILMS = {
  reef: {
    title: "The sea at Cozumel",
    source: "https://commons.wikimedia.org/wiki/File:K%E2%80%99%C3%A1anab_Cozumel.webm",
    url: "https://upload.wikimedia.org/wikipedia/commons/3/37/K%E2%80%99%C3%A1anab_Cozumel.webm",
    author: "Jorge F. Victoria Puerto",
    license: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    description: "Real footage of the sea in Cozumel, Mexico. Editorial destination footage; not a tour recording."
  },
  canopy: {
    title: "Life on the forest floor",
    source: "https://commons.wikimedia.org/wiki/File:Leafcutter_ants_on_the_move.webm",
    url: "https://upload.wikimedia.org/wikipedia/commons/2/26/Leafcutter_ants_on_the_move.webm",
    author: "Ketzirah Lesser & Art Drauglis",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    description: "Leafcutter ants at Asa Wright Nature Centre, Trinidad and Tobago. A real wildlife film from another Caribbean destination, not a listed excursion."
  }
} as const;

export function DiscoveryPhoto({ id }: { id: keyof typeof PHOTOS }) {
  const photo = PHOTOS[id];
  const [failed, setFailed] = useState(false);
  const film = FILMS[id];
  const [showFilm, setShowFilm] = useState(false);
  const [filmFailed, setFilmFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!showFilm || !video) return;
    const pause = () => { if (document.hidden) video.pause(); };
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) video.pause(); });
    observer.observe(video);
    document.addEventListener("visibilitychange", pause);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", pause); video.pause(); };
  }, [showFilm]);
  return (
    <section className="bg-[#081e27] px-5 pb-16 sm:px-10" aria-label="Destination photography">
      <figure className="mx-auto max-w-[1100px] overflow-hidden rounded-[26px] border border-white/15 bg-[#102c36]">
        <div className="relative aspect-[16/9] overflow-hidden bg-[#102c36]">
          {failed ? <div className="flex h-full items-center justify-center p-6 text-center text-sm text-white/80">Photograph temporarily unavailable. The source and credit remain below.</div> : <>
            {/* External openly licensed editorial photography; deliberately not imported into the MIT source license. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.image} alt={photo.alt} width={1280} height={720} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-full w-full object-cover" />
          </>}
        </div>
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
      <figure className="mx-auto mt-6 max-w-[1100px] overflow-hidden rounded-[26px] border border-white/15 bg-[#102c36]">
        <figcaption className="p-6 text-white sm:p-8" data-migo-avoid>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Field notes · Real footage</p>
          <h2 className="font-display mt-2 text-3xl">{film.title}</h2>
          <p className="mt-3 max-w-2xl text-sm text-white/80">{film.description}</p>
          {!showFilm && <button type="button" className="btn btn-ghost mt-4" onClick={() => setShowFilm(true)}>Load video</button>}
          {showFilm && !filmFailed && (
            <video ref={videoRef} src={film.url} className="mt-4 max-h-[55vh] w-full rounded-xl bg-black" controls playsInline muted preload="none" aria-label={film.title} onError={() => setFilmFailed(true)} />
          )}
          {filmFailed && <p role="status" className="mt-4 text-sm text-white/80">Video temporarily unavailable. View it at the original source below.</p>}
          <p className="mt-4 text-xs text-white/70"><a className="underline underline-offset-4" href={film.source} target="_blank" rel="noreferrer">Film: {film.author} — original source</a>{" · "}<a className="underline underline-offset-4" href={film.licenseUrl} target="_blank" rel="noreferrer">{film.license}</a>{" · Original file, muted playback."}</p>
        </figcaption>
      </figure>
    </section>
  );
}
