"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CompassMark, Wordmark } from "@/components/brand/Wordmark";
import { useAudio } from "@/components/audio/AudioProvider";
import { useCompanion } from "@/components/migo/CompanionProvider";
import { TideLink } from "@/components/transition/TideTransition";
import { ProofDrawer } from "@/components/proof/ProofDrawer";
import { usePrefs } from "@/components/prefs/PrefsProvider";
import type { Key } from "@/lib/client/i18n";

const NAV: { href: string; key: Key }[] = [
  { href: "/excursions", key: "nav.explore" },
  { href: "/ships", key: "nav.ships" },
  { href: "/trip", key: "nav.trip" },
  { href: "/bookings", key: "nav.bookings" },
  { href: "/crew", key: "nav.crew" },
];
const DISCOVER: { href: string; key: Key }[] = [
  { href: "/taste", key: "nav.taste" },
  { href: "/excursions?mood=relax", key: "nav.relax" },
  { href: "/#match", key: "nav.match" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { openConcierge } = useCompanion();
  const { t, openPortal } = usePrefs();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setMenu(false), [pathname]);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "py-2" : "py-4"}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-ivory focus:px-4 focus:py-2 focus:text-navy">
        Skip to content
      </a>
      <div
        className={`mx-auto flex max-w-[1400px] items-center gap-4 rounded-full px-4 py-2 transition-all duration-500 sm:px-5 ${scrolled ? "surface-strong mx-3 sm:mx-6" : "mx-1 sm:mx-4"}`}
      >
        <TideLink href="/" className="flex items-center gap-2 text-xl text-ink" aria-label="ShoreMigo home">
          <CompassMark />
          <Wordmark />
        </TideLink>
        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => {
            const active = n.href === pathname || (n.href !== "/" && !n.href.startsWith("/#") && pathname.startsWith(n.href));
            return (
              <TideLink
                key={n.href}
                href={n.href}
                className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition ${active ? "bg-white/10 text-ink" : "text-ink-soft hover:text-ink"}`}
                aria-current={active ? "page" : undefined}
              >
                {t(n.key)}
              </TideLink>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ProofDrawer />
          <ExperienceSettings />
          <AccountMenu />
          <button className="btn btn-primary hidden whitespace-nowrap !py-2 text-sm sm:inline-flex" onClick={() => openConcierge()}>
            {t("nav.askMigo")}
          </button>
          <button className="btn btn-ghost !h-10 !w-10 !p-0 lg:hidden" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            ☰
          </button>
        </div>
      </div>
      <AnimatePresence>
        {menu && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="surface mx-3 mt-2 grid gap-1 rounded-3xl p-3 lg:hidden"
            aria-label="Mobile"
          >
            {NAV.map((n) => (
              <TideLink key={n.href} href={n.href} className="rounded-2xl px-4 py-3 font-semibold text-ink">
                {t(n.key)}
              </TideLink>
            ))}
            <div className="mx-4 my-1 border-t border-line" />
            {DISCOVER.map((n) => (
              <TideLink key={n.href} href={n.href} className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-ink-soft">
                {t(n.key)}
              </TideLink>
            ))}
            <button
              className="rounded-2xl px-4 py-2.5 text-left text-sm font-semibold text-ink-soft"
              onClick={() => {
                setMenu(false);
                openPortal();
              }}
            >
              {t("nav.language")}
            </button>
            <TideLink href="/operator" className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-ink-soft">
              {t("nav.operator")}
            </TideLink>
            <button className="btn btn-primary mt-1" onClick={() => openConcierge()}>
              {t("nav.askMigo")}
            </button>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function AccountMenu() {
  const { t, openPortal, prefs } = usePrefs();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const item = "block w-full rounded-2xl px-4 py-2.5 text-left text-sm font-semibold transition hover:bg-white/10";
  return (
    <div className="relative hidden lg:block" ref={ref}>
      <button className="btn btn-ghost !h-10 !px-3 text-sm" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </svg>
        <span className="ml-1.5 uppercase">{prefs.lang}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="surface-strong absolute right-0 mt-3 w-64 rounded-3xl p-2"
          >
            <p className="px-4 pb-1 pt-2 text-[10px] font-bold tracking-[0.2em] text-ink-soft uppercase">{t("nav.account")}</p>
            <TideLink role="menuitem" href="/trip" className={item}>
              {t("nav.signin")}
            </TideLink>
            <button role="menuitem" className={item} onClick={() => { setOpen(false); openPortal(); }}>
              {t("nav.language")}
            </button>
            <div className="mx-3 my-1 border-t border-line" />
            {DISCOVER.map((n) => (
              <TideLink key={n.href} role="menuitem" href={n.href} className={item}>
                {t(n.key)}
              </TideLink>
            ))}
            <div className="mx-3 my-1 border-t border-line" />
            <TideLink role="menuitem" href="/operator" className={item}>
              {t("nav.operator")}
            </TideLink>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-[11px] text-ink-soft">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-white/15 transition peer-checked:bg-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}

function ExperienceSettings() {
  const { settings, update } = useAudio();
  const { prefs, setPrefs, state, hide, show } = useCompanion();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="btn btn-ghost !h-10 !w-10 !p-0"
        aria-label={settings.enabled ? "Sound and experience settings (sound on)" : "Sound and experience settings (sound off)"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {settings.enabled ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
            <path d="m22 9-6 6M16 9l6 6" />
          </svg>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="surface-strong absolute right-0 mt-3 w-[min(320px,calc(100vw-24px))] rounded-3xl p-5"
            role="dialog"
            aria-label="Experience settings"
          >
            <p className="eyebrow mb-2">Sound</p>
            <Toggle label="Enable sound" hint="Original synthesized audio. Off by default." checked={settings.enabled} onChange={(v) => update({ enabled: v })} />
            <div className={settings.enabled ? "" : "pointer-events-none opacity-40"}>
              <Toggle label="Ocean ambience" hint="Waves, breeze, distant birds" checked={settings.ambience} onChange={(v) => update({ ambience: v })} />
              <Toggle label="Migo's sounds" checked={settings.character} onChange={(v) => update({ character: v })} />
              <label className="block py-2">
                <span className="text-sm font-semibold">Volume</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.volume}
                  onChange={(e) => update({ volume: Number(e.target.value) })}
                  className="mt-2 w-full accent-[var(--accent)]"
                  aria-label="Volume"
                />
              </label>
            </div>
            <p className="eyebrow mb-2 mt-4">Migo & motion</p>
            <Toggle label="Pause animations" hint="Stops walking and ambient motion" checked={prefs.motionPaused} onChange={(v) => setPrefs({ motionPaused: v })} />
            <Toggle label="Helpful tips from Migo" hint="Occasional, dismissible suggestions" checked={prefs.proactive} onChange={(v) => setPrefs({ proactive: v })} />
            <Toggle label="Show Migo" checked={!state.userHidden} onChange={(v) => (v ? show() : hide())} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
