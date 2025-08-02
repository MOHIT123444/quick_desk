import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, User, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  role: 'user' | 'agent' | 'admin';
  avatar_url: string | null;
  created_at: string;
}

interface UserManagerProps {
  onUserUpdated: () => void;
}

const roleIcons = {
  user: <User className="h-4 w-4" />,
  agent: <Shield className="h-4 w-4" />,
  admin: <Crown className="h-4 w-4" />
};

const roleColors = {
  user: 'bg-blue-100 text-blue-800 border-blue-200',
  agent: 'bg-green-100 text-green-800 border-green-200',
  admin: 'bg-purple-100 text-purple-800 border-purple-200'
};

export const UserManager = ({ onUserUpdated }: UserManagerProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'agent' | 'admin') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Role Updated',
        description: `User role has been changed to ${newRole}.`
      });

      await fetchUsers();
      onUserUpdated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && users.length === 0) {
    return <div className="text-center py-4">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">User Management</h3>
        <p className="text-sm text-muted-foreground">
          Manage user roles and permissions
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || ''} alt={user.full_name || ''} />
                          <AvatarFallback>
                            {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.full_name || user.username || 'Unnamed User'}
                          </p>
                          {user.username && user.full_name && (
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.email}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role]}>
                        <span className="flex items-center gap-1">
                          {roleIcons[user.role]}
                          {user.role}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={user.role}
                        onValueChange={(value: 'user' | 'agent' | 'admin') =>
                          handleRoleChange(user.id, value)
                        }
                        disabled={loading}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">
                            <span className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              User
                            </span>
                          </SelectItem>
                          <SelectItem value="agent">
                            <span className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Agent
                            </span>
                          </SelectItem>
                          <SelectItem value="admin">
                            <span className="flex items-center gap-2">
                              <Crown className="h-4 w-4" />
                              Admin
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};