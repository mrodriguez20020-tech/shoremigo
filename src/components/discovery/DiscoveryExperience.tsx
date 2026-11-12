"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { DISCOVERIES, excursionsFor, type DiscoveryPoi } from "@/lib/domain/discovery";
import { getPort } from "@/lib/domain/catalog";
import { migo } from "@/components/migo/bus";
import { TideLink } from "@/components/transition/TideTransition";
import { DiscoveryFilm } from "./DiscoveryFilm";
import { useCompanion } from "@/components/migo/CompanionProvider";
import { fmtUsd } from "@/lib/domain/time";

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------- original illustrated scenes, driven by entry progress p (0 = start, 1 = arrived) ---------- */
function ReefScene({ p }: { p: number }) {
  const surface = mix(68, -12, p); // waterline height (% of stage) as the camera descends
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="rf-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5fb6dc" /><stop offset="1" stopColor="#e9f5f3" /></linearGradient>
        <linearGradient id="rf-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2bb3c0" /><stop offset=".45" stopColor="#0f6f8f" /><stop offset="1" stopColor="#06304a" /></linearGradient>
        <linearGradient id="rf-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e9fbff" stopOpacity=".45" /><stop offset="1" stopColor="#e9fbff" stopOpacity="0" /></linearGradient>
        <radialGradient id="rf-sun" cx=".7" cy=".1" r=".5"><stop offset="0" stopColor="#fff7d6" /><stop offset="1" stopColor="#fff7d6" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#rf-sky)" />
      <rect width="1600" height="900" fill="url(#rf-sun)" />
      <g transform={`translate(0 ${(surface / 100) * 900})`}>
        <rect y="0" width="1600" height="1400" fill="url(#rf-sea)" />
        <path d="M0 0 Q100 -10 200 0 T400 0 T600 0 T800 0 T1000 0 T1200 0 T1400 0 T1600 0 V14 H0Z" fill="#bff0f2" opacity=".7" />
        {Array.from({ length: 7 }, (_, i) => <polygon key={i} points={`${120 + i * 230},14 ${200 + i * 230},14 ${300 + i * 230 + 140},900 ${60 + i * 230 + 140},900`} fill="url(#rf-ray)" opacity={0.25 + 0.5 * p} />)}
      </g>
      <g transform={`translate(0 ${mix(520, 0, p)})`} opacity={clamp(p * 1.6)}>
        <path d="M0 760 Q200 700 380 740 T760 720 T1140 745 T1600 700 V900 H0Z" fill="#e6d6a8" />
        <path d="M0 800 Q260 760 520 790 T1040 780 T1600 770 V900 H0Z" fill="#d4c18f" />
        {/* elkhorn coral */}
        {[[200, 700], [300, 720], [140, 740]].map(([x, y], i) => <path key={i} d={`M${x} ${y} l-20 -70 l-30 -30 M${x} ${y} l10 -90 l35 -40 M${x - 6} ${y - 50} l40 -20`} stroke="#e8a07a" strokeWidth="14" strokeLinecap="round" fill="none" />)}
        {/* brain and fan corals */}
        <ellipse cx="480" cy="760" rx="70" ry="42" fill="#c98f6e" /><ellipse cx="480" cy="752" rx="56" ry="30" fill="#d9a57f" />
        <path d="M640 760 q-40 -120 20 -200 q60 80 20 200z" fill="#b46aa0" opacity=".85" />
        <path d="M980 740 q-60 -150 10 -250 q80 100 30 250z" fill="#7c5fb0" opacity=".8" />
        {/* reef wall on the right */}
        <path d="M1250 900 V520 Q1320 470 1400 520 Q1480 470 1600 500 V900Z" fill="#11546b" />
        <path d="M1260 560 q40 -30 80 0 q40 -30 90 0" stroke="#e3a27e" strokeWidth="10" fill="none" opacity=".7" />
        {/* seagrass */}
        {Array.from({ length: 26 }, (_, i) => <path key={i} d={`M${820 + i * 14} 800 q${(i % 3) * 6 - 6} -40 ${(i % 2) * 10 - 5} -${70 + (i % 5) * 10}`} stroke="#3f8f6a" strokeWidth="4" fill="none" />)}
        {/* turtle */}
        <g transform="translate(980 340) rotate(-8)"><ellipse rx="70" ry="44" fill="#5d7a4a" /><ellipse rx="56" ry="32" fill="#7c9a5c" /><circle cx="78" cy="-6" r="18" fill="#6f8c55" /><path d="M-20 -40 l-50 -40 M-20 40 l-50 40 M30 -40 l40 -40 M30 40 l40 40" stroke="#6f8c55" strokeWidth="16" strokeLinecap="round" /></g>
        {/* stingray */}
        <g transform="translate(700 720)"><path d="M0 0 q60 -50 120 0 q-60 30 -120 0z" fill="#8a7a66" opacity=".9" /><path d="M120 0 l80 10" stroke="#8a7a66" strokeWidth="4" /></g>
      </g>
    </svg>
  );
}
function CanopyScene({ p }: { p: number }) {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="cn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fc6d9" /><stop offset="1" stopColor="#f3ecd8" /></linearGradient>
        <linearGradient id="cn-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f3a2c" /><stop offset="1" stopColor="#0d1f17" /></linearGradient>
        <linearGradient id="cn-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity="0" /><stop offset=".5" stopColor="#ffffff" stopOpacity=".55" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></linearGradient>
      </defs>
      <style>{"@media (prefers-reduced-motion: no-preference){.zip-rider{offset-path:path(\"M120 90 L1500 250\");offset-rotate:0deg;animation:zip-ride 7s linear infinite}}@keyframes zip-ride{from{offset-distance:0%}to{offset-distance:100%}}.zip-rider{transform:translate(800px,170px)}@media (prefers-reduced-motion: no-preference){.zip-rider{transform:none}}"}</style>
      <rect width="1600" height="900" fill="url(#cn-sky)" />
      {/* distant ridges and the falls */}
      <g transform={`translate(0 ${mix(240, 0, p)})`}>
        <path d="M0 520 Q240 380 480 470 T960 430 T1440 460 T1600 430 V900 H0Z" fill="#5d8a76" opacity=".75" />
        <path d="M0 600 Q300 470 620 560 T1240 520 T1600 560 V900 H0Z" fill="#3f6f58" />
        <path d="M1270 470 q-14 120 0 240 l40 0 q14 -120 0 -240z" fill="#e8f6f7" opacity=".9" />
        <path d="M1240 720 q70 -30 140 0 q-70 40 -140 0z" fill="#dff1f2" opacity=".8" />
        <ellipse cx="1060" cy="720" rx="110" ry="26" fill="#3fb3a6" opacity=".85" />
      </g>
      {/* canopy band: you rise through it */}
      <g transform={`translate(0 ${mix(-80, 520, p)})`}>
        {Array.from({ length: 16 }, (_, i) => <ellipse key={i} cx={i * 110 + 20} cy={260 + (i % 3) * 30} rx="120" ry="80" fill={["#2f5b3e", "#3d7049", "#28513a"][i % 3]} />)}
        {Array.from({ length: 16 }, (_, i) => <ellipse key={`b${i}`} cx={i * 110 + 70} cy={330 + (i % 2) * 24} rx="110" ry="70" fill={["#356547", "#2a5a3d"][i % 2]} />)}
        <rect y="380" width="1600" height="900" fill="url(#cn-floor)" />
        {[120, 420, 760, 1080, 1420].map((x, i) => <rect key={i} x={x} y="330" width={36 + (i % 2) * 14} height="900" fill="#3a2a1f" opacity=".9" />)}
        {Array.from({ length: 18 }, (_, i) => <path key={`f${i}`} d={`M${i * 92} 900 q20 -90 60 -120 q-10 60 10 120z`} fill="#2f6b45" opacity=".8" />)}
      </g>
      <rect width="1600" height="900" fill="url(#cn-mist)" opacity={0.6 * (1 - Math.abs(p - 0.5) * 2)} />
      {/* zipline above the canopy */}
      <g opacity={clamp((p - 0.55) * 3)}>
        <line x1="120" y1="90" x2="1500" y2="250" stroke="#2b2b2b" strokeWidth="3" />
        <rect x="80" y="70" width="70" height="40" rx="6" fill="#6b4a2f" /><rect x="1470" y="232" width="70" height="40" rx="6" fill="#6b4a2f" />
        <g className="zip-rider"><circle cx="0" cy="0" r="10" fill="#e8762c" /><line x1="0" y1="-10" x2="0" y2="-22" stroke="#2b2b2b" strokeWidth="2" /></g>
      </g>
      {/* sloth */}
      <g transform={`translate(700 ${mix(780, 330, p)})`} opacity={clamp(p * 1.4)}><path d="M-80 -20 H120" stroke="#4a3626" strokeWidth="14" strokeLinecap="round" /><ellipse cx="20" cy="18" rx="36" ry="24" fill="#8b7558" /><circle cx="52" cy="10" r="14" fill="#a08a6a" /><path d="M0 0 v-20 M40 0 v-20" stroke="#6e5a44" strokeWidth="6" /></g>
    </svg>
  );
}

