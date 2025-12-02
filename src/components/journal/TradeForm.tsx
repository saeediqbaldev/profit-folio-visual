import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineNumbersTextarea } from "@/components/ui/line-numbers-textarea";
import { Plus, Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStrategies } from "@/hooks/useStrategies";
import { z } from "zod";
import ProgressToast from "@/components/ui/progress-toast";

// Security: Input validation schema
const tradeSchema = z.object({
  strategy: z.string()
    .min(1, "Strategy is required"),
  entry: z.string()
    .trim()
    .min(1, "Entry price is required")
    .max(50, "Entry price must be less than 50 characters")
    .regex(/^[\d.]+$/, "Entry must be a valid number"),
  reason: z.string()
    .trim()
    .min(10, "Reason must be at least 10 characters")
    .max(2000, "Reason must be less than 2000 characters"),
  tp: z.string()
    .trim()
    .min(1, "Take profit is required")
    .max(500, "Take profit must be less than 500 characters"),
  sl: z.string()
    .trim()
    .min(1, "Stop loss is required")
    .max(50, "Stop loss must be less than 50 characters")
    .regex(/^[\d.]+$/, "Stop loss must be a valid number"),
  rr: z.string()
    .trim()
    .min(1, "Risk/Reward ratio is required")
    .max(20, "Risk/Reward ratio must be less than 20 characters"),
  result: z.enum(["WIN", "LOSS", "BE"], {
    required_error: "Please select a trade result"
  }),
  learning: z.string()
    .trim()
    .min(10, "Learning outcome must be at least 10 characters")
    .max(2000, "Learning outcome must be less than 2000 characters"),
  assetPair: z.string()
    .min(1, "Asset pair is required")
    .max(20, "Asset pair must be less than 20 characters"),
});

interface Trade {
  id: string;
  strategy: string;
  entry: string;
  reason: string;
  tp: string;
  sl: string;
  rr: string;
  result: string;
  learning: string;
  screenshot: string | null;
  afterTradeScreenshot: string | null;
  assetPair: string;
  createdAt: string;
}

interface TradeFormProps {
  onAddTrade: (trade: Omit<Trade, 'id' | 'createdAt'>) => Promise<void>;
}

