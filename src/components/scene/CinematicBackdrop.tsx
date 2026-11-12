"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { usePrefs } from "@/components/prefs/PrefsProvider";
import { useCompanion } from "@/components/migo/CompanionProvider";
import { useScene } from "./SceneProvider";
import {
  loopDistance,
  parseFilmManifest,
  type FilmLight,
  type FilmManifest,
} from "@/lib/cinematic/media";

const STILL = "/cinematic/signature-still.webp";
const STILL_LIGHT = {
  tint: "#fff4d6", rim: "#ffffff", shadow: "#053049", compass: "#ffd27a",
  brightness: 1.04, rimAngle: 135, shadowSkew: -8,
};

/** One persistent pair for intro, welcome, hero and golden hour. Never a ship-over-video composite. */
export function CinematicBackdrop() {
  const pathname = usePathname();
  const { portalOpen } = usePrefs();
  const { reducedMotion } = useCompanion();
  const { scene } = useScene();
  const [manifest, setManifest] = useState<FilmManifest | null>(null);
  const [mobile, setMobile] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [inView, setInView] = useState(true);
  const [intro, setIntro] = useState(false);
  const [shown, setShown] = useState<FilmLight>("day");
  const [state, setState] = useState("poster-only");
  const [painted, setPainted] = useState<FilmLight | null>(null);
  const [failed, setFailed] = useState(false);
  const [failedPoster, setFailedPoster] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const day = useRef<HTMLVideoElement>(null);
  const sunset = useRef<HTMLVideoElement>(null);
  const active = useRef<FilmLight>("day");
  const phase = useRef(0);
  const gestureTried = useRef(false);
  const desired: FilmLight = scene === "sunset" ? "sunset" : "day";
  const available = pathname === "/" || portalOpen || intro;
  const variant =
    mobile && manifest?.mobile ? manifest.mobile : manifest?.desktop;
  const moving = Boolean(
    variant &&
    !reducedMotion &&
    !saveData &&
    !hidden &&
    (inView || portalOpen || intro) &&
    !failed,
  );

  useEffect(() => {
    if (!available || manifest) return;
    const abort = new AbortController();
    fetch("/cinematic/film/manifest.json", { signal: abort.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setManifest(parseFilmManifest(json)))
      .catch(() => {
        /* A missing/invalid delivery keeps navigation and the still usable. */
      });
    return () => abort.abort();
  }, [available, manifest]);

  useEffect(() => {
    const mq = window.matchMedia("(max-aspect-ratio: 1/1)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    const visibility = () => setHidden(document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    setSaveData(
      Boolean(
        (navigator as Navigator & { connection?: { saveData?: boolean } })
          .connection?.saveData,
      ),
    );
    const readIntro = () =>
      setIntro(document.documentElement.dataset.intro === "playing");
    readIntro();
    const introObserver = new MutationObserver(readIntro);
    introObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-intro"],
    });
    return () => {
      mq.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
      introObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (pathname !== "/") {
      setInView(false);
      return;
    }
    const visible = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        setInView(visible.size > 0);
      },
      { rootMargin: "15% 0px" },
    );
    document
      .querySelectorAll(".ocean-hero,.ocean-sunset")
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  // Muted is enforced independently of Migo's optional audio settings.
  useEffect(() => {
    if (!variant || !moving || !available) return;
    const elements = [day.current, sunset.current];
    for (const [index, element] of elements.entries()) {
      if (!element) continue;
      element.muted = true;
      element.defaultMuted = true;
      element.volume = 0;
      const delivery = variant[index === 0 ? "day" : "sunset"];
      const url =
        delivery.webm && element.canPlayType('video/webm; codecs="vp9"')
          ? delivery.webm
          : delivery.mp4;
      if (element.getAttribute("src") !== url) {
        element.src = url;
        element.load();
      }
    }
    return () => {
      const current = elements[active.current === "day" ? 0 : 1];
      if (current) phase.current = current.currentTime;
      for (const element of elements) element?.pause();
    };
  }, [variant, moving, available]);

  useEffect(() => {
    if (!available) {
      setPainted(null);
      return;
    }
    if (!moving || !variant) {
      const current = active.current === "day" ? day.current : sunset.current;
      if (current) phase.current = current.currentTime;
      day.current?.pause();
      sunset.current?.pause();
      // Visibility pauses retain the actual decoded frame, including its lighting.
      if (variant && !failed && !reducedMotion && !saveData &&
          (hidden || !(inView || portalOpen || intro))) {
        setState("paused");
        return;
      }
      setPainted(null);
      setShown(desired);
      setState(
        failed
          ? "media-error"
          : variant && reducedMotion
            ? "reduced-motion"
            : variant && saveData
              ? "save-data"
              : "poster-only",
      );
      return;
    }
    const target = desired === "day" ? day.current : sunset.current;
    const previous = active.current === "day" ? day.current : sunset.current;
    if (!target) return;
    target.preload = "auto";
    if (target.readyState === 0) target.load();
    let cancelled = false;
    let activating = false;
    let settle: ReturnType<typeof setTimeout> | undefined;
    let abortSeek: (() => void) | undefined;
    let abortFrame: (() => void) | undefined;
    const duration = variant.frames / variant.fps;
    const frame = 1 / variant.fps;
    const seek = (time: number) => new Promise<void>((resolve) => {
      const done = () => {
        target.removeEventListener("seeked", done);
        abortSeek = undefined;
        resolve();
      };
      abortSeek = done;
      target.addEventListener("seeked", done, { once: true });
      target.currentTime = ((time % duration) + duration) % duration;
    });
    const nextFrame = () => new Promise<void>(resolve => {
      const id = requestAnimationFrame(() => { abortFrame = undefined; resolve(); });
      abortFrame = () => { cancelAnimationFrame(id); abortFrame = undefined; resolve(); };
    });
    const show = async () => {
      if (cancelled || activating || target.readyState < 2 || target.seeking)
        return;
      activating = true;
      try {
        const paired = previous && previous !== target;
        if (paired && previous.paused && previous.classList.contains("is-visible")) await previous.play();
        let lead = 0;
        let aligned = false;
        for (let attempt = 0; attempt < 3 && !cancelled; attempt++) {
          const expected = previous && !previous.paused ? previous.currentTime : phase.current;
          if (loopDistance(target.currentTime, expected, duration) > frame) {
            target.pause();
            // Correct with the observed phase error, which includes seek/decode/play latency.
            // Wall-clock promise timing alone overestimates browsers that advance before play resolves.
            await seek(expected + (paired && !previous.paused ? lead : 0));
          }
          if (cancelled) return;
          await target.play();
          if (cancelled) return;
          if (!paired || previous.paused || loopDistance(target.currentTime, previous.currentTime, duration) <= frame) {
            aligned = true;
            break;
          }
          if (paired) lead += ((previous.currentTime - target.currentTime + duration * 1.5) % duration) - duration / 2;
        }
        if (!aligned && paired && !cancelled) {
          // Native decoder startup can vary between seeks. Fine-sync the still-invisible
          // target against the running outgoing clock, with a bounded settling period.
          const deadline = performance.now() + 600;
          while (!cancelled && !previous.paused && !target.paused && performance.now() < deadline) {
            const error = ((previous.currentTime - target.currentTime + duration * 1.5) % duration) - duration / 2;
            if (Math.abs(error) <= frame * 0.75) { aligned = true; break; }
            target.playbackRate = 1 + Math.max(-0.5, Math.min(0.5, error * 8));
            await nextFrame();
          }
          target.playbackRate = 1;
        }
        if (cancelled) return;
        if (!aligned) {
          // Keep the outgoing scene; never dissolve two unaligned ocean phases.
          target.pause();
          setState("alignment-blocked");
          return;
        }
        active.current = desired;
        setShown(desired);
        setPainted(desired);
        setState("transitioning");
        settle = setTimeout(() => {
          if (cancelled) return;
          (desired === "day" ? sunset.current : day.current)?.pause();
          setState("playing");
        }, 750);
      } catch {
        if (!cancelled) {
          if (previous) phase.current = previous.currentTime;
          day.current?.pause();
          sunset.current?.pause();
          setPainted(null);
          setShown(desired);
          setState("autoplay-blocked");
        }
      }
    };
    setState("buffering");
    target.addEventListener("loadeddata", show);
    target.addEventListener("canplay", show);
    void show();
    return () => {
      cancelled = true;
      abortSeek?.();
      abortFrame?.();
      target.playbackRate = 1;
      if (settle) clearTimeout(settle);
      target.removeEventListener("loadeddata", show);
      target.removeEventListener("canplay", show);
      // A pending play promise must not win after a scene reversal.
      if (active.current !== desired) target.pause();
    };
  }, [desired, moving, available, variant, reducedMotion, saveData, failed, retry, hidden, inView, portalOpen, intro]);

  useEffect(() => {
    if (state !== "autoplay-blocked" || !moving || !available || gestureTried.current) return;
    let cancelled = false;
    const resume = () => {
      gestureTried.current = true;
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      const target = desired === "day" ? day.current : sunset.current;
      // Invoke play in the gesture itself, while browser user activation is live.
      if (target) void target.play().then(() => {
        if (cancelled) target.pause();
        else setRetry(value => value + 1);
      }).catch(() => {});
    };
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, [state, moving, available, desired]);

  useEffect(() => {
    if (!available) return;
    // Until real paired media arrives, Migo stays in the still's daylight too.
    const displayingFallback = !variant || (!painted && failedPoster === variant[shown].poster);
    const light = (!displayingFallback && manifest?.lighting?.[shown]) || STILL_LIGHT;
    const golden = Boolean(!displayingFallback && manifest?.lighting && shown === "sunset");
    const properties: Record<string, string> = {
      "--migo-tint": light.tint,
      "--migo-rim": light.rim,
      "--migo-shadow": light.shadow,
      "--compass": light.compass,
      "--migo-bright": String(light.brightness),
      "--rim-angle": `${light.rimAngle}deg`,
      "--shadow-skew": String(light.shadowSkew),
      "--migo-tint-a": golden ? "0.24" : "0.06",
      "--migo-rim-a": golden ? "0.75" : "0.38",
      "--migo-sat": golden ? "1.12" : "1.06",
      "--migo-shadow-a": golden ? "0.5" : "0.34",
      "--compass-a": golden ? "0.8" : "0.3",
    };
    const root = document.documentElement;
    const previousLighting = root.dataset.cinematicLighting;
    root.dataset.cinematicLighting = displayingFallback ? "interim" : shown;
    const previous = Object.fromEntries(
      Object.keys(properties).map((key) => [
        key,
        root.style.getPropertyValue(key),
      ]),
    );
    for (const [key, value] of Object.entries(properties))
      root.style.setProperty(key, value);
    return () => {
      if (previousLighting) root.dataset.cinematicLighting = previousLighting;
      else delete root.dataset.cinematicLighting;
      for (const [key, value] of Object.entries(previous)) {
        if (value) root.style.setProperty(key, value);
        else root.style.removeProperty(key);
      }
    };
  }, [available, manifest, shown, variant, painted, failedPoster]);

  if (!available) return null;
  const poster = variant ? variant[shown].poster : STILL;
  return (
    <div
      className="cinematic-backdrop"
      data-cinematic-backdrop
      data-media-state={state}
      data-cinematic-scene={desired}
      data-light={shown}
      aria-hidden
    >
      <Image
        src={failedPoster === poster ? STILL : poster}
        alt=""
        fill
        priority
        sizes="(max-width: 639px) 180vh, 100vw"
        unoptimized={Boolean(variant)}
        onError={() => setFailedPoster(poster)}
        className="cinematic-poster"
      />
      {(["day", "sunset"] as const).map((light) => (
        <video
          key={light}
          ref={light === "day" ? day : sunset}
          className={`cinematic-film ${shown === light && painted ? "is-visible" : ""}`}
          data-light={light}
          muted
          loop
          playsInline
          preload="none"
          tabIndex={-1}
          disablePictureInPicture
          onLoadedMetadata={(event) => {
            if (
              variant &&
              (event.currentTarget.videoWidth !== variant.width ||
                event.currentTarget.videoHeight !== variant.height ||
                Math.abs(
                  event.currentTarget.duration - variant.frames / variant.fps,
                ) >
                  1 / variant.fps)
            )
              setFailed(true);
          }}
          onError={() => {
            setFailed(true);
            setPainted(null);
          }}
          onVolumeChange={(event) => {
            const video = event.currentTarget;
            if (!video.muted || video.volume !== 0) {
              video.muted = true;
              video.volume = 0;
            }
          }}
        />
      ))}
      <div className="cinematic-readability" />
    </div>
  );
}
