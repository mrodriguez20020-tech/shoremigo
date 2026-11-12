"use client";
import { useEffect, useRef, useState } from "react";
import { useCompanion } from "@/components/migo/CompanionProvider";

// Website display from the licensor's CDN; no stock binaries are redistributed in Git.
const SRC = "https://videos.pexels.com/video-files/11273418/11273418-hd_1280_720_25fps.mp4";
const POSTER = "https://images.pexels.com/videos/11273418/blue-colourful-coral-creatures-11273418.jpeg?auto=compress&w=1280";
export function DiscoveryFilm({ active }: { active: boolean }) {
  const { reducedMotion } = useCompanion();
  const video = useRef<HTMLVideoElement>(null);
  const [requested, setRequested] = useState(false);
  const [failed, setFailed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [visible, setVisible] = useState(true);
  const [saveData, setSaveData] = useState(true);
  useEffect(() => {
    setSaveData(Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData));
    const change = () => setVisible(!document.hidden);
    change(); document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);
  const enabled = active && visible && !reducedMotion && !saveData && !failed;
  useEffect(() => {
    if (!enabled || requested) return;
    const timer = setTimeout(() => setRequested(true), 350);
    return () => clearTimeout(timer);
  }, [enabled, requested]);
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (!enabled) { el.pause(); return; }
    let current = true;
    el.muted = true;
    el.play().then(() => { if (!current) el.pause(); else setBlocked(false); }).catch(() => { if (current) setBlocked(true); });
    return () => { current = false; el.pause(); };
  }, [enabled, requested]);
  if (!requested || !active || reducedMotion || saveData || failed) return null;
  return <div className="pointer-events-none absolute inset-0" style={{ opacity: active ? 1 : 0 }} data-discovery-film data-film-active={enabled}>
    <video ref={video} src={SRC} poster={POSTER} muted loop playsInline preload="none" disablePictureInPicture aria-hidden className="h-full w-full object-cover object-[60%_50%]" onError={() => setFailed(true)} />
    <div className="absolute inset-0 bg-gradient-to-r from-[#081e27]/80 via-[#081e27]/20 to-transparent" />
    <p data-migo-avoid className="absolute bottom-10 left-6 right-6 max-w-xl rounded-xl bg-[#081e27]/90 px-3 py-2 text-[11px] leading-relaxed text-white sm:left-12">
      Generic reef mood footage · Alex Mesel / Pexels. Not a named destination or tour recording. Scroll into the original illustrated guide.
      <a className="pointer-events-auto ml-2 underline" href="https://www.pexels.com/video/underwater-footage-of-tropical-fish-in-a-coral-reef-11273418/" target="_blank" rel="noreferrer">Source &amp; license</a>
    </p>
    {blocked && active && <button className="btn btn-primary pointer-events-auto absolute bottom-32 right-6" data-migo-avoid onClick={() => { const el = video.current; if (el) void el.play().then(() => setBlocked(false)).catch(() => setBlocked(true)); }}>Play reef film</button>}
  </div>;
}
