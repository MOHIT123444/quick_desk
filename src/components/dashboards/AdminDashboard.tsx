import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, Clock, CheckCircle, Users, Tag, Shield } from 'lucide-react';
import { TicketList } from '@/components/tickets/TicketList';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { UserManager } from '@/components/admin/UserManager';
import { supabase } from '@/integrations/supabase/client';

// add all the details for admin 
interface AdminStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  total_users: number;
  total_categories: number;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    total_tickets: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    resolved_tickets: 0,
    total_users: 0,
    total_categories: 0
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    try {
      // Get ticket stats
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('status');

      if (ticketsError) throw ticketsError;

      // Get user count
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError) throw usersError;

      // Get category count
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id');

      if (categoriesError) throw categoriesError;

      const stats: AdminStats = {
        total_tickets: tickets.length,
        open_tickets: tickets.filter(t => t.status === 'open').length,
        in_progress_tickets: tickets.filter(t => t.status === 'in_progress').length,
        resolved_tickets: tickets.filter(t => t.status === 'resolved').length,
        total_users: users.length,
        total_categories: categories.length
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage system settings, users, and tickets</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_tickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.open_tickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.in_progress_tickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved_tickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
          </CardContent>
        </Card>

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

      {/* Admin Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>System Management</CardTitle>
          <CardDescription>Manage tickets, users, and system settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tickets" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tickets">All Tickets</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tickets" className="space-y-4">
              <TicketList refreshKey={refreshKey} userRole="admin" />
            </TabsContent>
            
            <TabsContent value="users" className="space-y-4">
              <UserManager onUserUpdated={() => setRefreshKey(prev => prev + 1)} />
            </TabsContent>
            
            <TabsContent value="categories" className="space-y-4">
              <CategoryManager onCategoryUpdated={() => setRefreshKey(prev => prev + 1)} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
