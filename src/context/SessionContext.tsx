import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role } from "../types";
import { claim } from "../identity";

// O backend nao possui autenticacao. A "sessao" e o papel atual (loja ou
// consumidor) + o nome. A identidade e fixada no login: um nome cadastrado
// como loja nao pode entrar como cliente (e vice-versa). `name` vazio = deslogado.
interface Session {
  role: Role | null;
  name: string;
}

interface SessionContextValue extends Session {
  // Tenta entrar. Retorna erro se o nome pertencer ao outro papel.
  login: (role: Role, name: string) => { ok: boolean; error?: string };
  // Sai da sessao atual (mantem o registro de identidades).
  logout: () => void;
}

const STORAGE_KEY = "wad.session";

const SessionContext = createContext<SessionContextValue | null>(null);

function load(): Session {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Session;
  } catch {
    /* ignora JSON invalido */
  }
  return { role: null, name: "" };
}

const roleLabel = (r: Role) => (r === "store" ? "loja" : "cliente");

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  const value: SessionContextValue = {
    ...session,
    login: (role, rawName) => {
      const name = rawName.trim();
      if (!name) return { ok: false, error: "Informe um nome." };

      const result = claim(name, role);
      if (!result.ok) {
        return {
          ok: false,
          error: `O nome "${name}" já está cadastrado como ${roleLabel(
            result.conflict!,
          )}. Use outro nome ou entre como ${roleLabel(result.conflict!)}.`,
        };
      }

      setSession({ role, name });
      return { ok: true };
    },
    logout: () => setSession({ role: null, name: "" }),
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession deve ser usado dentro de <SessionProvider>");
  return ctx;
}
