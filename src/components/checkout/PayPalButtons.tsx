"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Thin wrapper around the official PayPal JS SDK Buttons (sandbox client id).
 * The SDK opens PayPal's real approval UI; our server creates and captures the
 * order. This component never decides success — `onApproved` calls our server,
 * which verifies the capture with PayPal before anything is confirmed.
 */
type PayPalNamespace = {
  Buttons: (opts: Record<string, unknown>) => { render: (el: HTMLElement) => Promise<void>; close?: () => void; isEligible?: () => boolean };
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

let sdkPromise: Promise<PayPalNamespace> | null = null;
function loadSdk(clientId: string) {
  if (window.paypal) return Promise.resolve(window.paypal);
  sdkPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons`;
    s.async = true;
    s.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error("PayPal SDK failed to initialise")));
    s.onerror = () => {
      sdkPromise = null;
      reject(new Error("Couldn't load PayPal. Check your connection or ad blocker."));
    };
    document.head.appendChild(s);
  });
  return sdkPromise;
}

export function PayPalButtons({
  clientId,
  createOrder,
  onApproved,
  onCancel,
  onError,
  disabled,
}: {
  clientId: string;
  createOrder: () => Promise<string>;
  onApproved: (orderId: string) => Promise<"ok" | "restart">;
  onCancel: () => void;
  onError: (message: string) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const handlers = useRef({ createOrder, onApproved, onCancel, onError });
  handlers.current = { createOrder, onApproved, onCancel, onError };

  useEffect(() => {
    let cancelled = false;
    let instance: { close?: () => void } | null = null;
    loadSdk(clientId)
      .then((paypal) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = "";
        const b = paypal.Buttons({
          style: { layout: "vertical", shape: "pill", color: "gold", label: "paypal", height: 48 },
          createOrder: () => handlers.current.createOrder(),
          onApprove: async (data: { orderID: string }, actions: { restart: () => Promise<void> }) => {
            const r = await handlers.current.onApproved(data.orderID);
            if (r === "restart") return actions.restart(); // e.g. INSTRUMENT_DECLINED → let buyer choose another funding source
          },
          onCancel: () => handlers.current.onCancel(),
          onError: (err: unknown) => handlers.current.onError(err instanceof Error ? err.message : "PayPal reported an error."),
        });
        instance = b;
        return b.render(ref.current).then(() => !cancelled && setState("ready"));
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setState("error");
          handlers.current.onError(e.message);
        }
      });
    return () => {
      cancelled = true;
      instance?.close?.();
    };
  }, [clientId]);

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""} aria-busy={state === "loading"}>
      {state === "loading" && <div className="h-[104px] animate-pulse rounded-2xl bg-black/5" aria-label="Loading PayPal" />}
      <div ref={ref} className="min-h-[50px] [&_iframe]:!rounded-2xl" />
    </div>
  );
}
