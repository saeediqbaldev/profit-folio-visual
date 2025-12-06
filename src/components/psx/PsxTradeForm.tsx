import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Loader2, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStrategies } from "@/hooks/useStrategies";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import ProgressToast from "@/components/ui/progress-toast";

// Stock symbols for PSX
const PSX_STOCKS = [
  "LUCK", "ENGRO", "HBL", "MCB", "UBL", "OGDC", "PPL", "PSO", "FFC", "HUBC",
  "KEL", "DGKC", "MLCF", "FCCL", "PIOC", "CHCC", "KOHC", "GWLC", "POWER", "NCPL",
  "EFERT", "FFBL", "FATIMA", "AKBL", "BAFL", "NBP", "ABL", "MEBL", "BAHL", "SILK",
  "TRG", "SYS", "NETSOL", "AVN", "TPL", "TPLP", "HCAR", "INDU", "MTL", "ATLH",
];

// Validation schema
const psxTradeSchema = z.object({
  strategy: z.string().min(1, "Strategy is required"),
  stockSymbol: z.string().min(1, "Stock symbol is required"),
  sharesPurchased: z.number().positive("Shares must be positive"),
  entryPrice: z.number().positive("Entry price must be positive"),
  tradeLogic: z.string().min(10, "Trade logic must be at least 10 characters").max(2000),
  tpExitPrice: z.number().nullable(),
});

interface PsxTradeFormProps {
  onAddTrade: (trade: {
    strategy: string;
    stockSymbol: string;
    sharesPurchased: number;
    entryPrice: number;
    tradeLogic: string;
    tpExitPrice: number | null;
    tradeDate: string;
  }) => Promise<any>;
}

const PsxTradeForm = ({ onAddTrade }: PsxTradeFormProps) => {
  const { toast } = useToast();
  const { strategies, loading: strategiesLoading } = useStrategies();
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState<"loading" | "success" | "error">("loading");
  const [tradeDate, setTradeDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    strategy: "",
    stockSymbol: "",
    sharesPurchased: "",
    entryPrice: "",
    tradeLogic: "",
    tpExitPrice: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    try {
      psxTradeSchema.parse({
        ...formData,
        sharesPurchased: parseFloat(formData.sharesPurchased) || 0,
        entryPrice: parseFloat(formData.entryPrice) || 0,
        tpExitPrice: formData.tpExitPrice ? parseFloat(formData.tpExitPrice) : null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0].message,
        });
        return;
      }
    }

    setSubmitting(true);
    setProgress(5);
    setProgressStatus("loading");

    try {
      setProgress(25);
      await onAddTrade({
        strategy: formData.strategy,
        stockSymbol: formData.stockSymbol,
        sharesPurchased: parseInt(formData.sharesPurchased),
        entryPrice: parseFloat(formData.entryPrice),
        tradeLogic: formData.tradeLogic,
        tpExitPrice: formData.tpExitPrice ? parseFloat(formData.tpExitPrice) : null,
        tradeDate: tradeDate ? format(tradeDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      });
      setProgress(90);
      
      // Reset form
      setFormData({
        strategy: "",
        stockSymbol: "",
        sharesPurchased: "",
        entryPrice: "",
        tradeLogic: "",
        tpExitPrice: "",
      });
      setTradeDate(new Date());

      setProgress(100);
      setProgressStatus("success");
    } catch (error) {
      setProgressStatus("error");
    } finally {
      setTimeout(() => {
        setSubmitting(false);
        setProgress(0);
      }, 2000);
    }
  };

  return (
    <>
      <ProgressToast 
        title="Adding trade..." 
        progress={progress} 
        isVisible={submitting || progress > 0}
        status={progressStatus}
        message={progressStatus === "success" ? "Trade added!" : progressStatus === "error" ? "Failed to add trade" : "Saving your trade..."}
      />
      
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add PSX Stock Trade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="strategy">Strategy *</Label>
                  <Select
                    value={formData.strategy}
                    onValueChange={(value) => handleInputChange('strategy', value)}
                    required
                    disabled={strategiesLoading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={strategiesLoading ? "Loading..." : "Select strategy"} />
                    </SelectTrigger>
                    <SelectContent>
                      {strategies.map((strategy) => (
                        <SelectItem key={strategy} value={strategy}>
                          {strategy}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stockSymbol">Stock Symbol *</Label>
                  <Select
                    value={formData.stockSymbol}
                    onValueChange={(value) => handleInputChange('stockSymbol', value)}
                    required
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select stock" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {PSX_STOCKS.map((stock) => (
                        <SelectItem key={stock} value={stock}>
                          {stock}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Trade Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-11 justify-start text-left font-normal",
                          !tradeDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tradeDate ? format(tradeDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={tradeDate}
                        onSelect={setTradeDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sharesPurchased">Shares Purchased *</Label>
                  <Input
                    id="sharesPurchased"
                    type="number"
                    placeholder="e.g., 100"
                    value={formData.sharesPurchased}
                    onChange={(e) => handleInputChange('sharesPurchased', e.target.value)}
                    className="h-11"
                    required
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entryPrice">Entry Price (PKR) *</Label>
                  <Input
                    id="entryPrice"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 150.50"
                    value={formData.entryPrice}
                    onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tpExitPrice">TP / Exit Price (PKR)</Label>
                  <Input
                    id="tpExitPrice"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 175.00 (leave empty if open)"
                    value={formData.tpExitPrice}
                    onChange={(e) => handleInputChange('tpExitPrice', e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for pending trades. P&L will auto-calculate when filled.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tradeLogic">Trade Logic / Reason *</Label>
              <Textarea
                id="tradeLogic"
                placeholder="Explain your trade logic and reason for entry..."
                value={formData.tradeLogic}
                onChange={(e) => handleInputChange('tradeLogic', e.target.value)}
                className="min-h-[150px] resize-none"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full md:w-1/4 bg-gradient-to-r from-primary to-primary-glow hover:shadow-elegant transition-all duration-300"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Trade...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Trade
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default PsxTradeForm;
