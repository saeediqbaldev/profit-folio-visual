import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, BarChart3, Target, Trophy, XCircle, Activity } from "lucide-react";
import { api } from "@/lib/api";
import CandleLoader from "@/components/ui/candle-loader";
import { format } from "date-fns";

interface Trade {
  id: string;
  sno: number;
  entry: string;
  result: string | null;
  asset_pair: string | null;
  rr: string | null;
  strategy: string | null;
  trade_date: string | null;
  created_at: string;
}

const PublicSharePage = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<any[]>("/api/public/trades");
        if (cancelled) return;
        if (!data || data.length === 0) {
          setTrades([]);
          setError("Public sharing is disabled or no trades available.");
        } else {
          setTrades(data as Trade[]);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Failed to load trading data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const availableStrategies = useMemo(() => {
    const set = new Set<string>();
    for (const t of trades) {
      const s = (t.strategy ?? "").trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort();
  }, [trades]);

  const filteredTrades = useMemo(() => {
    if (selectedStrategy === "all") return trades;
    return trades.filter((t) => (t.strategy ?? "").trim() === selectedStrategy);
  }, [trades, selectedStrategy]);

  const stats = useMemo(() => {
    const wins = filteredTrades.filter((t) => t.result?.toUpperCase() === "WIN").length;
    const losses = filteredTrades.filter((t) => t.result?.toUpperCase() === "LOSS").length;
    const breakeven = filteredTrades.filter((t) => ["BE", "BREAKEVEN"].includes(t.result?.toUpperCase() ?? "")).length;
    const total = filteredTrades.length;
    const denom = wins + losses;
    const winRate = denom > 0 ? (wins / denom) * 100 : 0;
    return { total, wins, losses, breakeven, winRate };
  }, [filteredTrades]);

  const strategyStats = useMemo(() => {
    const map: Record<string, { total: number; wins: number; winRate: number }> = {};
    for (const trade of trades) {
      const s = (trade.strategy ?? "Unknown").trim() || "Unknown";
      if (!map[s]) map[s] = { total: 0, wins: 0, winRate: 0 };
      map[s].total++;
      if (trade.result?.toUpperCase() === "WIN") map[s].wins++;
    }
    for (const k of Object.keys(map)) {
      map[k].winRate = map[k].total > 0 ? (map[k].wins / map[k].total) * 100 : 0;
    }
    return map;
  }, [trades]);

  const getResultBadge = (result: string | null) => {
    switch (result?.toUpperCase()) {
      case "WIN": return <Badge className="bg-success/10 text-success border-success/20">WIN</Badge>;
      case "LOSS": return <Badge className="bg-danger/10 text-danger border-danger/20">LOSS</Badge>;
      case "BE":
      case "BREAKEVEN": return <Badge variant="secondary">BE</Badge>;
      default: return <Badge variant="outline">{result || "N/A"}</Badge>;
    }
  };

  const getResultIcon = (result: string | null) => {
    switch (result?.toUpperCase()) {
      case "WIN": return <TrendingUp className="h-4 w-4 text-success" />;
      case "LOSS": return <TrendingDown className="h-4 w-4 text-danger" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CandleLoader />
          <span className="text-muted-foreground">Loading trading stats...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-danger mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unavailable</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center py-6">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Trading Performance
          </h1>
          <p className="text-muted-foreground mt-2">Public trading journal statistics</p>
          <div className="mt-4 flex justify-center">
            <div className="w-full max-w-xs text-left">
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger><SelectValue placeholder="Filter by strategy" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All strategies</SelectItem>
                  {availableStrategies.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-card border-border/50"><CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><BarChart3 className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Total Trades</p><p className="text-2xl font-bold">{stats.total}</p></div>
            </div>
          </CardContent></Card>
          <Card className="shadow-card border-border/50"><CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10"><Trophy className="h-5 w-5 text-success" /></div>
              <div><p className="text-sm text-muted-foreground">Wins</p><p className="text-2xl font-bold text-success">{stats.wins}</p></div>
            </div>
          </CardContent></Card>
          <Card className="shadow-card border-border/50"><CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-danger/10"><XCircle className="h-5 w-5 text-danger" /></div>
              <div><p className="text-sm text-muted-foreground">Losses</p><p className="text-2xl font-bold text-danger">{stats.losses}</p></div>
            </div>
          </CardContent></Card>
          <Card className="shadow-card border-border/50"><CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Target className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className={`text-2xl font-bold ${stats.winRate >= 50 ? "text-success" : "text-danger"}`}>{stats.winRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent></Card>
        </div>

        {Object.keys(strategyStats).length > 0 && (
          <Card className="shadow-card border-border/50">
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Strategy Performance</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(strategyStats).map(([strategy, data]) => (
                  <div key={strategy} className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <h4 className="font-medium truncate">{strategy}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">{data.total} trades</span>
                      <span className={`font-bold ${data.winRate >= 50 ? "text-success" : "text-danger"}`}>{data.winRate.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-card border-border/50">
          <CardHeader><CardTitle>Trade History ({filteredTrades.length} trades)</CardTitle></CardHeader>
          <CardContent>
            {filteredTrades.length === 0 ? (
              <Alert><AlertTitle>No trades</AlertTitle><AlertDescription>No trades match the selected strategy.</AlertDescription></Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">#</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>R:R</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.map((trade, index) => (
                      <TableRow key={trade.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                        <TableCell className="font-medium">{trade.sno}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {trade.trade_date
                            ? format(new Date(trade.trade_date), "MMM dd, yyyy")
                            : format(new Date(trade.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">{trade.asset_pair || "-"}</TableCell>
                        <TableCell>{trade.strategy || "-"}</TableCell>
                        <TableCell>{trade.entry}</TableCell>
                        <TableCell>{trade.rr || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getResultIcon(trade.result)}
                            {getResultBadge(trade.result)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center py-6 text-muted-foreground text-sm">Powered by Trading Journal</div>
      </div>
    </div>
  );
};

export default PublicSharePage;
