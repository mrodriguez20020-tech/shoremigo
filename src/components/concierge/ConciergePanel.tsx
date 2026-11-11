"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getExcursion, getPort } from "@/lib/domain/catalog";
import { fmtUsd } from "@/lib/domain/time";
import { migo } from "@/components/migo/bus";
import { useCompanion } from "@/components/migo/CompanionProvider";
import { TideLink, useTide } from "@/components/transition/TideTransition";
import { api, track } from "@/lib/client/track";
import { recordProof } from "@/lib/client/proof";
import { RichText } from "./RichText";

type Card =
  | { type: "excursions"; ids: string[] }
  | { type: "prepare_booking"; excursionId: string; guests: number; totalCents: number }
  | { type: "verify_booking" }
  | { type: "trip"; ref: string }
  | { type: "rescue" };

interface Msg {
  role: "user" | "assistant";
  text: string;
  cards?: Card[];
  engine?: "gemini" | "offline";
  degraded?: boolean;
  tools?: string[];
}

interface Reply {
  text: string;
  cards: Card[];
  mood: "speaking" | "excited" | "concerned";
  toolsUsed: string[];
  engine: "gemini" | "offline";
  degraded?: boolean;
  model?: string;
  toolCalls?: { name: string; args: Record<string, unknown> }[];
}

const STARTERS = [
  "Find me a reef snorkel in Cozumel",
  "Something relaxing at sunset in Ocho Rios",
  "What happens if my ship is late?",
  "Check my booking",
];

