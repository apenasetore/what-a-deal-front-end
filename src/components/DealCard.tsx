import { useState } from "react";
import { vote } from "../api/client";
import { useSession } from "../context/SessionContext";
import { getVote, saveVote } from "../votes";
import type { Deal, Vote } from "../types";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function DealCard({ deal }: { deal: Deal }) {
  const { name } = useSession();
  // Voto ja registrado por este cliente nesta promocao (persistido).
  const [myVote, setMyVote] = useState<Vote | undefined>(() => getVote(name, deal.id));
  const [pending, setPending] = useState<Vote | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cada cliente tem direito a apenas um voto por promocao.
  const alreadyVoted = myVote !== undefined;

  async function handleVote(v: Vote) {
    if (alreadyVoted) return;
    setPending(v);
    setError(null);
    try {
      await vote(deal, v);
      saveVote(name, deal.id, v);
      setMyVote(v);
    } catch (e) {
      setError(`Erro: ${(e as Error).message}`);
    } finally {
      setPending(null);
    }
  }

  const desconto =
    deal.preco_original > 0
      ? Math.round((1 - deal.preco_promocional / deal.preco_original) * 100)
      : 0;

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-800">{deal.nome}</h3>
        <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
          {deal.categoria}
        </span>
      </div>

      <p className="mt-1 text-sm text-slate-500">{deal.descricao}</p>
      <p className="mt-1 text-xs text-slate-400">por {deal.loja}</p>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-lg font-bold text-emerald-600">{brl(deal.preco_promocional)}</span>
        {deal.preco_original > deal.preco_promocional && (
          <>
            <span className="text-sm text-slate-400 line-through">{brl(deal.preco_original)}</span>
            {desconto > 0 && (
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                -{desconto}%
              </span>
            )}
          </>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => handleVote("up")}
          disabled={alreadyVoted || pending !== null}
          className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed ${
            myVote === "up"
              ? "border-emerald-400 bg-emerald-100 text-emerald-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          }`}
        >
          {pending === "up" ? "..." : "👍 Curtir"}
        </button>
        <button
          onClick={() => handleVote("down")}
          disabled={alreadyVoted || pending !== null}
          className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed ${
            myVote === "down"
              ? "border-rose-400 bg-rose-100 text-rose-800"
              : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50"
          }`}
        >
          {pending === "down" ? "..." : "👎 Não curtir"}
        </button>
      </div>

      {alreadyVoted && (
        <p className="mt-2 text-xs text-slate-500">
          Você já votou nesta promoção ({myVote === "up" ? "👍 positivo" : "👎 negativo"}).
        </p>
      )}
      {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
    </div>
  );
}
