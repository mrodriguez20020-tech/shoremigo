"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AudioEngine, type Sfx } from "./engine";
import { migo } from "@/components/migo/bus";

export interface AudioSettings {
  enabled: boolean; // master opt-in
  ambience: boolean;
  character: boolean;
  volume: number;
}

interface AudioCtx {
  settings: AudioSettings;
  update: (p: Partial<AudioSettings>) => void;
  play: (s: Sfx) => void;
}

const DEFAULTS: AudioSettings = { enabled: false, ambience: true, character: true, volume: 0.6 };
const KEY = "sm.audio.v1";
const Ctx = createContext<AudioCtx | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const engine = useRef<AudioEngine | null>(null);
  const [settings, setSettings] = useState<AudioSettings>(DEFAULTS);
  const ducked = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // Never auto-start audio on a new visit: restore toggles, but master stays off until the user opts in again.
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw), enabled: false });
    } catch {}
  }, []);

  const get = () => (engine.current ??= new AudioEngine());

  const update = useCallback((p: Partial<AudioSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...p };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Apply settings to the engine (requires a user gesture for the first unlock — the toggle click provides it).
  useEffect(() => {
    if (!settings.enabled) {
      engine.current?.stopAmbience();
      return;
    }
    const e = get();
    e.unlock().then(() => {
      e.setVolume(settings.volume);
      if (settings.ambience) {
        e.startAmbience();
        e.duck(ducked.current);
      } else e.stopAmbience();
    });
  }, [settings]);

  const play = useCallback(
    (s: Sfx) => {
      if (settings.enabled && settings.character) engine.current?.sfx(s);
    },
    [settings.enabled, settings.character],
  );

  // Sound follows Migo/app events.
  useEffect(
    () =>
      migo.on((e) => {
        switch (e.type) {
          case "app:arrived":
            return play("greet");
          case "user:poke":
            return play("curious");
          case "excursion:selected":
          case "match:completed":
            return play("excited");
          case "concierge:opened":
            return play("listen");
          case "concierge:replied":
            return play(e.mood === "concerned" ? "concern" : "tap");
          case "booking:verified":
            return play("success");
          case "disruption:detected":
            return play("concern");
          case "rescue:resolved":
            return play("resolve");
          case "checkout:entered":
            ducked.current = true;
            engine.current?.duck(true); // quiet around financial controls
            return;
          case "checkout:left":
            ducked.current = false;
            engine.current?.duck(false);
            return;
          case "scene:changed":
            if (settings.enabled && settings.ambience && e.scene !== "neutral") engine.current?.motif(e.scene);
            return;
        }
      }),
    [play, settings.enabled, settings.ambience],
  );

  return <Ctx.Provider value={{ settings, update, play }}>{children}</Ctx.Provider>;
}

export function useAudio() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAudio outside AudioProvider");
  return c;
}