export function ConciergePanel() {
  const { panelOpen, closeConcierge, consumePrompt, pendingPrompt } = useCompanion();
  const pathname = usePathname();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [engineLabel, setEngineLabel] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelOpen) return;
    track("concierge.opened", { page: pathname.slice(0, 40) });
    api<{ llm: string }>("/api/status")
      .then((s) => setEngineLabel(s.llm))
      .catch(() => setEngineLabel(null));
    setTimeout(() => inputRef.current?.focus(), 250);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeConcierge();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, pathname, closeConcierge]);

  useEffect(() => {
    if (panelOpen && pendingPrompt) {
      const p = consumePrompt();
      if (p) send(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen, pendingPrompt]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    const next = [...msgs, { role: "user" as const, text: t }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    migo.emit({ type: "concierge:thinking" });
    track("concierge.message", { page: pathname.slice(0, 40), count: next.length });
    const t0 = performance.now();
    try {
      const r = await api<Reply>("/api/concierge", {
        json: { history: next.map(({ role, text }) => ({ role, text })), page: pathname },
      });
      setMsgs((m) => [...m, { role: "assistant", text: r.text, cards: r.cards, engine: r.engine, degraded: r.degraded, tools: r.toolsUsed }]);
      migo.emit({ type: "concierge:replied", mood: r.mood });
      const calls = (r.toolCalls ?? r.toolsUsed.map((n) => ({ name: n, args: {} }))).map((c) => `${c.name}(${JSON.stringify(c.args)})`);
      recordProof({
        source: r.engine === "gemini" ? "gemini" : "system",
        kind: r.engine === "gemini" ? "live" : "fallback",
        title: r.engine === "gemini" ? `Gemini answered via ${calls.length} tool call${calls.length === 1 ? "" : "s"}` : r.degraded ? "Gemini unavailable: offline answer" : "Offline concierge (no LLM key)",
        detail: {
          ...(r.model ? { model: r.model } : {}),
          ...Object.fromEntries(calls.map((c, i) => [`call ${i + 1}`, c])),
          cards: r.cards.map((c) => c.type).join(", ") || "none",
          latency_ms: Math.round(performance.now() - t0),
        },
      });
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", text: `I couldn't reach my tools just now (${(e as Error).message}). You can still browse and book every tour from the Explore page.` }]);
      migo.emit({ type: "concierge:error" });
    } finally {
      setBusy(false);
    }
  }

  const close = () => {
    closeConcierge();
    (document.querySelector('[aria-controls="migo-concierge"]') as HTMLElement | null)?.focus();
  };

  return (
    <AnimatePresence>
      {panelOpen && (
        <motion.aside
          id="migo-concierge"
          role="dialog"
          aria-modal="false"
          aria-labelledby="migo-concierge-title"
          initial={{ opacity: 0, x: 40, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="surface-strong fixed inset-x-2 bottom-2 z-50 flex h-[70vh] flex-col overflow-hidden rounded-3xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-20 sm:h-auto sm:w-[420px]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <p className="eyebrow">AI concierge</p>
              <h2 id="migo-concierge-title" className="font-display text-2xl">
                Migo
              </h2>
              <p className="mt-0.5 text-[11px] text-ink-soft">
                {engineLabel?.startsWith("gemini") ? `AI assistant · ${engineLabel.replace("gemini:", "Gemini ")}` : "Offline mode · deterministic answers (no LLM key configured)"}
              </p>
            </div>
            <button onClick={close} className="btn btn-ghost !h-10 !w-10 !p-0 text-lg" aria-label="Close concierge">
              ×
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4" aria-live="polite">
            {msgs.length === 0 && (
              <div className="space-y-4">
                <p className="leading-relaxed">
                  Ahoy! I&apos;m Migo, ShoreMigo&apos;s <strong>AI assistant</strong>. I look up real tour availability and check every option against your ship&apos;s timetable.
                  I can prepare a booking, but you&apos;re always the one who confirms and pays.
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTERS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="btn btn-ghost !px-3 !py-2 text-left text-xs font-semibold">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink"
                      : "max-w-[95%] text-sm leading-relaxed"
                  }
                >
                  {m.role === "assistant" ? <RichText text={m.text} /> : <p className="whitespace-pre-wrap">{m.text}</p>}
                  {m.cards?.map((c, j) => <CardView key={j} card={c} onVerified={() => send("I've verified my booking. What's the status?")} />)}
                  {m.role === "assistant" && (m.tools?.length || m.degraded) ? (
                    <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                      {m.degraded ? "AI unavailable: offline answer · " : ""}
                      {m.tools?.length ? `checked: ${[...new Set(m.tools)].join(", ").replaceAll("_", " ")}` : ""}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
            {busy && <p className="text-xs text-ink-soft">Migo is checking the tide tables…</p>}
          </div>

          <form
            className="border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <div className="flex items-end gap-2">
              <label htmlFor="migo-input" className="sr-only">
                Message Migo
              </label>
              <textarea
                id="migo-input"
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={1000}
                onChange={(e) => {
                  setInput(e.target.value);
                  migo.emit({ type: "concierge:typing" });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask about ports, tours, timing…"
                className="field max-h-32 min-h-[46px] resize-none text-sm"
              />
              <button type="submit" disabled={busy || !input.trim()} className="btn btn-primary !h-[46px] !px-4" aria-label="Send">
                ➤
              </button>
            </div>
            <p className="mt-2 px-1 text-[10px] text-ink-soft">Migo can make mistakes. Prices, times and payments always come from ShoreMigo&apos;s systems and PayPal.</p>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function CardView({ card, onVerified }: { card: Card; onVerified: () => void }) {
  const { go } = useTide();
  const router = useRouter();
  if (card.type === "excursions") {
    return (
      <div className="mt-3 grid gap-2">
        {card.ids.map((id) => {
          const e = getExcursion(id);
          if (!e) return null;
          return (
            <TideLink
              key={id}
              href={`/excursions/${id}`}
              onClick={() => track("recommendation.clicked", { excursionId: id })}
              className="group flex items-center gap-3 rounded-2xl border border-line p-2.5 transition hover:bg-white/5"
            >
              <span className="h-12 w-12 shrink-0 rounded-xl" style={{ background: `linear-gradient(140deg, ${e.art.from}, ${e.art.to})` }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{e.title}</span>
                <span className="block text-xs text-ink-soft">
                  {getPort(e.portId)?.name} · {fmtUsd(e.priceCents)} / guest
                </span>
              </span>
              <span className="text-ink-soft transition group-hover:translate-x-0.5">→</span>
            </TideLink>
          );
        })}
      </div>
    );
  }
  if (card.type === "prepare_booking") {
    const e = getExcursion(card.excursionId)!;
    return (
      <div className="mt-3 rounded-2xl border border-line p-4">
        <p className="eyebrow">Booking prepared · not charged</p>
        <p className="mt-1 font-display text-lg">{e.title}</p>
        <p className="text-sm text-ink-soft">
          {card.guests} guest{card.guests > 1 ? "s" : ""} · total {fmtUsd(card.totalCents)}
        </p>
        <button
          className="btn btn-primary mt-3 w-full"
          onClick={() => {
            track("booking.started", { excursionId: e.id, count: card.guests });
            go(`/excursions/${e.id}?guests=${card.guests}#reserve`);
          }}
        >
          Review & continue to checkout
        </button>
      </div>
    );
  }
  if (card.type === "verify_booking") return <VerifyCard onVerified={onVerified} />;
  if (card.type === "trip")
    return (
      <button className="btn btn-ghost mt-3" onClick={() => go("/trip")}>
        Open my trip ({card.ref})
      </button>
    );
  if (card.type === "rescue")
    return (
      <button className="btn btn-primary mt-3" onClick={() => router.push("/trip#rescue")}>
        Open Trip Rescue
      </button>
    );
  return null;
}

function VerifyCard({ onVerified }: { onVerified: () => void }) {
  const [ref, setRef] = useState("");
  const [last, setLast] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  if (done) return <p className="mt-2 text-xs text-ink-soft">Booking verified for this browser.</p>;
  return (
    <form
      className="mt-3 grid gap-2 rounded-2xl border border-line p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        try {
          await api("/api/trip/verify", { json: { ref, lastName: last } });
          setDone(true);
          onVerified();
        } catch (x) {
          setErr((x as Error).message);
        }
      }}
    >
      <p className="text-xs text-ink-soft">For your privacy, verify your booking first.</p>
      <input className="field text-sm" placeholder="Booking ref (SM-XXXXX)" value={ref} onChange={(e) => setRef(e.target.value)} aria-label="Booking reference" />
      <input className="field text-sm" placeholder="Last name" value={last} onChange={(e) => setLast(e.target.value)} aria-label="Last name" autoComplete="family-name" />
      {err && <p className="text-xs text-warm">{err}</p>}
      <button className="btn btn-primary !py-2 text-sm" type="submit">
        Verify
      </button>
    </form>
  );
}

