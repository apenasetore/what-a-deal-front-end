import { useEffect, useRef } from "react";
import type { SSENotification } from "../types";

export type { SSENotification } from "../types";

export function useSSE(
  clientName: string,
  onNotification: (n: SSENotification) => void,
  enabled = true,
): void {
    
  const callbackRef = useRef(onNotification);
  callbackRef.current = onNotification;

  useEffect(() => {
    if (!enabled || !clientName) return;

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
