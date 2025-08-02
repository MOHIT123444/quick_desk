import { useUserProfile } from '@/hooks/useUserProfile';
import { Layout } from '@/components/Layout';
import { UserDashboard } from '@/components/dashboards/UserDashboard';
import { AgentDashboard } from '@/components/dashboards/AgentDashboard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { profile, loading } = useUserProfile();

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Unable to load profile. Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  const renderDashboard = () => {
    switch (profile.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'agent':
        return <AgentDashboard />;
      default:
        return <UserDashboard />;
    }
  }
  // render the dashboard 

  return (
    <Layout>
      {renderDashboard()}
    </Layout>
  );
};

export default Dashboard;
