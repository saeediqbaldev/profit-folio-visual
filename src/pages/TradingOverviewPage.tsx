import { useState, useEffect, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import CandleLoader from "@/components/ui/candle-loader";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface Trade {
  id: string;
  result: string;
  created_at: string;
  strategy?: string;
}

const TradingOverviewPage = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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
    return ['all', ...Array.from(uniqueStrategies)];
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
    { name: 'Wins', value: strategyStats.wins, color: 'hsl(142 76% 36%)' },
    { name: 'Losses', value: strategyStats.losses, color: 'hsl(0 84% 60%)' },
    { name: 'Breakeven', value: strategyStats.breakeven, color: 'hsl(var(--muted-foreground))' },
  ].filter(item => item.value > 0), [strategyStats]);

  const getDayStats = useMemo(() => {
    const statsMap = new Map();

    filteredTrades.forEach(trade => {
      const tradeDate = format(parseISO(trade.created_at), 'yyyy-MM-dd');
      if (!statsMap.has(tradeDate)) {
        statsMap.set(tradeDate, { total: 0, wins: 0, losses: 0, breakeven: 0, pnl: 0 });
      }
      const stats = statsMap.get(tradeDate);
      stats.total++;
      
      const result = trade.result.toLowerCase();
      if (result.includes('win') || result.includes('profit')) {
        stats.wins++;
        stats.pnl += Math.random() * 5000 + 500; // Mock P/L calculation
      } else if (result.includes('loss') || result.includes('lose')) {
        stats.losses++;
        stats.pnl -= Math.random() * 5000 + 500; // Mock P/L calculation
      } else {
        stats.breakeven++;
      }
    });

    return statsMap;
  }, [filteredTrades]);

  const modifiers = useMemo(() => {
    const bookedDays: Date[] = [];
    getDayStats.forEach((_, dateStr) => {
      bookedDays.push(parseISO(dateStr));
    });
    return { booked: bookedDays };
  }, [getDayStats]);

  const modifiersClassNames = useMemo(() => {
    const classNames: Record<string, string> = {};
    
    getDayStats.forEach((stats, dateStr) => {
      if (stats.total === 0) return;

      let className = "";
      if (stats.pnl > 0) {
        className = "bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500/40";
      } else if (stats.pnl < 0) {
        className = "bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/40";
      } else {
        className = "bg-gray-400/20 hover:bg-gray-500/30 border-2 border-gray-400/40";
      }
      
      classNames[dateStr] = className;
    });
    
    return classNames;
  }, [getDayStats]);


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
            TradeZilla Calendar
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
                <div className="bg-green-500/10 p-3 rounded-lg">
                  <div className="text-sm text-green-600 dark:text-green-400">Wins</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{strategyStats.wins}</div>
                </div>
                <div className="bg-red-500/10 p-3 rounded-lg">
                  <div className="text-sm text-red-600 dark:text-red-400">Losses</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{strategyStats.losses}</div>
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
              <CardTitle>Strategy Distribution</CardTitle>
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
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle>Strategy Breakdown</CardTitle>
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
                  <Bar dataKey="wins" fill="hsl(142 76% 36%)" name="Wins" />
                  <Bar dataKey="losses" fill="hsl(0 84% 60%)" name="Losses" />
                  <Bar dataKey="breakeven" fill="hsl(var(--muted-foreground))" name="Breakeven" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-2xl border-2 border-border/50">
          <CardContent className="p-4 md:p-8">
            <style>{`
              .calendar-box-view .rdp {
                --rdp-cell-size: 120px;
                margin: 0;
                width: 100%;
              }
              .calendar-box-view .rdp-months {
                width: 100%;
              }
              .calendar-box-view .rdp-month {
                width: 100%;
              }
              .calendar-box-view .rdp-caption {
                font-size: 1.5rem;
                font-weight: bold;
                margin-bottom: 1.5rem;
              }
              .calendar-box-view .rdp-table {
                width: 100%;
                max-width: none;
              }
              .calendar-box-view .rdp-head_cell {
                font-size: 0.875rem;
                font-weight: 600;
                padding: 0.75rem 0.5rem;
                color: hsl(var(--muted-foreground));
              }
              .calendar-box-view .rdp-cell {
                width: calc(100% / 7);
                height: 140px;
                padding: 4px;
              }
              .calendar-box-view .rdp-day {
                width: 100%;
                height: 100%;
                font-size: 16px;
                font-weight: 600;
                border-radius: 12px;
                border: 1px solid hsl(var(--border));
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                justify-content: flex-start;
                padding: 12px;
                gap: 4px;
                transition: all 0.2s ease;
                background: hsl(var(--card));
              }
              .calendar-box-view .rdp-day:hover {
                border-color: hsl(var(--primary));
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 10;
              }
              .calendar-box-view .rdp-day_selected {
                border: 2px solid hsl(var(--primary));
                box-shadow: 0 2px 8px hsl(var(--primary) / 0.3);
              }
              .calendar-box-view .rdp-day_outside {
                opacity: 0.3;
              }
              .pnl-amount {
                font-size: 16px;
                font-weight: 700;
                margin-top: 4px;
              }
              .pnl-positive {
                color: hsl(142 76% 36%);
              }
              .pnl-negative {
                color: hsl(0 84% 60%);
              }
              .trade-count {
                font-size: 12px;
                color: hsl(var(--muted-foreground));
                margin-top: 2px;
              }
              @media (max-width: 1024px) {
                .calendar-box-view .rdp-cell {
                  height: 100px;
                }
                .calendar-box-view .rdp-day {
                  font-size: 16px;
                }
                .trade-stats {
                  font-size: 11px;
                  gap: 6px;
                }
                .win-badge, .loss-badge {
                  padding: 3px 8px;
                }
              }
              @media (max-width: 768px) {
                .calendar-box-view .rdp-cell {
                  height: 80px;
                }
                .calendar-box-view .rdp-day {
                  font-size: 14px;
                }
                .calendar-box-view .rdp-caption {
                  font-size: 1.2rem;
                }
                .trade-stats {
                  font-size: 9px;
                  gap: 4px;
                }
                .win-badge, .loss-badge {
                  padding: 2px 6px;
                }
              }
            `}</style>
            <div className="calendar-box-view">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border-0 w-full"
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                components={{
                  DayContent: ({ date }) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const stats = getDayStats.get(dateStr);
                    
                    const formatPnL = (amount: number) => {
                      const absAmount = Math.abs(amount);
                      if (absAmount >= 1000) {
                        return `${amount < 0 ? '-' : ''}$${(absAmount / 1000).toFixed(2)}K`;
                      }
                      return `${amount < 0 ? '-' : ''}$${absAmount.toFixed(0)}`;
                    };
                    
                    return (
                      <div className="flex flex-col items-start w-full h-full">
                        <div className="text-sm font-semibold text-muted-foreground">{format(date, 'd')}</div>
                        {stats && stats.total > 0 && (
                          <>
                            <div className={`pnl-amount ${stats.pnl > 0 ? 'pnl-positive' : stats.pnl < 0 ? 'pnl-negative' : ''}`}>
                              {formatPnL(stats.pnl)}
                            </div>
                            <div className="trade-count">{stats.total} trade{stats.total !== 1 ? 's' : ''}</div>
                          </>
                        )}
                      </div>
                    );
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TradingOverviewPage;