const TradeForm = ({ onAddTrade }: TradeFormProps) => {
  const { toast } = useToast();
  const { strategies, loading: strategiesLoading } = useStrategies();
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    strategy: "",
    entry: "",
    reason: "",
    tp: "",
    sl: "",
    rr: "",
    result: "",
    learning: "",
    screenshot: null as string | null,
    afterTradeScreenshot: null as string | null,
    assetPair: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security: File validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PNG, JPG, or WEBP image.",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Image must be smaller than 5MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, screenshot: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAfterTradeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security: File validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PNG, JPG, or WEBP image.",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Image must be smaller than 5MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, afterTradeScreenshot: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setFormData(prev => ({ ...prev, screenshot: null }));
  };

  const removeAfterTradeScreenshot = () => {
    setFormData(prev => ({ ...prev, afterTradeScreenshot: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Security: Validate inputs with Zod schema
    try {
      tradeSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: firstError.message,
        });
        return;
      }
    }

    setSubmitting(true);
    setProgress(10);

    try {
      setProgress(30);
      await onAddTrade(formData);
      setProgress(80);
      
      // Reset form
      setFormData({
        strategy: "",
        entry: "",
        reason: "",
        tp: "",
        sl: "",
        rr: "",
        result: "",
        learning: "",
        screenshot: null,
        afterTradeScreenshot: null,
        assetPair: "",
      });

      setProgress(100);
      toast({
        title: "Trade added successfully!",
        description: "Your trade has been recorded in the journal.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add trade. Please try again.",
      });
    } finally {
      setTimeout(() => {
        setSubmitting(false);
        setProgress(0);
      }, 1000);
    }
  };

  return (
    <>
      <ProgressToast 
        title="Adding trade..." 
        progress={progress} 
        isVisible={submitting || progress > 0} 
      />
      
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Trade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Two Column Layout for Desktop */}
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
                  <Label htmlFor="assetPair">Asset Pair *</Label>
                  <Select
                    value={formData.assetPair}
                    onValueChange={(value) => handleInputChange('assetPair', value)}
                    required
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select asset pair" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XAUUSD">XAUUSD (Gold)</SelectItem>
                      <SelectItem value="BTCUSD">BTCUSD (Bitcoin)</SelectItem>
                      <SelectItem value="ETHUSD">ETHUSD (Ethereum)</SelectItem>
                      <SelectItem value="USOIL">USOIL (Oil)</SelectItem>
                      <SelectItem value="SILVER">SILVER</SelectItem>
                      <SelectItem value="EURUSD">EURUSD (Euro)</SelectItem>
                      <SelectItem value="GBPJPY">GBPJPY (Pound/Yen)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entry">Entry Price *</Label>
                  <Input
                    id="entry"
                    type="text"
                    placeholder="e.g., 1.2345"
                    value={formData.entry}
                    onChange={(e) => handleInputChange('entry', e.target.value)}
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sl">Stop Loss *</Label>
                  <Input
                    id="sl"
                    type="text"
                    placeholder="e.g., 1.2300"
                    value={formData.sl}
                    onChange={(e) => handleInputChange('sl', e.target.value)}
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rr">Risk Reward R/R *</Label>
                  <Input
                    id="rr"
                    type="text"
                    placeholder="e.g., 1:3"
                    value={formData.rr}
                    onChange={(e) => handleInputChange('rr', e.target.value)}
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tp">Take Profits *</Label>
                  <LineNumbersTextarea
                    value={formData.tp}
                    onChange={(e) => handleInputChange('tp', e.target.value)}
                    placeholder="Enter take profit levels:&#10;TP1: 1.2400&#10;TP2: 1.2450&#10;TP3: 1.2500"
                    className="min-h-[100px]"
                    required
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Trade Logic / Reason *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain your trade logic and reason for entry..."
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    className="min-h-[150px] resize-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="result">Trade Result *</Label>
                  <Select
                    value={formData.result}
                    onValueChange={(value) => handleInputChange('result', value)}
                    required
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select trade result" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WIN">WIN</SelectItem>
                      <SelectItem value="LOSS">LOSS</SelectItem>
                      <SelectItem value="BE">BE (Break Even)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learning">Learning Outcome *</Label>
                  <Textarea
                    id="learning"
                    placeholder="What did you learn from this trade?"
                    value={formData.learning}
                    onChange={(e) => handleInputChange('learning', e.target.value)}
                    className="min-h-[150px] resize-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Screenshot Uploads - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Setup Screenshot Upload */}
              <div className="space-y-2">
                <Label htmlFor="screenshot">Setup Screenshot</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('screenshot')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </Button>
                    <span className="text-sm text-muted-foreground">PNG, JPG only</span>
                  </div>
                  <input
                    id="screenshot"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {formData.screenshot && (
                    <div className="relative inline-block">
                      <img
                        src={formData.screenshot}
                        alt="Setup screenshot"
                        className="max-w-full max-h-48 rounded-lg border border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          const event = new CustomEvent('openLightbox', { detail: formData.screenshot });
                          window.dispatchEvent(event);
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-sm"
                        onClick={removeScreenshot}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* After Trade Screenshot Upload */}
              <div className="space-y-2">
                <Label htmlFor="afterTradeScreenshot">After Trade Screenshot</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('afterTradeScreenshot')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </Button>
                    <span className="text-sm text-muted-foreground">PNG, JPG only</span>
                  </div>
                  <input
                    id="afterTradeScreenshot"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleAfterTradeFileUpload}
                    className="hidden"
                  />
                  
                  {formData.afterTradeScreenshot && (
                    <div className="relative inline-block">
                      <img
                        src={formData.afterTradeScreenshot}
                        alt="After trade screenshot"
                        className="max-w-full max-h-48 rounded-lg border border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          const event = new CustomEvent('openLightbox', { detail: formData.afterTradeScreenshot });
                          window.dispatchEvent(event);
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-sm"
                        onClick={removeAfterTradeScreenshot}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-elegant transition-all duration-300"
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

export default TradeForm;