import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LineNumbersTextarea } from "@/components/ui/line-numbers-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Trash2, Eye, TrendingUp, TrendingDown, Minus, Upload, X, CheckSquare, Square } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  strategies?: string[];
  selectedStrategy?: string;
  onStrategyChange?: (strategy: string) => void;
  onUpdateTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
  onViewTrade: (tradeId: string) => void;
}

const TradesList = ({ trades, strategies, selectedStrategy, onStrategyChange, onUpdateTrade, onDeleteTrade, onViewTrade }: TradesListProps) => {
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [editFormData, setEditFormData] = useState<Trade | null>(null);
  const [selectedTrades, setSelectedTrades] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();

  const handleEditClick = useCallback((trade: Trade) => {
    setEditingTrade(trade);
    setEditFormData({ ...trade });
  }, []);

  const handleEditInputChange = useCallback((field: keyof Trade, value: string) => {
    setEditFormData(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, field: 'screenshot' | 'afterTradeScreenshot') => {
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
  }, [toast]);

  const removeScreenshot = useCallback((field: 'screenshot' | 'afterTradeScreenshot') => {
    setEditFormData(prev => prev ? { ...prev, [field]: null } : null);
  }, []);

  const handleEditSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editFormData) {
      onUpdateTrade(editFormData);
      setEditingTrade(null);
      setEditFormData(null);
    }
  }, [editFormData, onUpdateTrade]);

  const getResultIcon = useCallback((result: string) => {
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
  }, []);

  const getResultBadge = useCallback((result: string) => {
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
  }, []);

  const toggleTradeSelection = useCallback((tradeId: string) => {
    setSelectedTrades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
  }, []);

  const selectAllTrades = useCallback(() => {
    setSelectedTrades(new Set(trades.map(t => t.id)));
  }, [trades]);

  const deselectAllTrades = useCallback(() => {
    setSelectedTrades(new Set());
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedTrades.size === 0) return;
    
    const tradeIds = Array.from(selectedTrades);
    for (const id of tradeIds) {
      await onDeleteTrade(id);
    }
    
    setSelectedTrades(new Set());
    setShowDeleteConfirm(false);
    
    toast({
      title: "Trades deleted",
      description: `Successfully deleted ${tradeIds.length} trade(s).`,
    });
  }, [selectedTrades, onDeleteTrade, toast]);

  const allSelected = trades.length > 0 && selectedTrades.size === trades.length;
  const someSelected = selectedTrades.size > 0 && selectedTrades.size < trades.length;

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
    <>
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>All Trades ({trades.length})</CardTitle>
            
            {strategies && onStrategyChange && (
              <Select value={selectedStrategy} onValueChange={onStrategyChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by strategy" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map(strategy => (
                    <SelectItem key={strategy} value={strategy}>
                      {strategy === 'all' ? 'All Strategies' : strategy}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div>
            {selectedTrades.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedTrades.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllTrades}
                >
                  Deselect All
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
            )}
            </div>
          </div>
          {trades.length > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={allSelected ? deselectAllTrades : selectAllTrades}
              >
                {allSelected ? (
                  <>
                    <CheckSquare className="h-4 w-4 mr-1" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4 mr-1" />
                    Select All
                  </>
                )}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className={`border border-border/50 rounded-lg p-4 space-y-3 hover:shadow-md transition-all ${
                selectedTrades.has(trade.id) ? 'bg-primary/5 border-primary/50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedTrades.has(trade.id)}
                    onCheckedChange={() => toggleTradeSelection(trade.id)}
                    aria-label={`Select trade ${trade.id}`}
                  />
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Trades?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTrades.size} trade(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TradesList;