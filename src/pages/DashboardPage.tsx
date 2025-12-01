import { useState, useMemo } from "react";
import TradesList from "@/components/dashboard/TradesList";
import StatsCards from "@/components/dashboard/StatsCards";
import AdvancedCharts from "@/components/dashboard/AdvancedCharts";
import { useTrades } from "@/hooks/useTrades";
import CandleLoader from "@/components/ui/candle-loader";

interface DashboardPageProps {
  onViewTrade: (tradeId: string) => void;
}

const DashboardPage = ({ onViewTrade }: DashboardPageProps) => {
  const { trades, loading, updateTrade, deleteTrade } = useTrades();
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");

  // Get unique strategies from trades - memoized
  const strategies = useMemo(() => {
    const uniqueStrategies = new Set(trades.map(t => t.strategy).filter(Boolean));
    return ['all', ...Array.from(uniqueStrategies)] as string[];
  }, [trades]);

  // Filter trades by selected strategy - memoized
  const filteredTrades = useMemo(() => {
    if (selectedStrategy === 'all') return trades;
    return trades.filter(t => t.strategy === selectedStrategy);
  }, [trades, selectedStrategy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CandleLoader />
          <span className="text-muted-foreground">Loading dashboard...</span>
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
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              View and analyze all your trading records
            </p>
          </div>
        </div>

        <StatsCards trades={trades} />
        
        <AdvancedCharts trades={trades} />

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

export default DashboardPage;
