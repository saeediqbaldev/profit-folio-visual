import { useState, useEffect } from "react";
import StatsCards from "@/components/dashboard/StatsCards";
import TradeChart from "@/components/dashboard/TradeChart";
import TradesList from "@/components/dashboard/TradesList";
import AdvancedCharts from "@/components/dashboard/AdvancedCharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  assetPair: string;
  createdAt: string;
}

const DashboardPage = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load trades from Supabase on component mount
  useEffect(() => {
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
          toast({
            variant: "destructive",
            title: "Error loading trades",
            description: "Failed to load your trades from the database.",
          });
        } else {
          // Transform Supabase data to match frontend interface
          const transformedTrades = data.map(trade => ({
            id: trade.id,
            sno: trade.sno,
            entry: trade.entry,
            reason: trade.reason || '',
            tp: trade.tp || '',
            sl: trade.sl || '',
            result: trade.result || '',
            learning: trade.learning || '',
            screenshot: trade.screenshot_url,
            assetPair: trade.asset_pair || '',
            createdAt: trade.created_at,
          }));
          setTrades(transformedTrades);
        }
      } catch (error) {
        console.error('Error loading trades:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred while loading trades.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTrades();
  }, [user, toast]);

  const handleUpdateTrade = async (updatedTrade: Trade) => {
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
          screenshot_url: updatedTrade.screenshot,
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
  };

  const handleDeleteTrade = async (id: string) => {
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading your trades...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Analyze your trading performance and statistics
          </p>
        </div>

        <StatsCards trades={trades} />
        <AdvancedCharts trades={trades} />
        <TradeChart trades={trades} />
        <TradesList 
          trades={trades} 
          onUpdateTrade={handleUpdateTrade}
          onDeleteTrade={handleDeleteTrade}
        />
      </div>
    </div>
  );
};

export default DashboardPage;