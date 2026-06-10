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
  session?: string;
  strategy?: string;
  createdAt: string;
  tradeDate?: string;
}

let cacheRef: { data: Trade[]; timestamp: number } | null = null;
const CACHE_DURATION = 60000;
const TRADES_EVENT = "trades-updated";

const broadcast = () => {
  try { window.dispatchEvent(new CustomEvent(TRADES_EVENT)); } catch { /* noop */ }
};

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
  session: trade.session || "",
  strategy: trade.strategy || "",
  createdAt: trade.created_at,
  tradeDate: trade.trade_date || trade.created_at,
});

export const useTrades = () => {
  const [trades, setTrades] = useState<Trade[]>(cacheRef?.data || []);
  const [loading, setLoading] = useState(!cacheRef);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
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
        setLoading(false);
        setStatus("success");
        loadingRef.current = false;
        return;
      }

      setStatus("loading");
      try {
        const data = await api.get<any[]>("/api/trades");
        const allTrades = (data || []).map(transformTrade);
        cacheRef = { data: allTrades, timestamp: Date.now() };
        setTrades(allTrades);
        setStatus("success");
      } catch (error) {
        console.error("Error loading trades:", error);
        setStatus("error");
        toast({ variant: "destructive", title: "Error loading trades" });
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [user, toast]
  );

  useEffect(() => { loadTrades(); }, [loadTrades]);

  // Listen for global trade updates from other components
  useEffect(() => {
    const handler = () => {
      if (cacheRef) setTrades(cacheRef.data);
    };
    window.addEventListener(TRADES_EVENT, handler);
    return () => window.removeEventListener(TRADES_EVENT, handler);
  }, []);

  const addTrade = useCallback(async (payload: any) => {
    const res: any = await api.post("/api/trades", payload);
    const t = transformTrade(res);
    const next = [t, ...(cacheRef?.data || [])];
    cacheRef = { data: next, timestamp: Date.now() };
    setTrades(next);
    broadcast();
    toast({ title: "Trade added" });
    return t;
  }, [toast]);

  const updateTrade = useCallback(async (updatedTrade: Trade) => {
    if (!user) return;
    try {
      await api.put(`/api/trades/${updatedTrade.id}`, {
        entry: updatedTrade.entry,
        reason: updatedTrade.reason,
        tp: updatedTrade.tp,
        sl: updatedTrade.sl,
        result: updatedTrade.result,
        learning: updatedTrade.learning,
        asset_pair: updatedTrade.assetPair,
        rr: updatedTrade.rr,
        session: updatedTrade.session || null,
        strategy: updatedTrade.strategy,
        screenshot_url: updatedTrade.screenshot,
        after_trade_screenshot_url: updatedTrade.afterTradeScreenshot,
      });
      const next = (cacheRef?.data || []).map((t) => (t.id === updatedTrade.id ? updatedTrade : t));
      cacheRef = { data: next, timestamp: Date.now() };
      setTrades(next);
      broadcast();
      toast({ title: "Trade updated" });
    } catch (error) {
      console.error("Error updating trade:", error);
      toast({ variant: "destructive", title: "Error updating trade" });
    }
  }, [user, toast]);

  const deleteTrade = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await api.del(`/api/trades/${id}`);
      const next = (cacheRef?.data || []).filter((t) => t.id !== id);
      cacheRef = { data: next, timestamp: Date.now() };
      setTrades(next);
      broadcast();
      toast({ title: "Trade deleted" });
    } catch (error) {
      console.error("Error deleting trade:", error);
      toast({ variant: "destructive", title: "Error deleting trade" });
    }
  }, [user, toast]);

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
    progress: 0,
    status,
    stats,
    totalCount: trades.length,
    loadedCount: trades.length,
    addTrade,
    updateTrade,
    deleteTrade,
    refetch: () => loadTrades(true),
  };
};

export const clearTradesCache = () => { cacheRef = null; broadcast(); };
