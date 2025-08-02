import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Ticket, Clock, CheckCircle } from 'lucide-react';
import { CreateTicketDialog } from '@/components/tickets/CreateTicketDialog';
import { TicketList } from '@/components/tickets/TicketList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
}

export const UserDashboard = () => {
  const { user } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, refreshKey]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('status')
        .eq('created_by', user.id);

      if (error) throw error;

      const stats: TicketStats = {
        total: data.length,
        open: data.filter(t => t.status === 'open').length,
        in_progress: data.filter(t => t.status === 'in_progress').length,
        resolved: data.filter(t => t.status === 'resolved').length
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTicketCreated = () => {
    setRefreshKey(prev => prev + 1);
    setShowCreateDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Support Tickets</h2>
          <p className="text-muted-foreground">Manage and track your support requests</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.in_progress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tickets</CardTitle>
          <CardDescription>View and manage your support tickets</CardDescription>
        </CardHeader>
        <CardContent>
          <TicketList refreshKey={refreshKey} userRole="user" />
        </CardContent>
      </Card>

      <CreateTicketDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onTicketCreated={handleTicketCreated}
      />
    </div>
  );
};