import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, GraduationCap, Building, AlertCircle, 
  Plus, Activity, TrendingUp, Clock, Heart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { QuickStatsCard } from "@/components/dashboard/QuickStatsCard";

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalDepartments: number;
  pendingComplaints: number;
  backendStatus: 'online' | 'offline';
}

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  created_at: string;
  user_name?: string;
}

export const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalDepartments: 0,
    pendingComplaints: 0,
    backendStatus: 'online'
  });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Access control
  if (user?.role !== 'Admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
              <h3 className="mt-2 text-lg font-semibold">Access Denied</h3>
              <p className="text-muted-foreground">You don't have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchDashboardData();
    // Check backend health every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch user counts
      const { data: profiles } = await supabase.from('profiles').select('role');
      const totalUsers = profiles?.length || 0;
      const totalStudents = profiles?.filter(p => p.role === 'Student').length || 0;
      const totalFaculty = profiles?.filter(p => p.role === 'Faculty').length || 0;

      // Fetch department count
      const { data: departments } = await supabase.from('departments').select('id');
      const totalDepartments = departments?.length || 0;

      // Fetch pending complaints
      const { data: complaints } = await supabase
        .from('hostel_complaints')
        .select('id')
        .eq('status', 'Pending');
      const pendingComplaints = complaints?.length || 0;

      // Fetch recent activities
      const { data: activityData } = await supabase
        .from('activity_logs')
        .select('id, action, details, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalUsers,
        totalStudents,
        totalFaculty,
        totalDepartments,
        pendingComplaints,
        backendStatus: 'online'
      });

      setActivities(activityData?.map(activity => ({
        id: activity.id,
        action: activity.action,
        details: activity.details,
        created_at: activity.created_at,
        user_name: activity.user_id
      })) || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const checkBackendHealth = async () => {
    try {
      const startTime = Date.now();
      await supabase.from('profiles').select('id').limit(1);
      const responseTime = Date.now() - startTime;

      // Update backend health status
      await supabase.from('backend_health').upsert({
        service_name: 'supabase',
        status: 'active',
        response_time: responseTime,
        last_check: new Date().toISOString()
      });

      setStats(prev => ({ ...prev, backendStatus: 'online' }));
    } catch (error) {
      console.error('Backend health check failed:', error);
      setStats(prev => ({ ...prev, backendStatus: 'offline' }));
      toast.error('Backend is offline!');
    }
  };

  const logActivity = async (action: string, details: string) => {
    try {
      await supabase.from('activity_logs').insert({
        user_id: user?.email,
        action,
        details
      });
      fetchDashboardData(); // Refresh to show new activity
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.email}! Here's your institutional overview.
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickStatsCard
          title="Total Users"
          description="All registered users"
          value={stats.totalUsers}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          className="hover-scale"
        />
        <QuickStatsCard
          title="Students"
          description="Enrolled students"
          value={stats.totalStudents}
          icon={GraduationCap}
          trend={{ value: 8, isPositive: true }}
          className="hover-scale"
        />
        <QuickStatsCard
          title="Faculty"
          description="Teaching staff"
          value={stats.totalFaculty}
          icon={Users}
          trend={{ value: 3, isPositive: true }}
          className="hover-scale"
        />
        <QuickStatsCard
          title="Departments"
          description="Academic departments"
          value={stats.totalDepartments}
          icon={Building}
          trend={{ value: 0, isPositive: true }}
          className="hover-scale"
        />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backend Status</CardTitle>
            <Heart className={`h-4 w-4 ${stats.backendStatus === 'online' ? 'text-green-500' : 'text-red-500 pulse'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={stats.backendStatus === 'online' ? 'default' : 'destructive'}>
                {stats.backendStatus === 'online' ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Last checked: {new Date().toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>

        <Card className="animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Complaints</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingComplaints}</div>
            <p className="text-xs text-muted-foreground">
              Hostel complaints awaiting review
            </p>
          </CardContent>
        </Card>

        <Card className="animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">
              Uptime this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => {
                window.location.href = '/admin/add-user';
                logActivity('Navigation', 'Accessed user creation form');
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              Create New User
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => {
                window.location.href = '/admin/departments';
                logActivity('Navigation', 'Accessed department management');
              }}
            >
              <Building className="mr-2 h-4 w-4" />
              Manage Departments
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => {
                window.location.href = '/admin/holidays';
                logActivity('Navigation', 'Accessed holiday management');
              }}
            >
              <Clock className="mr-2 h-4 w-4" />
              Holiday Management
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest system activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recent activities</p>
              ) : (
                activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-muted-foreground">{activity.details}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};