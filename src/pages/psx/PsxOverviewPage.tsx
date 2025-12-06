import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format, startOfMonth } from 'date-fns';
import { usePsxTrades } from "@/hooks/usePsxTrades";
import CandleLoader from "@/components/ui/candle-loader";
import ProgressToast from "@/components/ui/progress-toast";
import CustomCalendar from "@/components/dashboard/CustomCalendar";

const PsxOverviewPage = () => {
  const { trades, loading, progress, status, stats, loadedCount, totalCount, estimatedTime } = usePsxTrades();
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");

  const strategies = useMemo(() => {
    const uniqueStrategies = new Set(trades.map(t => t.strategy).filter(Boolean));
    return ['all', ...Array.from(uniqueStrategies)] as string[];
  }, [trades]);

  const filteredTrades = useMemo(() => {
    if (selectedStrategy === 'all') return trades;
    return trades.filter(t => t.strategy === selectedStrategy);
  }, [trades, selectedStrategy]);

  const strategyStats = useMemo(() => {
    const result = { total: 0, wins: 0, losses: 0, breakeven: 0, pending: 0, profitLoss: 0 };
    filteredTrades.forEach(trade => {
      result.total++;
      if (trade.result === 'win') result.wins++;
      else if (trade.result === 'loss') result.losses++;
      else if (trade.result === 'breakeven') result.breakeven++;
      else if (trade.result === 'pending') result.pending++;
      result.profitLoss += trade.profitLoss || 0;
    });
    return result;
  }, [filteredTrades]);

  const strategyChartData = useMemo(() => [
    { name: 'Wins', value: strategyStats.wins, color: 'hsl(var(--success))' },
    { name: 'Losses', value: strategyStats.losses, color: 'hsl(var(--danger))' },
    { name: 'Breakeven', value: strategyStats.breakeven, color: 'hsl(var(--muted-foreground))' },
    { name: 'Pending', value: strategyStats.pending, color: 'hsl(var(--primary))' },
  ].filter(item => item.value > 0), [strategyStats]);

  const generatePerformanceData = (trades: typeof filteredTrades) => {
    const monthlyData: { [key: string]: { wins: number; losses: number; profitLoss: number } } = {};
    
    trades.forEach(trade => {
      const date = new Date(trade.createdAt);
      const monthKey = format(startOfMonth(date), 'MMM yyyy');
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { wins: 0, losses: 0, profitLoss: 0 };
      }
      
      if (trade.result === 'win') monthlyData[monthKey].wins++;
      else if (trade.result === 'loss') monthlyData[monthKey].losses++;
      monthlyData[monthKey].profitLoss += trade.profitLoss || 0;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, data]) => ({ date, ...data }));
  };

  // Transform trades for calendar
  const calendarTrades = useMemo(() => 
    filteredTrades.map(t => ({
      id: t.id,
      result: t.result === 'win' ? 'WIN' : t.result === 'loss' ? 'LOSS' : t.result === 'breakeven' ? 'BE' : t.result.toUpperCase(),
      created_at: t.tradeDate || t.createdAt,
      strategy: t.strategy,
    }))
  , [filteredTrades]);

  if (loading && trades.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CandleLoader />
          <span className="text-muted-foreground">Loading PSX overview...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <ProgressToast 
        title={`Loading PSX trades (${loadedCount}/${totalCount})...`}
        progress={progress} 
        isVisible={progress > 0 && progress < 100} 
        status={status}
        message={estimatedTime ? `Est. ${estimatedTime}s remaining` : "Fetching data..."}
      />
      
      <div className="w-full p-4 md:p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            PSX Calendar Overview
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Track your Pakistan Stock Exchange performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="shadow-card border-border/50 bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground font-medium">Total Trades</p>
              <p className="text-3xl font-bold mt-2">{strategyStats.total}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50 bg-gradient-to-br from-success/5 to-success/10">
            <CardContent className="p-6">
              <p className="text-sm text-success font-medium">Winning</p>
              <p className="text-3xl font-bold text-success mt-2">{strategyStats.wins}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50 bg-gradient-to-br from-danger/5 to-danger/10">
            <CardContent className="p-6">
              <p className="text-sm text-danger font-medium">Losing</p>
              <p className="text-3xl font-bold text-danger mt-2">{strategyStats.losses}</p>
            </CardContent>
          </Card>
          <Card className={`shadow-card border-border/50 ${strategyStats.profitLoss >= 0 ? 'bg-gradient-to-br from-success/5 to-success/10' : 'bg-gradient-to-br from-danger/5 to-danger/10'}`}>
            <CardContent className="p-6">
              <p className={`text-sm font-medium ${strategyStats.profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>Total P&L</p>
              <p className={`text-3xl font-bold mt-2 ${strategyStats.profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                {strategyStats.profitLoss >= 0 ? '+' : ''}{strategyStats.profitLoss.toLocaleString()} PKR
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
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
                    {strategyStats.total > 0 ? ((strategyStats.wins / (strategyStats.wins + strategyStats.losses)) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle>Distribution</CardTitle>
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
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={generatePerformanceData(filteredTrades)}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="wins" stroke="hsl(var(--success))" strokeWidth={2} name="Wins" />
                  <Line type="monotone" dataKey="losses" stroke="hsl(var(--danger))" strokeWidth={2} name="Losses" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle>Calendar Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <CustomCalendar trades={calendarTrades} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PsxOverviewPage;
