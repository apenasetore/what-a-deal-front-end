import type { Deal, NewDeal, SubscriptionResponse, Vote, Store, CreateStoreResponse } from "../types";
import { generateStoreKeys, getSignature} from "./crypto";

const BASE = "/api";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

export async function listDeals(): Promise<Deal[]> {
  const res = await fetch(`${BASE}/deals`);
  return handle<Deal[]>(res);
}

export interface CreateDealResponse {
  message: string;
  data: { promo_data: NewDeal; status: string };
}


export async function createStore(payload: Store): Promise<CreateStoreResponse> {
  payload.pub_key = await generateStoreKeys(payload.nome);

  const res = await fetch(`${BASE}/store`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  return handle<CreateStoreResponse>(res);
}

export async function createDeal(payload: NewDeal): Promise<CreateDealResponse> {
  const sign = await getSignature(payload);
  const signedPayload = { ...payload, signature: sign };
  
  const res = await fetch(`${BASE}/deals`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(signedPayload),
  });
  return handle<CreateDealResponse>(res);
}

export async function vote(promo: Deal, voteValue: Vote): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/vote`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ promo, vote: voteValue }),
  });
  return handle<{ message: string }>(res);
}

export async function subscribe(client_name: string, category: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/subscription`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ client_name, category }),
  });
  return handle<{ message: string }>(res);
}

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

export async function getSubscriptions(client_name: string): Promise<string[]> {
  const res = await fetch(`${BASE}/subscription/${encodeURIComponent(client_name)}`);
  const data = await handle<SubscriptionResponse>(res);
  return data.categories ?? [];
}
