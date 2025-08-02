import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { LogOut, User, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LayoutProps {
  children: ReactNode; // Accepts child components to render inside layout
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth(); // Custom hook to get authenticated user and signOut method
  const { profile } = useUserProfile(); // Custom hook to fetch the user's profile

  // If user is not authenticated, redirect to login/auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Handles user sign-out
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Brand title and user role badge */}
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">QuickDesk</h1>
            {profile && (
              <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                {profile.role}
              </span>
            )}
          </div>

          {/* User avatar and dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  {/* Displays user avatar or fallback */}
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                  <AvatarFallback>
                    {/* Fallback shows first letter of full name or username, defaults to 'U' */}
                    {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            {/* Dropdown menu content */}
            <DropdownMenuContent className="w-56" align="end" forceMount>
              {/* User info section */}
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{profile?.full_name || profile?.username}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Profile and Settings menu options */}
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Sign out button */}
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main layout content area */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};
