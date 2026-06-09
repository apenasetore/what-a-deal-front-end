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

export type NewDeal = Omit<Deal, "id">;

export type Vote = "up" | "down";


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
