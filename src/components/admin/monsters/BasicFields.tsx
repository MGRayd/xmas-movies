import React from "react";

type Props = {
  col: string;
  name: string;
  slug: string;
  type: string;
  quote: string;
  onChange: (patch: Record<string, any>) => void;
};

export default function BasicFields({ col, name, slug, type, quote, onChange }: Props) {
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
          placeholder="Monster name"
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
          <span className="label-text">Type</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={type}
          onChange={(e) => onChange({ type: e.target.value })}
          placeholder="Monster type (e.g., Undead, Beast, Aberration)"
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
          placeholder="Monster quote (displayed in italics below name)"
        />
      </div>
    </div>
  );
}
