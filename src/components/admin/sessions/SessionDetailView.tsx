import React from "react";
import EnhancedMarkdown from "@/components/EnhancedMarkdown";

type ThreadItem =
  | string
  | { text?: string; title?: string; done?: boolean; resolved?: boolean };

type SessionDoc = {
  id: string;
  title?: string;
  date?: string;
  imageUrl?: string;
  quote?: string; // Session quote displayed below title/image

  summary?: string;
  tldr?: string;
  tldrMarkdown?: string;
  content?: string;
  contentMarkdown?: string;
  detailsMarkdown?: string;
  overviewMarkdown?: string;

  openThreads?: ThreadItem[];
};

function normalizeThreads(list?: ThreadItem[]) {
  if (!Array.isArray(list)) return [];
  return list
    .map((t) => {
      if (typeof t === "string") return { text: t, done: false };
      const text = t.text ?? t.title ?? "";
      const done = !!(t.done ?? t.resolved);
      return text ? { text, done } : null;
    })
    .filter(Boolean) as { text: string; done: boolean }[];
}

export default function SessionDetailView({ data }: { data: SessionDoc }) {
  const tldr = data.tldrMarkdown ?? data.tldr ?? data.summary ?? "";
  const body =
    data.contentMarkdown ??
    data.detailsMarkdown ??
    data.overviewMarkdown ??
    data.content ??
    "";
  const quote = data.quote ?? "";

  const threads = normalizeThreads(data.openThreads);

  return (
    <div className="space-y-8">
      {/* Quote - displayed at the top */}
      {quote && (
        <section>
          <p className="italic text-lg">{quote}</p>
        </section>
      )}

      {/* TL;DR */}
      {!!tldr && (
        <section>
          <h2 className="text-xl font-semibold mb-2">TL;DR</h2>
          <EnhancedMarkdown>{tldr}</EnhancedMarkdown>
        </section>
      )}

      {/* Open Threads (with checkboxes, read-only) */}
      {threads.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Open Threads</h2>
          <ul className="space-y-2">
            {threads.map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="checkbox mt-1"
                  checked={t.done}
                  readOnly
                />
                <span className={t.done ? "opacity-70 line-through" : ""}>{t.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Main content */}
      {!!body && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Session Notes</h2>
          <EnhancedMarkdown>{body}</EnhancedMarkdown>
        </section>
      )}
    </div>
  );
}
