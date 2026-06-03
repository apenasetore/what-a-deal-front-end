import { useEffect, useRef } from "react";
import type { SSENotification } from "../types";

export type { SSENotification } from "../types";

// Conecta no endpoint SSE do Gateway (GET /stream/:client_name) via proxy do
// Vite (/api/stream/...). O Gateway mantem a conexao aberta e envia um evento
// `data: <json>` por notificacao das categorias que o cliente segue
// (ver ../what-a-deal/apps/gateway/lib/gateway/sse_module.ex — Gateway.SSE).
//
// As notificacoes sao enviadas SEM nome de evento, entao chegam em onmessage.
// O evento inicial `ready` (nomeado) e ignorado de proposito, e comentarios de
// keepalive (linhas iniciadas por ":") tambem nao disparam onmessage.
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

    // Conecta DIRETO no gateway (porta 4000), sem passar pelo proxy do Vite:
    // o proxy de dev costuma derrubar conexoes SSE de longa duracao. O gateway
    // libera CORS na resposta do /stream. Os demais endpoints REST continuam
    // pelo proxy /api (requests curtos, sem problema).
    const url = `http://${window.location.hostname}:4000/stream/${encodeURIComponent(clientName)}`;
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
