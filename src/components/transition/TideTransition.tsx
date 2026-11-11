"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

/**
 * "Tide" route transitions: on navigation a luminous horizon rises from the
 * bottom of the screen like the tide coming in, the route changes underneath,
 * then the tide recedes upward revealing the new scene. Pure clip-path +
 * transform (compositor-friendly). Reduced motion: instant navigation.
 */
const Ctx = createContext<{ go: (href: string) => void } | null>(null);

export function TideProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [covering, setCovering] = useState(false);
  const target = useRef<string | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced";

  const go = useCallback(
    (href: string) => {
      const samePath = href.split(/[?#]/)[0] === window.location.pathname;
      if (reduced() || samePath) {
        router.push(href);
        return;
      }
      target.current = href;
      setCovering(true);
      setTimeout(() => router.push(href), 420);
      safety.current = setTimeout(() => setCovering(false), 2500);
    },
    [router],
  );

  useEffect(() => {
    if (!covering) return;
    // New route committed — let it paint, then recede.
    const t = setTimeout(() => setCovering(false), 120);
    if (safety.current) clearTimeout(safety.current);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Ctx.Provider value={{ go }}>
      {children}
      <AnimatePresence>
        {covering && (
          <motion.div
            key="tide"
            aria-hidden
            className="pointer-events-auto fixed inset-0 z-[90]"
            initial={{ clipPath: "inset(100% 0 0 0)" }}
            animate={{ clipPath: "inset(0% 0 0 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
            style={{ background: "linear-gradient(to bottom, var(--sky-1), var(--sky-2) 38%, var(--sky-3) 49.6%, var(--sea-1) 50.4%, var(--sea-2))" }}
          >
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2" style={{ background: "var(--glint)", boxShadow: "0 0 40px 8px var(--sun-glow)" }} />
            <motion.div
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              style={{ background: "radial-gradient(closest-side, var(--compass), transparent)", mixBlendMode: "screen" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

export function useTide() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTide outside TideProvider");
  return c;
}

/** Drop-in <Link> that plays the tide transition. Modifier-clicks behave normally. */
export function TideLink({ href, onClick, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const { go } = useTide();
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || href.startsWith("#")) return;
        e.preventDefault();
        go(href);
      }}
    />
  );
}
