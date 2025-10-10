import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: string; kind: ToastKind; message: string };

const ToastCtx = createContext<{ push: (kind: ToastKind, msg: string) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, kind, message }]);
    // auto-dismiss
    setTimeout(() => remove(id), 3000);
  }, [remove]);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {/* viewport */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`alert shadow-lg max-w-sm ${
              t.kind === "success" ? "alert-success" :
              t.kind === "error" ? "alert-error" : "alert-info"
            }`}
          >
            <div>
              {t.kind === "success" ? "✅" : t.kind === "error" ? "⚠️" : "ℹ️"}
              <span className="ml-2">{t.message}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => remove(t.id)}>✕</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return {
    success: (m: string) => ctx.push("success", m),
    error: (m: string) => ctx.push("error", m),
    info: (m: string) => ctx.push("info", m),
  };
}
