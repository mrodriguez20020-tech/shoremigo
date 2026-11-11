"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { COUNTRIES, LANGS, type Lang, translate } from "@/lib/client/i18n";
import { INTRO_DONE_EVENT } from "@/components/intro/Intro";
import { SpriteMigo } from "@/components/migo/SpriteMigo";
import { migo } from "@/components/migo/bus";
import { track } from "@/lib/client/track";
import { usePrefs } from "./PrefsProvider";

/**
 * First-visit welcome: independent country and language choices (both
 * optional, skippable), then Migo's greeting. Never infers language from
 * country. Reopenable from the header (Account → Language & region).
 */
export function WelcomePortal() {
  const { prefs, ready, setPrefs, portalOpen, openPortal, closePortal } = usePrefs();
  const [country, setCountry] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [remember, setRemember] = useState(false);
  const firstField = useRef<HTMLSelectElement>(null);

  // First visit only: open after the intro finishes (or a short fallback).
  useEffect(() => {
    if (!ready || prefs.welcomed) return;
    let done = false;
    const open = () => {
      if (done) return;
      done = true;
      openPortal();
    };
    window.addEventListener(INTRO_DONE_EVENT, open);
    const fallback = setTimeout(open, 9000); // only if the intro never reports finishing
    return () => {
      window.removeEventListener(INTRO_DONE_EVENT, open);
      clearTimeout(fallback);
    };
  }, [ready, prefs.welcomed, openPortal]);

  useEffect(() => {
    if (!portalOpen) return;
    setCountry(prefs.country ?? "");
    setLang(prefs.lang);
    setRemember(prefs.remember);
    const id = setTimeout(() => firstField.current?.focus(), 60);
    migo.emit({ type: "dock:request" });
    return () => {
      clearTimeout(id);
      migo.emit({ type: "dock:release" });
    };
  }, [portalOpen, prefs.country, prefs.lang, prefs.remember]);

  const greet = (l: Lang, c: string | null) => {
    const text = c && c !== "Other" ? translate(l, "migo.greetingFrom", { country: c }) : translate(l, "migo.greeting");
    setTimeout(() => {
      migo.emit({ type: "app:arrived" });
      migo.emit({ type: "suggest", key: "welcome-portal", text, href: "/#discover", cta: translate(l, "migo.cta") });
    }, 450);
  };

  const finish = (save: boolean) => {
    const c = save ? country || null : prefs.country;
    const l = save ? lang : prefs.lang;
    setPrefs({ welcomed: true, ...(save ? { country: c, lang: l, remember } : {}) });
    track("welcome.portal", { action: save ? "continue" : "skip", lang: l, country_set: Boolean(c) });
    closePortal();
    greet(l, c);
  };

  const T = (k: Parameters<typeof translate>[1]) => translate(lang, k);

  return (
    <AnimatePresence>
      {portalOpen && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(6,22,36,0.55)] p-3 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onKeyDown={(e) => e.key === "Escape" && finish(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
            className="surface-strong relative w-full max-w-xl overflow-hidden rounded-[32px] p-6 sm:p-9"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="pointer-events-none absolute -right-6 -top-4 hidden sm:block" aria-hidden>
              <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25, type: "spring", stiffness: 180, damping: 14 }}>
                <SpriteMigo pose="wave" size={150} reflection={false} />
              </motion.div>
            </div>
            <p className="eyebrow">ShoreMigo</p>
            <h2 id="welcome-title" className="font-display mt-2 max-w-[14ch] text-4xl leading-tight sm:text-5xl">
              {T("welcome.title")}
            </h2>
            <p className="mt-3 max-w-md text-sm text-ink-soft">{T("welcome.sub")}</p>

            <form
              className="mt-7 grid gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                finish(true);
              }}
            >
              <label className="grid gap-2">
                <span className="text-sm font-semibold">{T("welcome.country")}</span>
                <select ref={firstField} value={country} onChange={(e) => setCountry(e.target.value)} className="field">
                  <option value="">{T("welcome.countryNone")}</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="grid gap-2">
                <legend className="mb-2 text-sm font-semibold">{T("welcome.language")}</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup">
                  {LANGS.map((l) => (
                    <label key={l.id} className={`cursor-pointer rounded-2xl border px-3 py-2.5 text-center text-sm font-semibold transition ${lang === l.id ? "border-accent bg-accent text-accent-ink" : "border-line hover:border-accent"}`}>
                      <input type="radio" name="lang" value={l.id} checked={lang === l.id} onChange={() => setLang(l.id)} className="sr-only" />
                      {l.label}
                    </label>
                  ))}
                </div>
                <span className="text-[11px] text-ink-soft">{T("welcome.partial")}</span>
              </fieldset>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
                <span>
                  <span className="font-semibold">{T("welcome.remember")}</span>
                  <span className="block text-[11px] text-ink-soft">{T("welcome.rememberHint")}</span>
                </span>
              </label>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <button type="submit" className="btn btn-primary">
                  {T("welcome.continue")}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => finish(false)}>
                  {T("welcome.skip")}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
