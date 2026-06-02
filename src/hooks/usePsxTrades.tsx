import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface PsxTrade {
  id: string;
  sno?: number;
  strategy: string;
  stockSymbol: string;
  sharesPurchased: number;
  entryPrice: number;
  tradeLogic: string;
  tpExitPrice: number | null;
  profitLoss: number | null;
  result: string;
  tradeDate: string;
  createdAt: string;
}

let cacheRef: { data: PsxTrade[]; timestamp: number } | null = null;
const CACHE_DURATION = 60000;

const transformTrade = (trade: any): PsxTrade => ({
  id: trade.id,
  sno: trade.sno,
  strategy: trade.strategy || "",
  stockSymbol: trade.stock_symbol,
  sharesPurchased: Number(trade.shares_purchased),
  entryPrice: parseFloat(trade.entry_price),
  tradeLogic: trade.trade_logic || "",
  tpExitPrice: trade.tp_exit_price != null ? parseFloat(trade.tp_exit_price) : null,
  profitLoss: trade.profit_loss != null ? parseFloat(trade.profit_loss) : null,
  result: trade.result || "pending",
  tradeDate: trade.trade_date || trade.created_at,
  createdAt: trade.created_at,
});

export const usePsxTrades = () => {
  const [trades, setTrades] = useState<PsxTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const loadingRef = useRef(false);

  const loadTrades = useCallback(
    async (forceRefresh = false) => {
      if (!user) {
        setLoading(false);
        return;
      }
      if (loadingRef.current) return;
      loadingRef.current = true;

      if (!forceRefresh && cacheRef && Date.now() - cacheRef.timestamp < CACHE_DURATION) {
        setTrades(cacheRef.data);
        setTotalCount(cacheRef.data.length);
        setLoadedCount(cacheRef.data.length);
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      setProgress(5);
      setStatus("loading");
      setLoadedCount(0);

      try {
        const data = await api.get<any[]>("/api/psx-trades");
        const allTrades = (data || []).map(transformTrade);
        const total = allTrades.length;
        setTotalCount(total);
        setEstimatedTime(Math.ceil(total * 0.1));
        setProgress(15);

        const batchSize = 5;
        const accumulated: PsxTrade[] = [];
        for (let i = 0; i < total; i += batchSize) {
          accumulated.push(...allTrades.slice(i, i + batchSize));
          setTrades([...accumulated]);
          setLoadedCount(accumulated.length);
          setProgress(15 + (85 * accumulated.length) / Math.max(total, 1));
          if (i + batchSize < total) {
            await new Promise((r) => setTimeout(r, 50));
          }
        }

        if (total === 0) setTrades([]);
        cacheRef = { data: allTrades, timestamp: Date.now() };
        setProgress(100);
        setStatus("success");
      } catch (error) {
        console.error("Error loading PSX trades:", error);
        setStatus("error");
        toast({
          variant: "destructive",
          title: "Error loading trades",
          description: "Failed to load your PSX trades.",
        });
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setTimeout(() => {
          setProgress(0);
          setEstimatedTime(null);
        }, 1500);
      }
    },
    [user, toast]
  );

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const addTrade = useCallback(
    async (
      tradeData: Omit<PsxTrade, "id" | "sno" | "createdAt" | "profitLoss" | "result">
    ) => {
      if (!user) return;
      try {
        const data = await api.post<any>("/api/psx-trades", {
          strategy: tradeData.strategy,
          stock_symbol: tradeData.stockSymbol,
          shares_purchased: tradeData.sharesPurchased,
          entry_price: tradeData.entryPrice,
          trade_logic: tradeData.tradeLogic,
          tp_exit_price: tradeData.tpExitPrice,
          trade_date: tradeData.tradeDate,
        });
        const newTrade = transformTrade(data);
        setTrades((prev) => [newTrade, ...prev]);
        if (cacheRef) cacheRef.data = [newTrade, ...cacheRef.data];
        toast({ title: "Trade added successfully" });
        return newTrade;
      } catch (error) {
        console.error("Error adding PSX trade:", error);
        toast({ variant: "destructive", title: "Error adding trade" });
        throw error;
      }
    },
    [user, toast]
  );

  const updateTrade = useCallback(
    async (
      updatedTrade: Partial<PsxTrade> & { id: string },
      onProgress?: (p: number, s?: "loading" | "success" | "error") => void
    ) => {
      if (!user) return;
      onProgress?.(10, "loading");
      try {
        onProgress?.(40, "loading");
        const data = await api.put<any>(`/api/psx-trades/${updatedTrade.id}`, {
          strategy: updatedTrade.strategy,
          stock_symbol: updatedTrade.stockSymbol,
          shares_purchased: updatedTrade.sharesPurchased,
          entry_price: updatedTrade.entryPrice,
          trade_logic: updatedTrade.tradeLogic,
          tp_exit_price: updatedTrade.tpExitPrice,
        });
        onProgress?.(80, "loading");
        const refreshed = transformTrade(data);
        setTrades((prev) =>
          prev.map((t) => (t.id === refreshed.id ? refreshed : t))
        );
        if (cacheRef) {
          cacheRef.data = cacheRef.data.map((t) =>
            t.id === refreshed.id ? refreshed : t
          );
        }
        onProgress?.(100, "success");
        toast({ title: "Trade updated successfully" });
      } catch (error) {
        console.error("Error updating PSX trade:", error);
        onProgress?.(100, "error");
        toast({ variant: "destructive", title: "Error updating trade" });
      }
    },
    [user, toast]
  );

  const deleteTrade = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        await api.del(`/api/psx-trades/${id}`);
        setTrades((prev) => prev.filter((t) => t.id !== id));
        if (cacheRef) cacheRef.data = cacheRef.data.filter((t) => t.id !== id);
        toast({ title: "Trade deleted" });
      } catch (error) {
        console.error("Error deleting PSX trade:", error);
        toast({ variant: "destructive", title: "Error deleting trade" });
      }
    },
    [user, toast]
  );

  const stats = useMemo(() => {
    const wins = trades.filter((t) => t.result === "win").length;
    const losses = trades.filter((t) => t.result === "loss").length;
    const breakeven = trades.filter((t) => t.result === "breakeven").length;
    const pending = trades.filter((t) => t.result === "pending").length;
    const total = trades.length;
    const winRate =
      wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "0";
    const totalProfitLoss = trades.reduce((s, t) => s + (t.profitLoss || 0), 0);
    return { wins, losses, breakeven, pending, total, winRate, totalProfitLoss };
  }, [trades]);

  return {
    trades,
    loading,
    progress,
    status,
    stats,
    loadedCount,
    totalCount,
    estimatedTime,
    addTrade,
    updateTrade,
    deleteTrade,
    refetch: () => loadTrades(true),
  };
};

export const clearPsxTradesCache = () => {
  cacheRef = null;
};
