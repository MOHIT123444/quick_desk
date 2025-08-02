// React imports for state and effect hooks
import { useState, useEffect } from 'react';

// UI components from your design system
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icon components for dashboard visuals
import { Ticket, Clock, CheckCircle, Users, Tag, Shield } from 'lucide-react';

// Custom components for ticket listing and admin management
import { TicketList } from '@/components/tickets/TicketList';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { UserManager } from '@/components/admin/UserManager';

// Supabase client for backend data
import { supabase } from '@/integrations/supabase/client';

// Interface to type-check admin statistics structure
interface AdminStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  total_users: number;
  total_categories: number;
}

// Main admin dashboard component
export const AdminDashboard = () => {
  // State to hold various admin statistics
  const [stats, setStats] = useState<AdminStats>({
    total_tickets: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    resolved_tickets: 0,
    total_users: 0,
    total_categories: 0
  });

  // State to force refresh of dashboard data
  const [refreshKey, setRefreshKey] = useState(0);

  // Trigger data fetch on component mount or when refreshKey changes
  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  // Function to fetch data from Supabase and update stats
  const fetchStats = async () => {
    try {
      // Fetch all ticket statuses
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('status');

      if (ticketsError) throw ticketsError;

      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError) throw usersError;

      // Fetch all categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id');

      if (categoriesError) throw categoriesError;

      // Build admin statistics object
      const stats: AdminStats = {
        total_tickets: tickets.length,
        open_tickets: tickets.filter(t => t.status === 'open').length,
        in_progress_tickets: tickets.filter(t => t.status === 'in_progress').length,
        resolved_tickets: tickets.filter(t => t.status === 'resolved').length,
        total_users: users.length,
        total_categories: categories.length
      };

      // Update stats state
      setStats(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage system settings, users, and tickets</p>
        </div>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Total Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_tickets}</div>
          </CardContent>
        </Card>

        {/* Open Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.open_tickets}</div>
          </CardContent>
        </Card>

        {/* In Progress Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.in_progress_tickets}</div>
          </CardContent>
        </Card>

        {/* Resolved Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved_tickets}</div>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
          </CardContent>
        </Card>

        {/* Total Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_categories}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for system management sections */}
      <Card>
        <CardHeader>
          <CardTitle>System Management</CardTitle>
          <CardDescription>Manage tickets, users, and system settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tickets" className="w-full">
            {/* Tabs list */}
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tickets">All Tickets</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
            
            {/* Tickets tab */}
            <TabsContent value="tickets" className="space-y-4">
              <TicketList refreshKey={refreshKey} userRole="admin" />
            </TabsContent>
            
            {/* Users tab */}
            <TabsContent value="users" className="space-y-4">
              {/* RefreshKey is incremented to trigger data re-fetch in UserManager */}
              <UserManager onUserUpdated={() => setRefreshKey(prev => prev + 1)} />
            </TabsContent>
            
            {/* Categories tab */}
            <TabsContent value="categories" className="space-y-4">
              {/* RefreshKey is incremented to trigger data re-fetch in CategoryManager */}
              <CategoryManager onCategoryUpdated={() => setRefreshKey(prev => prev + 1)} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
