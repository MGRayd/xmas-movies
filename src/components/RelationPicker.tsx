import { useEffect, useMemo, useState } from "react";

export type Option = { id: string; label: string };

type Props = {
  title: string;
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
  loading?: boolean;
  createHref?: string;     // e.g. /admin/npcs/new
  onRefresh?: () => void;  // called when user clicks refresh
};

export default function RelationPicker({
  title,
  options,
  selected,
  onChange,
  loading,
  createHref,
  onRefresh,
}: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    // First filter by search term if any
    const filteredOptions = !term
      ? [...options]
      : options.filter(
          (o) => o.label.toLowerCase().includes(term) || o.id.toLowerCase().includes(term)
        );
    
    // Then sort alphabetically by label
    return filteredOptions.sort((a, b) => {
      // Special case for sessions - sort numerically by session number
      if (a.label.startsWith('Session-') && b.label.startsWith('Session-')) {
        const numA = parseInt(a.label.replace('Session-', ''), 10) || 0;
        const numB = parseInt(b.label.replace('Session-', ''), 10) || 0;
        return numA - numB;
      }
      // Default alphabetical sort
      return a.label.localeCompare(b.label);
    });
  }, [q, options]);

  function toggle(id: string) {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else onChange([...selected, id]);
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body gap-3">
        <div className="flex items-center gap-2">
          <h3 className="card-title">{title}</h3>
          {createHref && (
            <a
              className="btn btn-xs btn-outline"
              href={createHref}
              target="_blank"
              rel="noreferrer"
              title="Add new in a new tab"
            >
              + New
            </a>
          )}
          {onRefresh && (
            <button
              className="btn btn-xs"
              type="button"
              onClick={onRefresh}
              title="Refresh list"
            >
              Refresh
            </button>
          )}
          <button className="btn btn-xs btn-ghost" onClick={clearAll} type="button">
            Clear
          </button>
        </div>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected
              .map(id => ({
                id,
                label: options.find((o) => o.id === id)?.label || id
              }))
              .sort((a, b) => {
                // Special case for sessions - sort numerically by session number
                if (a.label.startsWith('Session-') && b.label.startsWith('Session-')) {
                  const numA = parseInt(a.label.replace('Session-', ''), 10) || 0;
                  const numB = parseInt(b.label.replace('Session-', ''), 10) || 0;
                  return numA - numB;
                }
                // Default alphabetical sort
                return a.label.localeCompare(b.label);
              })
              .map(({ id, label }) => (
                <span key={id} className="badge badge-neutral gap-1">
                  {label}
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => toggle(id)}
                    aria-label={`Remove ${label}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
          </div>
        )}

        {/* Search + list */}
        <input
          className="input input-bordered"
          placeholder={`Search ${title.toLowerCase()}…`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="max-h-64 overflow-auto rounded border border-base-300">
          {loading ? (
            <div className="p-4 opacity-70">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 opacity-70">No results.</div>
          ) : (
            <ul>
              {filtered.map((o) => {
                const checked = selected.includes(o.id);
                return (
                  <li
                    key={o.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-base-300"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={checked}
                      onChange={() => toggle(o.id)}
                    />
                    <div className="truncate">
                      <div className="font-medium">{o.label}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
