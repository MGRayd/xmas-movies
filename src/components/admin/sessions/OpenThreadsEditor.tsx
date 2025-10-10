import { useState } from "react";

export type ThreadItem = { text: string; done: boolean };

export default function OpenThreadsEditor({
  value,
  onChange,
}: {
  value: ThreadItem[];
  onChange: (next: ThreadItem[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const t = draft.trim();
    if (!t) return;
    onChange([...(value ?? []), { text: t, done: false }]);
    setDraft("");
  }

  function updateAt(idx: number, patch: Partial<ThreadItem>) {
    const next = [...value];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  }

  function removeAt(idx: number) {
    const next = [...value];
    next.splice(idx, 1);
    onChange(next);
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body gap-3">
        <h3 className="card-title">Open Threads</h3>

        <div className="flex items-center gap-2">
          <input
            className="input input-bordered w-full"
            placeholder='e.g. "Caravan guard contract confirmed"'
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
        <button type="button" className="btn btn-primary" onClick={add}>
            Add
          </button>
        </div>

        {(value?.length ?? 0) === 0 ? (
          <div className="opacity-60">No threads yet. Add your first one above.</div>
        ) : (
          <ul className="space-y-2">
            {value.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={!!item.done}
                  onChange={(e) => updateAt(idx, { done: e.target.checked })}
                />
                <input
                  className="input input-bordered w-full"
                  value={item.text}
                  onChange={(e) => updateAt(idx, { text: e.target.value })}
                />
                <button
                  type="button"
                  className="btn btn-error btn-outline btn-sm"
                  title="Remove"
                  onClick={() => removeAt(idx)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
