import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import CandleLoader from "@/components/ui/candle-loader";
import CustomCalendar from "@/components/dashboard/CustomCalendar";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { format, startOfMonth } from "date-fns";

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
        const data = await api.get<any[]>("/api/trades");
        setTrades(
          (data || []).map((t) => ({
            id: t.id,
            result: t.result,
            created_at: t.created_at,
            strategy: t.strategy,
          }))
        );
      } catch (error) {
        console.error("Error loading trades:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to load trades data." });
      } finally {
        setLoading(false);
      }
    };
    loadTrades();
  }, [user, toast]);

  const strategies = useMemo(() => {
    const unique = new Set(trades.map((t) => t.strategy).filter(Boolean));
    return ["all", ...Array.from(unique)] as string[];
  }, [trades]);

  const filteredTrades = useMemo(() => {
    if (selectedStrategy === "all") return trades;
    return trades.filter((t) => t.strategy === selectedStrategy);
  }, [trades, selectedStrategy]);

  const strategyStats = useMemo(() => {
    const stats = { total: 0, wins: 0, losses: 0, breakeven: 0 };
    filteredTrades.forEach((trade) => {
      stats.total++;
      const r = trade.result?.toUpperCase() || "";
      if (r === "WIN") stats.wins++;
      else if (r === "LOSS") stats.losses++;
      else if (r === "BE" || r === "BREAKEVEN") stats.breakeven++;
    });
    return stats;
  }, [filteredTrades]);

  const strategyChartData = useMemo(
    () =>
      [
        { name: "Wins", value: strategyStats.wins, color: "hsl(var(--success))" },
        { name: "Losses", value: strategyStats.losses, color: "hsl(var(--danger))" },
        { name: "Breakeven", value: strategyStats.breakeven, color: "hsl(var(--muted-foreground))" },
      ].filter((i) => i.value > 0),
    [strategyStats]
  );

  const generatePerformanceData = (trades: Trade[]) => {
    const monthlyData: { [key: string]: { wins: number; losses: number; breakeven: number } } = {};
    trades.forEach((trade) => {
      const date = new Date(trade.created_at);
      const key = format(startOfMonth(date), "MMM yyyy");
      if (!monthlyData[key]) monthlyData[key] = { wins: 0, losses: 0, breakeven: 0 };
      const r = trade.result?.toUpperCase() || "";
      if (r === "WIN") monthlyData[key].wins++;
      else if (r === "LOSS") monthlyData[key].losses++;
      else if (r === "BE" || r === "BREAKEVEN") monthlyData[key].breakeven++;
    });
    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, data]) => ({ date, ...data }));
  };

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-card border-border/50 bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Trades</p>
                  <p className="text-3xl font-bold mt-2">{strategyStats.total}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50 bg-gradient-to-br from-success/5 to-success/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-success font-medium">Winning Trades</p>
                  <p className="text-3xl font-bold text-success mt-2">{strategyStats.wins}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50 bg-gradient-to-br from-danger/5 to-danger/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-danger font-medium">Losing Trades</p>
                  <p className="text-3xl font-bold text-danger mt-2">{strategyStats.losses}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center">
                  <span className="text-2xl">❌</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-card border-border/50">
            <CardHeader><CardTitle>Strategy Filter</CardTitle></CardHeader>
            <CardContent>
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger><SelectValue placeholder="Select strategy" /></SelectTrigger>
                <SelectContent>
                  {strategies.map((s) => (
                    <SelectItem key={s} value={s}>{s === "all" ? "All Strategies" : s}</SelectItem>
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
            <CardHeader><CardTitle>Win/Loss Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={strategyChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {strategyChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader><CardTitle>Performance Breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={generatePerformanceData(filteredTrades)}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend />
                  <Line type="monotone" dataKey="wins" stroke="hsl(var(--success))" strokeWidth={2} name="Wins" />
                  <Line type="monotone" dataKey="losses" stroke="hsl(var(--danger))" strokeWidth={2} name="Losses" />
                  <Line type="monotone" dataKey="breakeven" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Breakeven" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card border-border/50">
          <CardHeader><CardTitle>Calendar Overview</CardTitle></CardHeader>
          <CardContent className="p-4">
            <CustomCalendar trades={filteredTrades} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TradingOverviewPage;
