import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, X, Edit, Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { api } from "@/lib/api";
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
  session?: string;
  createdAt: string;
}


const TradePage = ({ tradeId, onBack, viewOnly = false }: TradePageProps) => {
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(!viewOnly);
  const { toast } = useToast();

  useEffect(() => { loadTrade(); /* eslint-disable-next-line */ }, [tradeId]);

  const loadTrade = async () => {
    setLoading(true);
    try {
      const data = await api.get<any>(`/api/trades/${tradeId}`);
      setTrade({
        id: data.id,
        sno: data.sno,
        entry: data.entry,
        reason: data.reason || "",
        tp: data.tp || "",
        sl: data.sl || "",
        result: data.result || "",
        learning: data.learning || "",
        screenshot: data.screenshot_url,
        afterTradeScreenshot: data.after_trade_screenshot_url,
        assetPair: data.asset_pair || "",
        rr: data.rr || "",
        strategy: data.strategy || "",
        session: data.session || "",
        createdAt: data.created_at,
      });

    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error loading trade" });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = useCallback(async (file: File, field: "screenshot" | "afterTradeScreenshot") => {
    if (!trade || !isEditing) return;
    const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!ALLOWED.includes(file.type)) { toast({ variant: "destructive", title: "Invalid file type" }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ variant: "destructive", title: "File too large", description: "Max 5MB" }); return; }
    try {
      const { url } = await api.upload(file);
      setTrade((p) => p ? { ...p, [field]: url } : null);
      toast({ title: "Screenshot uploaded" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Upload failed" });
    }
  }, [trade, isEditing, toast]);

  const handleRemoveScreenshot = useCallback((field: "screenshot" | "afterTradeScreenshot") => {
    if (!isEditing) return;
    setTrade((p) => p ? { ...p, [field]: null } : null);
  }, [isEditing]);

  const handleSave = useCallback(async () => {
    if (!trade) return;
    setSaving(true);
    setSaveProgress(20);
    try {
      setSaveProgress(50);
      await api.put(`/api/trades/${trade.id}`, {
        entry: trade.entry,
        reason: trade.reason,
        tp: trade.tp,
        sl: trade.sl,
        result: trade.result,
        learning: trade.learning,
        asset_pair: trade.assetPair,
        rr: trade.rr,
        strategy: trade.strategy,
        session: trade.session || null,
        screenshot_url: trade.screenshot,
        after_trade_screenshot_url: trade.afterTradeScreenshot,
      });
      setSaveProgress(100);
      toast({ title: "Trade updated", description: "Changes saved successfully." });
      setIsEditing(false);
      // Notify other views (history list, dashboard, overview)
      try { window.dispatchEvent(new CustomEvent("trades-updated")); } catch { /* noop */ }

    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error updating trade" });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveProgress(0), 1000);
    }
  }, [trade, toast]);

  const getResultIcon = (result: string) => {
    switch (result?.toUpperCase()) {
      case "WIN": return <TrendingUp className="h-5 w-5 text-success" />;
      case "LOSS": return <TrendingDown className="h-5 w-5 text-danger" />;
      case "BE":
      case "BREAKEVEN": return <Minus className="h-5 w-5 text-muted-foreground" />;
      default: return null;
    }
  };

  const getResultBadge = (result: string) => {
    switch (result?.toUpperCase()) {
      case "WIN": return <Badge className="bg-success/10 text-success border-success/20">WIN</Badge>;
      case "LOSS": return <Badge className="bg-danger/10 text-danger border-danger/20">LOSS</Badge>;
      case "BE":
      case "BREAKEVEN": return <Badge variant="secondary">BREAKEVEN</Badge>;
      default: return <Badge variant="outline">{result || "N/A"}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4"><CandleLoader /><span className="text-muted-foreground">Loading trade...</span></div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <p className="text-muted-foreground">Trade not found</p>
          <Button onClick={onBack} className="mt-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <ProgressToast title="Saving trade..." progress={saveProgress} isVisible={saving || saveProgress > 0} />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
            <div className="flex items-center gap-3">
              {getResultIcon(trade.result)}
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Trade #{trade.sno || "N/A"}
              </h1>
              {getResultBadge(trade.result)}
            </div>
          </div>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)} className="flex items-center gap-2">
              <Edit className="w-4 h-4" />Edit Trade
            </Button>
          )}
        </div>

        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-border">
            {isEditing ? (<><Edit className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-primary">Edit Mode</span></>)
              : (<><Eye className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium text-muted-foreground">View Mode</span></>)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([
              ["assetPair", "Asset Pair"],
              ["strategy", "Strategy"],
              ["session", "Session"],
              ["entry", "Entry"],
              ["tp", "Take Profit"],
              ["sl", "Stop Loss"],
              ["rr", "Risk Reward R/R"],
            ] as Array<[keyof Trade, string]>).map(([key, label]) => (

              <div className="space-y-2" key={key as string}>
                <Label htmlFor={key as string}>{label}</Label>
                <Input
                  id={key as string}
                  value={(trade as any)[key] || ""}
                  onChange={(e) => isEditing && setTrade({ ...trade, [key]: e.target.value } as Trade)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted cursor-default" : ""}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Entry</Label>
            <Textarea id="reason" value={trade.reason}
              onChange={(e) => isEditing && setTrade({ ...trade, reason: e.target.value })}
              rows={3} readOnly={!isEditing} className={!isEditing ? "bg-muted cursor-default resize-none" : ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="result">Result</Label>
            <Input id="result" value={trade.result}
              onChange={(e) => isEditing && setTrade({ ...trade, result: e.target.value })}
              placeholder="WIN / LOSS / BE" readOnly={!isEditing} className={!isEditing ? "bg-muted cursor-default" : ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="learning">Learning</Label>
            <Textarea id="learning" value={trade.learning}
              onChange={(e) => isEditing && setTrade({ ...trade, learning: e.target.value })}
              rows={3} readOnly={!isEditing} className={!isEditing ? "bg-muted cursor-default resize-none" : ""} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(["screenshot", "afterTradeScreenshot"] as const).map((field) => (
              <div className="space-y-2" key={field}>
                <Label>{field === "screenshot" ? "Setup Screenshot" : "After Trade Screenshot"}</Label>
                {(trade as any)[field] ? (
                  <div className="relative">
                    <img src={(trade as any)[field]} alt="" className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80"
                      onClick={() => window.dispatchEvent(new CustomEvent("openLightbox", { detail: (trade as any)[field] }))} />
                    {isEditing && (
                      <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => handleRemoveScreenshot(field)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ) : isEditing ? (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input type="file" id={`upload-${field}`} accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, field); }} />
                    <label htmlFor={`upload-${field}`} className="cursor-pointer">
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
            ))}
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? "Saving..." : "Save Changes"}</Button>
              <Button variant="outline" onClick={() => viewOnly ? onBack() : setIsEditing(false)}>Cancel</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TradePage;
