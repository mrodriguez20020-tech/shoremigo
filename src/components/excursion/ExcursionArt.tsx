import type { Excursion } from "@/lib/domain/types";

/**
 * Original, lightweight vector "postcards" per excursion motif. These stand in
 * for photography until licensed images are added (set `image` later and
 * render it above this layer). No external assets, no licensing questions.
 */
export function ExcursionArt({ art, className = "" }: { art: Excursion["art"]; className?: string }) {
  const { from, to, accent, motif } = art;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: `linear-gradient(160deg, ${from}, ${to})` }} aria-hidden>
      <div className="absolute -right-[10%] -top-[20%] h-[70%] w-[70%] rounded-full opacity-60" style={{ background: `radial-gradient(closest-side, ${accent}, transparent)` }} />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">
        {motif === "reef" && (
          <g>
            {[...Array(9)].map((_, i) => (
              <circle key={i} cx={40 + i * 42} cy={60 + ((i * 37) % 90)} r={2 + (i % 3)} fill="white" opacity={0.35} />
            ))}
            <path d="M0 220 C60 170 90 200 130 180 C170 160 200 200 250 175 C300 150 340 190 400 170 L400 260 L0 260Z" fill={to} opacity={0.75} />
            <path d="M60 230 q10 -50 0 -80 M60 190 q20 -14 30 -40 M60 200 q-18 -10 -26 -32" stroke={accent} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.7} />
            <path d="M300 235 q-6 -40 10 -70 M305 200 q18 -6 26 -28" stroke="#ff8f7a" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.6} />
            <path d="M190 120 q20 -12 40 0 q-20 12 -40 0 l-10 -8 l0 16 z" fill="white" opacity={0.5} />
          </g>
        )}
        {motif === "beach" && (
          <g>
            <path d="M0 190 C120 160 260 175 400 150 L400 260 L0 260Z" fill="#f6e3b8" opacity={0.85} />
            <path d="M0 175 C120 150 260 165 400 140" stroke="white" strokeWidth={3} fill="none" opacity={0.6} />
            <path d="M280 175 L280 110" stroke="#5a3d25" strokeWidth={3} />
            <path d="M240 115 Q280 80 320 115 Z" fill="#ff7a59" opacity={0.9} />
          </g>
        )}
        {motif === "sail" && (
          <g>
            <circle cx="200" cy="150" r="42" fill={accent} opacity={0.9} />
            <rect x="0" y="160" width="400" height="100" fill={to} opacity={0.8} />
            {[...Array(7)].map((_, i) => (
              <rect key={i} x={170 - i * 6} y={168 + i * 12} width={60 + i * 12} height={2} fill={accent} opacity={0.5 - i * 0.05} />
            ))}
            <path d="M120 160 L150 70 L150 160 Z M155 160 L155 85 L190 160 Z" fill="#1b0f27" opacity={0.85} />
            <path d="M110 162 L200 162 L192 172 L118 172 Z" fill="#1b0f27" opacity={0.85} />
          </g>
        )}
        {motif === "falls" && (
          <g>
            <path d="M120 0 L280 0 L300 260 L100 260Z" fill="white" opacity={0.12} />
            {[...Array(10)].map((_, i) => (
              <rect key={i} x={130 + i * 15} y={0} width={4} height={260} fill="white" opacity={0.15 + (i % 3) * 0.08} />
            ))}
            <path d="M0 200 C80 180 140 215 200 205 C260 195 320 220 400 200 L400 260 L0 260Z" fill={to} opacity={0.85} />
          </g>
        )}
        {motif === "jungle" && (
          <g opacity={0.8}>
            {[...Array(7)].map((_, i) => (
              <path
                key={i}
                transform={`translate(${i * 65 - 20} ${150 + (i % 2) * 30}) rotate(${-30 + i * 12})`}
                d="M0 0 C30 -40 90 -40 120 0 C90 30 30 30 0 0Z"
                fill={i % 2 ? to : "#0b2e22"}
              />
            ))}
          </g>
        )}
        {motif === "cacao" && (
          <g>
            {[...Array(5)].map((_, i) => (
              <ellipse key={i} cx={80 + i * 60} cy={170 - (i % 2) * 30} rx={22} ry={38} fill={i % 2 ? "#8a4b24" : "#b5652f"} opacity={0.85} transform={`rotate(${-20 + i * 10} ${80 + i * 60} 170)`} />
            ))}
            <path d="M0 230 C120 210 280 240 400 220 L400 260 L0 260Z" fill="#2a1410" opacity={0.7} />
          </g>
        )}
        {motif === "ruins" && (
          <g fill={to} opacity={0.85}>
            <rect x="120" y="200" width="160" height="60" />
            <rect x="140" y="170" width="120" height="30" />
            <rect x="160" y="145" width="80" height="25" />
            <rect x="180" y="125" width="40" height="20" />
          </g>
        )}
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    </div>
  );
}
