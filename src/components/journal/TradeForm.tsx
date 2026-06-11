import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineNumbersTextarea } from "@/components/ui/line-numbers-textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Upload, X, Loader2, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStrategies } from "@/hooks/useStrategies";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export const ASSET_PAIRS = [
  { value: "XAUUSD", label: "XAUUSD (Gold)" },
  { value: "BTCUSD", label: "BTCUSD (Bitcoin)" },
  { value: "ETHUSD", label: "ETHUSD (Ethereum)" },
  { value: "USOIL", label: "USOIL (Oil)" },
  { value: "SILVER", label: "SILVER" },
  { value: "EURUSD", label: "EURUSD (Euro)" },
  { value: "GBPJPY", label: "GBPJPY (Pound/Yen)" },
  { value: "USDCHF", label: "USDCHF" },
  { value: "AUDCHF", label: "AUDCHF" },
  { value: "AUDCAD", label: "AUDCAD" },
  { value: "AUDUSD", label: "AUDUSD" },
  { value: "AUDJPY", label: "AUDJPY" },
];

export const SESSIONS = [
  { value: "Asian Session", label: "Asian Session" },
  { value: "London Session", label: "London Session" },
  { value: "NewYork Session", label: "NewYork Session" },
];

const tradeSchema = z.object({
  strategy: z.string().min(1, "Strategy is required"),
  entry: z.string().trim().min(1, "Entry price is required").max(50).regex(/^[\d.]+$/, "Entry must be a valid number"),
  reason: z.string().trim().min(10, "Reason must be at least 10 characters").max(2000),
  tp: z.string().trim().min(1, "Take profit is required").max(500),
  sl: z.string().trim().min(1, "Stop loss is required").max(50).regex(/^[\d.]+$/, "Stop loss must be a valid number"),
  rr: z.string().trim().min(1, "Risk/Reward ratio is required").max(20),
  result: z.enum(["WIN", "LOSS", "BE"], { required_error: "Please select a trade result" }),
  learning: z.string().trim().min(10, "Learning outcome must be at least 10 characters").max(2000),
  assetPair: z.string().min(1, "Asset pair is required").max(20),
});

interface TradeFormProps {
  onAddTrade: (trade: any) => Promise<void>;
}

const TradeForm = ({ onAddTrade }: TradeFormProps) => {
  const { toast } = useToast();
  const { strategies, loading: strategiesLoading } = useStrategies();
  const [submitting, setSubmitting] = useState(false);
  const [tradeDate, setTradeDate] = useState<Date | undefined>(undefined);
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
    session: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>, field: 'screenshot' | 'afterTradeScreenshot') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX = 5 * 1024 * 1024;
    const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!ALLOWED.includes(file.type)) {
      toast({ variant: "destructive", title: "Invalid file type", description: "PNG, JPG or WEBP only." });
      return;
    }
    if (file.size > MAX) {
      toast({ variant: "destructive", title: "File too large", description: "Max 5MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setFormData(prev => ({ ...prev, [field]: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      tradeSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ variant: "destructive", title: "Validation Error", description: error.errors[0].message });
        return;
      }
    }

    setSubmitting(true);
    try {
      await onAddTrade({
        ...formData,
        tradeDate: tradeDate ? format(tradeDate, 'yyyy-MM-dd') : undefined,
      });
      setFormData({
        strategy: "", entry: "", reason: "", tp: "", sl: "", rr: "", result: "",
        learning: "", screenshot: null, afterTradeScreenshot: null, assetPair: "", session: "",
      });
      setTradeDate(undefined);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to add trade." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Trade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Strategy *</Label>
                <Select value={formData.strategy} onValueChange={(v) => handleInputChange('strategy', v)} required disabled={strategiesLoading}>
                  <SelectTrigger className="h-11"><SelectValue placeholder={strategiesLoading ? "Loading..." : "Select strategy"} /></SelectTrigger>
                  <SelectContent>
                    {strategies.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Asset Pair *</Label>
                <Select value={formData.assetPair} onValueChange={(v) => handleInputChange('assetPair', v)} required>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select asset pair" /></SelectTrigger>
                  <SelectContent>
                    {ASSET_PAIRS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Session</Label>
                <Select value={formData.session} onValueChange={(v) => handleInputChange('session', v)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select session" /></SelectTrigger>
                  <SelectContent>
                    {SESSIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trade Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full h-11 justify-start text-left font-normal", !tradeDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {tradeDate ? format(tradeDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={tradeDate} onSelect={setTradeDate} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Entry Price *</Label>
                <Input type="text" placeholder="e.g., 1.2345" value={formData.entry} onChange={(e) => handleInputChange('entry', e.target.value)} className="h-11" required />
              </div>

              <div className="space-y-2">
                <Label>Stop Loss *</Label>
                <Input type="text" placeholder="e.g., 1.2300" value={formData.sl} onChange={(e) => handleInputChange('sl', e.target.value)} className="h-11" required />
              </div>

              <div className="space-y-2">
                <Label>Risk Reward R/R *</Label>
                <Input type="text" placeholder="e.g., 1:3" value={formData.rr} onChange={(e) => handleInputChange('rr', e.target.value)} className="h-11" required />
              </div>

              <div className="space-y-2">
                <Label>Take Profits *</Label>
                <LineNumbersTextarea value={formData.tp} onChange={(e) => handleInputChange('tp', e.target.value)}
                  placeholder="TP1: 1.2400&#10;TP2: 1.2450&#10;TP3: 1.2500" className="min-h-[100px]" required />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Trade Logic / Reason *</Label>
                <Textarea placeholder="Explain your trade logic..." value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)} className="min-h-[150px] resize-none" required />
              </div>

              <div className="space-y-2">
                <Label>Trade Result *</Label>
                <Select value={formData.result} onValueChange={(v) => handleInputChange('result', v)} required>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select trade result" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WIN">WIN</SelectItem>
                    <SelectItem value="LOSS">LOSS</SelectItem>
                    <SelectItem value="BE">BE (Break Even)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Learning Outcome *</Label>
                <Textarea placeholder="What did you learn?" value={formData.learning}
                  onChange={(e) => handleInputChange('learning', e.target.value)} className="min-h-[150px] resize-none" required />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['screenshot', 'afterTradeScreenshot'] as const).map((field) => (
              <div key={field} className="space-y-2">
                <Label>{field === 'screenshot' ? 'Setup Screenshot' : 'After Trade Screenshot'}</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" onClick={() => document.getElementById(`f-${field}`)?.click()} className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />Upload Image
                    </Button>
                    <span className="text-sm text-muted-foreground">PNG, JPG only</span>
                  </div>
                  <input id={`f-${field}`} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(e) => handleImage(e, field)} className="hidden" />
                  {formData[field] && (
                    <div className="relative inline-block">
                      <img src={formData[field] as string} alt="" className="max-w-full max-h-48 rounded-lg border border-border shadow-sm cursor-pointer hover:shadow-md"
                        onClick={() => window.dispatchEvent(new CustomEvent('openLightbox', { detail: formData[field] }))} />
                      <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={() => setFormData(p => ({ ...p, [field]: null }))}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" disabled={submitting} className="w-full md:w-1/4 bg-gradient-to-r from-primary to-primary-glow hover:shadow-elegant transition-all duration-300">
            {submitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</>) : (<><Plus className="h-4 w-4 mr-2" />Add Trade</>)}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TradeForm;
