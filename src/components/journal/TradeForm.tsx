import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineNumbersTextarea } from "@/components/ui/line-numbers-textarea";
import { Plus, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Trade {
  id: string;
  sno?: number;
  entry: string;
  reason: string;
  tp: string;
  sl: string;
  result: string;
  learning: string;
  screenshot: string | null;
  assetPair: string;
  createdAt: string;
}

interface TradeFormProps {
  onAddTrade: (trade: Omit<Trade, 'id' | 'createdAt' | 'sno'>) => void;
}

const TradeForm = ({ onAddTrade }: TradeFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    entry: "",
    reason: "",
    tp: "",
    sl: "",
    result: "",
    learning: "",
    screenshot: null as string | null,
    assetPair: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormData(prev => ({ ...prev, screenshot: e.target?.result as string }));
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a PNG or JPG image.",
        });
      }
    }
  };

  const removeScreenshot = () => {
    setFormData(prev => ({ ...prev, screenshot: null }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.entry || !formData.assetPair) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please fill in Entry and Asset Pair fields.",
      });
      return;
    }

    onAddTrade(formData);
    
    // Reset form
    setFormData({
      entry: "",
      reason: "",
      tp: "",
      sl: "",
      result: "",
      learning: "",
      screenshot: null,
      assetPair: "",
    });

    toast({
      title: "Trade added successfully!",
      description: "Your trade has been recorded in the journal.",
    });
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Asset Pair */}
            <div className="space-y-2">
              <Label htmlFor="assetPair">Asset Pair *</Label>
              <Select value={formData.assetPair} onValueChange={(value) => handleInputChange('assetPair', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select asset pair" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XAUUSD">XAUUSD</SelectItem>
                  <SelectItem value="BTCUSD">BTCUSD</SelectItem>
                  <SelectItem value="ETHUSD">ETHUSD</SelectItem>
                  <SelectItem value="USOIL">USOIL</SelectItem>
                  <SelectItem value="SILVER">SILVER</SelectItem>
                  <SelectItem value="EURUSD">EURUSD</SelectItem>
                  <SelectItem value="GBPJPY">GBPJPY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entry */}
            <div className="space-y-2">
              <Label htmlFor="entry">Entry Price *</Label>
              <Input
                id="entry"
                value={formData.entry}
                onChange={(e) => handleInputChange('entry', e.target.value)}
                placeholder="Entry price"
                required
              />
            </div>

            {/* SL */}
            <div className="space-y-2">
              <Label htmlFor="sl">Stop Loss (SL)</Label>
              <Input
                id="sl"
                value={formData.sl}
                onChange={(e) => handleInputChange('sl', e.target.value)}
                placeholder="Stop loss price"
              />
            </div>

            {/* Result */}
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <Label htmlFor="result">Result</Label>
              <Select value={formData.result} onValueChange={(value) => handleInputChange('result', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trade result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WIN">WIN</SelectItem>
                  <SelectItem value="LOSS">LOSS</SelectItem>
                  <SelectItem value="BREAKEVEN">BREAKEVEN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Take Profit with Line Numbers */}
          <div className="space-y-2">
            <Label htmlFor="tp">Take Profit Levels</Label>
            <LineNumbersTextarea
              id="tp"
              value={formData.tp}
              onChange={(e) => handleInputChange('tp', e.target.value)}
              placeholder="TP1: 2150.00&#10;TP2: 2160.00&#10;TP3: 2170.00"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">Enter each TP level on a new line</p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="Why did you enter this trade?"
              rows={3}
            />
          </div>

          {/* Learning */}
          <div className="space-y-2">
            <Label htmlFor="learning">Learning</Label>
            <Textarea
              id="learning"
              value={formData.learning}
              onChange={(e) => handleInputChange('learning', e.target.value)}
              placeholder="What did you learn from this trade?"
              rows={3}
            />
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <Label htmlFor="screenshot">Screenshot</Label>
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
                    alt="Trade screenshot"
                    className="max-w-full max-h-48 rounded-lg border border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      // This will be handled by the lightbox component
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

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-elegant transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Trade
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TradeForm;