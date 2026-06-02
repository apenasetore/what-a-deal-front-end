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

// Notificacao recebida via SSE em GET /notifications/:client_name.
// Formato montado pelo MS Notificacao
// (../what-a-deal/apps/notificacao/lib/notificacao/consumer.ex):
//   - tipo "nova"     -> nova promocao publicada na categoria
//   - tipo "hot deal" -> promocao em destaque (ranking)
export interface SSENotification {
  tipo: "nova" | "hot deal" | string;
  categoria: string;
  promo_id: string;
  source: string;
  timestamp: string;
  promo: Deal;
}
