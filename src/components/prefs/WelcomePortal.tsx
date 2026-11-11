"use client";

import { OceanScene } from "@/components/scene/OceanScene";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { COUNTRIES, LANGS, type Lang, translate } from "@/lib/client/i18n";
import { INTRO_DONE_EVENT } from "@/components/intro/Intro";
import { GreetingMigo } from "@/components/migo/GreetingMigo";
import { CompassMark, Wordmark } from "@/components/brand/Wordmark";
import { useCompanion } from "@/components/migo/CompanionProvider";
import { migo } from "@/components/migo/bus";
import { track } from "@/lib/client/track";
import { usePrefs } from "./PrefsProvider";

/** Country and language remain independent. Only explicit consent persists choices across visits. */
export function WelcomePortal() {
  const { prefs, ready, setPrefs, portalOpen, openPortal, closePortal } =
    usePrefs();
  const { reducedMotion } = useCompanion();
  const [country, setCountry] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [remember, setRemember] = useState(false);
  const firstField = useRef<HTMLSelectElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const greetingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (greetingTimer.current) clearTimeout(greetingTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!ready || prefs.welcomed) return;
    let done = false;
    const open = () => {
      if (!done) {
        done = true;
        openPortal();
      }
    };
    window.addEventListener(INTRO_DONE_EVENT, open);
    if (document.documentElement.dataset.intro === "done") open();
    const fallback = setTimeout(open, 2200);
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
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const siblings = Array.from(document.body.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && !el.contains(dialog.current),
    );
    const inert = siblings.map((el) => el.inert);
    siblings.forEach((el) => {
      el.inert = true;
    });
    const id = setTimeout(
      () => firstField.current?.focus({ preventScroll: true }),
      60,
    );
    migo.emit({ type: "dock:request" });
    return () => {
      clearTimeout(id);
      document.body.style.overflow = overflow;
      siblings.forEach((el, i) => {
        el.inert = inert[i];
      });
      previousFocus?.focus({ preventScroll: true });
      migo.emit({ type: "dock:release" });
    };
  }, [portalOpen, prefs.country, prefs.lang, prefs.remember]);

  const finish = (save: boolean) => {
    const c = save ? country || null : prefs.country;
    const l = save ? lang : prefs.lang;
    setPrefs({
      welcomed: true,
      ...(save ? { country: c, lang: l, remember } : {}),
    });
    track("welcome.portal", {
      action: save ? "continue" : "skip",
      lang: l,
      country_set: Boolean(c),
    });
    if (!reducedMotion) {
      document.documentElement.dataset.approach = "true";
      window.setTimeout(() => { delete document.documentElement.dataset.approach; }, 900);
    }
    closePortal();
    if (greetingTimer.current) clearTimeout(greetingTimer.current);
    greetingTimer.current = setTimeout(
      () => {
        migo.emit({ type: "app:arrived" });
        migo.emit({
          type: "suggest",
          key: "welcome-portal",
          text:
            c && c !== "Other"
              ? translate(l, "migo.greetingFrom", { country: c })
              : translate(l, "migo.greeting"),
          href: "/#discover",
          cta: translate(l, "migo.cta"),
        });
      },
      reducedMotion ? 0 : 450,
    );
  };
  const T = (k: Parameters<typeof translate>[1]) => translate(lang, k);

  return (
    <AnimatePresence>
      {portalOpen && (
        <motion.div
          ref={dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
          lang={lang}
          className="welcome-world fixed inset-0 z-[80] overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.015 }}
          transition={{ duration: reducedMotion ? 0 : 0.45 }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              finish(false);
            }
            if (e.key === "Tab") {
              const items = Array.from(
                e.currentTarget.querySelectorAll<HTMLElement>(
                  'button, select, input:not([type="radio"]), input[type="radio"]:checked',
                ),
              );
              const first = items[0];
              const last = items.at(-1);
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
              }
            }
          }}
        >
          <OceanScene variant="welcome" />
          <div className="welcome-shade absolute inset-0" />
          <div className="welcome-shell relative mx-auto flex min-h-dvh max-w-[1600px] flex-col px-6 py-6 sm:px-12 sm:py-8 lg:px-20">
            <div className="flex items-center justify-between gap-4">
              <div
                className="flex items-center gap-2 text-2xl"
                aria-label="ShoreMigo"
              >
                <CompassMark />
                <Wordmark />
              </div>
              <button
                type="button"
                className="welcome-skip"
                onClick={() => finish(false)}
              >
                {T("welcome.skip")} <span aria-hidden>→</span>
              </button>
            </div>
            <div className="welcome-grid grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
              <div className="welcome-story">
                <p className="luxury-kicker">{T("welcome.escape")}</p>
                <h1 className="font-display mt-5 max-w-[10ch] text-[clamp(3rem,5.8vw,6.8rem)] leading-[1.02] tracking-[-0.045em]">
                  {T("welcome.headline")}
                </h1>
                <div className="welcome-companion mt-10 flex items-center gap-4">
                  <div aria-hidden className="welcome-migo shrink-0"><GreetingMigo /></div>
                  <div className="max-w-[250px] border-l border-white/30 pl-5">
                    <p className="font-display text-2xl">{T("welcome.meet")}</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/80">
                      {T("welcome.companion")}
                    </p>
                  </div>
                </div>
              </div>
              <motion.div
                className="welcome-card"
                initial={reducedMotion ? false : { y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.55,
                  delay: reducedMotion ? 0 : 0.15,
                }}
              >
                <p className="luxury-kicker">{T("welcome.begin")}</p>
                <h2
                  id="welcome-title"
                  className="font-display mt-3 text-3xl leading-tight tracking-[-0.03em] sm:text-4xl"
                >
                  {T("welcome.title")}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/75">
                  {T("welcome.sub")}
                </p>
                <form
                  className="mt-7 grid gap-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    finish(true);
                  }}
                >
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">
                      {T("welcome.country")}
                    </span>
                    <select
                      ref={firstField}
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="field"
                    >
                      <option value="">{T("welcome.countryNone")}</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <fieldset>
                    <legend className="mb-2 text-sm font-semibold">
                      {T("welcome.language")}
                    </legend>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {LANGS.map((l) => (
                        <label
                          key={l.id}
                          className={`welcome-language ${lang === l.id ? "is-selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name="lang"
                            value={l.id}
                            checked={lang === l.id}
                            onChange={() => setLang(l.id)}
                            className="sr-only"
                          />
                          <span lang={l.id}>{l.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-white/65">
                      {T("welcome.partial")}
                    </p>
                  </fieldset>
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#e8c895]"
                    />
                    <span>
                      <span className="font-semibold">
                        {T("welcome.remember")}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-white/65">
                        {T("welcome.rememberHint")}
                      </span>
                    </span>
                  </label>
                  <button type="submit" className="welcome-continue mt-1">
                    {T("welcome.continue")} <span aria-hidden>→</span>
                  </button>
                </form>
              </motion.div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] tracking-[0.12em] text-white/65">
              <span>SHOREMIGO · {T("welcome.signature")}</span>
              <span>{T("welcome.imagery")}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
