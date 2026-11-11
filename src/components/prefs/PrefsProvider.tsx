"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type Key, type Lang, translate } from "@/lib/client/i18n";

export interface VisitorPrefs {
  lang: Lang;
  country: string | null;
  remember: boolean;
  /** true once the visitor continued or skipped the welcome portal */
  welcomed: boolean;
}

const KEY = "sm_prefs";
const DEFAULT: VisitorPrefs = { lang: "en", country: null, remember: false, welcomed: false };

interface Ctx {
  prefs: VisitorPrefs;
  ready: boolean;
  setPrefs: (p: Partial<VisitorPrefs>) => void;
  t: (key: Key, vars?: Record<string, string>) => string;
  portalOpen: boolean;
  openPortal: () => void;
  closePortal: () => void;
}

const PrefsCtx = createContext<Ctx | null>(null);

function readStored(): VisitorPrefs | null {
  for (const store of [() => window.localStorage, () => window.sessionStorage]) {
    try {
      const raw = store().getItem(KEY);
      if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
    } catch {
      /* storage blocked: fall through */
    }
  }
  return null;
}

/**
 * Visitor language/country. Consent-aware: saved to sessionStorage by default
 * (forgotten when the tab closes) and to localStorage only if the visitor
 * ticks "Remember my choices". Nothing is sent to the server.
 */
export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setState] = useState<VisitorPrefs>(DEFAULT);
  const [ready, setReady] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) setState(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = prefs.lang;
  }, [prefs.lang]);

  const setPrefs = useCallback((p: Partial<VisitorPrefs>) => {
    setState((prev) => {
      const next = { ...prev, ...p };
      try {
        const json = JSON.stringify(next);
        if (next.remember) {
          window.localStorage.setItem(KEY, json);
          window.sessionStorage.removeItem(KEY);
        } else {
          window.sessionStorage.setItem(KEY, json);
          window.localStorage.removeItem(KEY);
        }
      } catch {
        /* storage unavailable: keep in memory only */
      }
      return next;
    });
  }, []);

  const t = useCallback((key: Key, vars?: Record<string, string>) => translate(prefs.lang, key, vars), [prefs.lang]);

  const value = useMemo(
    () => ({ prefs, ready, setPrefs, t, portalOpen, openPortal: () => setPortalOpen(true), closePortal: () => setPortalOpen(false) }),
    [prefs, ready, setPrefs, t, portalOpen],
  );
  return <PrefsCtx.Provider value={value}>{children}</PrefsCtx.Provider>;
}

export function usePrefs() {
  const c = useContext(PrefsCtx);
  if (!c) throw new Error("usePrefs must be used inside PrefsProvider");
  return c;
}
