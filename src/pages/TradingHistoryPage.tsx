import { useState, useMemo } from "react";
import TradesList from "@/components/dashboard/TradesList";
import { useTrades } from "@/hooks/useTrades";
import CandleLoader from "@/components/ui/candle-loader";
import ProgressToast from "@/components/ui/progress-toast";

interface TradingHistoryPageProps {
  onViewTrade: (tradeId: string) => void;
}

const TradingHistoryPage = ({ onViewTrade }: TradingHistoryPageProps) => {
  const { trades, loading, progress, status, updateTrade, deleteTrade } = useTrades();
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<"loading" | "success" | "error">("loading");

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

  // Handle trade update with progress
  const handleUpdateTrade = async (trade: any) => {
    setUpdateProgress(5);
    setUpdateStatus("loading");
    await updateTrade(trade, (p, s) => {
      setUpdateProgress(p);
      if (s) setUpdateStatus(s);
    });
    setTimeout(() => setUpdateProgress(0), 2000);
  };

  // Show loader only on initial load when no trades exist
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
      {/* Loading progress toast */}
      <ProgressToast 
        title="Loading trades..." 
        progress={progress} 
        isVisible={progress > 0 && progress < 100} 
        status={status}
        message={status === "success" ? "Trades loaded!" : status === "error" ? "Failed to load" : "Fetching your trades..."}
      />
      
      {/* Update progress toast */}
      <ProgressToast 
        title="Updating trade..." 
        progress={updateProgress} 
        isVisible={updateProgress > 0} 
        status={updateStatus}
        message={updateStatus === "success" ? "Trade updated!" : updateStatus === "error" ? "Update failed" : "Saving changes..."}
      />
      
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Trading History
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              View and manage all your trading records
            </p>
          </div>
        </div>

        <TradesList 
          trades={filteredTrades}
          strategies={strategies}
          selectedStrategy={selectedStrategy}
          onStrategyChange={setSelectedStrategy}
          onUpdateTrade={handleUpdateTrade}
          onDeleteTrade={deleteTrade}
          onViewTrade={onViewTrade}
        />
      </div>
    </div>
  );
};

export default TradingHistoryPage;
