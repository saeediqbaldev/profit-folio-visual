import { useState, useEffect, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";

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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading overview...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Trading Overview
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your daily trading performance at a glance
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "daily" ? "default" : "outline"}
            onClick={() => setViewMode("daily")}
          >
            Daily
          </Button>
          <Button
            variant={viewMode === "weekly" ? "default" : "outline"}
            onClick={() => setViewMode("weekly")}
          >
            Weekly
          </Button>
          <Button
            variant={viewMode === "monthly" ? "default" : "outline"}
            onClick={() => setViewMode("monthly")}
          >
            Monthly
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Trading Calendar</CardTitle>
              <CardDescription>
                {viewMode === "weekly" && "Monday to Friday view"}
                {viewMode === "monthly" && "Monthly overview"}
                {viewMode === "daily" && "Select a day to view details"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center p-6">
              <style>{`
                .calendar-wrapper .rdp {
                  --rdp-cell-size: 60px;
                  --rdp-accent-color: hsl(var(--primary));
                  margin: 0;
                }
                .calendar-wrapper .rdp-months {
                  width: 100%;
                }
                .calendar-wrapper .rdp-month {
                  width: 100%;
                }
                .calendar-wrapper .rdp-table {
                  width: 100%;
                  max-width: none;
                }
                .calendar-wrapper .rdp-cell {
                  width: 60px;
                  height: 60px;
                  padding: 2px;
                }
                .calendar-wrapper .rdp-day {
                  width: 56px;
                  height: 56px;
                  font-size: 14px;
                  border-radius: 8px;
                  position: relative;
                }
                .calendar-wrapper .rdp-day_selected {
                  background-color: hsl(var(--primary));
                  color: hsl(var(--primary-foreground));
                  font-weight: bold;
                }
              `}</style>
              <div className="calendar-wrapper w-full">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border-0 w-full"
                  modifiers={modifiers}
                  modifiersClassNames={modifiersClassNames}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                {viewMode === "daily" && format(selectedDate, 'MMM dd, yyyy')}
                {viewMode === "weekly" && `Week of ${format(getDateRange.start, 'MMM dd')}`}
                {viewMode === "monthly" && format(selectedDate, 'MMMM yyyy')}
              </CardTitle>
              <CardDescription>Trading Statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Trades</span>
                  <span className="text-2xl font-bold">{currentStats.total}</span>
                </div>
                <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                  <span className="text-sm">Winning Trades</span>
                  <span className="text-xl font-semibold">{currentStats.wins}</span>
                </div>
                <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                  <span className="text-sm">Losing Trades</span>
                  <span className="text-xl font-semibold">{currentStats.losses}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span className="text-sm">Breakeven Trades</span>
                  <span className="text-xl font-semibold">{currentStats.breakeven}</span>
                </div>
              </div>

              {currentStats.total > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Win Rate</span>
                    <span className="text-lg font-bold">
                      {((currentStats.wins / currentStats.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Color Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Color Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-green-500/80" />
                <span className="text-sm">High Win Rate (80%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-green-400/70" />
                <span className="text-sm">Good Win Rate (60-80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-green-300/60" />
                <span className="text-sm">Moderate Win Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-300/60" />
                <span className="text-sm">Moderate Loss Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-400/70" />
                <span className="text-sm">High Loss Rate (60-80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-500/80" />
                <span className="text-sm">Very High Loss Rate (80%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gray-400/60" />
                <span className="text-sm">Breakeven</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TradingOverviewPage;
