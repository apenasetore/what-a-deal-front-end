import { useEffect, useState } from "react";
import { getSubscriptions, subscribe, unsubscribe } from "../api/client";
import { useSession } from "../context/SessionContext";

// Painel de interesses do consumidor: seguir e cancelar categorias.
// `suggestions` traz categorias derivadas das promocoes existentes.
export function SubscriptionPanel({ suggestions }: { suggestions: string[] }) {
  const { name } = useSession();
  const [categories, setCategories] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!name) return;
    getSubscriptions(name)
      .then(setCategories)
      .catch((e: Error) => setError(e.message));
  }, [name]);

  async function follow(category: string) {
    const cat = category.trim();
    if (!cat || categories.includes(cat)) return;
    setBusy(true);
    setError(null);
    try {
      await subscribe(name, cat);
      setCategories((c) => [...c, cat]);
      setDraft("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function unfollow(category: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await unsubscribe(name, category);
      setCategories(res.categories ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const available = suggestions.filter((s) => !categories.includes(s));

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-slate-800">Meus interesses</h2>
      <p className="mt-1 text-xs text-slate-500">
        Categorias que você segue para receber notificações.
      </p>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void follow(draft);
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nova categoria"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Seguir
        </button>
      </form>

      {available.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-slate-400">Sugestões:</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {available.map((s) => (
              <button
                key={s}
                onClick={() => void follow(s)}
                disabled={busy}
                className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-1">
        {categories.length === 0 && (
          <p className="text-sm text-slate-400">Você ainda não segue nenhuma categoria.</p>
        )}
        {categories.map((c) => (
          <div
            key={c}
            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5"
          >
            <span className="text-sm text-slate-700">{c}</span>
            <button
              onClick={() => void unfollow(c)}
              disabled={busy}
              className="text-xs font-medium text-rose-500 hover:text-rose-700 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        ))}
      </div>

      {error && <p className="mt-2 text-xs text-rose-500">Erro: {error}</p>}
    </aside>
  );
}
