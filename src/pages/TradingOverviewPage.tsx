import { useState, useEffect, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";
import CandleLoader from "@/components/ui/candle-loader";

interface Trade {
  id: string;
  result: string;
  created_at: string;
}

type ViewMode = "daily" | "weekly" | "monthly";

const TradingOverviewPage = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadTrades = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('trades')
          .select('id, result, created_at')
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

  const getDateRange = useMemo(() => {
    switch (viewMode) {
      case "weekly":
        return {
          start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
          end: endOfWeek(selectedDate, { weekStartsOn: 1 })
        };
      case "monthly":
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate)
        };
      default:
        return { start: selectedDate, end: selectedDate };
    }
  }, [viewMode, selectedDate]);

  const getDayStats = useMemo(() => {
    const statsMap = new Map();

    trades.forEach(trade => {
      const tradeDate = format(parseISO(trade.created_at), 'yyyy-MM-dd');
      if (!statsMap.has(tradeDate)) {
        statsMap.set(tradeDate, { total: 0, wins: 0, losses: 0, breakeven: 0 });
      }
      const stats = statsMap.get(tradeDate);
      stats.total++;
      
      const result = trade.result.toLowerCase();
      if (result.includes('win') || result.includes('profit')) {
        stats.wins++;
      } else if (result.includes('loss') || result.includes('lose')) {
        stats.losses++;
      } else {
        stats.breakeven++;
      }
    });

    return statsMap;
  }, [trades]);

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
      
      const winRate = stats.wins / stats.total;
      const lossRate = stats.losses / stats.total;

      let className = "";
      if (winRate > lossRate) {
        if (winRate >= 0.8) className = "bg-green-500/80 text-white hover:bg-green-600/80 font-bold";
        else if (winRate >= 0.6) className = "bg-green-400/70 text-white hover:bg-green-500/70 font-semibold";
        else className = "bg-green-300/60 hover:bg-green-400/60";
      } else if (lossRate > winRate) {
        if (lossRate >= 0.8) className = "bg-red-500/80 text-white hover:bg-red-600/80 font-bold";
        else if (lossRate >= 0.6) className = "bg-red-400/70 text-white hover:bg-red-500/70 font-semibold";
        else className = "bg-red-300/60 hover:bg-red-400/60";
      } else {
        className = "bg-gray-400/60 hover:bg-gray-500/60";
      }
      
      classNames[dateStr] = className;
    });
    
    return classNames;
  }, [getDayStats]);

  const currentStats = useMemo(() => {
    const stats = { total: 0, wins: 0, losses: 0, breakeven: 0 };
    
    if (viewMode === 'daily') {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayStats = getDayStats.get(dateStr);
      return dayStats || stats;
    }
    
    // For weekly and monthly views, aggregate stats across the range
    const { start, end } = getDateRange;
    getDayStats.forEach((dayStats, dateStr) => {
      const date = parseISO(dateStr);
      if (date >= start && date <= end) {
        stats.total += dayStats.total;
        stats.wins += dayStats.wins;
        stats.losses += dayStats.losses;
        stats.breakeven += dayStats.breakeven;
      }
    });
    
    return stats;
  }, [viewMode, selectedDate, getDayStats, getDateRange]);

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
                font-size: 1rem;
                font-weight: 600;
                padding: 1rem 0.5rem;
              }
              .calendar-box-view .rdp-cell {
                width: calc(100% / 7);
                height: 140px;
                padding: 6px;
              }
              .calendar-box-view .rdp-day {
                width: 100%;
                height: 100%;
                font-size: 20px;
                font-weight: 600;
                border-radius: 16px;
                border: 3px solid hsl(var(--border));
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 6px;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .calendar-box-view .rdp-day:hover {
                border-color: hsl(var(--primary));
                transform: translateY(-4px) scale(1.05);
                box-shadow: 0 8px 20px rgba(0,0,0,0.15);
                z-index: 10;
              }
              .calendar-box-view .rdp-day_selected {
                background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)));
                color: hsl(var(--primary-foreground));
                font-weight: bold;
                border-color: hsl(var(--primary));
                box-shadow: 0 4px 16px hsl(var(--primary) / 0.4);
              }
              .calendar-box-view .rdp-day_outside {
                opacity: 0.2;
              }
              .trade-stats {
                font-size: 13px;
                display: flex;
                gap: 8px;
                margin-top: 4px;
              }
              .win-badge {
                background: hsl(142 76% 36%);
                color: white;
                padding: 4px 10px;
                border-radius: 6px;
                font-weight: 700;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
              }
              .loss-badge {
                background: hsl(0 84% 60%);
                color: white;
                padding: 4px 10px;
                border-radius: 6px;
                font-weight: 700;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
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
                    return (
                      <div className="flex flex-col items-center justify-center w-full h-full">
                        <div className="text-lg font-semibold">{format(date, 'd')}</div>
                        {stats && stats.total > 0 && (
                          <div className="trade-stats">
                            {stats.wins > 0 && <span className="win-badge">{stats.wins}W</span>}
                            {stats.losses > 0 && <span className="loss-badge">{stats.losses}L</span>}
                          </div>
                        )}
                      </div>
                    );
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Stats */}
        {(() => {
          const dateStr = format(selectedDate, 'yyyy-MM-dd');
          const dayStats = getDayStats.get(dateStr);
          
          if (dayStats && dayStats.total > 0) {
            return (
              <Card>
                <CardHeader>
                  <CardTitle>{format(selectedDate, 'MMMM dd, yyyy')}</CardTitle>
                  <CardDescription>Daily Trading Statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Trades</div>
                      <div className="text-2xl font-bold">{dayStats.total}</div>
                    </div>
                    <div className="bg-green-500/10 p-4 rounded-lg">
                      <div className="text-sm text-green-600 dark:text-green-400">Wins</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{dayStats.wins}</div>
                    </div>
                    <div className="bg-red-500/10 p-4 rounded-lg">
                      <div className="text-sm text-red-600 dark:text-red-400">Losses</div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">{dayStats.losses}</div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Win Rate</div>
                      <div className="text-2xl font-bold">
                        {((dayStats.wins / dayStats.total) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
};

export default TradingOverviewPage;
