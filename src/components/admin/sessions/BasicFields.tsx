export default function BasicFields({
    col,
    title,
    slug,
    date,
    summary,
    quote,
    onChange,
  }: {
    col: string;
    title: string;
    slug: string;
    date?: string;
    summary?: string;
    quote?: string;
    onChange: (patch: Partial<{ title: string; slug: string; date?: string; summary?: string; quote?: string }>) => void;
  }) {
    return (
      <div className="grid gap-3">
        <input
          className="input input-bordered"
          placeholder="Title or Name"
          value={title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
  
        <input
          className="input input-bordered"
          placeholder="Slug (optional)"
          value={slug}
          onChange={(e) => onChange({ slug: e.target.value })}
        />
  
        {col === "sessions" && (
          <input
            type="date"
            className="input input-bordered"
            value={date || new Date().toISOString().slice(0, 10)}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        )}
  
        <input
          className="input input-bordered"
          placeholder="Summary (optional)"
          value={summary || ""}
          onChange={(e) => onChange({ summary: e.target.value })}
        />
  
        <input
          className="input input-bordered"
          placeholder="Quote (displayed in italics below title)"
          value={quote || ""}
          onChange={(e) => onChange({ quote: e.target.value })}
        />
      </div>
    );
  }