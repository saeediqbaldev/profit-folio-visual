import TradeForm from "@/components/journal/TradeForm";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Trade {
  id: string;
  strategy: string;
  entry: string;
  reason: string;
  tp: string;
  sl: string;
  result: string;
  learning: string;
  screenshot: string | null;
  afterTradeScreenshot: string | null;
  assetPair: string;
  rr: string;
  createdAt: string;
  tradeDate?: string;
}

const JournalPage = () => {
  const { toast } = useToast();

  const handleAddTrade = async (tradeData: Omit<Trade, "id" | "createdAt">) => {
    try {
      await api.post("/api/trades", {
        strategy: tradeData.strategy,
        entry: tradeData.entry,
        reason: tradeData.reason,
        tp: tradeData.tp,
        sl: tradeData.sl,
        result: tradeData.result,
        learning: tradeData.learning,
        asset_pair: tradeData.assetPair,
        rr: tradeData.rr,
        screenshot_url: tradeData.screenshot,
        after_trade_screenshot_url: tradeData.afterTradeScreenshot,
        trade_date: tradeData.tradeDate || null,
      });
      toast({ title: "Trade added", description: "Successfully saved." });
    } catch (error) {
      console.error("Error adding trade:", error);
      toast({ variant: "destructive", title: "Error adding trade", description: "Failed to save." });
    }
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
      </div>
    </div>
  );
};

export default JournalPage;
