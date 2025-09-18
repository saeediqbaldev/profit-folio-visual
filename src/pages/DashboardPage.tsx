import { useState, useEffect } from "react";
import StatsCards from "@/components/dashboard/StatsCards";
import TradeChart from "@/components/dashboard/TradeChart";

interface Trade {
  id: string;
  sno: string;
  entry: string;
  reason: string;
  tp: string;
  sl: string;
  result: string;
  learning: string;
  screenshot: string | null;
  tradeResult: string;
  createdAt: string;
}

const DashboardPage = () => {
  const [trades, setTrades] = useState<Trade[]>([]);

  // Load trades from localStorage on component mount
  useEffect(() => {
    const savedTrades = localStorage.getItem('tradingJournalTrades');
    if (savedTrades) {
      try {
        setTrades(JSON.parse(savedTrades));
      } catch (error) {
        console.error('Error loading trades from localStorage:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Analyze your trading performance and statistics
          </p>
        </div>

        <StatsCards trades={trades} />
        <TradeChart trades={trades} />
      </div>
    </div>
  );
};

export default DashboardPage;