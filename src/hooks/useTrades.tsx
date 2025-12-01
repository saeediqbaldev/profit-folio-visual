import { useState, useEffect, useCallback, useMemo } from "react";
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
}

export const useTrades = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load trades with optimized query - only select needed fields initially
  const loadTrades = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Optimized query - select only essential fields for initial load
      const { data, error } = await supabase
        .from('trades')
        .select('id, sno, entry, result, asset_pair, rr, strategy, created_at, reason, tp, sl, learning, screenshot_url, after_trade_screenshot_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100); // Limit initial load

      if (error) {
        console.error('Error loading trades:', error);
        toast({
          variant: "destructive",
          title: "Error loading trades",
          description: "Failed to load your trades.",
        });
      } else {
        const transformedTrades = (data || []).map(trade => ({
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
        }));
        setTrades(transformedTrades);
      }
    } catch (error) {
      console.error('Error loading trades:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const updateTrade = useCallback(async (updatedTrade: Trade) => {
    if (!user) return;

    try {
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

      if (error) throw error;

      setTrades(prev => prev.map(trade => 
        trade.id === updatedTrade.id ? updatedTrade : trade
      ));
      
      toast({ title: "Trade updated" });
    } catch (error) {
      console.error('Error updating trade:', error);
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
    const breakeven = trades.filter(t => t.result?.toLowerCase() === 'breakeven').length;
    const total = trades.length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';

    return { wins, losses, breakeven, total, winRate };
  }, [trades]);

  return {
    trades,
    loading,
    stats,
    updateTrade,
    deleteTrade,
    refetch: loadTrades,
  };
};
