import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
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

// Cache for trades data
const tradesCache: { [userId: string]: { data: Trade[]; timestamp: number } } = {};
const CACHE_DURATION = 60000; // 1 minute cache

export const useTrades = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const { user } = useAuth();
  const { toast } = useToast();
  const loadingRef = useRef(false);

  // Transform database row to Trade object
  const transformTrade = (trade: any): Trade => ({
    id: trade.id,
    sno: trade.sno,
    entry: trade.entry,
    reason: trade.reason || '',
    tp: trade.tp || '',
    sl: trade.sl || '',
    result: trade.result || '',
    learning: trade.learning || '',
    screenshot: trade.screenshot_url,
    afterTradeScreenshot: trade.after_trade_screenshot_url,
    assetPair: trade.asset_pair || '',
    rr: trade.rr || '',
    strategy: trade.strategy || '',
    createdAt: trade.created_at,
    tradeDate: trade.trade_date || trade.created_at,
  });

  // Load trades with caching and progress
  const loadTrades = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Prevent duplicate calls
    if (loadingRef.current) return;
    loadingRef.current = true;

    // Check cache first
    const cached = tradesCache[user.id];
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setTrades(cached.data);
      setLoading(false);
      loadingRef.current = false;
      return;
    }

    setProgress(5);
    setStatus("loading");
    
    try {
      // STEP 1: Load first 5 trades immediately for instant UI
      setProgress(15);
      const { data: initialData, error: initialError } = await supabase
        .from('trades')
        .select('id, sno, entry, result, asset_pair, rr, strategy, created_at, trade_date, reason, tp, sl, learning, screenshot_url, after_trade_screenshot_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (initialError) throw initialError;

      // Show first 5 trades immediately
      const initialTrades = (initialData || []).map(transformTrade);
      setTrades(initialTrades);
      setLoading(false); // Stop loading spinner immediately
      setProgress(50);

      // STEP 2: Load remaining trades in background
      const { data: remainingData, error: remainingError } = await supabase
        .from('trades')
        .select('id, sno, entry, result, asset_pair, rr, strategy, created_at, trade_date, reason, tp, sl, learning, screenshot_url, after_trade_screenshot_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(5, 999);

      setProgress(85);

      if (remainingError) throw remainingError;

      const remainingTrades = (remainingData || []).map(transformTrade);
      const allTrades = [...initialTrades, ...remainingTrades];
      
      // Update cache
      tradesCache[user.id] = { data: allTrades, timestamp: Date.now() };
      setTrades(allTrades);
      
      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error('Error loading trades:', error);
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
  }, [user, toast]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const updateTrade = useCallback(async (updatedTrade: Trade, onProgress?: (p: number, s?: "loading" | "success" | "error") => void) => {
    if (!user) return;

    onProgress?.(10, "loading");
    
    try {
      onProgress?.(40, "loading");
      
      const { error } = await supabase
        .from('trades')
        .update({
          entry: updatedTrade.entry,
          reason: updatedTrade.reason,
          tp: updatedTrade.tp,
          sl: updatedTrade.sl,
          result: updatedTrade.result,
          learning: updatedTrade.learning,
          asset_pair: updatedTrade.assetPair,
          rr: updatedTrade.rr,
          screenshot_url: updatedTrade.screenshot,
          after_trade_screenshot_url: updatedTrade.afterTradeScreenshot,
        })
        .eq('id', updatedTrade.id)
        .eq('user_id', user.id);

      onProgress?.(80, "loading");

      if (error) throw error;

      setTrades(prev => prev.map(trade => 
        trade.id === updatedTrade.id ? updatedTrade : trade
      ));
      
      // Update cache
      if (tradesCache[user.id]) {
        tradesCache[user.id].data = tradesCache[user.id].data.map(trade => 
          trade.id === updatedTrade.id ? updatedTrade : trade
        );
      }
      
      onProgress?.(100, "success");
      toast({ title: "Trade updated successfully" });
    } catch (error) {
      console.error('Error updating trade:', error);
      onProgress?.(100, "error");
      toast({ variant: "destructive", title: "Error updating trade" });
    }
  }, [user, toast]);

  const deleteTrade = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTrades(prev => prev.filter(trade => trade.id !== id));
      
      // Update cache
      if (tradesCache[user.id]) {
        tradesCache[user.id].data = tradesCache[user.id].data.filter(trade => trade.id !== id);
      }
      
      toast({ title: "Trade deleted" });
    } catch (error) {
      console.error('Error deleting trade:', error);
      toast({ variant: "destructive", title: "Error deleting trade" });
    }
  }, [user, toast]);

  // Computed stats - memoized for performance
  const stats = useMemo(() => {
    const wins = trades.filter(t => t.result?.toLowerCase() === 'win').length;
    const losses = trades.filter(t => t.result?.toLowerCase() === 'loss').length;
    const breakeven = trades.filter(t => t.result?.toLowerCase() === 'breakeven' || t.result?.toLowerCase() === 'be').length;
    const total = trades.length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';

    return { wins, losses, breakeven, total, winRate };
  }, [trades]);

  return {
    trades,
    loading,
    progress,
    status,
    stats,
    updateTrade,
    deleteTrade,
    refetch: () => loadTrades(true),
  };
};

// Clear cache utility
export const clearTradesCache = (userId?: string) => {
  if (userId) {
    delete tradesCache[userId];
  } else {
    Object.keys(tradesCache).forEach(key => delete tradesCache[key]);
  }
};