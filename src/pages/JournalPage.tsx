import { useState, useEffect } from "react";
import TradeForm from "@/components/journal/TradeForm";
import TradeList from "@/components/journal/TradeList";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Trade {
  id: string;
  sno: string;
  entry: string;
  reason: string;
  tp: string;
  sl: string;
  result: string;
  learning: string;
  screenshot: string | null;
  tradeResult: string;
  createdAt: string;
}

const JournalPage = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load trades from Supabase on component mount
  useEffect(() => {
    const loadTrades = async () => {
      if (!user) return;
      
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
            sno: '', // Not used in current implementation
            entry: trade.entry,
            reason: trade.reason || '',
            tp: trade.tp || '',
            sl: trade.sl || '',
            result: trade.result || '',
            learning: trade.learning || '',
            screenshot: null, // Not implemented yet
            tradeResult: '', // Not used in current implementation
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

  const handleAddTrade = async (tradeData: Omit<Trade, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('trades')
        .insert({
          user_id: user.id,
          entry: tradeData.entry,
          reason: tradeData.reason,
          tp: tradeData.tp,
          sl: tradeData.sl,
          result: tradeData.result,
          learning: tradeData.learning,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding trade:', error);
        toast({
          variant: "destructive",
          title: "Error adding trade",
          description: "Failed to save the trade to the database.",
        });
      } else {
        // Transform and add to local state
        const newTrade: Trade = {
          id: data.id,
          sno: '',
          entry: data.entry,
          reason: data.reason || '',
          tp: data.tp || '',
          sl: data.sl || '',
          result: data.result || '',
          learning: data.learning || '',
          screenshot: null,
          tradeResult: '',
          createdAt: data.created_at,
        };
        setTrades(prev => [newTrade, ...prev]);
        toast({
          title: "Trade added",
          description: "Your trade has been successfully saved.",
        });
      }
    } catch (error) {
      console.error('Error adding trade:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while saving the trade.",
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
            Trading Journal
          </h1>
          <p className="text-muted-foreground mt-2">
            Record and analyze your trading decisions
          </p>
        </div>

        <TradeForm onAddTrade={handleAddTrade} />
        <TradeList trades={trades} onDeleteTrade={handleDeleteTrade} />
      </div>
    </div>
  );
};

export default JournalPage;