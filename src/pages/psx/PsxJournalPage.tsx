import PsxTradeForm from "@/components/psx/PsxTradeForm";
import { usePsxTrades } from "@/hooks/usePsxTrades";

const PsxJournalPage = () => {
  const { addTrade } = usePsxTrades();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            PSX Stock Journal
          </h1>
          <p className="text-muted-foreground mt-2">
            Record and analyze your Pakistan Stock Exchange trades
          </p>
        </div>

        <PsxTradeForm onAddTrade={addTrade} />
      </div>
    </div>
  );
};

export default PsxJournalPage;
