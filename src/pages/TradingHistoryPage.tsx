import { useState, useMemo } from "react";
import TradesList from "@/components/dashboard/TradesList";
import { useTrades } from "@/hooks/useTrades";
import CandleLoader from "@/components/ui/candle-loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SESSIONS } from "@/components/journal/TradeForm";

interface TradingHistoryPageProps {
  onViewTrade: (tradeId: string) => void;
}

const TradingHistoryPage = ({ onViewTrade }: TradingHistoryPageProps) => {
  const { trades, loading, updateTrade, deleteTrade } = useTrades();
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<string>("all");

  const strategies = useMemo(() => {
    const unique = new Set(trades.map(t => t.strategy).filter(Boolean));
    return ['all', ...Array.from(unique)] as string[];
  }, [trades]);

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (selectedStrategy !== 'all' && t.strategy !== selectedStrategy) return false;
      if (selectedSession !== 'all' && (t.session || '') !== selectedSession) return false;
      return true;
    });
  }, [trades, selectedStrategy, selectedSession]);

  if (loading && trades.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CandleLoader />
          <span className="text-muted-foreground">Loading trades...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Trading History
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">View and manage all your trading records</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Session" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {SESSIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TradesList
          trades={filteredTrades}
          strategies={strategies}
          selectedStrategy={selectedStrategy}
          onStrategyChange={setSelectedStrategy}
          onUpdateTrade={updateTrade}
          onDeleteTrade={deleteTrade}
          onViewTrade={onViewTrade}
        />
      </div>
    </div>
  );
};

export default TradingHistoryPage;
