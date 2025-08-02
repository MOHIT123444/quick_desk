import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, Clock, CheckCircle, Users } from 'lucide-react';
import { TicketList } from '@/components/tickets/TicketList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AgentStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  assigned_to_me: number;
}

export const AgentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AgentStats>({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    assigned_to_me: 0
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
      // Get all tickets visible to agents
      const { data: allTickets, error: allError } = await supabase
        .from('tickets')
        .select('status, assigned_to');

      if (allError) throw allError;

      // Get tickets assigned to current agent
      const { data: myTickets, error: myError } = await supabase
        .from('tickets')
        .select('status')
        .eq('assigned_to', user.id);

      if (myError) throw myError;

      const stats: AgentStats = {
        total: allTickets.length,
        open: allTickets.filter(t => t.status === 'open').length,
        in_progress: allTickets.filter(t => t.status === 'in_progress').length,
        resolved: allTickets.filter(t => t.status === 'resolved').length,
        assigned_to_me: myTickets.length
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching agent stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agent Dashboard</h2>
          <p className="text-muted-foreground">Manage support tickets and help customers</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned to Me</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.assigned_to_me}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>Manage customer support requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Tickets</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <TicketList refreshKey={refreshKey} userRole="agent" />
            </TabsContent>
            
            <TabsContent value="open" className="space-y-4">
              <TicketList refreshKey={refreshKey} userRole="agent" statusFilter="open" />
            </TabsContent>
            
            <TabsContent value="assigned" className="space-y-4">
              <TicketList refreshKey={refreshKey} userRole="agent" assignedToMe={true} />
            </TabsContent>
            
            <TabsContent value="resolved" className="space-y-4">
              <TicketList refreshKey={refreshKey} userRole="agent" statusFilter="resolved" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};