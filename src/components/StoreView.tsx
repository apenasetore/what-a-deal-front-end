import { useState, type FormEvent } from "react";
import { createDeal } from "../api/client";
import { useSession } from "../context/SessionContext";
import type { NewDeal } from "../types";

const empty = (loja: string): NewDeal => ({
  nome: "",
  descricao: "",
  preco_original: 0,
  preco_promocional: 0,
  categoria: "",
  loja,
  email: "",
});

export function StoreView() {
  const { name } = useSession();
  const [form, setForm] = useState<NewDeal>(() => empty(name));
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update<K extends keyof NewDeal>(key: K, value: NewDeal[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    setError(null);
    try {
      const res = await createDeal({ ...form, loja: name });
      setStatus(res.data.status);
      setForm(empty(name));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold text-slate-800">Cadastrar promoção</h1>
      <p className="mt-1 text-sm text-slate-500">
        A promoção é assinada e validada pelo backend antes de ser publicada.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label className="text-sm font-medium text-slate-600">Nome do produto</label>
          <input
            className={field}
            value={form.nome}
            onChange={(e) => update("nome", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600">Descrição</label>
          <textarea
            className={field}
            rows={2}
            value={form.descricao}
            onChange={(e) => update("descricao", e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-600">Preço original (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={field}
              value={form.preco_original || ""}
              onChange={(e) => update("preco_original", Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Preço promocional (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={field}
              value={form.preco_promocional || ""}
              onChange={(e) => update("preco_promocional", Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-600">Categoria</label>
            <input
              className={field}
              value={form.categoria}
              onChange={(e) => update("categoria", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">E-mail da loja</label>
            <input
              type="email"
              className={field}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? "Enviando..." : "Publicar promoção"}
        </button>

        {status && (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{status}</p>
        )}
        {error && (
          <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">
            Erro: {error}
            <br />
            Verifique se o Gateway está rodando em http://localhost:4000.
          </p>
        )}
      </form>
    </div>
  );
}