/* ---------- ambient life: fish or birds on a canvas, paused offscreen, when hidden and under reduced motion ---------- */
function Ambient({ kind, active }: { kind: "reef" | "canopy"; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c || !active) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const N = kind === "reef" ? 26 : 9;
    const agents = Array.from({ length: N }, (_, i) => ({ x: (i * 137) % 1600, y: kind === "reef" ? 250 + ((i * 97) % 420) : 80 + ((i * 53) % 220), v: 0.4 + ((i * 31) % 10) / 12, hue: ["#ffd25a", "#4fd1e8", "#ff8a5c", "#c7f0ff"][i % 4], s: 0.6 + (i % 5) / 6 }));
    let raf = 0, last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(50, now - last); last = now;
      const W = (c.width = c.clientWidth), H = (c.height = c.clientHeight), sx = W / 1600, sy = H / 900;
      ctx.clearRect(0, 0, W, H);
      for (const a of agents) {
        a.x += a.v * dt * 0.06; if (a.x > 1680) a.x = -80;
        const y = a.y + Math.sin((a.x + a.y) / 90) * 10;
        ctx.save(); ctx.translate(a.x * sx, y * sy); ctx.scale(a.s * sx * 1.4, a.s * sy * 1.4);
        if (kind === "reef") { ctx.fillStyle = a.hue; ctx.beginPath(); ctx.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-22, -7); ctx.lineTo(-22, 7); ctx.fill(); }
        else { ctx.strokeStyle = "#1f2b24"; ctx.lineWidth = 2; ctx.beginPath(); const f = Math.sin(now / 160 + a.y) * 5; ctx.moveTo(-12, f); ctx.quadraticCurveTo(-6, -4, 0, 0); ctx.quadraticCurveTo(6, -4, 12, f); ctx.stroke(); }
        ctx.restore();
      }
      raf = requestAnimationFrame(step);
    };
    const run = () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(step); };
    run();
    document.addEventListener("visibilitychange", run);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", run); };
  }, [kind, active]);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}

