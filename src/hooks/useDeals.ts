import { useCallback, useEffect, useState } from "react";
import { listDeals } from "../api/client";
import type { Deal } from "../types";

interface UseDeals {
  deals: Deal[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// Carrega a lista de promocoes de GET /deals. Como o SSE ainda nao esta
// disponivel, a atualizacao e manual (botao) ou por polling leve opcional.
export function useDeals(pollMs?: number): UseDeals {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    listDeals()
      .then((d) => {
        setDeals(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    if (!pollMs) return;
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  return { deals, loading, error, refresh };
}
