import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface Trade {
  id: string;
  sno?: number;
  entry: string;
  reason: string;
  tp: string;
  sl: string;
  result: string;
  learning: string;
  screenshot: string | null;
  afterTradeScreenshot: string | null;
  assetPair: string;
  rr: string;
  strategy?: string;
  createdAt: string;
  tradeDate?: string;
}

const tradesCache: { data: Trade[]; timestamp: number } | null = null;
let cacheRef: { data: Trade[]; timestamp: number } | null = tradesCache;
const CACHE_DURATION = 60000;

const transformTrade = (trade: any): Trade => ({
  id: trade.id,
  sno: trade.sno,
  entry: trade.entry,
  reason: trade.reason || "",
  tp: trade.tp || "",
  sl: trade.sl || "",
  result: trade.result || "",
  learning: trade.learning || "",
  screenshot: trade.screenshot_url,
  afterTradeScreenshot: trade.after_trade_screenshot_url,
  assetPair: trade.asset_pair || "",
  rr: trade.rr || "",
  strategy: trade.strategy || "",
  createdAt: trade.created_at,
  tradeDate: trade.trade_date || trade.created_at,
});

export const useTrades = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [totalCount, setTotalCount] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
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
      setTrades([]);

      try {
        const data = await api.get<any[]>("/api/trades");
        const allTrades = (data || []).map(transformTrade);
        const total = allTrades.length;
        setTotalCount(total);
        setLoadedCount(0);
        setProgress(50);
        setLoading(false);

        if (total === 0) {
          cacheRef = { data: [], timestamp: Date.now() };
          setProgress(100);
          setStatus("success");
          loadingRef.current = false;
          return;
        }

        const batchSize = 10;
        let currentBatch = 0;
        const renderBatch = () => {
          const start = currentBatch * batchSize;
          const end = Math.min(start + batchSize, allTrades.length);
          const batch = allTrades.slice(0, end);
          setTrades(batch);
          setLoadedCount(end);
          setProgress(Math.min(50 + (end / allTrades.length) * 50, 99));
          currentBatch++;
          if (end < allTrades.length) {
            requestAnimationFrame(renderBatch);
          } else {
            cacheRef = { data: allTrades, timestamp: Date.now() };
            setProgress(100);
            setStatus("success");
          }
        };
        requestAnimationFrame(renderBatch);
      } catch (error) {
        console.error("Error loading trades:", error);
        setStatus("error");
        toast({
          variant: "destructive",
          title: "Error loading trades",
          description: "Failed to load your trades.",
        });
      } finally {
        loadingRef.current = false;
        setTimeout(() => setProgress(0), 1500);
      }
    },
    [user, toast]
  );

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const updateTrade = useCallback(
    async (
      updatedTrade: Trade,
      onProgress?: (p: number, s?: "loading" | "success" | "error") => void
    ) => {
      if (!user) return;
      onProgress?.(10, "loading");
      try {
        onProgress?.(40, "loading");
        await api.put(`/api/trades/${updatedTrade.id}`, {
          entry: updatedTrade.entry,
          reason: updatedTrade.reason,
          tp: updatedTrade.tp,
          sl: updatedTrade.sl,
          result: updatedTrade.result,
          learning: updatedTrade.learning,
          asset_pair: updatedTrade.assetPair,
          rr: updatedTrade.rr,
          strategy: updatedTrade.strategy,
          screenshot_url: updatedTrade.screenshot,
          after_trade_screenshot_url: updatedTrade.afterTradeScreenshot,
        });
        onProgress?.(80, "loading");
        setTrades((prev) =>
          prev.map((t) => (t.id === updatedTrade.id ? updatedTrade : t))
        );
        if (cacheRef) {
          cacheRef.data = cacheRef.data.map((t) =>
            t.id === updatedTrade.id ? updatedTrade : t
          );
        }
        onProgress?.(100, "success");
        toast({ title: "Trade updated successfully" });
      } catch (error) {
        console.error("Error updating trade:", error);
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
        await api.del(`/api/trades/${id}`);
        setTrades((prev) => prev.filter((t) => t.id !== id));
        if (cacheRef) {
          cacheRef.data = cacheRef.data.filter((t) => t.id !== id);
        }
        toast({ title: "Trade deleted" });
      } catch (error) {
        console.error("Error deleting trade:", error);
        toast({ variant: "destructive", title: "Error deleting trade" });
      }
    },
    [user, toast]
  );

  const stats = useMemo(() => {
    const wins = trades.filter((t) => t.result?.toLowerCase() === "win").length;
    const losses = trades.filter((t) => t.result?.toLowerCase() === "loss").length;
    const breakeven = trades.filter(
      (t) => t.result?.toLowerCase() === "breakeven" || t.result?.toLowerCase() === "be"
    ).length;
    const total = trades.length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0";
    return { wins, losses, breakeven, total, winRate };
  }, [trades]);

  return {
    trades,
    loading,
    progress,
    status,
    stats,
    totalCount,
    loadedCount,
    updateTrade,
    deleteTrade,
    refetch: () => loadTrades(true),
  };
};

export const clearTradesCache = () => {
  cacheRef = null;
};
