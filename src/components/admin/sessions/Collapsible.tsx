import { useEffect, useState } from "react";

export default function Collapsible({
  title,
  children,
  defaultOpen = false,
  storageKey, // optional: persist open/closed
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
}) {
  const key = storageKey || `collapsible:${title}`;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    try {
      const s = localStorage.getItem(key);
      if (s !== null) setOpen(s === "1");
    } catch {}
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, open ? "1" : "0");
    } catch {}
  }, [key, open]);

  return (
    <div className="collapse collapse-arrow bg-base-200 border border-base-300">
      <input type="checkbox" checked={open} onChange={() => setOpen(!open)} />
      <div className="collapse-title text-lg font-semibold">{title}</div>
      <div className="collapse-content pt-3">{children}</div>
    </div>
  );
}
