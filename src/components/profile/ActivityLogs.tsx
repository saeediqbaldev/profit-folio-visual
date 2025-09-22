import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, User, LogIn, LogOut, Plus, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  created_at: string;
}

const ActivityLogs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadActivityLogs();
      // Log the page visit
      logActivity('PAGE_VISIT', 'Viewed profile page');
    }
  }, [user]);

  const loadActivityLogs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading activity logs:', error);
        toast({
          variant: "destructive",
          title: "Error loading activity logs",
          description: "Failed to load your activity history.",
        });
      } else {
        setLogs(data || []);
      }
    } catch (error) {
      console.error('Error in loadActivityLogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (action: string, details: string) => {
    if (!user) return;

    try {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action,
          details,
          ip_address: null, // Would need to get client IP
          user_agent: navigator.userAgent,
        });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return <LogIn className="h-4 w-4 text-green-500" />;
      case 'LOGOUT':
        return <LogOut className="h-4 w-4 text-red-500" />;
      case 'PROFILE_UPDATE':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'TRADE_CREATE':
        return <Plus className="h-4 w-4 text-emerald-500" />;
      case 'TRADE_UPDATE':
        return <Edit className="h-4 w-4 text-orange-500" />;
      case 'TRADE_DELETE':
        return <Trash2 className="h-4 w-4 text-destructive" />;
      case 'PAGE_VISIT':
        return <Activity className="h-4 w-4 text-primary" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (action: string) => {
    const colors = {
      LOGIN: 'bg-green-500/10 text-green-500 border-green-500/20',
      LOGOUT: 'bg-red-500/10 text-red-500 border-red-500/20',
      PROFILE_UPDATE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      TRADE_CREATE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      TRADE_UPDATE: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      TRADE_DELETE: 'bg-destructive/10 text-destructive border-destructive/20',
      PAGE_VISIT: 'bg-primary/10 text-primary border-primary/20',
    };

    return (
      <Badge className={colors[action as keyof typeof colors] || 'bg-muted text-muted-foreground'}>
        {action.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Logs
          </CardTitle>
          <Button
            onClick={loadActivityLogs}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-muted-foreground">Loading activity logs...</span>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No activity logs found
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
              >
                <div className="flex items-center gap-3">
                  {getActionIcon(log.action)}
                  <div>
                    <div className="flex items-center gap-2">
                      {getActionBadge(log.action)}
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at))} ago
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLogs;