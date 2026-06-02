import { useEffect, useRef } from "react";
import type { SSENotification } from "../types";

// Toast com chave estavel para o React e auto-dismiss.
export interface Toast extends SSENotification {
  key: number;
}

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// Pilha de toasts no canto superior direito, alimentada pelas notificacoes SSE.
export function NotificationToasts({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (key: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <ToastCard key={t.key} toast={t} onDismiss={() => onDismiss(t.key)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  // Ref evita reiniciar o timer quando o componente pai re-renderiza.
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const id = setTimeout(() => dismissRef.current(), 8000);
    return () => clearTimeout(id);
  }, []);

  const isHot = toast.tipo === "hot deal";
  const label = isHot ? "🔥 HOT DEAL" : "🆕 Nova promoção";

  return (
    <div
      role="status"
      className={`rounded-xl border bg-white p-3 shadow-lg ${
        isHot ? "border-amber-300" : "border-indigo-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            isHot ? "bg-amber-100 text-amber-700" : "bg-indigo-50 text-indigo-600"
          }`}
        >
          {label}
        </span>
        <button
          onClick={() => dismissRef.current()}
          className="text-slate-400 hover:text-slate-600"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <p className="mt-2 text-sm font-medium text-slate-800">{toast.promo?.nome}</p>
      <p className="text-xs text-slate-500">
        {toast.categoria}
        {typeof toast.promo?.preco_promocional === "number" && (
          <> · {brl(toast.promo.preco_promocional)}</>
        )}
      </p>
    </div>
  );
}
