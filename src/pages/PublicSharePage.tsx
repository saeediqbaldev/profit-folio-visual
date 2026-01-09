import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Target,
  Trophy,
  XCircle,
  Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CandleLoader from "@/components/ui/candle-loader";
import { format } from "date-fns";

interface PublicSharePageProps {
  userId: string;
}

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

type StrategyStatsMap = Record<string, { total: number; wins: number; winRate: number }>;

interface OverallStats {
  total: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
}

const PublicSharePage = ({ userId }: PublicSharePageProps) => {
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
        setSelectedStrategy("all");

        // Fetch trades directly - RLS policy handles share_enabled check
        const { data: tradesData, error: tradesError } = await supabase
          .from("trades")
          .select("id, sno, entry, result, asset_pair, rr, strategy, trade_date, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (tradesError) throw tradesError;

        // If no trades returned, either user has no trades or sharing is disabled
        if (!tradesData || tradesData.length === 0) {
          if (!cancelled) {
            setTrades([]);
            setError("This profile is not publicly shared or has no trades.");
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setTrades(tradesData as Trade[]);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        if (!cancelled) {
          setError("Failed to load trading data.");
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const availableStrategies = useMemo(() => {
    const set = new Set<string>();
    for (const t of trades) {
      const s = (t.strategy ?? "").trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [trades]);

  const filteredTrades = useMemo(() => {
    if (selectedStrategy === "all") return trades;
    return trades.filter((t) => (t.strategy ?? "").trim() === selectedStrategy);
  }, [trades, selectedStrategy]);

  const stats: OverallStats = useMemo(() => {
    const wins = filteredTrades.filter((t) => t.result?.toUpperCase() === "WIN").length;
    const losses = filteredTrades.filter((t) => t.result?.toUpperCase() === "LOSS").length;
    const breakeven = filteredTrades.filter((t) =>
      ["BE", "BREAKEVEN"].includes(t.result?.toUpperCase() ?? ""),
    ).length;
    const total = filteredTrades.length;
    const denom = wins + losses;
    const winRate = denom > 0 ? (wins / denom) * 100 : 0;

    return { total, wins, losses, breakeven, winRate };
  }, [filteredTrades]);

  const strategyStats: StrategyStatsMap = useMemo(() => {
    const map: StrategyStatsMap = {};

    for (const trade of trades) {
      const strategy = (trade.strategy ?? "Unknown").trim() || "Unknown";
      if (!map[strategy]) {
        map[strategy] = { total: 0, wins: 0, winRate: 0 };
      }

      map[strategy].total++;
      if (trade.result?.toUpperCase() === "WIN") {
        map[strategy].wins++;
      }
    }

    for (const key of Object.keys(map)) {
      const s = map[key];
      s.winRate = s.total > 0 ? (s.wins / s.total) * 100 : 0;
    }

    return map;
  }, [trades]);

  const getResultBadge = (result: string | null) => {
    switch (result?.toUpperCase()) {
      case "WIN":
        return <Badge className="bg-success/10 text-success border-success/20">WIN</Badge>;
      case "LOSS":
        return <Badge className="bg-danger/10 text-danger border-danger/20">LOSS</Badge>;
      case "BE":
      case "BREAKEVEN":
        return <Badge variant="secondary">BE</Badge>;
      default:
        return <Badge variant="outline">{result || "N/A"}</Badge>;
    }
  };

  const getResultIcon = (result: string | null) => {
    switch (result?.toUpperCase()) {
      case "WIN":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "LOSS":
        return <TrendingDown className="h-4 w-4 text-danger" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
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
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Trading Performance
          </h1>
          <p className="text-muted-foreground mt-2">Public trading journal statistics</p>

          <div className="mt-4 flex justify-center">
            <div className="w-full max-w-xs text-left">
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All strategies</SelectItem>
                  {availableStrategies.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-card border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Trophy className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wins</p>
                  <p className="text-2xl font-bold text-success">{stats.wins}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-danger/10">
                  <XCircle className="h-5 w-5 text-danger" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Losses</p>
                  <p className="text-2xl font-bold text-danger">{stats.losses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className={`text-2xl font-bold ${stats.winRate >= 50 ? 'text-success' : 'text-danger'}`}>
                    {stats.winRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategy Win Rates */}
        {Object.keys(strategyStats).length > 0 && (
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Strategy Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(Object.entries(strategyStats) as Array<[
                  string,
                  { total: number; wins: number; winRate: number }
                ]>).map(([strategy, data]) => (
                  <div
                    key={strategy}
                    className="p-4 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <h4 className="font-medium truncate">{strategy}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">
                        {data.total} trades
                      </span>
                      <span
                        className={`font-bold ${data.winRate >= 50 ? "text-success" : "text-danger"}`}
                      >
                        {data.winRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trades Table */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle>
              Trade History ({filteredTrades.length} trades)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTrades.length === 0 ? (
              <Alert>
                <AlertTitle>No trades</AlertTitle>
                <AlertDescription>
                  No trades match the selected strategy.
                </AlertDescription>
              </Alert>
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
                      <TableRow
                        key={trade.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <TableCell className="font-medium">
                          {trade.sno}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {trade.trade_date
                            ? format(new Date(trade.trade_date), "MMM dd, yyyy")
                            : format(new Date(trade.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {trade.asset_pair || "-"}
                        </TableCell>
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

        {/* Footer */}
        <div className="text-center py-6 text-muted-foreground text-sm">
          Powered by Trading Journal
        </div>
      </div>
    </div>
  );
};

export default PublicSharePage;
