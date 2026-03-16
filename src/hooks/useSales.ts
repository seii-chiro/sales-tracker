import { useCallback, useEffect, useState } from "react";
import { fetchSalesLog, type SalesLogEntry } from "../lib/salesService";

interface UseSalesResult {
  sales: SalesLogEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSales = (): UseSalesResult => {
  const [sales, setSales] = useState<SalesLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextSales = await fetchSalesLog();
      setSales(nextSales);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Failed to load sales.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { sales, loading, error, refetch };
};
