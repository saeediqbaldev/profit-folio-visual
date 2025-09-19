import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, BarChart3 } from "lucide-react";

interface Trade {
  id: string;
  result: string;
  tradeResult: string;
  entry: string;
  tp: string;
  sl: string;
}

interface StatsCardsProps {
  trades: Trade[];
}

const StatsCards = ({ trades }: StatsCardsProps) => {
  const calculateStats = () => {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
      };
    }

    const winningTrades = trades.filter(trade => 
      trade.result === 'WIN'
    ).length;

    const losingTrades = trades.filter(trade => 
      trade.result === 'LOSS'
    ).length;

    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

    return {
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      winRate,
    };
  };

  const stats = calculateStats();

  const statCards = [
    {
      title: "Total Trades",
      value: stats.totalTrades,
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Winning Trades",
      value: stats.winningTrades,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Losing Trades",
      value: stats.losingTrades,
      icon: TrendingDown,
      color: "text-danger",
      bgColor: "bg-danger/10",
    },
    {
      title: "Win Rate",
      value: `${stats.winRate.toFixed(1)}%`,
      icon: Target,
      color: stats.winRate >= 50 ? "text-success" : "text-danger",
      bgColor: stats.winRate >= 50 ? "bg-success/10" : "bg-danger/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="shadow-card border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;