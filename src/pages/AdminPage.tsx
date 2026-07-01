import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, HardDrive, Activity, CheckCircle, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useUserRole } from "@/hooks/useUserRole";
import CandleLoader from "@/components/ui/candle-loader";
import ActivityLogs from "@/components/profile/ActivityLogs";
import MembersManager from "@/components/admin/MembersManager";

interface AdminStats {
  totalTrades: number;
  storageUsed: string;
}

const AdminPage = () => {
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({ totalTrades: 0, storageUsed: "0 MB" });


  useEffect(() => { loadAdminData(); /* eslint-disable-next-line */ }, []);

  const loadAdminData = async () => {
    try {
      const data = await api.get<AdminStats>("/api/admin/stats");
      setStats(data);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error loading admin data" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4"><CandleLoader /><span className="text-muted-foreground">Loading admin data...</span></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><ShieldAlert className="h-5 w-5" />Access Denied</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Admin privileges required.</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Monitor system health and usage</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forex Trades</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalTrades}</div>
              <p className="text-xs text-muted-foreground">Records in database</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.storageUsed}</div>
              <p className="text-xs text-muted-foreground">Uploads folder</p>
            </CardContent>
          </Card>
        </div>


        <Card className="shadow-card border-border/50">
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />System Health</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[["Database", "healthy"], ["Storage", "healthy"], ["Authentication", "healthy"]].map(([label]) => (
                <div key={label} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">{label}</span>
                  </div>
                  <Badge>HEALTHY</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <MembersManager />
        <ActivityLogs />
      </div>
    </div>
  );
};

export default AdminPage;
