import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface Trade {
  id: string;
  result: string;
  tradeResult: string;
  createdAt: string;
}

interface TradeChartProps {
  trades: Trade[];
}

const TradeChart = ({ trades }: TradeChartProps) => {
  const calculatePieData = () => {
    const winningTrades = trades.filter(trade => 
      trade.result === 'WIN'
    ).length;

    const losingTrades = trades.filter(trade => 
      trade.result === 'LOSS'
    ).length;

    const breakevenTrades = trades.filter(trade => 
      trade.result === 'BREAKEVEN'
    ).length;

    return [
      { name: 'Winning', value: winningTrades, color: 'hsl(var(--success))' },
      { name: 'Losing', value: losingTrades, color: 'hsl(var(--danger))' },
      { name: 'Breakeven', value: breakevenTrades, color: 'hsl(var(--muted-foreground))' },
    ].filter(item => item.value > 0);
  };

  const calculateMonthlyData = () => {
    const monthlyStats: { [key: string]: { wins: number; losses: number } } = {};

    trades.forEach(trade => {
      const date = new Date(trade.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { wins: 0, losses: 0 };
      }

      if (trade.result === 'WIN') {
        monthlyStats[monthKey].wins++;
      } else if (trade.result === 'LOSS') {
        monthlyStats[monthKey].losses++;
      }
    });

    return Object.entries(monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, stats]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        wins: stats.wins,
        losses: stats.losses,
      }));
  };

  const pieData = calculatePieData();
  const monthlyData = calculateMonthlyData();

  const renderCustomTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (trades.length === 0) {
    return (
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle>Trade Analytics</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle>Trade Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={renderCustomTooltip} />
              <Legend />
              <Bar dataKey="wins" fill="hsl(var(--success))" name="Wins" />
              <Bar dataKey="losses" fill="hsl(var(--danger))" name="Losses" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradeChart;