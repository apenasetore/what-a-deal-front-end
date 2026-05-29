import type { Role } from "./types";

// Registro local de identidades: cada nome pertence a UM papel (loja ou cliente).
// Assim, um nome usado como loja nao pode entrar como cliente, e vice-versa.
// Persistido em localStorage (chave separada da sessao atual).
const KEY = "wad.identities";

type Registry = Record<string, Role>;

function read(): Registry {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Registry;
  } catch {
    /* ignora JSON invalido */
  }
  return {};
}

function write(reg: Registry): void {
  localStorage.setItem(KEY, JSON.stringify(reg));
}

// Chave normalizada para evitar duplicar "Loja" e "loja".
const norm = (name: string) => name.trim().toLowerCase();

export function roleOf(name: string): Role | undefined {
  return read()[norm(name)];
}

// Tenta reservar o nome para o papel informado.
// - ok: true  -> nome livre ou ja pertence a esse papel
// - ok: false -> nome ja cadastrado no outro papel (conflict)
export function claim(name: string, role: Role): { ok: boolean; conflict?: Role } {
  const reg = read();
  const key = norm(name);
  const existing = reg[key];

  if (existing && existing !== role) {
    return { ok: false, conflict: existing };
  }

  if (!existing) {
    reg[key] = role;
    write(reg);
  }
  return { ok: true };
}
