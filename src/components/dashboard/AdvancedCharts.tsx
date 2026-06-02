import { useState, useMemo, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Trade {
  id: string;
  result: string;
  assetPair?: string;
  createdAt: string;
}

interface AdvancedChartsProps {
  trades: Trade[];
}

type ChartType = 'line' | 'bar' | 'pie' | 'area';
type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const AdvancedCharts = memo(({ trades }: AdvancedChartsProps) => {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('daily');

  const filterTradesByTime = (trades: Trade[], filter: TimeFilter) => {
    const now = new Date();
    const filteredTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.createdAt);
      const diffTime = now.getTime() - tradeDate.getTime();
      
      switch (filter) {
        case 'daily':
          return diffTime <= 24 * 60 * 60 * 1000 * 30; // Last 30 days
        case 'weekly':
          return diffTime <= 24 * 60 * 60 * 1000 * 7 * 12; // Last 12 weeks
        case 'monthly':
          return diffTime <= 24 * 60 * 60 * 1000 * 30 * 12; // Last 12 months
        case 'quarterly':
          return diffTime <= 24 * 60 * 60 * 1000 * 30 * 36; // Last 36 months
        case 'yearly':
          return true; // All trades
        default:
          return true;
      }
    });
    
    return filteredTrades;
  };

  const generateTimeSeriesData = (trades: Trade[], filter: TimeFilter) => {
    const filteredTrades = filterTradesByTime(trades, filter);
    const groupedData: { [key: string]: { wins: number; losses: number; breakeven: number } } = {};

    filteredTrades.forEach(trade => {
      const date = new Date(trade.createdAt);
      let key: string;

      switch (filter) {
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

      switch (trade.result) {
        case 'WIN':
          groupedData[key].wins++;
          break;
        case 'LOSS':
          groupedData[key].losses++;
          break;
        case 'BREAKEVEN':
          groupedData[key].breakeven++;
          break;
      }
    });

    return Object.entries(groupedData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        ...data,
        total: data.wins + data.losses + data.breakeven,
        winRate: data.wins + data.losses > 0 ? (data.wins / (data.wins + data.losses)) * 100 : 0,
      }));
  };

  const generatePieData = (trades: Trade[]) => {
    const filteredTrades = filterTradesByTime(trades, timeFilter);
    const wins = filteredTrades.filter(t => t.result === 'WIN').length;
    const losses = filteredTrades.filter(t => t.result === 'LOSS').length;
    const breakeven = filteredTrades.filter(t => t.result === 'BREAKEVEN').length;

    return [
      { name: 'Wins', value: wins, color: 'hsl(var(--success))' },
      { name: 'Losses', value: losses, color: 'hsl(var(--danger))' },
      { name: 'Breakeven', value: breakeven, color: 'hsl(var(--muted-foreground))' },
    ].filter(item => item.value > 0);
  };

  const timeSeriesData = useMemo(() => generateTimeSeriesData(trades, timeFilter), [trades, timeFilter]);
  const pieData = useMemo(() => generatePieData(trades), [trades, timeFilter]);

  const renderChart = useCallback(() => {
    const commonProps = {
      width: "100%" as const,
      height: 400,
      data: timeSeriesData,
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="wins" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                name="Wins"
              />
              <Line 
                type="monotone" 
                dataKey="losses" 
                stroke="hsl(var(--danger))" 
                strokeWidth={2}
                name="Losses"
              />
              <Line 
                type="monotone" 
                dataKey="breakeven" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                name="Breakeven"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="wins" 
                stackId="1"
                stroke="hsl(var(--success))" 
                fill="hsl(var(--success))"
                fillOpacity={0.6}
                name="Wins"
              />
              <Area 
                type="monotone" 
                dataKey="losses" 
                stackId="1"
                stroke="hsl(var(--danger))" 
                fill="hsl(var(--danger))"
                fillOpacity={0.6}
                name="Losses"
              />
              <Area 
                type="monotone" 
                dataKey="breakeven" 
                stackId="1"
                stroke="hsl(var(--muted-foreground))" 
                fill="hsl(var(--muted-foreground))"
                fillOpacity={0.6}
                name="Breakeven"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="wins" fill="hsl(var(--success))" name="Wins" />
              <Bar dataKey="losses" fill="hsl(var(--danger))" name="Losses" />
              <Bar dataKey="breakeven" fill="hsl(var(--muted-foreground))" name="Breakeven" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  }, [chartType, timeSeriesData, pieData]);

  const getWinRate = useCallback(() => {
    const filteredTrades = filterTradesByTime(trades, timeFilter);
    const wins = filteredTrades.filter(t => t.result === 'WIN').length;
    const losses = filteredTrades.filter(t => t.result === 'LOSS').length;
    const total = wins + losses;
    return total > 0 ? ((wins / total) * 100).toFixed(1) : '0';
  }, [trades, timeFilter]);

  const getTotalTrades = useCallback(() => {
    return filterTradesByTime(trades, timeFilter).length;
  }, [trades, timeFilter]);

  if (trades.length === 0) {
    return (
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Advanced Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No data available for analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Advanced Analytics
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Time Filter" />
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
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{getTotalTrades()}</div>
            <div className="text-xs text-muted-foreground">Total Trades</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{getWinRate()}%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {filterTradesByTime(trades, timeFilter).filter(t => t.result === 'WIN').length}
            </div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {filterTradesByTime(trades, timeFilter).filter(t => t.result === 'LOSS').length}
            </div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
});

AdvancedCharts.displayName = 'AdvancedCharts';

export default AdvancedCharts;