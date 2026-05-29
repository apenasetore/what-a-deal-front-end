import { useMemo, useState } from "react";
import { useDeals } from "../hooks/useDeals";
import { DealCard } from "./DealCard";
import { SubscriptionPanel } from "./SubscriptionPanel";

export function ConsumerView() {
  const { deals, loading, error, refresh } = useDeals();
  const [filter, setFilter] = useState<string>("");

  const categories = useMemo(
    () => Array.from(new Set(deals.map((d) => d.categoria))).sort(),
    [deals],
  );

  const visible = filter ? deals.filter((d) => d.categoria === filter) : deals;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <section>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter("")}
              className={`rounded-full px-3 py-1 text-sm ${
                filter === "" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Todas
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`rounded-full px-3 py-1 text-sm ${
                  filter === c ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={refresh}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            🔄 Atualizar
          </button>
        </div>

        {loading && <p className="text-slate-400">Carregando promoções...</p>}
        {error && (
          <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">
            Não foi possível carregar as promoções: {error}
            <br />
            Verifique se o Gateway está rodando em http://localhost:4000.
          </p>
        )}
        {!loading && !error && visible.length === 0 && (
          <p className="text-slate-400">Nenhuma promoção publicada ainda.</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((d) => (
            <DealCard key={d.id} deal={d} />
          ))}
        </div>
      </section>

      <SubscriptionPanel suggestions={categories} />
    </div>
  );
}
