import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role } from "../types";
import { claim } from "../identity";


interface Session {
  role: Role | null;
  name: string;
  email: string;
}

interface SessionContextValue extends Session {
  login: (role: Role, name: string, email: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const STORAGE_KEY = "wad.session";

const SessionContext = createContext<SessionContextValue | null>(null);

function load(): Session {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Session;
  } catch {
  }
  return { role: null, name: "", email: "" };
}

const roleLabel = (r: Role) => (r === "store" ? "loja" : "cliente");

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(load);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  const value: SessionContextValue = {
    ...session,
    login: (role, rawName, rawEmail) => {
      const name = rawName.trim();
      const email = rawEmail.trim();
      if (!name) return { ok: false, error: "Informe um nome." };
      if (role === "store" && !email) return { ok: false, error: "Informe um email." };

      const result = claim(name, role);
      if (!result.ok) {
        return {
          ok: false,
          error: `O nome "${name}" já está cadastrado como ${roleLabel(
            result.conflict!,
          )}. Use outro nome ou entre como ${roleLabel(result.conflict!)}.`,
        };
      }

      setSession({ role, name, email });
      return { ok: true };
    },
    logout: () => setSession({ role: null, name: "", email: "" }),
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession deve ser usado dentro de <SessionProvider>");
  return ctx;
}
