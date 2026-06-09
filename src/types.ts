export interface Deal {
  id: string;
  nome: string;
  descricao: string;
  preco_original: number;
  preco_promocional: number;
  categoria: string;
  loja: string;
  email: string;
}

export interface Store {
  nome: string;
  pub_key: string;
}

export type NewDeal = Omit<Deal, "id">;

export type Vote = "up" | "down";


export interface CreateStoreResponse {
  message: string;
  data: { promo_data: Store; status: string };
}


export interface SubscriptionResponse {
  client_name: string;
  categories: string[] | null;
}

export type Role = "consumer" | "store";


export interface SSENotification {
  tipo: "nova" | "hot deal" | string;
  categoria: string;
  promo_id: string;
  source: string;
  timestamp: string;
  promo: Deal;
}
