// Espelha os dados trafegados pela API REST do Gateway
// (../what-a-deal/apps/gateway/lib/gateway/rest_api_deals.ex e store_deals.ex).

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

// Payload aceito por POST /deals (o backend gera o id ao publicar).
export type NewDeal = Omit<Deal, "id">;

export type Vote = "up" | "down";

// Resposta de GET /subscription/:cliente_name e de DELETE /subscription.
// O backend pode devolver categories: null quando o cliente nao existe.
export interface SubscriptionResponse {
  client_name: string;
  categories: string[] | null;
}

export type Role = "consumer" | "store";
