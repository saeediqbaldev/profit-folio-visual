import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import CandleLoader from "@/components/ui/candle-loader";
import CustomCalendar from "@/components/dashboard/CustomCalendar";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { format, startOfMonth } from "date-fns";
import { SESSIONS } from "@/components/journal/TradeForm";

interface Trade {
  id: string;
  entry: string;
  result: string;
  created_at: string;
  trade_date?: string | null;
  strategy?: string | null;
  session?: string | null;
  asset_pair?: string | null;
  reason?: string | null;
}

const TradingOverviewPage = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<string>("all");
  const [dayModal, setDayModal] = useState<{ date: Date; trades: Trade[] } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadTrades = async () => {
      if (!user) return;
      try {
        const data = await api.get<any[]>("/api/trades");
        setTrades((data || []) as Trade[]);
      } catch (error) {
        console.error("Error loading trades:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to load trades." });
      } finally {
        setLoading(false);
      }
    };
    loadTrades();
  }, [user, toast]);

  const strategies = useMemo(() => {
    const unique = new Set(trades.map(t => t.strategy).filter(Boolean) as string[]);
    return ["all", ...Array.from(unique)];
  }, [trades]);

  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      if (selectedStrategy !== "all" && t.strategy !== selectedStrategy) return false;
      if (selectedSession !== "all" && (t.session || "") !== selectedSession) return false;
      return true;
    });
  }, [trades, selectedStrategy, selectedSession]);

  const strategyStats = useMemo(() => {
    const s = { total: 0, wins: 0, losses: 0, breakeven: 0 };
    filteredTrades.forEach(t => {
      s.total++;
      const r = t.result?.toUpperCase() || "";
      if (r === "WIN") s.wins++;
      else if (r === "LOSS") s.losses++;
      else if (r === "BE" || r === "BREAKEVEN") s.breakeven++;
    });
    return s;
  }, [filteredTrades]);

  const pieData = useMemo(() => [
    { name: "Wins", value: strategyStats.wins, color: "hsl(var(--success))" },
    { name: "Losses", value: strategyStats.losses, color: "hsl(var(--danger))" },
    { name: "Breakeven", value: strategyStats.breakeven, color: "hsl(var(--muted-foreground))" },
  ].filter(i => i.value > 0), [strategyStats]);

  const perfData = useMemo(() => {
    const monthly: { [k: string]: { wins: number; losses: number; breakeven: number } } = {};
    filteredTrades.forEach(t => {
      const d = new Date(t.trade_date || t.created_at);
      const k = format(startOfMonth(d), "MMM yyyy");
      if (!monthly[k]) monthly[k] = { wins: 0, losses: 0, breakeven: 0 };
      const r = t.result?.toUpperCase() || "";
      if (r === "WIN") monthly[k].wins++;
      else if (r === "LOSS") monthly[k].losses++;
      else if (r === "BE" || r === "BREAKEVEN") monthly[k].breakeven++;
    });
    return Object.entries(monthly).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime()).map(([date, d]) => ({ date, ...d }));
  }, [filteredTrades]);

  const handleDayClick = (date: Date) => {
    const dStr = format(date, "yyyy-MM-dd");
    const dayTrades = filteredTrades.filter(t => {
      const td = format(new Date(t.trade_date || t.created_at), "yyyy-MM-dd");
      return td === dStr;
    });
    setDayModal({ date, trades: dayTrades });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4"><CandleLoader /><span className="text-muted-foreground">Loading overview...</span></div>
      </div>
    );
  }

  // Heuristic: BUY if reason mentions buy/long, SELL if sell/short
  const sideOf = (t: Trade): "Buy" | "Sell" | "—" => {
    const text = `${t.reason || ""}`.toLowerCase();
    if (/\b(buy|long)\b/.test(text)) return "Buy";
    if (/\b(sell|short)\b/.test(text)) return "Sell";
    return "—";
  };

  const daySummary = dayModal ? (() => {
    const buys = dayModal.trades.filter(t => sideOf(t) === "Buy").length;
    const sells = dayModal.trades.filter(t => sideOf(t) === "Sell").length;
    return { total: dayModal.trades.length, buys, sells };
  })() : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="w-full p-4 md:p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Calendar Overview
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Track your trading performance with a visual calendar</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-card border-border/50 bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6"><div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground font-medium">Total Trades</p><p className="text-3xl font-bold mt-2">{strategyStats.total}</p></div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-2xl">📊</span></div>
            </div></CardContent>
          </Card>
          <Card className="shadow-card border-border/50 bg-gradient-to-br from-success/5 to-success/10">
            <CardContent className="p-6"><div className="flex items-center justify-between">
              <div><p className="text-sm text-success font-medium">Winning Trades</p><p className="text-3xl font-bold text-success mt-2">{strategyStats.wins}</p></div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center"><span className="text-2xl">✅</span></div>
            </div></CardContent>
          </Card>
          <Card className="shadow-card border-border/50 bg-gradient-to-br from-danger/5 to-danger/10">
            <CardContent className="p-6"><div className="flex items-center justify-between">
              <div><p className="text-sm text-danger font-medium">Losing Trades</p><p className="text-3xl font-bold text-danger mt-2">{strategyStats.losses}</p></div>
              <div className="h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center"><span className="text-2xl">❌</span></div>
            </div></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-card border-border/50">
            <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger><SelectValue placeholder="Strategy" /></SelectTrigger>
                <SelectContent>
                  {strategies.map(s => <SelectItem key={s} value={s}>{s === "all" ? "All Strategies" : s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger><SelectValue placeholder="Session" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {SESSIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="mt-2 space-y-3">
                <div className="bg-muted/50 p-3 rounded-lg"><div className="text-sm text-muted-foreground">Total</div><div className="text-2xl font-bold">{strategyStats.total}</div></div>
                <div className="bg-success/10 p-3 rounded-lg"><div className="text-sm text-success">Wins</div><div className="text-2xl font-bold text-success">{strategyStats.wins}</div></div>
                <div className="bg-danger/10 p-3 rounded-lg"><div className="text-sm text-danger">Losses</div><div className="text-2xl font-bold text-danger">{strategyStats.losses}</div></div>
                <div className="bg-muted/50 p-3 rounded-lg"><div className="text-sm text-muted-foreground">Win Rate</div>
                  <div className="text-2xl font-bold">{strategyStats.total > 0 ? ((strategyStats.wins / strategyStats.total) * 100).toFixed(0) : 0}%</div></div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader><CardTitle>Win/Loss Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
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
                <LineChart data={perfData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" /><YAxis />
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
          <CardHeader><CardTitle>Calendar (click a day for details)</CardTitle></CardHeader>
          <CardContent className="p-4">
            <CustomCalendar trades={filteredTrades as any} onDayClick={handleDayClick} />
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!dayModal} onOpenChange={(o) => !o && setDayModal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dayModal ? format(dayModal.date, "EEEE, MMM dd, yyyy") : ""}
            </DialogTitle>
          </DialogHeader>
          {dayModal && daySummary && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 p-3 rounded-lg"><div className="text-xs text-muted-foreground">Total Trades</div><div className="text-2xl font-bold">{daySummary.total}</div></div>
                <div className="bg-success/10 p-3 rounded-lg"><div className="text-xs text-success">Buy Trades</div><div className="text-2xl font-bold text-success">{daySummary.buys}</div></div>
                <div className="bg-danger/10 p-3 rounded-lg"><div className="text-xs text-danger">Sell Trades</div><div className="text-2xl font-bold text-danger">{daySummary.sells}</div></div>
              </div>
              <div className="space-y-2">
                {dayModal.trades.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/30">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{t.asset_pair || "Trade"} — {t.entry}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {t.strategy || "—"}{t.session ? ` · ${t.session}` : ""} · {sideOf(t)}
                      </div>
                    </div>
                    <Badge variant={t.result?.toUpperCase() === "WIN" ? "default" : t.result?.toUpperCase() === "LOSS" ? "destructive" : "secondary"}>
                      {t.result || "—"}
                    </Badge>
                  </div>
                ))}
                {dayModal.trades.length === 0 && (
                  <p className="text-center text-muted-foreground py-6">No trades for this date</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TradingOverviewPage;
