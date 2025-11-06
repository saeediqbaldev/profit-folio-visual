import { useState, useEffect, useCallback, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TradesList from "@/components/dashboard/TradesList";
import StatsCards from "@/components/dashboard/StatsCards";
import AdvancedCharts from "@/components/dashboard/AdvancedCharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import CandleLoader from "@/components/ui/candle-loader";

interface Trade {
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

interface DashboardPageProps {
  onViewTrade: (tradeId: string) => void;
}

const DashboardPage = ({ onViewTrade }: DashboardPageProps) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");
  const { user } = useAuth();
  const { toast } = useToast();

  // Get unique strategies from trades
  const strategies = useMemo(() => {
    const uniqueStrategies = new Set(trades.map(t => t.strategy).filter(Boolean));
    return ['all', ...Array.from(uniqueStrategies)] as string[];
  }, [trades]);

  // Filter trades by selected strategy
  const filteredTrades = useMemo(() => {
    if (selectedStrategy === 'all') return trades;
    return trades.filter(t => t.strategy === selectedStrategy);
  }, [trades, selectedStrategy]);

  // Load trades from Supabase on component mount
  useEffect(() => {
    let isMounted = true;
    
    const loadTrades = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading trades:', error);
          if (isMounted) {
            toast({
              variant: "destructive",
              title: "Error loading trades",
              description: "Failed to load your trades from the database.",
            });
          }
        } else if (isMounted) {
          // Transform Supabase data to match frontend interface
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
        if (isMounted) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "An unexpected error occurred while loading trades.",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTrades();
    
    return () => {
      isMounted = false;
    };
  }, [user, toast]);

  const handleUpdateTrade = useCallback(async (updatedTrade: Trade) => {
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

      if (error) {
        console.error('Error updating trade:', error);
        toast({
          variant: "destructive",
          title: "Error updating trade",
          description: "Failed to update the trade in the database.",
        });
      } else {
        setTrades(prev => prev.map(trade => 
          trade.id === updatedTrade.id ? updatedTrade : trade
        ));
        toast({
          title: "Trade updated",
          description: "The trade has been successfully updated.",
        });
      }
    } catch (error) {
      console.error('Error updating trade:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while updating the trade.",
      });
    }
  }, [user, toast]);

  const handleDeleteTrade = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting trade:', error);
        toast({
          variant: "destructive",
          title: "Error deleting trade",
          description: "Failed to delete the trade from the database.",
        });
      } else {
        setTrades(prev => prev.filter(trade => trade.id !== id));
        toast({
          title: "Trade deleted",
          description: "The trade has been successfully removed.",
        });
      }
    } catch (error) {
      console.error('Error deleting trade:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while deleting the trade.",
      });
    }
  }, [user, toast]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CandleLoader />
          <span className="text-muted-foreground">Loading your trades...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Trading History
            </h1>
            <p className="text-muted-foreground mt-2">
              View and analyze all your trading records
            </p>
          </div>
        </div>

        <StatsCards trades={trades} />
        
        <AdvancedCharts trades={trades} />

        <TradesList 
          trades={filteredTrades}
          strategies={strategies}
          selectedStrategy={selectedStrategy}
          onStrategyChange={setSelectedStrategy}
          onUpdateTrade={handleUpdateTrade}
          onDeleteTrade={handleDeleteTrade}
          onViewTrade={onViewTrade}
        />
      </div>
    </div>
  );
};

export default DashboardPage;