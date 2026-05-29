import { useState } from "react";
import { useSession } from "../context/SessionContext";
import type { Role } from "../types";

const ROLES: { key: Role; label: string; hint: string }[] = [
  { key: "consumer", label: "Consumidor", hint: "consultar promoções, votar e seguir categorias" },
  { key: "store", label: "Loja", hint: "cadastrar promoções" },
];

export function Login() {
  const { login } = useSession();
  const [role, setRole] = useState<Role>("consumer");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = login(role, name);
    if (!result.ok) setError(result.error ?? "Não foi possível entrar.");
  }

  const selected = ROLES.find((r) => r.key === role)!;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <h1 className="text-xl font-bold text-indigo-600">What A Deal</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">Entre escolhendo seu perfil e um nome.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600">Perfil</label>
            <div className="mt-1 flex rounded-lg bg-slate-100 p-1">
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => {
                    setRole(r.key);
                    setError(null);
                  }}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    role === r.key
                      ? "bg-white text-indigo-600 shadow"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400">Para {selected.hint}.</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">
              {role === "store" ? "Nome da loja" : "Seu nome de cliente"}
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={role === "store" ? "Ex: Loja do João" : "Ex: maria"}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 p-2.5 text-sm text-rose-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Entrar
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400">
          Sem senha. Cada nome pertence a um único perfil (loja ou cliente).
        </p>
      </div>
    </div>
  );
}
