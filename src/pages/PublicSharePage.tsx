import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus, BarChart3, Target, Trophy, XCircle, Activity } from "lucide-react";
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
  result: string;
  asset_pair: string;
  rr: string;
  strategy: string;
  trade_date: string;
  created_at: string;
}

interface Stats {
  total: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  strategyStats: { [key: string]: { total: number; wins: number; winRate: number } };
}

const PublicSharePage = ({ userId }: PublicSharePageProps) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleTrades, setVisibleTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch trades directly - RLS policy handles share_enabled check
        const { data: tradesData, error: tradesError } = await supabase
          .from('trades')
          .select('id, sno, entry, result, asset_pair, rr, strategy, trade_date, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (tradesError) throw tradesError;

        // If no trades returned, either user has no trades or sharing is disabled
        if (!tradesData || tradesData.length === 0) {
          setError("This profile is not publicly shared or has no trades.");
          setLoading(false);
          return;
        }

        setTrades(tradesData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError("Failed to load trading data.");
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Progressive fade-in effect for trades
  useEffect(() => {
    if (trades.length === 0) {
      setVisibleTrades([]);
      return;
    }

    // Reset visible trades when trades change
    setVisibleTrades([]);
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < trades.length) {
        setVisibleTrades(prev => [...prev, trades[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [trades]);

  // Calculate stats
  const stats: Stats = useMemo(() => {
    const wins = trades.filter(t => t.result?.toUpperCase() === 'WIN').length;
    const losses = trades.filter(t => t.result?.toUpperCase() === 'LOSS').length;
    const breakeven = trades.filter(t => ['BE', 'BREAKEVEN'].includes(t.result?.toUpperCase())).length;
    const total = trades.length;
    const winRate = total > 0 ? (wins / (wins + losses)) * 100 : 0;

    // Strategy stats
    const strategyStats: { [key: string]: { total: number; wins: number; winRate: number } } = {};
    trades.forEach(trade => {
      const strategy = trade.strategy || 'Unknown';
      if (!strategyStats[strategy]) {
        strategyStats[strategy] = { total: 0, wins: 0, winRate: 0 };
      }
      strategyStats[strategy].total++;
      if (trade.result?.toUpperCase() === 'WIN') {
        strategyStats[strategy].wins++;
      }
    });

    Object.keys(strategyStats).forEach(key => {
      const s = strategyStats[key];
      s.winRate = s.total > 0 ? (s.wins / s.total) * 100 : 0;
    });

    return { total, wins, losses, breakeven, winRate, strategyStats };
  }, [trades]);

  const getResultBadge = (result: string) => {
    switch (result?.toUpperCase()) {
      case 'WIN':
        return <Badge className="bg-success/10 text-success border-success/20">WIN</Badge>;
      case 'LOSS':
        return <Badge className="bg-danger/10 text-danger border-danger/20">LOSS</Badge>;
      case 'BE':
      case 'BREAKEVEN':
        return <Badge variant="secondary">BE</Badge>;
      default:
        return <Badge variant="outline">{result || 'N/A'}</Badge>;
    }
  };

  const getResultIcon = (result: string) => {
    switch (result?.toUpperCase()) {
      case 'WIN':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'LOSS':
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
          <p className="text-muted-foreground mt-2">
            Public trading journal statistics
          </p>
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
        {Object.keys(stats.strategyStats).length > 0 && (
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Strategy Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(stats.strategyStats).map(([strategy, data]) => (
                  <div key={strategy} className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <h4 className="font-medium truncate">{strategy}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">{data.total} trades</span>
                      <span className={`font-bold ${data.winRate >= 50 ? 'text-success' : 'text-danger'}`}>
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
            <CardTitle>Trade History ({trades.length} trades)</CardTitle>
          </CardHeader>
          <CardContent>
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
                  {visibleTrades.map((trade, index) => (
                    <TableRow 
                      key={trade.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell className="font-medium">{trade.sno}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {trade.trade_date 
                          ? format(new Date(trade.trade_date), 'MMM dd, yyyy')
                          : format(new Date(trade.created_at), 'MMM dd, yyyy')
                        }
                      </TableCell>
                      <TableCell className="font-medium">{trade.asset_pair || '-'}</TableCell>
                      <TableCell>{trade.strategy || '-'}</TableCell>
                      <TableCell>{trade.entry}</TableCell>
                      <TableCell>{trade.rr || '-'}</TableCell>
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
