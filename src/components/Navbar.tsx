import { useSession } from "../context/SessionContext";

export function Navbar() {
  const { role, name, logout } = useSession();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-indigo-600">What A Deal</span>
          <span className="text-2xl">🛒</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">
            {role === "store" ? "Loja" : "Cliente"}:{" "}
            <strong className="text-slate-700">{name}</strong>
          </span>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
