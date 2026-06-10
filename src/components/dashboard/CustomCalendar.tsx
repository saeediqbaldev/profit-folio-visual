import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DayStats {
  total: number;
  wins: number;
  losses: number;
  breakeven: number;
}

interface CustomCalendarProps {
  trades: Array<{
    created_at: string;
    trade_date?: string | null;
    result: string;
  }>;
  onDayClick?: (date: Date) => void;
}

const CustomCalendar = ({ trades, onDayClick }: CustomCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDayStats = useMemo(() => {
    const statsMap = new Map<string, DayStats>();
    trades.forEach(trade => {
      const dateSrc = trade.trade_date || trade.created_at;
      const tradeDate = format(new Date(dateSrc), 'yyyy-MM-dd');
      if (!statsMap.has(tradeDate)) statsMap.set(tradeDate, { total: 0, wins: 0, losses: 0, breakeven: 0 });
      const stats = statsMap.get(tradeDate)!;
      stats.total++;
      const result = trade.result?.toUpperCase() || '';
      if (result === 'WIN') stats.wins++;
      else if (result === 'LOSS') stats.losses++;
      else if (result === 'BE' || result === 'BREAKEVEN') stats.breakeven++;
    });
    return statsMap;
  }, [trades]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const getDayBackgroundClass = (stats: DayStats | undefined) => {
    if (!stats || stats.total === 0) return 'bg-card hover:bg-muted/50';
    const winRate = stats.total > 0 ? (stats.wins / stats.total) : 0;
    if (winRate > 0.6) return 'bg-success/10 hover:bg-success/20 border-success/30';
    if (winRate < 0.4 && stats.losses > 0) return 'bg-danger/10 hover:bg-danger/20 border-danger/30';
    return 'bg-muted/30 hover:bg-muted/50 border-muted-foreground/30';
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="h-10 w-10">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="h-10 w-10">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-full">
        <div className="hidden md:grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const stats = getDayStats.get(dateStr);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const clickable = !!onDayClick && (stats?.total || 0) > 0;
            return (
              <button
                type="button"
                key={index}
                onClick={() => clickable && onDayClick!(day)}
                disabled={!clickable}
                className={cn(
                  "min-h-[100px] md:min-h-[120px] p-2 md:p-3 rounded-lg border-2 transition-all duration-200 text-left",
                  getDayBackgroundClass(stats),
                  !isCurrentMonth && "opacity-40",
                  clickable ? "cursor-pointer hover:scale-[1.02]" : "cursor-default"
                )}
              >
                <div className="flex flex-col h-full">
                  <div className="text-sm md:text-base font-semibold text-foreground mb-1">{format(day, 'd')}</div>
                  {stats && stats.total > 0 && (
                    <div className="mt-auto space-y-0.5 md:space-y-1">
                      <div className="text-[10px] md:text-xs font-semibold text-foreground">T: {stats.total}</div>
                      <div className="text-[10px] md:text-xs text-success">W: {stats.wins}</div>
                      <div className="text-[10px] md:text-xs text-danger">L: {stats.losses}</div>
                      {stats.breakeven > 0 && (
                        <div className="text-[10px] md:text-xs text-muted-foreground">BE: {stats.breakeven}</div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CustomCalendar;
