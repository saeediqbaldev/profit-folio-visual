import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, PieChartIcon, Activity, ZoomIn, ZoomOut, RotateCcw, DollarSign } from "lucide-react";
import { usePsxTrades } from "@/hooks/usePsxTrades";
import CandleLoader from "@/components/ui/candle-loader";
import ProgressToast from "@/components/ui/progress-toast";

type ChartType = 'line' | 'bar' | 'area';
type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const PsxDashboardPage = () => {
  const { trades, loading, progress, status, stats, loadedCount, totalCount, estimatedTime } = usePsxTrades();
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");
  const [performanceChartType, setPerformanceChartType] = useState<ChartType>('line');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly');
  const [chartZoom, setChartZoom] = useState<Record<string, number>>({
    performance: 1,
    distribution: 1,
    profitLoss: 1,
  });

  // Get unique strategies from trades
  const strategies = useMemo(() => {
    const uniqueStrategies = new Set(trades.map(t => t.strategy).filter(Boolean));
    return ['all', ...Array.from(uniqueStrategies)] as string[];
  }, [trades]);

  // Filter trades by selected strategy
  const filteredTrades = useMemo(() => {
    if (selectedStrategy === 'all') return trades;
    return trades.filter(t => t.strategy === selectedStrategy);
  }, [trades, selectedStrategy]);

  // Generate time series data
  const timeSeriesData = useMemo(() => {
    const groupedData: { [key: string]: { wins: number; losses: number; breakeven: number; profitLoss: number } } = {};

    filteredTrades.forEach(trade => {
      const date = new Date(trade.tradeDate || trade.createdAt);
      let key: string;

      switch (timeFilter) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'yearly':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = { wins: 0, losses: 0, breakeven: 0, profitLoss: 0 };
      }

      if (trade.result === 'win') groupedData[key].wins++;
      else if (trade.result === 'loss') groupedData[key].losses++;
      else if (trade.result === 'breakeven') groupedData[key].breakeven++;
      
      groupedData[key].profitLoss += trade.profitLoss || 0;
    });

    return Object.entries(groupedData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        ...data,
        total: data.wins + data.losses + data.breakeven,
        winRate: data.wins + data.losses > 0 ? (data.wins / (data.wins + data.losses)) * 100 : 0,
      }));
  }, [filteredTrades, timeFilter]);

  // Generate pie data for distribution
  const pieData = useMemo(() => {
    const wins = filteredTrades.filter(t => t.result === 'win').length;
    const losses = filteredTrades.filter(t => t.result === 'loss').length;
    const breakeven = filteredTrades.filter(t => t.result === 'breakeven').length;
    const pending = filteredTrades.filter(t => t.result === 'pending').length;

    return [
      { name: 'Wins', value: wins, color: 'hsl(var(--success))' },
      { name: 'Losses', value: losses, color: 'hsl(var(--danger))' },
      { name: 'Breakeven', value: breakeven, color: 'hsl(var(--muted-foreground))' },
      { name: 'Pending', value: pending, color: 'hsl(var(--primary))' },
    ].filter(item => item.value > 0);
  }, [filteredTrades]);

  // Zoom handlers
  const handleZoom = (chartId: string, direction: 'in' | 'out' | 'reset') => {
    setChartZoom(prev => ({
      ...prev,
      [chartId]: direction === 'reset' ? 1 : direction === 'in' ? Math.min(prev[chartId] + 0.25, 2) : Math.max(prev[chartId] - 0.25, 0.5)
    }));
  };

  if (loading && trades.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CandleLoader />
          <span className="text-muted-foreground">Loading PSX stats...</span>
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
        message={estimatedTime ? `Est. ${estimatedTime}s remaining` : status === "success" ? "Data loaded!" : "Fetching your data..."}
      />
      
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Header with Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              PSX Stats / Analytics
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Analyze your Pakistan Stock Exchange performance
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Strategy" />
              </SelectTrigger>
              <SelectContent>
                {strategies.map((strategy) => (
                  <SelectItem key={strategy} value={strategy}>
                    {strategy === 'all' ? 'All Strategies' : strategy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="shadow-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.total}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card border-border/50 bg-success/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm text-success">Wins</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-success">{stats.wins}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card border-border/50 bg-danger/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-danger" />
                <span className="text-sm text-danger">Losses</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-danger">{stats.losses}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.pending}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Win Rate</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.winRate}%</p>
            </CardContent>
          </Card>
          
          <Card className={`shadow-card border-border/50 ${stats.totalProfitLoss >= 0 ? 'bg-success/5' : 'bg-danger/5'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className={`h-4 w-4 ${stats.totalProfitLoss >= 0 ? 'text-success' : 'text-danger'}`} />
                <span className={`text-sm ${stats.totalProfitLoss >= 0 ? 'text-success' : 'text-danger'}`}>P&L</span>
              </div>
              <p className={`text-2xl font-bold mt-2 ${stats.totalProfitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                {stats.totalProfitLoss >= 0 ? '+' : ''}{stats.totalProfitLoss.toLocaleString()} PKR
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Performance
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={() => handleZoom('performance', 'out')} className="h-8 w-8">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleZoom('performance', 'in')} className="h-8 w-8">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleZoom('performance', 'reset')} className="h-8 w-8">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {timeSeriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300 * chartZoom.performance}>
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="wins" fill="hsl(var(--success))" name="Wins" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="losses" fill="hsl(var(--danger))" name="Losses" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribution Chart */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* P&L Chart */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Profit & Loss Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value.toLocaleString()}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => [`PKR ${value.toLocaleString()}`, 'P&L']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profitLoss" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                    name="Profit/Loss"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PsxDashboardPage;
