import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Cpu, HardDrive, MemoryStick, User as UserIcon, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

interface SystemStats {
  username: string;
  totalTrades: number;
  storageBytes: number;
  uploadsBytes: number;
  databaseBytes: number;
  cpuPercent: number;
  memory: { totalBytes: number; usedBytes: number; freeBytes: number; percent: number };
  uptimeSeconds: number;
}

interface TimelinePoint { day: string; trades: number; }

function fmtBytes(b: number) {
  if (!b || b < 0) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 10 ? 0 : 2)} ${u[i]}`;
}

function fmtUptime(s: number) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

const ResourceUsage = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [days, setDays] = useState<7 | 30 | 90 | 120>(7);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const s = await api.get<SystemStats>("/api/system/stats");
        if (alive) setStats(s);
      } catch { /* ignore */ }
    };
    load();
    const id = setInterval(load, 5000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await api.get<TimelinePoint[]>(`/api/system/timeline?days=${days}`);
        if (alive) setTimeline(r || []);
      } catch { /* ignore */ }
    };
    load();
    const id = setInterval(load, 15000);
    return () => { alive = false; clearInterval(id); };
  }, [days]);

  const series = useMemo(() => {
    // Fill missing days with 0
    const map = new Map(timeline.map(t => [t.day, t.trades]));
    const out: TimelinePoint[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({ day: key.slice(5), trades: map.get(key) || 0 });
    }
    return out;
  }, [timeline, days]);

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" /> Resources Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserIcon className="h-3.5 w-3.5" /> User
            </div>
            <div className="mt-1 text-lg font-semibold truncate">{stats?.username || "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">Uptime {stats ? fmtUptime(stats.uptimeSeconds) : "—"}</div>
          </div>

          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-success/5 to-success/10 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" /> Total Trades
            </div>
            <div className="mt-1 text-2xl font-bold">{stats?.totalTrades ?? "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">Across all sessions</div>
          </div>

          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-accent/30 to-accent/10 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <HardDrive className="h-3.5 w-3.5" /> Storage
            </div>
            <div className="mt-1 text-2xl font-bold">{stats ? fmtBytes(stats.storageBytes) : "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats ? `Uploads ${fmtBytes(stats.uploadsBytes)} · DB ${fmtBytes(stats.databaseBytes)}` : ""}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-muted/40 to-muted/10 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Cpu className="h-3.5 w-3.5" /> CPU
            </div>
            <div className="mt-1 text-2xl font-bold">{stats?.cpuPercent ?? 0}%</div>
            <Progress value={stats?.cpuPercent ?? 0} className="mt-2 h-1.5" />
          </div>
        </div>

        <div className="rounded-xl border border-border/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MemoryStick className="h-4 w-4" /> Memory
            </div>
            <div className="text-sm text-muted-foreground">
              {stats ? `${fmtBytes(stats.memory.usedBytes)} / ${fmtBytes(stats.memory.totalBytes)}` : "—"}
            </div>
          </div>
          <Progress value={stats?.memory.percent ?? 0} className="h-2" />
          <div className="mt-1 text-xs text-muted-foreground">{stats?.memory.percent ?? 0}% used</div>
        </div>

        <div className="rounded-xl border border-border/50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="text-sm font-medium">Activity Timeline</div>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v) as 7 | 30 | 90 | 120)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="120">Last 120 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="resUsageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="trades"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#resUsageGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceUsage;
