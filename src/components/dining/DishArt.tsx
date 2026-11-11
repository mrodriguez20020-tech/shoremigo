/** Original vector food illustration (no photos): plate, glass or sweet, tinted per dish. */
export function DishArt({ tone, kind }: { tone: [string, string]; kind: "street" | "main" | "breakfast" | "drink" | "sweet" }) {
  const [a, b] = tone;
  const id = `g${a.slice(1)}${b.slice(1)}${kind}`;
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id={id} cx=".5" cy=".4" r=".8">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </radialGradient>
      </defs>
      <rect width="120" height="120" fill={`url(#${id})`} />
      {kind === "drink" ? (
        <g>
          <path d="M40 30 H80 L74 96 Q60 102 46 96Z" fill="#f9f6ee" opacity=".9" />
          <path d="M43 48 H77 L73 94 Q60 99 47 94Z" fill={a} />
          <circle cx="70" cy="34" r="9" fill="#65d6cf" />
          <path d="M66 18 L58 50" stroke="#f9f6ee" strokeWidth="3" />
        </g>
      ) : kind === "sweet" ? (
        <g>
          <path d="M24 78 L60 44 L96 78Z" fill="#f9f6ee" />
          <path d="M24 78 H96 V90 H24Z" fill={a} />
          <path d="M28 76 L60 48 L92 76" fill="none" stroke={b} strokeWidth="4" opacity=".6" />
          <circle cx="60" cy="40" r="7" fill="#c2412d" />
        </g>
      ) : (
        <g>
          <ellipse cx="60" cy="72" rx="44" ry="18" fill="#f9f6ee" opacity=".95" />
          <ellipse cx="60" cy="66" rx="32" ry="12" fill={a} />
          {kind === "street" && <path d="M34 64 Q60 44 86 64" stroke="#f4c777" strokeWidth="8" fill="none" strokeLinecap="round" />}
          {kind === "breakfast" && <circle cx="60" cy="64" r="8" fill="#f4c777" stroke="#f9f6ee" strokeWidth="4" />}
          {kind === "main" && (
            <>
              <circle cx="50" cy="64" r="5" fill="#5d8a3a" />
              <circle cx="68" cy="62" r="4" fill="#f69a8e" />
            </>
          )}
        </g>
      )}
    </svg>
  );
}
