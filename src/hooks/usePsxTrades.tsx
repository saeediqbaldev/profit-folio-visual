import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
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

// Cache for PSX trades data
const psxTradesCache: { [userId: string]: { data: PsxTrade[]; timestamp: number } } = {};
const CACHE_DURATION = 60000; // 1 minute cache

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

  // Transform database row to PsxTrade object
  const transformTrade = (trade: any): PsxTrade => ({
    id: trade.id,
    sno: trade.sno,
    strategy: trade.strategy || '',
    stockSymbol: trade.stock_symbol,
    sharesPurchased: trade.shares_purchased,
    entryPrice: parseFloat(trade.entry_price),
    tradeLogic: trade.trade_logic || '',
    tpExitPrice: trade.tp_exit_price ? parseFloat(trade.tp_exit_price) : null,
    profitLoss: trade.profit_loss ? parseFloat(trade.profit_loss) : null,
    result: trade.result || 'pending',
    tradeDate: trade.trade_date || trade.created_at,
    createdAt: trade.created_at,
  });

  // Load trades with progressive loading and fade-in effect
  const loadTrades = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Prevent duplicate calls
    if (loadingRef.current) return;
    loadingRef.current = true;

    // Check cache first
    const cached = psxTradesCache[user.id];
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setTrades(cached.data);
      setTotalCount(cached.data.length);
      setLoadedCount(cached.data.length);
      setLoading(false);
      loadingRef.current = false;
      return;
    }

    setProgress(5);
    setStatus("loading");
    setLoadedCount(0);
    
    try {
      // First get the count
      const { count, error: countError } = await supabase
        .from('psx_trades')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) throw countError;
      
      const totalTrades = count || 0;
      setTotalCount(totalTrades);
      
      // Estimate time: ~100ms per trade for loading
      setEstimatedTime(Math.ceil(totalTrades * 0.1));

      setProgress(15);

      // Load trades in batches for fade-in effect
      const batchSize = 5;
      const allTrades: PsxTrade[] = [];
      
      for (let offset = 0; offset < totalTrades; offset += batchSize) {
        const { data, error } = await supabase
          .from('psx_trades')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(offset, offset + batchSize - 1);

        if (error) throw error;

        const batchTrades = (data || []).map(transformTrade);
        allTrades.push(...batchTrades);
        
        // Update state progressively for fade-in effect
        setTrades([...allTrades]);
        setLoadedCount(allTrades.length);
        setProgress(15 + (85 * allTrades.length / Math.max(totalTrades, 1)));
        
        // Small delay for visual fade-in effect
        if (offset + batchSize < totalTrades) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // If no trades, clear loading state
      if (totalTrades === 0) {
        setTrades([]);
        setLoading(false);
      }
      
      // Update cache
      psxTradesCache[user.id] = { data: allTrades, timestamp: Date.now() };
      
      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error('Error loading PSX trades:', error);
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
  }, [user, toast]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const addTrade = useCallback(async (tradeData: Omit<PsxTrade, 'id' | 'sno' | 'createdAt' | 'profitLoss' | 'result'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('psx_trades')
        .insert({
          user_id: user.id,
          strategy: tradeData.strategy,
          stock_symbol: tradeData.stockSymbol,
          shares_purchased: tradeData.sharesPurchased,
          entry_price: tradeData.entryPrice,
          trade_logic: tradeData.tradeLogic,
          tp_exit_price: tradeData.tpExitPrice,
          trade_date: tradeData.tradeDate,
        })
        .select()
        .single();

      if (error) throw error;

      const newTrade = transformTrade(data);
      setTrades(prev => [newTrade, ...prev]);
      
      // Update cache
      if (psxTradesCache[user.id]) {
        psxTradesCache[user.id].data = [newTrade, ...psxTradesCache[user.id].data];
      }
      
      toast({ title: "Trade added successfully" });
      return newTrade;
    } catch (error) {
      console.error('Error adding PSX trade:', error);
      toast({ variant: "destructive", title: "Error adding trade" });
      throw error;
    }
  }, [user, toast]);

  const updateTrade = useCallback(async (updatedTrade: Partial<PsxTrade> & { id: string }, onProgress?: (p: number, s?: "loading" | "success" | "error") => void) => {
    if (!user) return;

    onProgress?.(10, "loading");
    
    try {
      onProgress?.(40, "loading");
      
      const { error } = await supabase
        .from('psx_trades')
        .update({
          strategy: updatedTrade.strategy,
          stock_symbol: updatedTrade.stockSymbol,
          shares_purchased: updatedTrade.sharesPurchased,
          entry_price: updatedTrade.entryPrice,
          trade_logic: updatedTrade.tradeLogic,
          tp_exit_price: updatedTrade.tpExitPrice,
        })
        .eq('id', updatedTrade.id)
        .eq('user_id', user.id);

      onProgress?.(80, "loading");

      if (error) throw error;

      // Refetch the updated trade to get computed columns
      const { data: refreshedData } = await supabase
        .from('psx_trades')
        .select('*')
        .eq('id', updatedTrade.id)
        .single();

      if (refreshedData) {
        const refreshedTrade = transformTrade(refreshedData);
        setTrades(prev => prev.map(trade => 
          trade.id === updatedTrade.id ? refreshedTrade : trade
        ));
        
        // Update cache
        if (psxTradesCache[user.id]) {
          psxTradesCache[user.id].data = psxTradesCache[user.id].data.map(trade => 
            trade.id === updatedTrade.id ? refreshedTrade : trade
          );
        }
      }
      
      onProgress?.(100, "success");
      toast({ title: "Trade updated successfully" });
    } catch (error) {
      console.error('Error updating PSX trade:', error);
      onProgress?.(100, "error");
      toast({ variant: "destructive", title: "Error updating trade" });
    }
  }, [user, toast]);

  const deleteTrade = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('psx_trades')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTrades(prev => prev.filter(trade => trade.id !== id));
      
      // Update cache
      if (psxTradesCache[user.id]) {
        psxTradesCache[user.id].data = psxTradesCache[user.id].data.filter(trade => trade.id !== id);
      }
      
      toast({ title: "Trade deleted" });
    } catch (error) {
      console.error('Error deleting PSX trade:', error);
      toast({ variant: "destructive", title: "Error deleting trade" });
    }
  }, [user, toast]);

  // Computed stats - memoized for performance
  const stats = useMemo(() => {
    const wins = trades.filter(t => t.result === 'win').length;
    const losses = trades.filter(t => t.result === 'loss').length;
    const breakeven = trades.filter(t => t.result === 'breakeven').length;
    const pending = trades.filter(t => t.result === 'pending').length;
    const total = trades.length;
    const winRate = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0';
    const totalProfitLoss = trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);

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

// Clear cache utility
export const clearPsxTradesCache = (userId?: string) => {
  if (userId) {
    delete psxTradesCache[userId];
  } else {
    Object.keys(psxTradesCache).forEach(key => delete psxTradesCache[key]);
  }
};
