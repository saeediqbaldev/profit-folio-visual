import { useState, useEffect, useCallback, useMemo } from "react";
import TradesList from "@/components/dashboard/TradesList";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/utils/exportData";
import CandleLoader from "@/components/ui/candle-loader";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from "date-fns";

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
  createdAt: string;
}

interface DashboardPageProps {
  onViewTrade: (tradeId: string) => void;
}

const DashboardPage = ({ onViewTrade }: DashboardPageProps) => {
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
          console.log('Loaded trades from database:', data?.length || 0, 'trades');
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
            afterTradeScreenshot: trade.after_trade_screenshot_url,
            assetPair: trade.asset_pair || '',
            rr: trade.rr || '',
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

  const chartData = useMemo(() => {
    const dailyStats: { [key: string]: { total: number; wins: number; losses: number; breakeven: number } } = {};
    
    trades.forEach(trade => {
      const date = format(parseISO(trade.createdAt), 'MMM dd');
      if (!dailyStats[date]) {
        dailyStats[date] = { total: 0, wins: 0, losses: 0, breakeven: 0 };
      }
      dailyStats[date].total++;
      
      if (trade.result === 'WIN') dailyStats[date].wins++;
      else if (trade.result === 'LOSS') dailyStats[date].losses++;
      else if (trade.result === 'BE') dailyStats[date].breakeven++;
    });
    
    return Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        ...stats
      }))
      .slice(-30);
  }, [trades]);

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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportToCSV(trades)}
              disabled={trades.length === 0}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => exportToPDF(trades)}
              disabled={trades.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle>Trading Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} name="Total Trades" />
                <Line type="monotone" dataKey="wins" stroke="hsl(var(--success))" strokeWidth={2} name="Wins" />
                <Line type="monotone" dataKey="losses" stroke="hsl(var(--danger))" strokeWidth={2} name="Losses" />
                <Line type="monotone" dataKey="breakeven" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Breakeven" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <TradesList 
          trades={trades} 
          onUpdateTrade={handleUpdateTrade}
          onDeleteTrade={handleDeleteTrade}
          onViewTrade={onViewTrade}
        />
      </div>
    </div>
  );
};

export default DashboardPage;