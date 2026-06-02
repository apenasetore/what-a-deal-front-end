import { useEffect, useRef } from "react";
import type { SSENotification } from "../types";

export type { SSENotification } from "../types";

// Conecta no endpoint SSE do Gateway (GET /notifications/:client_name) via
// proxy do Vite (/api/notifications/...). O Gateway mantem a conexao aberta e
// envia um evento `data: <json>` por notificacao das categorias que o cliente
// segue (ver ../what-a-deal/apps/gateway/lib/gateway/sse_handler.ex).
//
// Comentarios de keepalive (linhas iniciadas por ":") nao disparam onmessage,
// entao nao chegam aqui — somente os eventos de dados reais.
export function useSSE(
  clientName: string,
  onNotification: (n: SSENotification) => void,
  enabled = true,
): void {
  // Mantem o callback num ref para nao reabrir a conexao a cada render
  // (a dependencia do effect fica so em clientName/enabled).
  const callbackRef = useRef(onNotification);
  callbackRef.current = onNotification;

  useEffect(() => {
    if (!enabled || !clientName) return;

    const url = `/api/notifications/${encodeURIComponent(clientName)}`;
    const source = new EventSource(url);

    source.onmessage = (event) => {
      try {
        callbackRef.current(JSON.parse(event.data) as SSENotification);
      } catch {
        /* ignora payloads malformados */
      }
    };

    source.onerror = () => {
      // EventSource reconecta automaticamente; nada a fazer aqui.
    };

    return () => source.close();
  }, [clientName, enabled]);
}
