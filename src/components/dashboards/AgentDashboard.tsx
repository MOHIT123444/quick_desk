// React hooks
import { useState, useEffect } from 'react';

// UI components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icon components for display
import { Ticket, Clock, CheckCircle, Users } from 'lucide-react';

// Component to list tickets
import { TicketList } from '@/components/tickets/TicketList';

// Supabase client for backend interaction
import { supabase } from '@/integrations/supabase/client';

// Custom hook to get authenticated user
import { useAuth } from '@/hooks/useAuth';

// Type definition for agent-specific ticket stats
interface AgentStats {
  total: number;           // Total tickets in system
  open: number;            // Open tickets
  in_progress: number;     // Tickets currently in progress
  resolved: number;        // Resolved tickets
  assigned_to_me: number;  // Tickets assigned to this agent
}

// Main component for the Agent Dashboard
export const AgentDashboard = () => {
  const { user } = useAuth(); // Get logged-in user details
  const [stats, setStats] = useState<AgentStats>({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    assigned_to_me: 0
  });

  // Key used to trigger data refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch stats when user is available or refreshKey changes
  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, refreshKey]);

  // Fetch ticket statistics for the agent
  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get all tickets to compute general stats
      const { data: allTickets, error: allError } = await supabase
        .from('tickets')
        .select('status, assigned_to');

      if (allError) throw allError;

      // Get only tickets assigned to current agent
      const { data: myTickets, error: myError } = await supabase
        .from('tickets')
        .select('status')
        .eq('assigned_to', user.id);

      if (myError) throw myError;

      // Calculate the agent's ticket stats
      const stats: AgentStats = {
        total: allTickets.length,
        open: allTickets.filter(t => t.status === 'open').length,
        in_progress: allTickets.filter(t => t.status === 'in_progress').length,
        resolved: allTickets.filter(t => t.status === 'resolved').length,
        assigned_to_me: myTickets.length
      };

      // Update state with new stats
      setStats(stats);
    } catch (error) {
      console.error('Error fetching agent stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page title and subtitle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agent Dashboard</h2>
          <p className="text-muted-foreground">Manage support tickets and help customers</p>
        </div>
      </div>

      {/* Ticket statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Total Tickets Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        {/* Open Tickets Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.open}</div>
          </CardContent>
        </Card>

        {/* In Progress Tickets Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.in_progress}</div>
          </CardContent>
        </Card>

        {/* Resolved Tickets Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>

        {/* Assigned to Me Tickets Card */}
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

      {/* Ticket Tabs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>Manage customer support requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            {/* Tab buttons */}
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Tickets</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>

            {/* All Tickets */}
            <TabsContent value="all" className="space-y-4">
              <TicketList refreshKey={refreshKey} userRole="agent" />
            </TabsContent>

            {/* Open Tickets */}
            <TabsContent value="open" className="space-y-4">
              <TicketList refreshKey={refreshKey} userRole="agent" statusFilter="open" />
            </TabsContent>

            {/* Tickets assigned to current agent */}
            <TabsContent value="assigned" className="space-y-4">
              <TicketList refreshKey={refreshKey} userRole="agent" assignedToMe={true} />
            </TabsContent>

            {/* Resolved Tickets */}
            <TabsContent value="resolved" className="space-y-4">
              <TicketList refreshKey={refreshKey} userRole="agent" statusFilter="resolved" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
