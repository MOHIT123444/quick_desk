// Import necessary hooks, components, and icons
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, User, Tag, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Define Ticket and Comment interfaces to type the props and state
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

interface Comment {
  id: string;
  content: string;
  created_at: string;
  is_internal: boolean;
  user_id: string;
  user: { full_name: string | null; username: string | null; role: string } | null;
}

// Props for TicketDetailDialog component
interface TicketDetailDialogProps {
  ticket: Ticket;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: 'user' | 'agent' | 'admin';
  onTicketUpdated: () => void;
}

// Main dialog component for viewing and managing a support ticket
export const TicketDetailDialog = ({ 
  ticket, 
  open, 
  onOpenChange, 
  userRole, 
  onTicketUpdated 
}: TicketDetailDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState(ticket.status);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);

  // Fetch comments and agent list when dialog opens
  useEffect(() => {
    if (open) {
      fetchComments();
      if (userRole === 'agent' || userRole === 'admin') {
        fetchAgents();
      }
    }
  }, [open, ticket.id]);

  // Retrieve ticket comments from Supabase
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          user:profiles(full_name, username, role)
        `)
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Retrieve list of agents and admins
  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('role', ['agent', 'admin']);

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  // Handle comment submission
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticket.id,
          user_id: user.id,
          content: newComment.trim(),
          is_internal: false
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments(); // Refresh comments

      toast({
        title: 'Comment Added',
        description: 'Your comment has been added successfully.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add comment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle status updates
  const handleStatusUpdate = async () => {
    if (!user || newStatus === ticket.status) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Ticket status changed to ${newStatus.replace('_', ' ')}`
      });

      onTicketUpdated(); // Refresh ticket state
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle agent assignment
  const handleAssignTicket = async (agentId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_to: agentId || null })
        .eq('id', ticket.id);

      if (error) throw error;

      toast({
        title: 'Assignment Updated',
        description: agentId ? 'Ticket assigned successfully' : 'Ticket unassigned'
      });

      onTicketUpdated(); // Refresh ticket state
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update assignment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Format timestamps into a readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determine whether the user can update ticket details
  const canManageTicket = userRole === 'admin' || 
    (userRole === 'agent' && (ticket.assigned_to === user?.id || !ticket.assigned_to));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Dialog header section */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{ticket.title}</span>
            <Badge variant="outline">#{ticket.id.slice(-8)}</Badge>
          </DialogTitle>
          <DialogDescription>
            Created {formatDate(ticket.created_at)} by {ticket.creator?.full_name || ticket.creator?.username}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main ticket details and comments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket description card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </CardContent>
            </Card>

            {/* Comments section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing comments */}
                {comments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No comments yet.</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {comment.user?.full_name?.charAt(0) || comment.user?.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.user?.full_name || comment.user?.username}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {comment.user?.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}

                {/* Add comment form */}
                <form onSubmit={handleAddComment} className="space-y-3">
                  <div>
                    <Label htmlFor="comment">Add a comment</Label>
                    <Textarea
                      id="comment"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Type your comment here..."
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={loading || !newComment.trim()}>
                    {loading ? 'Adding...' : 'Add Comment'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with ticket metadata and actions */}
          <div className="space-y-4">
            {/* Ticket info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status badge */}
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge className={`${
                      ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                      ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Priority display */}
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{ticket.priority}</Badge>
                  </div>
                </div>

                {/* Category */}
                {ticket.categories && (
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <div className="mt-1">
                      <Badge variant="outline" style={{ borderColor: ticket.categories.color }}>
                        <Tag className="w-3 h-3 mr-1" />
                        {ticket.categories.name}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Creation date */}
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDate(ticket.created_at)}
                  </div>
                </div>

                {/* Last updated */}
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDate(ticket.updated_at)}
                  </div>
                </div>

                {/* Assignee */}
                {ticket.assignee && (
                  <div>
                    <Label className="text-sm font-medium">Assigned To</Label>
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="w-3 h-3" />
                      {ticket.assignee.full_name || ticket.assignee.username}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Management actions (status update, assignment) */}
            {canManageTicket && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status change dropdown */}
                  <div>
                    <Label htmlFor="status">Update Status</Label>
                    <div className="flex gap-2 mt-1">
                      <Select value={newStatus} onValueChange={(value: 'open' | 'in_progress' | 'resolved' | 'closed') => setNewStatus(value)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={handleStatusUpdate}
                        disabled={loading || newStatus === ticket.status}
                        size="sm"
                      >
                        Update
                      </Button>
                    </div>
                  </div>

                  {/* Agent assignment dropdown */}
                  {(userRole === 'agent' || userRole === 'admin') && (
                    <div>
                      <Label htmlFor="assign">Assign To</Label>
                      <div className="mt-1">
                        <Select 
                          value={ticket.assigned_to || ''} 
                          onValueChange={handleAssignTicket}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select agent" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
                            {agents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.full_name || agent.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
