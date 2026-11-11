import { CompassMark, Wordmark } from "@/components/brand/Wordmark";

export function SiteFooter() {
  return (
    <footer className="relative z-10 px-5 pb-36 pt-16 sm:px-10">
      <div className="surface mx-auto flex max-w-[1400px] flex-col gap-6 rounded-[28px] p-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-2xl">
            <CompassMark />
            <Wordmark />
          </div>
          <p className="mt-2 text-sm text-ink-soft">Your adventure doesn&apos;t stop when plans change.</p>
        </div>
        <p className="max-w-xl text-xs leading-relaxed text-ink-soft">
          Built for the PayPal AI Hackathon 2026. Hackathon demo: sample inventory, fictional sailing, PayPal sandbox only. Environment art is original vector work;
          audio is synthesized in-browser; fonts Fraunces and Manrope (SIL OFL). Migo is an AI assistant and can make mistakes; prices, schedules and payments come
          from ShoreMigo&apos;s systems and PayPal.
        </p>
      </div>
    </footer>
  );
}
