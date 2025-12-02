import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, X, Edit, Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import CandleLoader from "@/components/ui/candle-loader";
import ProgressToast from "@/components/ui/progress-toast";

interface TradePageProps {
  tradeId: string;
  onBack: () => void;
  viewOnly?: boolean;
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
  strategy?: string;
  createdAt: string;
}

const TradePage = ({ tradeId, onBack, viewOnly = false }: TradePageProps) => {
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(!viewOnly);
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
          strategy: data.strategy || '',
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
    if (!user || !trade || !isEditing) return;

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
  }, [user, trade, tradeId, toast, isEditing]);

  const handleRemoveScreenshot = useCallback((field: 'screenshot' | 'afterTradeScreenshot') => {
    if (!isEditing) return;
    setTrade(prev => prev ? { ...prev, [field]: null } : null);
  }, [isEditing]);

  const handleSave = useCallback(async () => {
    if (!user || !trade) return;

    setSaving(true);
    setSaveProgress(10);
    
    try {
      setSaveProgress(30);
      
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

      setSaveProgress(80);

      if (error) {
        console.error('Error updating trade:', error);
        toast({
          variant: "destructive",
          title: "Error updating trade",
          description: "Failed to save changes.",
        });
      } else {
        setSaveProgress(100);
        toast({
          title: "Trade updated",
          description: "Changes saved successfully.",
        });
        setIsEditing(false);
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
      setTimeout(() => setSaveProgress(0), 1000);
    }
  }, [user, trade, toast]);

  const getResultIcon = (result: string) => {
    const normalizedResult = result?.toUpperCase();
    switch (normalizedResult) {
      case 'WIN':
        return <TrendingUp className="h-5 w-5 text-success" />;
      case 'LOSS':
        return <TrendingDown className="h-5 w-5 text-danger" />;
      case 'BE':
      case 'BREAKEVEN':
        return <Minus className="h-5 w-5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getResultBadge = (result: string) => {
    const normalizedResult = result?.toUpperCase();
    switch (normalizedResult) {
      case 'WIN':
        return <Badge className="bg-success/10 text-success border-success/20">WIN</Badge>;
      case 'LOSS':
        return <Badge className="bg-danger/10 text-danger border-danger/20">LOSS</Badge>;
      case 'BE':
      case 'BREAKEVEN':
        return <Badge variant="secondary">BREAKEVEN</Badge>;
      default:
        return <Badge variant="outline">{result || 'N/A'}</Badge>;
    }
  };

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
      <ProgressToast 
        title="Saving trade..." 
        progress={saveProgress} 
        isVisible={saving || saveProgress > 0} 
      />
      
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              {getResultIcon(trade.result)}
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Trade #{trade.sno || 'N/A'}
              </h1>
              {getResultBadge(trade.result)}
            </div>
          </div>
          
          {!isEditing && (
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Trade
            </Button>
          )}
        </div>

        <Card className="p-6 space-y-6">
          {/* View/Edit Mode Indicator */}
          <div className="flex items-center gap-2 pb-4 border-b border-border">
            {isEditing ? (
              <>
                <Edit className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Edit Mode</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">View Mode</span>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assetPair">Asset Pair</Label>
              <Input
                id="assetPair"
                value={trade.assetPair}
                onChange={(e) => isEditing && setTrade({ ...trade, assetPair: e.target.value })}
                placeholder="e.g., BTC/USD"
                readOnly={!isEditing}
                className={!isEditing ? "bg-muted cursor-default" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy">Strategy</Label>
              <Input
                id="strategy"
                value={trade.strategy || ''}
                onChange={(e) => isEditing && setTrade({ ...trade, strategy: e.target.value })}
                placeholder="Strategy used"
                readOnly={!isEditing}
                className={!isEditing ? "bg-muted cursor-default" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry">Entry</Label>
              <Input
                id="entry"
                value={trade.entry}
                onChange={(e) => isEditing && setTrade({ ...trade, entry: e.target.value })}
                placeholder="Entry price"
                readOnly={!isEditing}
                className={!isEditing ? "bg-muted cursor-default" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tp">Take Profit</Label>
              <Input
                id="tp"
                value={trade.tp}
                onChange={(e) => isEditing && setTrade({ ...trade, tp: e.target.value })}
                placeholder="TP price"
                readOnly={!isEditing}
                className={!isEditing ? "bg-muted cursor-default" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sl">Stop Loss</Label>
              <Input
                id="sl"
                value={trade.sl}
                onChange={(e) => isEditing && setTrade({ ...trade, sl: e.target.value })}
                placeholder="SL price"
                readOnly={!isEditing}
                className={!isEditing ? "bg-muted cursor-default" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rr">Risk Reward R/R</Label>
              <Input
                id="rr"
                value={trade.rr}
                onChange={(e) => isEditing && setTrade({ ...trade, rr: e.target.value })}
                placeholder="e.g., 1:3"
                readOnly={!isEditing}
                className={!isEditing ? "bg-muted cursor-default" : ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Entry</Label>
            <Textarea
              id="reason"
              value={trade.reason}
              onChange={(e) => isEditing && setTrade({ ...trade, reason: e.target.value })}
              placeholder="Why did you enter this trade?"
              rows={3}
              readOnly={!isEditing}
              className={!isEditing ? "bg-muted cursor-default resize-none" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="result">Result</Label>
            <Input
              id="result"
              value={trade.result}
              onChange={(e) => isEditing && setTrade({ ...trade, result: e.target.value })}
              placeholder="WIN / LOSS / BE"
              readOnly={!isEditing}
              className={!isEditing ? "bg-muted cursor-default" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="learning">Learning</Label>
            <Textarea
              id="learning"
              value={trade.learning}
              onChange={(e) => isEditing && setTrade({ ...trade, learning: e.target.value })}
              placeholder="What did you learn?"
              rows={3}
              readOnly={!isEditing}
              className={!isEditing ? "bg-muted cursor-default resize-none" : ""}
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
                  {isEditing && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleRemoveScreenshot('screenshot')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ) : isEditing ? (
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
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted">
                  <p className="text-sm text-muted-foreground">No screenshot</p>
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
                  {isEditing && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleRemoveScreenshot('afterTradeScreenshot')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ) : isEditing ? (
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
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted">
                  <p className="text-sm text-muted-foreground">No screenshot</p>
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => viewOnly ? onBack() : setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TradePage;