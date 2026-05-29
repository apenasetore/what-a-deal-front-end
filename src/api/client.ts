import type { Deal, NewDeal, SubscriptionResponse, Vote } from "../types";

// Todas as chamadas usam o prefixo "/api", que o proxy do Vite reescreve para
// http://localhost:4000 (ver vite.config.ts). Isso evita CORS em desenvolvimento.
const BASE = "/api";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

// GET /deals — lista promocoes ja validadas e publicadas.
export async function listDeals(): Promise<Deal[]> {
  const res = await fetch(`${BASE}/deals`);
  return handle<Deal[]>(res);
}

// POST /deals — loja cadastra uma promocao (entra no fluxo de validacao).
export interface CreateDealResponse {
  message: string;
  data: { promo_data: NewDeal; status: string };
}

export async function createDeal(payload: NewDeal): Promise<CreateDealResponse> {
  const res = await fetch(`${BASE}/deals`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  return handle<CreateDealResponse>(res);
}

// POST /vote — registra voto (up/down) em uma promocao.
export async function vote(promo: Deal, voteValue: Vote): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/vote`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ promo, vote: voteValue }),
  });
  return handle<{ message: string }>(res);
}

// POST /subscription — consumidor segue uma categoria.
export async function subscribe(client_name: string, category: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/subscription`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ client_name, category }),
  });
  return handle<{ message: string }>(res);
}

// DELETE /subscription — consumidor cancela interesse; retorna lista atualizada.
export async function unsubscribe(
  client_name: string,
  category: string,
): Promise<SubscriptionResponse> {
  const res = await fetch(`${BASE}/subscription`, {
    method: "DELETE",
    headers: JSON_HEADERS,
    body: JSON.stringify({ client_name, category }),
  });
  return handle<SubscriptionResponse>(res);
}

// GET /subscription/:cliente_name — categorias seguidas pelo cliente.
export async function getSubscriptions(client_name: string): Promise<string[]> {
  const res = await fetch(`${BASE}/subscription/${encodeURIComponent(client_name)}`);
  const data = await handle<SubscriptionResponse>(res);
  return data.categories ?? [];
}
