"use client";

import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { migo, type MigoEvent } from "./bus";
import { initialMigo, migoReducer, type MigoAction, type MigoState } from "./machine";

export interface CompanionPrefs {
  proactive: boolean; // proactive suggestion bubbles
  motionPaused: boolean; // user-paused walking/animation
}

interface CompanionCtx {
  state: MigoState;
  prefs: CompanionPrefs;
  setPrefs: (p: Partial<CompanionPrefs>) => void;
  reducedMotion: boolean;
  hide: () => void;
  show: () => void;
  panelOpen: boolean;
  openConcierge: (prompt?: string) => void;
  closeConcierge: () => void;
  pendingPrompt: string | null;
  consumePrompt: () => string | null;
}

const KEY = "sm.migo.v1";
const Ctx = createContext<CompanionCtx | null>(null);

export function CompanionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer((s: MigoState, a: MigoAction) => migoReducer(s, a), initialMigo);
  const [prefs, setPrefsState] = useState<CompanionPrefs>({ proactive: true, motionPaused: false });
  const [reducedMotion, setReduced] = useState(false);
  const [pendingPrompt, setPending] = useState<string | null>(null);
  const pendingRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setPrefsState((p) => ({ ...p, ...saved.prefs }));
        if (saved.hidden) dispatch({ type: "user:hide" });
      }
    } catch {}
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => migo.on((e: MigoEvent) => dispatch(e)), []);
  useEffect(() => {
    const t = setInterval(() => dispatch({ type: "tick", now: Date.now() }), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = prefs.motionPaused ? "reduced" : "full";
  }, [prefs.motionPaused]);

  const persist = (p: CompanionPrefs, hidden: boolean) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ prefs: p, hidden }));
    } catch {}
  };

  const setPrefs = useCallback(
    (p: Partial<CompanionPrefs>) =>
      setPrefsState((prev) => {
        const next = { ...prev, ...p };
        persist(next, state.userHidden);
        return next;
      }),
    [state.userHidden],
  );

  const hide = useCallback(() => {
    dispatch({ type: "user:hide" });
    persist(prefs, true);
  }, [prefs]);
  const show = useCallback(() => {
    dispatch({ type: "user:show" });
    persist(prefs, false);
  }, [prefs]);

  const openConcierge = useCallback((prompt?: string) => {
    if (prompt) {
      pendingRef.current = prompt;
      setPending(prompt);
    }
    migo.emit({ type: "concierge:opened" });
  }, []);
  const closeConcierge = useCallback(() => migo.emit({ type: "concierge:closed" }), []);
  const consumePrompt = useCallback(() => {
    const p = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    return p;
  }, []);

  return (
    <Ctx.Provider
      value={{
        state,
        prefs,
        setPrefs,
        reducedMotion: reducedMotion || prefs.motionPaused,
        hide,
        show,
        panelOpen: state.panelOpen,
        openConcierge,
        closeConcierge,
        pendingPrompt,
        consumePrompt,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCompanion() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCompanion outside CompanionProvider");
  return c;
}
