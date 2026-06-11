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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { ASSET_PAIRS, SESSIONS } from "@/components/journal/TradeForm";
import { useStrategies } from "@/hooks/useStrategies";

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
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { strategies: userStrategies } = useStrategies();

  const handleEditClick = useCallback((trade: Trade) => {
    setEditingTrade(trade);
    setEditFormData({ ...trade });
  }, []);

  const handleEditInputChange = useCallback((field: keyof Trade, value: string) => {
    setEditFormData(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, field: 'screenshot' | 'afterTradeScreenshot') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX = 5 * 1024 * 1024;
    const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!ALLOWED.includes(file.type)) {
      toast({ variant: "destructive", title: "Invalid file type" }); return;
    }
    if (file.size > MAX) {
      toast({ variant: "destructive", title: "File too large", description: "Max 5MB." }); return;
    }
    setUploading(true);
    try {
      const { url } = await api.upload(file);
      setEditFormData(prev => prev ? { ...prev, [field]: url } : null);
      toast({ title: "Screenshot uploaded" });
    } catch {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploading(false);
    }
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
    switch (result?.toUpperCase()) {
      case 'WIN': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'LOSS': return <TrendingDown className="h-4 w-4 text-danger" />;
      case 'BE':
      case 'BREAKEVEN': return <Minus className="h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  }, []);

  const getResultBadge = useCallback((result: string) => {
    switch (result?.toUpperCase()) {
      case 'WIN': return <Badge className="bg-success/10 text-success border-success/20">WIN</Badge>;
      case 'LOSS': return <Badge className="bg-danger/10 text-danger border-danger/20">LOSS</Badge>;
      case 'BE':
      case 'BREAKEVEN': return <Badge variant="secondary">BE</Badge>;
      default: return <Badge variant="outline">{result || 'N/A'}</Badge>;
    }
  }, []);

  const toggleTradeSelection = useCallback((id: string) => {
    setSelectedTrades(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAllTrades = useCallback(() => setSelectedTrades(new Set(trades.map(t => t.id))), [trades]);
  const deselectAllTrades = useCallback(() => setSelectedTrades(new Set()), []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedTrades.size === 0) return;
    const ids = Array.from(selectedTrades);
    for (const id of ids) await onDeleteTrade(id);
    setSelectedTrades(new Set());
    setShowDeleteConfirm(false);
    toast({ title: "Trades deleted", description: `Deleted ${ids.length} trade(s).` });
  }, [selectedTrades, onDeleteTrade, toast]);

  const allSelected = trades.length > 0 && selectedTrades.size === trades.length;

  if (trades.length === 0) {
    return (
      <Card className="shadow-card border-border/50">
        <CardHeader><CardTitle>All Trades</CardTitle></CardHeader>
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
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by strategy" /></SelectTrigger>
                <SelectContent>
                  {strategies.map(s => (
                    <SelectItem key={s} value={s}>{s === 'all' ? 'All Strategies' : s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedTrades.size > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">{selectedTrades.size} selected</span>
              <Button variant="outline" size="sm" onClick={deselectAllTrades}>Deselect All</Button>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="h-4 w-4 mr-1" />Delete Selected
              </Button>
            </div>
          )}
          {trades.length > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={allSelected ? deselectAllTrades : selectAllTrades}>
                {allSelected ? (<><CheckSquare className="h-4 w-4 mr-1" />Deselect All</>) : (<><Square className="h-4 w-4 mr-1" />Select All</>)}
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {trades.map((trade, index) => (
            <div key={trade.id}
              className={`border border-border/50 rounded-lg p-4 space-y-3 hover:shadow-md transition-all animate-fade-in ${
                selectedTrades.has(trade.id) ? 'bg-primary/5 border-primary/50' : ''
              }`}
              style={{ animationDelay: `${index * 30}ms` }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Checkbox checked={selectedTrades.has(trade.id)} onCheckedChange={() => toggleTradeSelection(trade.id)} />
                  {getResultIcon(trade.result)}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">
                      {trade.assetPair || 'Trade'} — Entry: {trade.entry}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(trade.createdAt))} ago
                      {trade.session ? ` · ${trade.session}` : ''}
                      {trade.strategy ? ` · ${trade.strategy}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {getResultBadge(trade.result)}
                  <Button variant="outline" size="sm" onClick={() => onViewTrade(trade.id)} className="flex-shrink-0">
                    <Eye className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">View</span>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => handleEditClick(trade)} className="flex-shrink-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Edit Trade</DialogTitle></DialogHeader>
                      {editingTrade && editFormData && (
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Asset Pair</Label>
                              <Select value={editFormData.assetPair} onValueChange={(v) => handleEditInputChange('assetPair', v)}>
                                <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                                <SelectContent>
                                  {ASSET_PAIRS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Strategy</Label>
                              <Select value={editFormData.strategy || ""} onValueChange={(v) => handleEditInputChange('strategy', v)}>
                                <SelectTrigger><SelectValue placeholder="Select strategy" /></SelectTrigger>
                                <SelectContent>
                                  {userStrategies.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Session</Label>
                              <Select value={editFormData.session || ""} onValueChange={(v) => handleEditInputChange('session', v)}>
                                <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                                <SelectContent>
                                  {SESSIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Entry Price</Label>
                              <Input value={editFormData.entry} onChange={(e) => handleEditInputChange('entry', e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                              <Label>Stop Loss</Label>
                              <Input value={editFormData.sl} onChange={(e) => handleEditInputChange('sl', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>Risk/Reward Ratio</Label>
                              <Input value={editFormData.rr} onChange={(e) => handleEditInputChange('rr', e.target.value)} placeholder="e.g., 1:3" />
                            </div>
                            <div className="space-y-2">
                              <Label>Result</Label>
                              <Select value={editFormData.result} onValueChange={(v) => handleEditInputChange('result', v)}>
                                <SelectTrigger><SelectValue placeholder="Select result" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="WIN">WIN</SelectItem>
                                  <SelectItem value="LOSS">LOSS</SelectItem>
                                  <SelectItem value="BE">BE (Break Even)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Take Profits</Label>
                            <LineNumbersTextarea value={editFormData.tp} onChange={(e) => handleEditInputChange('tp', e.target.value)} className="min-h-[100px]" />
                          </div>
                          <div className="space-y-2">
                            <Label>Reason</Label>
                            <Textarea value={editFormData.reason} onChange={(e) => handleEditInputChange('reason', e.target.value)} rows={3} />
                          </div>
                          <div className="space-y-2">
                            <Label>Learning Outcome</Label>
                            <Textarea value={editFormData.learning} onChange={(e) => handleEditInputChange('learning', e.target.value)} rows={3} />
                          </div>

                          {(['screenshot', 'afterTradeScreenshot'] as const).map((field) => (
                            <div key={field} className="space-y-2">
                              <Label>{field === 'screenshot' ? 'Setup Screenshot' : 'After Trade Screenshot'}</Label>
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                  <Button type="button" variant="outline" onClick={() => document.getElementById(`edit-${field}`)?.click()} className="flex items-center gap-2" disabled={uploading}>
                                    <Upload className="h-4 w-4" />{uploading ? "Uploading..." : "Upload Image"}
                                  </Button>
                                </div>
                                <input id={`edit-${field}`} type="file" accept="image/png,image/jpeg,image/jpg,image/webp"
                                  onChange={(e) => handleFileUpload(e, field)} className="hidden" />
                                {editFormData[field] && (
                                  <div className="relative inline-block">
                                    <img src={editFormData[field] as string} alt="" className="max-w-full max-h-48 rounded-lg border border-border" />
                                    <Button type="button" variant="destructive" size="icon"
                                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                      onClick={() => removeScreenshot(field)}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setEditingTrade(null)}>Cancel</Button>
                            <Button type="submit">Update Trade</Button>
                          </div>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="icon" onClick={() => onDeleteTrade(trade.id)} className="flex-shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">TP:</span> {trade.tp || 'N/A'}</div>
                <div><span className="font-medium">SL:</span> {trade.sl || 'N/A'}</div>
              </div>
              {trade.reason && <div className="text-sm"><span className="font-medium">Reason:</span> {trade.reason}</div>}
              {trade.learning && <div className="text-sm"><span className="font-medium">Learning:</span> {trade.learning}</div>}
            </div>
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Trades?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTrades.size} trade(s)? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TradesList;
