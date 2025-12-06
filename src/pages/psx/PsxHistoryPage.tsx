import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Edit, Trash2, TrendingUp, TrendingDown, Minus, Clock, CheckSquare, Square } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { usePsxTrades, PsxTrade } from "@/hooks/usePsxTrades";
import CandleLoader from "@/components/ui/candle-loader";
import ProgressToast from "@/components/ui/progress-toast";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PsxHistoryPage = () => {
  const { trades, loading, progress, status, updateTrade, deleteTrade, loadedCount, totalCount, estimatedTime } = usePsxTrades();
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");
  const [editingTrade, setEditingTrade] = useState<PsxTrade | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PsxTrade> | null>(null);
  const [selectedTrades, setSelectedTrades] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<"loading" | "success" | "error">("loading");
  const { toast } = useToast();

  // Get unique strategies
  const strategies = useMemo(() => {
    const uniqueStrategies = new Set(trades.map(t => t.strategy).filter(Boolean));
    return ['all', ...Array.from(uniqueStrategies)] as string[];
  }, [trades]);

  // Filter trades
  const filteredTrades = useMemo(() => {
    if (selectedStrategy === 'all') return trades;
    return trades.filter(t => t.strategy === selectedStrategy);
  }, [trades, selectedStrategy]);

  const handleEditClick = (trade: PsxTrade) => {
    setEditingTrade(trade);
    setEditFormData({ ...trade });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData || !editingTrade) return;
    
    setUpdateProgress(5);
    setUpdateStatus("loading");
    
    await updateTrade({ ...editFormData, id: editingTrade.id } as PsxTrade & { id: string }, (p, s) => {
      setUpdateProgress(p);
      if (s) setUpdateStatus(s);
    });
    
    setEditingTrade(null);
    setEditFormData(null);
    setTimeout(() => setUpdateProgress(0), 2000);
  };

  const toggleTradeSelection = (tradeId: string) => {
    setSelectedTrades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
  };

  const selectAllTrades = () => setSelectedTrades(new Set(filteredTrades.map(t => t.id)));
  const deselectAllTrades = () => setSelectedTrades(new Set());

  const handleBulkDelete = async () => {
    for (const id of Array.from(selectedTrades)) {
      await deleteTrade(id);
    }
    setSelectedTrades(new Set());
    setShowDeleteConfirm(false);
    toast({ title: `Deleted ${selectedTrades.size} trade(s)` });
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'win': return <Badge className="bg-success/10 text-success border-success/20">WIN</Badge>;
      case 'loss': return <Badge className="bg-danger/10 text-danger border-danger/20">LOSS</Badge>;
      case 'breakeven': return <Badge variant="secondary">BE</Badge>;
      case 'pending': return <Badge variant="outline" className="border-primary/50 text-primary">PENDING</Badge>;
      default: return <Badge variant="outline">{result}</Badge>;
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'win': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'loss': return <TrendingDown className="h-4 w-4 text-danger" />;
      case 'breakeven': return <Minus className="h-4 w-4 text-muted-foreground" />;
      case 'pending': return <Clock className="h-4 w-4 text-primary" />;
      default: return null;
    }
  };

  if (loading && trades.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CandleLoader />
          <span className="text-muted-foreground">Loading PSX trades...</span>
        </div>
      </div>
    );
  }

  const allSelected = filteredTrades.length > 0 && selectedTrades.size === filteredTrades.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <ProgressToast 
        title={`Loading PSX trades (${loadedCount}/${totalCount})...`}
        progress={progress} 
        isVisible={progress > 0 && progress < 100} 
        status={status}
        message={estimatedTime ? `Est. ${estimatedTime}s remaining` : "Fetching your trades..."}
      />
      
      <ProgressToast 
        title="Updating trade..." 
        progress={updateProgress} 
        isVisible={updateProgress > 0} 
        status={updateStatus}
        message={updateStatus === "success" ? "Trade updated!" : updateStatus === "error" ? "Update failed" : "Saving changes..."}
      />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            PSX Trading History
          </h1>
          <p className="text-muted-foreground mt-2">View and manage your PSX stock trades</p>
        </div>

        <Card className="shadow-card border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>All Trades ({filteredTrades.length})</CardTitle>
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
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
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={allSelected ? deselectAllTrades : selectAllTrades}>
                  {allSelected ? <><CheckSquare className="h-4 w-4 mr-1" />Deselect All</> : <><Square className="h-4 w-4 mr-1" />Select All</>}
                </Button>
                {selectedTrades.size > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">{selectedTrades.size} selected</span>
                    <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                      <Trash2 className="h-4 w-4 mr-1" />Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {filteredTrades.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No trades found
              </div>
            ) : (
              filteredTrades.map((trade, index) => (
                <div
                  key={trade.id}
                  className={cn(
                    "border border-border/50 rounded-lg p-4 space-y-3 hover:shadow-md transition-all animate-in fade-in-0 slide-in-from-bottom-2",
                    selectedTrades.has(trade.id) && 'bg-primary/5 border-primary/50'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedTrades.has(trade.id)}
                        onCheckedChange={() => toggleTradeSelection(trade.id)}
                      />
                      {getResultIcon(trade.result)}
                      <div>
                        <h3 className="font-medium">{trade.stockSymbol} - {trade.sharesPurchased} shares</h3>
                        <p className="text-sm text-muted-foreground">
                          Entry: PKR {trade.entryPrice.toLocaleString()} • {formatDistanceToNow(new Date(trade.createdAt))} ago
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getResultBadge(trade.result)}
                      {trade.profitLoss !== null && (
                        <Badge className={trade.profitLoss >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}>
                          {trade.profitLoss >= 0 ? '+' : ''}{trade.profitLoss.toLocaleString()} PKR
                        </Badge>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => handleEditClick(trade)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Edit Trade</DialogTitle>
                          </DialogHeader>
                          {editFormData && (
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Shares</Label>
                                  <Input
                                    type="number"
                                    value={editFormData.sharesPurchased || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, sharesPurchased: parseInt(e.target.value) }))}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Entry Price</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editFormData.entryPrice || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, entryPrice: parseFloat(e.target.value) }))}
                                  />
                                </div>
                                <div className="space-y-2 col-span-2">
                                  <Label>TP/Exit Price</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editFormData.tpExitPrice || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, tpExitPrice: e.target.value ? parseFloat(e.target.value) : null }))}
                                    placeholder="Leave empty for pending"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Trade Logic</Label>
                                <Textarea
                                  value={editFormData.tradeLogic || ''}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, tradeLogic: e.target.value }))}
                                  rows={3}
                                />
                              </div>
                              <Button type="submit" className="w-full">Save Changes</Button>
                            </form>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="icon" onClick={() => deleteTrade(trade.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  {trade.tradeLogic && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{trade.tradeLogic}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedTrades.size} trade(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PsxHistoryPage;
