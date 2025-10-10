import React from "react";

type Props = {
  col: string;
  name: string;
  slug: string;
  summary: string;
  quote: string;
  onChange: (patch: Record<string, any>) => void;
};

export default function BasicFields({ col, name, slug, summary, quote, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Name</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Location name"
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Slug (optional)</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={slug}
          onChange={(e) => onChange({ slug: e.target.value })}
          placeholder="URL-friendly identifier (auto-generated if blank)"
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Summary</span>
        </label>
        <textarea
          className="textarea textarea-bordered"
          value={summary}
          onChange={(e) => onChange({ summary: e.target.value })}
          placeholder="Brief summary of the location"
          rows={3}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Quote</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={quote}
          onChange={(e) => onChange({ quote: e.target.value })}
          placeholder="Location quote (displayed in italics below name)"
        />
      </div>
    </div>
  );
}
