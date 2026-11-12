"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useCompanion } from "@/components/migo/CompanionProvider";
import { type CulinaryItem, photoFor } from "@/lib/culinary/catalog";
import { fmtUsd } from "@/lib/domain/time";
import { CulinaryMedia } from "./CulinaryMedia";
import "./culinary.css";

const GalleryContext = createContext<((id: string, button: HTMLButtonElement) => void) | null>(null);
export function CulinaryTrigger({ item, children, className = "" }: { item: CulinaryItem; children: ReactNode; className?: string }) {
  const open = useContext(GalleryContext);
  return <button type="button" className={`culinary-trigger ${className}`} aria-label={`Explore ${item.name}`} aria-haspopup="dialog" onClick={(e) => open?.(item.id, e.currentTarget)}>{children}</button>;
}

export function CulinaryCollection({ items, children }: { items: CulinaryItem[]; children: ReactNode }) {
  const { reducedMotion, openConcierge } = useCompanion();
  const [selected, setSelected] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const origin = useRef<DOMRect | null>(null);
  const animation = useRef<Animation | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId(), captionId = useId();
  const isOpen = selected !== null;
  const item = selected === null ? null : items[selected];

  const finish = useCallback(() => {
    animation.current?.cancel();
    if (closeTimer.current) clearTimeout(closeTimer.current);
    dialog.current?.close();
    setSelected(null); setClosing(false);
    if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
  }, []);
  const close = useCallback((after?: () => void) => {
    if (closing) return;
    setClosing(true);
    const done = () => { finish(); after?.(); };
    if (reducedMotion || !visual.current) { done(); return; }
    animation.current?.cancel();
    animation.current = visual.current.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.97)" }], { duration: 180, easing: "ease-in", fill: "forwards" });
    closeTimer.current = setTimeout(done, 180);
  }, [closing, finish, reducedMotion]);

  useEffect(() => {
    if (!isOpen || !dialog.current) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal(); // Native top layer makes all outside content inert, including Migo and the header.
    closeButton.current?.focus();
    const returnTo = opener.current;
    return () => {
      animation.current?.cancel();
      if (closeTimer.current) clearTimeout(closeTimer.current);
      element.close();
      document.body.style.overflow = previousOverflow;
      if (returnTo?.isConnected) returnTo.focus({ preventScroll: true });
    };
  }, [isOpen]);

  useEffect(() => {
    if (!item || !visual.current || reducedMotion) return;
    animation.current?.cancel();
    const bounds = visual.current.getBoundingClientRect(), from = origin.current;
    const scale = from ? Math.min(from.width / bounds.width, from.height / bounds.height) : .97;
    const x = from ? from.x + from.width / 2 - (bounds.x + bounds.width / 2) : 0;
    const y = from ? from.y + from.height / 2 - (bounds.y + bounds.height / 2) : 0;
    animation.current = visual.current.animate([{ opacity: .25, transform: `translate(${x}px, ${y}px) scale(${scale})` }, { opacity: 1, transform: "translate(0,0) scale(1)" }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
    origin.current = null;
  }, [item, reducedMotion]);

  const move = (delta: number) => { if (!closing) setSelected((i) => i === null ? null : (i + delta + items.length) % items.length); };
  const photo = item ? photoFor(item.id) : null;
  return <GalleryContext.Provider value={(id, button) => {
    const index = items.findIndex((d) => d.id === id);
    if (index < 0) return;
    opener.current = button;
    origin.current = button.querySelector(".culinary-media")?.getBoundingClientRect() ?? button.getBoundingClientRect();
    setSelected(index); setClosing(false);
  }}>
    {children}
    <dialog ref={dialog} className="culinary-dialog" aria-labelledby={titleId} aria-describedby={captionId} data-migo-avoid onCancel={(e) => { e.preventDefault(); close(); }} onClose={() => { setSelected(null); setClosing(false); }} onClick={(e) => { if (e.target === e.currentTarget) close(); }} onKeyDown={(e) => {
      if (e.key === "Tab") {
        const controls = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],[tabindex="0"]'));
        const first = controls[0], last = controls.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
      if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
    }}>
      {item && <div className="culinary-dialog-content" data-closing={closing}>
        <button ref={closeButton} type="button" className="culinary-close" aria-label="Close dish details" onClick={() => close()}>×</button>
        <div ref={visual} className="culinary-expanded-media"><CulinaryMedia key={item.id} item={item} expanded /></div>
        <div className="culinary-detail-copy">
          <p className="culinary-kicker">{item.sample ? `${item.venueName} · sample menu` : item.region}</p>
          <h2 id={titleId}>{item.name}</h2>
          <p id={captionId}>{item.description}</p>
          {item.priceCents !== undefined && <p className="culinary-detail-price">{item.priceCents === 0 ? "Included in the demo fare" : `${fmtUsd(item.priceCents)} · illustrative sample price`}</p>}
          {item.tags?.includes("contains-alcohol") && <p className="culinary-disclosure">Contains alcohol · legal drinking age only.</p>}
          <p className="culinary-disclosure">{item.sample ? "Fictional demo menu. This venue cannot be booked. " : "Dish guide; no venue, tour availability or serving is implied. "}Confirm ingredients and allergens with staff; no dietary guarantees.</p>
          {photo ? <p className="culinary-credit"><a href={photo.source} target="_blank" rel="noreferrer">{photo.title.replace("File:", "")} — {photo.author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>. Resized / converted to WebP. This photograph illustrates the dish; it is not a sample-menu serving or a bookable experience.</p> : <p className="culinary-credit">Original ShoreMigo vector illustration. A verified photograph of this subject is not available here.</p>}
          <button className="culinary-ask" type="button" onClick={() => close(() => openConcierge(`Tell me about ${item.name}. Use the dining guide, explain the sample-menu status, and help me find food experiences that fit my port schedule.`))}>Ask Migo about this dish <span aria-hidden>↗</span></button>
          <div className="culinary-gallery-controls">
            <button type="button" aria-label="Previous dish" disabled={items.length < 2 || closing} onClick={() => move(-1)}>←</button>
            <p role="status" aria-live="polite">{selected! + 1} / {items.length} · {item.name}</p>
            <button type="button" aria-label="Next dish" disabled={items.length < 2 || closing} onClick={() => move(1)}>→</button>
          </div>
        </div>
      </div>}
    </dialog>
  </GalleryContext.Provider>;
}
