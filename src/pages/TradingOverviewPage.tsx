import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import CandleLoader from "@/components/ui/candle-loader";
import CustomCalendar from "@/components/dashboard/CustomCalendar";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface Trade {
  id: string;
  result: string;
  created_at: string;
  strategy?: string | null;
}

const TradingOverviewPage = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadTrades = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('trades')
          .select('id, result, created_at, strategy')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setTrades(data || []);
      } catch (error) {
        console.error('Error loading trades:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load trades data.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTrades();
  }, [user, toast]);

  const strategies = useMemo(() => {
    const uniqueStrategies = new Set(trades.map(t => t.strategy).filter(Boolean));
    return ['all', ...Array.from(uniqueStrategies)] as string[];
  }, [trades]);

  const filteredTrades = useMemo(() => {
    if (selectedStrategy === 'all') return trades;
    return trades.filter(t => t.strategy === selectedStrategy);
  }, [trades, selectedStrategy]);

  const strategyStats = useMemo(() => {
    const stats = { total: 0, wins: 0, losses: 0, breakeven: 0 };
    filteredTrades.forEach(trade => {
      stats.total++;
      const result = trade.result.toLowerCase();
      if (result.includes('win') || result.includes('profit')) stats.wins++;
      else if (result.includes('loss') || result.includes('lose')) stats.losses++;
      else stats.breakeven++;
    });
    return stats;
  }, [filteredTrades]);

  const strategyChartData = useMemo(() => [
    { name: 'Wins', value: strategyStats.wins, color: 'hsl(var(--success))' },
    { name: 'Losses', value: strategyStats.losses, color: 'hsl(var(--danger))' },
    { name: 'Breakeven', value: strategyStats.breakeven, color: 'hsl(var(--muted-foreground))' },
  ].filter(item => item.value > 0), [strategyStats]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CandleLoader />
          <span className="text-muted-foreground">Loading overview...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="w-full p-4 md:p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Calendar Overview
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Track your trading performance with visual calendar view
          </p>
        </div>

        {/* Strategy Filter Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle>Strategy Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map(strategy => (
                    <SelectItem key={strategy} value={strategy}>
                      {strategy === 'all' ? 'All Strategies' : strategy}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-6 space-y-3">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Trades</div>
                  <div className="text-2xl font-bold">{strategyStats.total}</div>
                </div>
                <div className="bg-success/10 p-3 rounded-lg">
                  <div className="text-sm text-success">Wins</div>
                  <div className="text-2xl font-bold text-success">{strategyStats.wins}</div>
                </div>
                <div className="bg-danger/10 p-3 rounded-lg">
                  <div className="text-sm text-danger">Losses</div>
                  <div className="text-2xl font-bold text-danger">{strategyStats.losses}</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                  <div className="text-2xl font-bold">
                    {strategyStats.total > 0 ? ((strategyStats.wins / strategyStats.total) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle>Win/Loss Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={strategyChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {strategyChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle>Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[strategyStats]}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="wins" fill="hsl(var(--success))" name="Wins" />
                  <Bar dataKey="losses" fill="hsl(var(--danger))" name="Losses" />
                  <Bar dataKey="breakeven" fill="hsl(var(--muted-foreground))" name="Breakeven" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle>Calendar Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <CustomCalendar trades={filteredTrades} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TradingOverviewPage;
