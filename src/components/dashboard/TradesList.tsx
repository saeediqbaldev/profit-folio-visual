import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Trade {
  id: string;
  sno: string;
  entry: string;
  reason: string;
  tp: string;
  sl: string;
  result: string;
  learning: string;
  screenshot: string | null;
  tradeResult: string;
  createdAt: string;
}

interface TradesListProps {
  trades: Trade[];
  onUpdateTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
}

const TradesList = ({ trades, onUpdateTrade, onDeleteTrade }: TradesListProps) => {
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [editFormData, setEditFormData] = useState<Trade | null>(null);

  const handleEditClick = (trade: Trade) => {
    setEditingTrade(trade);
    setEditFormData({ ...trade });
  };

  const handleEditInputChange = (field: keyof Trade, value: string) => {
    if (editFormData) {
      setEditFormData({ ...editFormData, [field]: value });
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
                            <Label htmlFor="edit-entry">Entry</Label>
                            <Input
                              id="edit-entry"
                              value={editFormData.entry}
                              onChange={(e) => handleEditInputChange('entry', e.target.value)}
                              required
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
                                <SelectItem value="BREAKEVEN">BREAKEVEN</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-tp">Take Profit</Label>
                            <Input
                              id="edit-tp"
                              value={editFormData.tp}
                              onChange={(e) => handleEditInputChange('tp', e.target.value)}
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
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-reason">Reason</Label>
                          <Textarea
                            id="edit-reason"
                            value={editFormData.reason}
                            onChange={(e) => handleEditInputChange('reason', e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-learning">Learning</Label>
                          <Textarea
                            id="edit-learning"
                            value={editFormData.learning}
                            onChange={(e) => handleEditInputChange('learning', e.target.value)}
                            rows={3}
                          />
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