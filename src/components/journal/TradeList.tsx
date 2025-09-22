import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface TradeListProps {
  trades: Trade[];
  onDeleteTrade: (id: string) => void;
}

const TradeList = ({ trades, onDeleteTrade }: TradeListProps) => {
  const openLightbox = (imageUrl: string) => {
    const event = new CustomEvent('openLightbox', { detail: imageUrl });
    window.dispatchEvent(event);
  };

  const getResultVariant = (result: string) => {
    const lowerResult = result.toLowerCase();
    if (lowerResult.includes('profit') || lowerResult.includes('win') || lowerResult.includes('success')) {
      return 'success';
    }
    if (lowerResult.includes('loss') || lowerResult.includes('lose') || lowerResult.includes('fail')) {
      return 'danger';
    }
    return 'secondary';
  };

  const getResultIcon = (result: string) => {
    const lowerResult = result.toLowerCase();
    if (lowerResult.includes('profit') || lowerResult.includes('win') || lowerResult.includes('success')) {
      return <TrendingUp className="h-3 w-3" />;
    }
    if (lowerResult.includes('loss') || lowerResult.includes('lose') || lowerResult.includes('fail')) {
      return <TrendingDown className="h-3 w-3" />;
    }
    return null;
  };

  if (trades.length === 0) {
    return (
      <Card className="shadow-card border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 bg-muted rounded-full mb-4">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No trades yet</h3>
          <p className="text-muted-foreground text-center">
            Start by adding your first trade using the form above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Trade History ({trades.length})</h3>
      <div className="grid gap-4">
        {trades.map((trade) => (
          <Card key={trade.id} className="shadow-card border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  Trade #{trade.sno}
                  {trade.result && (
                    <Badge variant={getResultVariant(trade.result) as any} className="flex items-center gap-1">
                      {getResultIcon(trade.result)}
                      {trade.result}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(trade.createdAt), { addSuffix: true })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteTrade(trade.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Entry</p>
                  <p className="font-medium">{trade.entry || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Take Profit</p>
                  <p className="font-medium">{trade.tp || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stop Loss</p>
                  <p className="font-medium">{trade.sl || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trade Result</p>
                  <p className="font-medium">{trade.result || 'N/A'}</p>
                </div>
              </div>

              {trade.reason && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reason</p>
                  <p className="text-sm bg-muted/30 p-3 rounded-lg">{trade.reason}</p>
                </div>
              )}

              {trade.learning && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Learning</p>
                  <p className="text-sm bg-accent/30 p-3 rounded-lg">{trade.learning}</p>
                </div>
              )}

              {trade.screenshot && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Screenshot</p>
                  <div className="relative inline-block">
                    <img
                      src={trade.screenshot}
                      alt={`Trade ${trade.sno} screenshot`}
                      className="max-w-full max-h-32 rounded-lg border border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openLightbox(trade.screenshot!)}
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 bg-background/80 backdrop-blur-sm"
                      onClick={() => openLightbox(trade.screenshot!)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TradeList;