export function DiscoveryExperience({ id }: { id: "reef" | "canopy" }) {
  const cfg = DISCOVERIES[id];
  const { reducedMotion: reduced } = useCompanion();
  const section = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);
  const [inView, setInView] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [open, setOpen] = useState<DiscoveryPoi | null>(null);
  const told = useRef(new Set<string>());
  const opener = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLElement | null>(null);
  const close = useCallback(() => { setOpen(null); opener.current?.focus({ preventScroll: true }); }, []);

  useEffect(() => {
    if (reduced) { setP(1); return; }
    const onScroll = () => {
      const el = section.current; if (!el) return;
      const r = el.getBoundingClientRect(), span = el.offsetHeight - window.innerHeight;
      setP(clamp(-r.top / Math.max(1, span)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [reduced]);
  useEffect(() => {
    const el = section.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const arrived = p > 0.82;
  // Focus can scroll a sticky descendant before its click is dispatched. Stabilize at
  // focus/pointer-down time, while the entered hotspot is still an active target.
  const completeEntry = () => {
    const el = section.current;
    if (el && !reduced) window.scrollTo({ top: el.offsetTop + el.offsetHeight - innerHeight, behavior: "instant" });
    setP(1);
  };
  const choose = (poi: DiscoveryPoi, button: HTMLButtonElement) => {
    opener.current = button;
    completeEntry();
    setOpen(poi);
    const ex = excursionsFor(poi)[0];
    if (!told.current.has(poi.id)) {
      told.current.add(poi.id);
      migo.emit({ type: "suggest", key: `discover-${cfg.id}-${poi.id}`, text: poi.migo, href: ex ? `/excursions/${ex.id}` : undefined, cta: ex ? "See timing" : undefined });
    }
  };
  const skip = () => { const el = section.current; if (el) window.scrollTo({ top: el.offsetTop + el.offsetHeight - window.innerHeight, behavior: reduced ? "auto" : "smooth" }); };

  return (
    <>
      <style>{`.discovery-hotspot { top:var(--discovery-poi-top); } @media(max-width:639px) { .discovery-hotspot { top:clamp(190px,var(--discovery-poi-top),calc(100svh - 116px)); } }`}</style>
      <section ref={section} className="relative" style={{ height: reduced ? "100svh" : "260svh" }} data-discovery={cfg.id} data-progress={p.toFixed(2)}>
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          {cfg.id === "reef" ? <ReefScene p={p} /> : <CanopyScene p={p} />}
          <Ambient kind={cfg.id} active={!reduced && inView && p > 0.45} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#081e27]/75 via-[#081e27]/20 to-transparent" />
          {id === "reef" && <DiscoveryFilm active={inView && p < 0.5} />}
          <div className="absolute left-0 top-0 max-w-xl px-6 pt-28 sm:px-12 lg:px-20" data-migo-avoid>
            <p className={`eyebrow flex flex-wrap items-center gap-3 ${arrived ? "sr-only sm:not-sr-only" : ""}`}><span>{cfg.kicker}</span><span className="demo-tag">Illustrated scene</span></p>
            <h1 className={`font-display mt-3 leading-[1.02] sm:text-6xl ${arrived ? "text-xl" : "text-5xl"}`}>{cfg.title}</h1>
            <p className={`mt-4 text-lg text-ink-soft ${arrived ? "sr-only sm:not-sr-only" : ""}`}>{cfg.intro}</p>
            {!arrived && <button onClick={skip} className="btn btn-ghost mt-6 !py-2 text-sm">Skip the {cfg.id === "reef" ? "descent" : "climb"} ↓</button>}
            {!arrived && !reduced && <p className="mt-4 text-[11px] tracking-[0.18em] text-white/70 uppercase" aria-live="polite">{cfg.entryLabel} · {Math.round(p * 100)}%</p>}
          </div>
          {arrived && (
            <div className="absolute left-6 right-6 top-20 z-20 flex flex-wrap gap-2 sm:left-auto sm:right-10 sm:top-24" role="group" aria-label="Filter points of interest" data-migo-avoid>
              {cfg.filters.map((f) => (
                <button key={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(filter === f.id ? null : f.id)} className={`rounded-full px-4 py-2 text-sm font-semibold backdrop-blur ${filter === f.id ? "bg-accent text-accent-ink" : "bg-[#081e27]/70 text-white"}`}>{f.label}</button>
              ))}
            </div>
          )}
          {cfg.pois.map((poi) => {
            const dim = filter && !poi.tags.includes(filter);
            return (
              <button key={poi.id} onFocus={completeEntry} onPointerDown={completeEntry} onClick={(event) => choose(poi, event.currentTarget)} data-migo-avoid aria-label={`${poi.name}: ${poi.fact}`} aria-expanded={open?.id === poi.id}
                className="discovery-hotspot absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition"
                style={{ left: `${poi.x}%`, "--discovery-poi-top": `${poi.y}%`, opacity: arrived ? (dim ? 0.25 : 1) : 0, pointerEvents: arrived ? "auto" : "none" } as CSSProperties} tabIndex={arrived ? 0 : -1}>
                <span className="relative flex h-11 w-11 items-center justify-center">
                  {!reduced && <span className="absolute inset-0 animate-ping rounded-full bg-accent/40" />}
                  <span className="relative h-4 w-4 rounded-full border-2 border-[#081e27] bg-accent" />
                </span>
                <span className={`pointer-events-none absolute top-full mt-1 w-max max-w-[11rem] rounded-full bg-[#081e27]/80 px-2.5 py-1 text-center text-[11px] font-semibold text-white ${poi.x < 25 ? "left-0" : poi.x > 75 ? "right-0" : "left-1/2 -translate-x-1/2"}`}>{poi.name}</span>
              </button>
            );
          })}
          <AnimatePresence>
            {open && (
              <motion.aside ref={panel} key={open.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: reduced ? 0 : 0.25 }}
                className="surface-strong absolute bottom-4 left-4 right-4 z-30 max-h-[calc(100svh-96px)] max-w-md overflow-y-auto rounded-[24px] p-5 sm:left-auto sm:right-10" role="dialog" aria-label={open.name} data-migo-avoid>
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">{open.fact}</p><h2 className="font-display mt-1 text-2xl">{open.name}</h2></div>
                  <button onClick={close} className="btn btn-ghost !h-9 !w-9 !p-0" aria-label="Close">✕</button>
                </div>
                <p className="mt-2 text-sm text-ink-soft">{open.detail}</p>
                <ul className="mt-4 space-y-2">
                  {excursionsFor(open).map((e) => (
                    <li key={e.id}>
                      <TideLink href={`/excursions/${e.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 px-3 py-2 text-sm transition hover:bg-white/10">
                        <span><b className="font-semibold">{e.title}</b><span className="block text-xs text-ink-soft">{getPort(e.portId)?.name} · {fmtUsd(e.priceCents)} / guest</span></span>
                        <span aria-hidden>→</span>
                      </TideLink>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] text-ink-soft">Times and seats are checked against your ship&apos;s schedule on the tour page.</p>
                <p className="mt-2 text-[11px] text-ink-soft">{cfg.disclosure}</p>
              </motion.aside>
            )}
          </AnimatePresence>
          <p data-migo-avoid className="absolute bottom-3 left-6 right-6 max-w-lg text-[10px] text-white/80 sm:left-12">{id === "reef" ? "Original illustrated guide with optional generic stock footage; no named destination or tour recording. Sightings are never guaranteed." : cfg.disclosure}</p>
        </div>
      </section>
      <section className="bg-[#081e27] px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="font-display text-3xl">Everything in this scene</h2>
          {cfg.note && <p className="mt-2 text-sm text-ink-soft">{cfg.note}</p>}
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {cfg.pois.map((poi) => (
              <li key={poi.id} className="surface rounded-[22px] p-5">
                <p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">{poi.tags.join(" · ")} · {poi.fact}</p>
                <h3 className="font-display mt-1 text-xl">{poi.name}</h3>
                <p className="mt-1 text-sm text-ink-soft">{poi.detail}</p>
                <p className="mt-3 flex flex-wrap gap-2 text-sm">{excursionsFor(poi).map((e) => <TideLink key={e.id} href={`/excursions/${e.id}`} className="underline decoration-accent underline-offset-4">{e.title}</TideLink>)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
