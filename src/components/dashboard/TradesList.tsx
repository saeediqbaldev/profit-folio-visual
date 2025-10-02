import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LineNumbersTextarea } from "@/components/ui/line-numbers-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Trash2, Eye, TrendingUp, TrendingDown, Minus, Upload, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
  afterTradeScreenshot: string | null;
  assetPair: string;
  createdAt: string;
}

interface TradesListProps {
  trades: Trade[];
  onUpdateTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
  onViewTrade: (tradeId: string) => void;
}

const TradesList = ({ trades, onUpdateTrade, onDeleteTrade, onViewTrade }: TradesListProps) => {
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [editFormData, setEditFormData] = useState<Trade | null>(null);
  const { toast } = useToast();

  const handleEditClick = (trade: Trade) => {
    setEditingTrade(trade);
    setEditFormData({ ...trade });
  };

  const handleEditInputChange = (field: keyof Trade, value: string) => {
    if (editFormData) {
      setEditFormData({ ...editFormData, [field]: value });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'screenshot' | 'afterTradeScreenshot') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
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
      if (editFormData) {
        setEditFormData({ ...editFormData, [field]: e.target?.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = (field: 'screenshot' | 'afterTradeScreenshot') => {
    if (editFormData) {
      setEditFormData({ ...editFormData, [field]: null });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editFormData) {
      onUpdateTrade(editFormData);
      setEditingTrade(null);
      setEditFormData(null);
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'WIN':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'LOSS':
        return <TrendingDown className="h-4 w-4 text-danger" />;
      case 'BREAKEVEN':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'WIN':
        return <Badge className="bg-success/10 text-success border-success/20">WIN</Badge>;
      case 'LOSS':
        return <Badge className="bg-danger/10 text-danger border-danger/20">LOSS</Badge>;
      case 'BREAKEVEN':
        return <Badge variant="secondary">BREAKEVEN</Badge>;
      default:
        return <Badge variant="outline">{result || 'N/A'}</Badge>;
    }
  };

  if (trades.length === 0) {
    return (
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle>All Trades</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No trades found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle>All Trades ({trades.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {trades.map((trade) => (
          <div
            key={trade.id}
            className="border border-border/50 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getResultIcon(trade.result)}
                <div>
                  <h3 className="font-medium">Entry: {trade.entry}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(trade.createdAt))} ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getResultBadge(trade.result)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewTrade(trade.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditClick(trade)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Trade</DialogTitle>
                    </DialogHeader>
                    {editingTrade && editFormData && (
                      <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-assetPair">Asset Pair</Label>
                            <Select 
                              value={editFormData.assetPair} 
                              onValueChange={(value) => handleEditInputChange('assetPair', value)}
                            >
                              <SelectTrigger>
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
                            <Label htmlFor="edit-entry">Entry Price</Label>
                            <Input
                              id="edit-entry"
                              value={editFormData.entry}
                              onChange={(e) => handleEditInputChange('entry', e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-sl">Stop Loss</Label>
                            <Input
                              id="edit-sl"
                              value={editFormData.sl}
                              onChange={(e) => handleEditInputChange('sl', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-result">Result</Label>
                            <Select 
                              value={editFormData.result} 
                              onValueChange={(value) => handleEditInputChange('result', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select trade result" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="WIN">WIN</SelectItem>
                                <SelectItem value="LOSS">LOSS</SelectItem>
                                <SelectItem value="BE">BE (Break Even)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-tp">Take Profits</Label>
                          <LineNumbersTextarea
                            value={editFormData.tp}
                            onChange={(e) => handleEditInputChange('tp', e.target.value)}
                            placeholder="Enter take profit levels"
                            className="min-h-[100px]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-reason">Trade Logic / Reason</Label>
                          <Textarea
                            id="edit-reason"
                            value={editFormData.reason}
                            onChange={(e) => handleEditInputChange('reason', e.target.value)}
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-learning">Learning Outcome</Label>
                          <Textarea
                            id="edit-learning"
                            value={editFormData.learning}
                            onChange={(e) => handleEditInputChange('learning', e.target.value)}
                            rows={3}
                          />
                        </div>

                        {/* Setup Screenshot */}
                        <div className="space-y-2">
                          <Label>Setup Screenshot</Label>
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('edit-screenshot')?.click()}
                                className="flex items-center gap-2"
                              >
                                <Upload className="h-4 w-4" />
                                Upload Image
                              </Button>
                            </div>
                            <input
                              id="edit-screenshot"
                              type="file"
                              accept="image/png,image/jpeg,image/jpg"
                              onChange={(e) => handleFileUpload(e, 'screenshot')}
                              className="hidden"
                            />
                            {editFormData.screenshot && (
                              <div className="relative inline-block">
                                <img
                                  src={editFormData.screenshot}
                                  alt="Setup screenshot"
                                  className="max-w-full max-h-48 rounded-lg border border-border shadow-sm"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-sm"
                                  onClick={() => removeScreenshot('screenshot')}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* After Trade Screenshot */}
                        <div className="space-y-2">
                          <Label>After Trade Screenshot</Label>
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('edit-after-screenshot')?.click()}
                                className="flex items-center gap-2"
                              >
                                <Upload className="h-4 w-4" />
                                Upload Image
                              </Button>
                            </div>
                            <input
                              id="edit-after-screenshot"
                              type="file"
                              accept="image/png,image/jpeg,image/jpg"
                              onChange={(e) => handleFileUpload(e, 'afterTradeScreenshot')}
                              className="hidden"
                            />
                            {editFormData.afterTradeScreenshot && (
                              <div className="relative inline-block">
                                <img
                                  src={editFormData.afterTradeScreenshot}
                                  alt="After trade screenshot"
                                  className="max-w-full max-h-48 rounded-lg border border-border shadow-sm"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-sm"
                                  onClick={() => removeScreenshot('afterTradeScreenshot')}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setEditingTrade(null)}>
                            Cancel
                          </Button>
                          <Button type="submit">Update Trade</Button>
                        </div>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDeleteTrade(trade.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">TP:</span> {trade.tp || 'N/A'}
              </div>
              <div>
                <span className="font-medium">SL:</span> {trade.sl || 'N/A'}
              </div>
            </div>
            
            {trade.reason && (
              <div className="text-sm">
                <span className="font-medium">Reason:</span> {trade.reason}
              </div>
            )}
            
            {trade.learning && (
              <div className="text-sm">
                <span className="font-medium">Learning:</span> {trade.learning}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TradesList;