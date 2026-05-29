import { useEffect } from "react";

// STUB preparado para a fase de SSE.
//
// O Gateway ainda NAO expoe um endpoint SSE (o router so tem rotas REST).
// Quando o backend disponibilizar algo como `GET /events?client=<nome>`,
// basta remover o early-return abaixo para o EventSource conectar via proxy
// (/api/events). As notificacoes (hot deals e promocoes de categorias seguidas)
// chegariam por aqui e seriam exibidas automaticamente, sem refresh manual.
export interface SSENotification {
  tipo: string;
  promo?: unknown;
  [key: string]: unknown;
}

export function useSSE(
  clientName: string,
  onNotification: (n: SSENotification) => void,
  enabled = false, // desativado ate o endpoint SSE existir no Gateway
): void {
  useEffect(() => {
    if (!enabled || !clientName) return;

    const url = `/api/events?client=${encodeURIComponent(clientName)}`;
    const source = new EventSource(url);

    source.onmessage = (event) => {
      try {
        onNotification(JSON.parse(event.data) as SSENotification);
      } catch {
        /* ignora payloads malformados */
      }
    };

    source.onerror = () => {
      // EventSource reconecta automaticamente; nada a fazer aqui por ora.
    };

    return () => source.close();
  }, [clientName, enabled, onNotification]);
}
