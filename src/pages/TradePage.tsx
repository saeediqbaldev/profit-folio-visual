import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import CandleLoader from "@/components/ui/candle-loader";

interface TradePageProps {
  tradeId: string;
  onBack: () => void;
}

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
  afterTradeScreenshot: string | null;
  assetPair: string;
  rr: string;
  createdAt: string;
}

const TradePage = ({ tradeId, onBack }: TradePageProps) => {
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadTrade();
  }, [tradeId, user]);

  const loadTrade = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading trade:', error);
        toast({
          variant: "destructive",
          title: "Error loading trade",
          description: "Failed to load trade details.",
        });
      } else {
        setTrade({
          id: data.id,
          sno: data.sno,
          entry: data.entry,
          reason: data.reason || '',
          tp: data.tp || '',
          sl: data.sl || '',
          result: data.result || '',
          learning: data.learning || '',
          screenshot: data.screenshot_url,
          afterTradeScreenshot: data.after_trade_screenshot_url,
          assetPair: data.asset_pair || '',
          rr: data.rr || '',
          createdAt: data.created_at,
        });
      }
    } catch (error) {
      console.error('Error loading trade:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = useCallback(async (file: File, field: 'screenshot' | 'afterTradeScreenshot') => {
    if (!user || !trade) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Only PNG, JPEG, JPG, and WEBP images are allowed.",
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "File size must be less than 5MB.",
      });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${tradeId}-${field}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('trade_screenshots')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Use signed URL for private bucket (expires in 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('trade_screenshots')
        .createSignedUrl(fileName, 3600);

      if (signedUrlError) throw signedUrlError;

      setTrade(prev => prev ? { ...prev, [field]: signedUrlData.signedUrl } : null);

      toast({
        title: "Success",
        description: "Screenshot uploaded successfully.",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload screenshot.",
      });
    }
  }, [user, trade, tradeId, toast]);

  const handleRemoveScreenshot = useCallback((field: 'screenshot' | 'afterTradeScreenshot') => {
    setTrade(prev => prev ? { ...prev, [field]: null } : null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!user || !trade) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('trades')
        .update({
          entry: trade.entry,
          reason: trade.reason,
          tp: trade.tp,
          sl: trade.sl,
          result: trade.result,
          learning: trade.learning,
          asset_pair: trade.assetPair,
          rr: trade.rr,
          screenshot_url: trade.screenshot,
          after_trade_screenshot_url: trade.afterTradeScreenshot,
        })
        .eq('id', trade.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating trade:', error);
        toast({
          variant: "destructive",
          title: "Error updating trade",
          description: "Failed to save changes.",
        });
      } else {
        toast({
          title: "Trade updated",
          description: "Changes saved successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating trade:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setSaving(false);
    }
  }, [user, trade, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CandleLoader />
          <span className="text-muted-foreground">Loading trade...</span>
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <Card className="p-6">
          <p className="text-muted-foreground">Trade not found</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Trade #{trade.sno || 'N/A'}
          </h1>
        </div>

        <Card className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assetPair">Asset Pair</Label>
              <Input
                id="assetPair"
                value={trade.assetPair}
                onChange={(e) => setTrade({ ...trade, assetPair: e.target.value })}
                placeholder="e.g., BTC/USD"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry">Entry</Label>
              <Input
                id="entry"
                value={trade.entry}
                onChange={(e) => setTrade({ ...trade, entry: e.target.value })}
                placeholder="Entry price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tp">Take Profit</Label>
              <Input
                id="tp"
                value={trade.tp}
                onChange={(e) => setTrade({ ...trade, tp: e.target.value })}
                placeholder="TP price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sl">Stop Loss</Label>
              <Input
                id="sl"
                value={trade.sl}
                onChange={(e) => setTrade({ ...trade, sl: e.target.value })}
                placeholder="SL price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rr">Risk Reward R/R</Label>
              <Input
                id="rr"
                value={trade.rr}
                onChange={(e) => setTrade({ ...trade, rr: e.target.value })}
                placeholder="e.g., 1:3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Entry</Label>
            <Textarea
              id="reason"
              value={trade.reason}
              onChange={(e) => setTrade({ ...trade, reason: e.target.value })}
              placeholder="Why did you enter this trade?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="result">Result</Label>
            <Textarea
              id="result"
              value={trade.result}
              onChange={(e) => setTrade({ ...trade, result: e.target.value })}
              placeholder="What was the outcome?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="learning">Learning</Label>
            <Textarea
              id="learning"
              value={trade.learning}
              onChange={(e) => setTrade({ ...trade, learning: e.target.value })}
              placeholder="What did you learn?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Setup Screenshot</Label>
              {trade.screenshot ? (
                <div className="relative">
                  <img
                    src={trade.screenshot}
                    alt="Trade setup"
                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openLightbox', { detail: trade.screenshot }));
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveScreenshot('screenshot')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="setup-screenshot"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'screenshot');
                    }}
                  />
                  <label htmlFor="setup-screenshot" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload</p>
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>After Trade Screenshot</Label>
              {trade.afterTradeScreenshot ? (
                <div className="relative">
                  <img
                    src={trade.afterTradeScreenshot}
                    alt="After trade"
                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openLightbox', { detail: trade.afterTradeScreenshot }));
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveScreenshot('afterTradeScreenshot')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="after-screenshot"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'afterTradeScreenshot');
                    }}
                  />
                  <label htmlFor="after-screenshot" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload</p>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TradePage;
