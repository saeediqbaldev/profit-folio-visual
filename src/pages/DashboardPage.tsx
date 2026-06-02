import { useState, useMemo } from "react";
import StatsCards from "@/components/dashboard/StatsCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, BarChart3, PieChartIcon, Activity, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useTrades } from "@/hooks/useTrades";
import CandleLoader from "@/components/ui/candle-loader";
import ProgressToast from "@/components/ui/progress-toast";

type ChartType = 'line' | 'bar' | 'pie' | 'area';
type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const DashboardPage = () => {
  const { trades, loading, progress, status, totalCount, loadedCount } = useTrades();
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");
  const [performanceChartType, setPerformanceChartType] = useState<ChartType>('line');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly');
  const [chartZoom, setChartZoom] = useState<Record<string, number>>({
    performance: 1,
    distribution: 1,
    winRate: 1,
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

  // Filter trades by time
  const filterTradesByTime = (trades: any[], filter: TimeFilter) => {
    const now = new Date();
    return trades.filter(trade => {
      const tradeDate = new Date(trade.tradeDate || trade.createdAt);
      const diffTime = now.getTime() - tradeDate.getTime();
      
      switch (filter) {
        case 'daily': return diffTime <= 24 * 60 * 60 * 1000 * 30;
        case 'weekly': return diffTime <= 24 * 60 * 60 * 1000 * 7 * 12;
        case 'monthly': return diffTime <= 24 * 60 * 60 * 1000 * 30 * 12;
        case 'quarterly': return diffTime <= 24 * 60 * 60 * 1000 * 30 * 36;
        case 'yearly': return true;
        default: return true;
      }
    });
  };

  // Generate time series data
  const timeSeriesData = useMemo(() => {
    const timeFilteredTrades = filterTradesByTime(filteredTrades, timeFilter);
    const groupedData: { [key: string]: { wins: number; losses: number; breakeven: number } } = {};

    timeFilteredTrades.forEach(trade => {
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
        groupedData[key] = { wins: 0, losses: 0, breakeven: 0 };
      }

      const result = trade.result?.toUpperCase();
      if (result === 'WIN') groupedData[key].wins++;
      else if (result === 'LOSS') groupedData[key].losses++;
      else if (result === 'BE' || result === 'BREAKEVEN') groupedData[key].breakeven++;
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
    const timeFilteredTrades = filterTradesByTime(filteredTrades, timeFilter);
    const wins = timeFilteredTrades.filter(t => t.result?.toUpperCase() === 'WIN').length;
    const losses = timeFilteredTrades.filter(t => t.result?.toUpperCase() === 'LOSS').length;
    const breakeven = timeFilteredTrades.filter(t => ['BE', 'BREAKEVEN'].includes(t.result?.toUpperCase())).length;

    return [
      { name: 'Wins', value: wins, color: 'hsl(var(--success))' },
      { name: 'Losses', value: losses, color: 'hsl(var(--danger))' },
      { name: 'Breakeven', value: breakeven, color: 'hsl(var(--muted-foreground))' },
    ].filter(item => item.value > 0);
  }, [filteredTrades, timeFilter]);

  // Zoom handlers
  const handleZoom = (chartId: string, direction: 'in' | 'out' | 'reset') => {
    setChartZoom(prev => ({
      ...prev,
      [chartId]: direction === 'reset' ? 1 : direction === 'in' ? Math.min(prev[chartId] + 0.25, 2) : Math.max(prev[chartId] - 0.25, 0.5)
    }));
  };

  // Render performance chart based on type
  const renderPerformanceChart = () => {
    const height = 350 * chartZoom.performance;
    const commonProps = { width: "100%" as const, height, data: timeSeriesData };

    switch (performanceChartType) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="wins" stroke="hsl(var(--success))" strokeWidth={2} name="Wins" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="losses" stroke="hsl(var(--danger))" strokeWidth={2} name="Losses" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="breakeven" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Breakeven" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Legend />
              <Area type="monotone" dataKey="wins" stackId="1" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.6} name="Wins" />
              <Area type="monotone" dataKey="losses" stackId="1" stroke="hsl(var(--danger))" fill="hsl(var(--danger))" fillOpacity={0.6} name="Losses" />
              <Area type="monotone" dataKey="breakeven" stackId="1" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.6} name="Breakeven" />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="wins" fill="hsl(var(--success))" name="Wins" radius={[4, 4, 0, 0]} />
              <Bar dataKey="losses" fill="hsl(var(--danger))" name="Losses" radius={[4, 4, 0, 0]} />
              <Bar dataKey="breakeven" fill="hsl(var(--muted-foreground))" name="Breakeven" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  if (loading && trades.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CandleLoader />
          <span className="text-muted-foreground">Loading stats...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <ProgressToast 
        title="Loading data..." 
        progress={progress} 
        isVisible={progress > 0 && progress < 100} 
        status={status}
        message={status === "success" ? "Data loaded!" : status === "error" ? "Failed to load" : "Fetching your data..."}
        totalCount={totalCount}
        loadedCount={loadedCount}
      />
      
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Header with Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Stats / Analytics
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Analyze your trading performance
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
        <StatsCards trades={filteredTrades} />
        
        {/* Performance Chart Section */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Trends
              </CardTitle>
              
              <div className="flex flex-wrap items-center gap-2">
                <Select value={performanceChartType} onValueChange={(value: ChartType) => setPerformanceChartType(value)}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="area">Area Chart</SelectItem>
                  </SelectContent>
                </Select>
                
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
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {timeSeriesData.length > 0 ? renderPerformanceChart() : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No data available for the selected filters
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribution Chart Section */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                Win/Loss Distribution
              </CardTitle>
              
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => handleZoom('distribution', 'out')} className="h-8 w-8">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleZoom('distribution', 'in')} className="h-8 w-8">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleZoom('distribution', 'reset')} className="h-8 w-8">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300 * (chartZoom.distribution || 1)}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60 * (chartZoom.distribution || 1)}
                    outerRadius={100 * (chartZoom.distribution || 1)}
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
                No data available for the selected filters
              </div>
            )}
          </CardContent>
        </Card>

        {/* Win Rate Trend Section */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Win Rate Over Time
              </CardTitle>
              
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => handleZoom('winRate', 'out')} className="h-8 w-8">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleZoom('winRate', 'in')} className="h-8 w-8">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleZoom('winRate', 'reset')} className="h-8 w-8">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300 * chartZoom.winRate}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="winRate" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                    name="Win Rate"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No data available for the selected filters
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
