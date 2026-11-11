/**
 * Minimal, safe markdown for model replies: paragraphs, "- " / "1. " lists
 * and **bold**. React escapes all text, so no HTML can be injected.
 */
const LIST_ITEM = /^\s*(?:[-*•]|\d+\.)\s+/;

function inline(t: string) {
  return t.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

export function RichText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.length && lines.every((l) => LIST_ITEM.test(l)))
          return (
            <ul key={i} className="space-y-1 pl-1">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2">
                  <span className="text-accent" aria-hidden>
                    •
                  </span>
                  <span>{inline(l.replace(LIST_ITEM, ""))}</span>
                </li>
              ))}
            </ul>
          );
        return (
          <p key={i} className="whitespace-pre-wrap">
            {inline(b)}
          </p>
        );
      })}
    </div>
  );
}
