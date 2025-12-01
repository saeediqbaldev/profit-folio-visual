import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Database, HardDrive, Activity, AlertTriangle, CheckCircle, ShieldAlert, ExternalLink, FileText } from "lucide-react";
import UserManagement from "@/components/admin/UserManagement";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import CandleLoader from "@/components/ui/candle-loader";

interface AdminStats {
  totalUsers: number;
  totalTrades: number;
  storageUsed: string;
  totalStorage: string;
  storagePercentage: number;
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  auth: 'healthy' | 'warning' | 'error';
}

const AdminPage = () => {
  const { toast } = useToast();
  const { role, loading: roleLoading, isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTrades: 0,
    storageUsed: "0 MB",
    totalStorage: "1 GB",
    storagePercentage: 0,
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    storage: 'healthy',
    auth: 'healthy',
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      // Get total trades count
      const { count: tradesCount, error: tradesError } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true });

      if (tradesError) {
        console.error('Error fetching trades count:', tradesError);
      }

      // Get total profiles count (users)
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        console.error('Error fetching users count:', usersError);
      }

      // Calculate storage (mock data for now as we need storage analytics)
      const storageUsedMB = Math.round((tradesCount || 0) * 0.1); // Rough estimation
      const storagePercentage = Math.min((storageUsedMB / 1024) * 100, 100);

      setStats({
        totalUsers: usersCount || 0,
        totalTrades: tradesCount || 0,
        storageUsed: `${storageUsedMB} MB`,
        totalStorage: "1 GB",
        storagePercentage,
      });

      // System health check
      setSystemHealth({
        database: tradesError || usersError ? 'warning' : 'healthy',
        storage: storagePercentage > 80 ? 'warning' : 'healthy',
        auth: 'healthy',
      });

    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        variant: "destructive",
        title: "Error loading admin data",
        description: "Failed to load system statistics.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getHealthIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const getHealthBadge = (status: 'healthy' | 'warning' | 'error') => {
    const variants = {
      healthy: 'default',
      warning: 'secondary',
      error: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status]} className="ml-2">
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CandleLoader />
          <span className="text-muted-foreground">Loading admin data...</span>
        </div>
      </div>
    );
  }

  // Security: Role-based access control
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <Card className="max-w-md shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You do not have permission to access this page. Admin privileges are required.
            </p>
            <Badge variant="secondary">Current Role: {role || 'user'}</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor system health, user statistics, and resource usage
          </p>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
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
              <p className="text-xs text-muted-foreground">of {stats.totalStorage} total</p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.storagePercentage.toFixed(1)}%</div>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.storagePercentage, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {getHealthIcon(systemHealth.database)}
                  <span className="font-medium">Database</span>
                </div>
                {getHealthBadge(systemHealth.database)}
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {getHealthIcon(systemHealth.storage)}
                  <span className="font-medium">Storage</span>
                </div>
                {getHealthBadge(systemHealth.storage)}
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {getHealthIcon(systemHealth.auth)}
                  <span className="font-medium">Authentication</span>
                </div>
                {getHealthBadge(systemHealth.auth)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supabase Project Information */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle>Supabase Project Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Project ID</Label>
                  <p className="font-mono text-sm">vmghabwzgzghigalicdq</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Project URL</Label>
                  <p className="font-mono text-sm">https://vmghabwzgzghigalicdq.supabase.co</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Database Size</Label>
                  <p className="text-sm">{stats.storageUsed} / {stats.totalStorage}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Active Tables</Label>
                  <p className="text-sm">2 (trades, profiles)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Management Section */}
        <UserManagement />

        {/* Quick Actions */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-medium mb-2 text-center">User Management</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center">Manage user accounts and permissions</p>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.open('https://supabase.com/dashboard/project/vmghabwzgzghigalicdq/auth/users', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Users
                </Button>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <Database className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-medium mb-2 text-center">Database Management</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center">View and manage database tables</p>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.open('https://supabase.com/dashboard/project/vmghabwzgzghigalicdq/editor', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Database
                </Button>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-medium mb-2 text-center">System Logs</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center">View authentication and database logs</p>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.open('https://supabase.com/dashboard/project/vmghabwzgzghigalicdq/logs/auth-logs', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Logs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Label = ({ className, children, ...props }: any) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
    {children}
  </label>
);

export default AdminPage;