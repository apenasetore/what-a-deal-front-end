import type { Vote } from "./types";

// Controle local de votos: cada cliente tem direito a UM voto por promocao.
// Guardamos cliente -> { dealId: voto } em localStorage, para que o limite
// persista entre recarregamentos da pagina.
const KEY = "wad.votes";

type Store = Record<string, Record<string, Vote>>;

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    /* ignora JSON invalido */
  }
  return {};
}

function write(store: Store): void {
  localStorage.setItem(KEY, JSON.stringify(store));
}

const key = (name: string) => name.trim().toLowerCase();

export function getVote(client: string, dealId: string): Vote | undefined {
  return read()[key(client)]?.[dealId];
}

export function saveVote(client: string, dealId: string, vote: Vote): void {
  const store = read();
  const k = key(client);
  store[k] = { ...(store[k] ?? {}), [dealId]: vote };
  write(store);
}
