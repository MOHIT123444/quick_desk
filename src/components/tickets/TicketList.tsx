import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Calendar, User, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TicketDetailDialog } from './TicketDetailDialog';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  category_id: string | null;
  created_by: string;
  assigned_to: string | null;
  categories: { name: string; color: string } | null;
  creator: { full_name: string | null; username: string | null } | null;
  assignee: { full_name: string | null; username: string | null } | null;
}

interface TicketListProps {
  refreshKey: number;
  userRole: 'user' | 'agent' | 'admin';
  statusFilter?: string;
  assignedToMe?: boolean;
}

const statusColors = {
  open: 'bg-red-100 text-red-800 border-red-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200'
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-orange-100 text-orange-800 border-orange-200',
  high: 'bg-red-100 text-red-800 border-red-200',
  urgent: 'bg-purple-100 text-purple-800 border-purple-200'
};

export const TicketList = ({ refreshKey, userRole, statusFilter, assignedToMe }: TicketListProps) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchTickets();
  }, [refreshKey, statusFilter, assignedToMe, user]);

  const fetchTickets = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          categories(name, color),
          creator:profiles!tickets_created_by_fkey(full_name, username),
          assignee:profiles!tickets_assigned_to_fkey(full_name, username)
        `)
        .order(sortBy, { ascending: false });

      // Apply role-based filtering
      if (userRole === 'user') {
        query = query.eq('created_by', user.id);
      }

      // Apply status filter
      if (statusFilter && ['open', 'in_progress', 'resolved', 'closed'].includes(statusFilter)) {
        query = query.eq('status', statusFilter as 'open' | 'in_progress' | 'resolved' | 'closed');
      }

      // Apply assigned to me filter
      if (assignedToMe) {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="text-center py-4">Loading tickets...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search tickets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={sortBy} onValueChange={(value: string) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Created Date</SelectItem>
            <SelectItem value="updated_at">Last Updated</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets Grid */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No tickets found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium line-clamp-2">
                    {ticket.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="line-clamp-2">
                  {ticket.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusColors[ticket.status]}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={priorityColors[ticket.priority]}>
                    {ticket.priority}
                  </Badge>
                  {ticket.categories && (
                    <Badge 
                      variant="outline"
                      style={{ borderColor: ticket.categories.color }}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {ticket.categories.name}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Created: {formatDate(ticket.created_at)}
                  </div>
                  
                  {ticket.creator && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      By: {ticket.creator.full_name || ticket.creator.username}
                    </div>
                  )}
                  
                  {ticket.assignee && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Assigned: {ticket.assignee.full_name || ticket.assignee.username}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ticket Detail Dialog */}
      {selectedTicket && (
        <TicketDetailDialog
          ticket={selectedTicket}
          open={!!selectedTicket}
          onOpenChange={(open) => !open && setSelectedTicket(null)}
          userRole={userRole}
          onTicketUpdated={fetchTickets}
        />
      )}
    </div>
  );
};