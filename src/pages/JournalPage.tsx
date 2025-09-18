import { useState, useEffect } from "react";
import TradeForm from "@/components/journal/TradeForm";
import TradeList from "@/components/journal/TradeList";

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

const JournalPage = () => {
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

  // Save trades to localStorage whenever trades change
  useEffect(() => {
    localStorage.setItem('tradingJournalTrades', JSON.stringify(trades));
  }, [trades]);

  const handleAddTrade = (tradeData: Omit<Trade, 'id' | 'createdAt'>) => {
    const newTrade: Trade = {
      ...tradeData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setTrades(prev => [newTrade, ...prev]);
  };

  const handleDeleteTrade = (id: string) => {
    setTrades(prev => prev.filter(trade => trade.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Trading Journal
          </h1>
          <p className="text-muted-foreground mt-2">
            Record and analyze your trading decisions
          </p>
        </div>

        <TradeForm onAddTrade={handleAddTrade} />
        <TradeList trades={trades} onDeleteTrade={handleDeleteTrade} />
      </div>
    </div>
  );
};

export default JournalPage;