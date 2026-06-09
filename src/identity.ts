import type { Role } from "./types";


const KEY = "wad.identities";

type Registry = Record<string, Role>;

function read(): Registry {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Registry;
  } catch {
    /* ignora JSON invalido */
  }
  return {};
}

function write(reg: Registry): void {
  sessionStorage.setItem(KEY, JSON.stringify(reg));
}

const norm = (name: string) => name.trim().toLowerCase();

export function roleOf(name: string): Role | undefined {
  return read()[norm(name)];
}


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
