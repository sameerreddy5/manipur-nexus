import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, AlertTriangle, CheckCircle, Clock, 
  Users, Wrench, Bell, FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface WardenStats {
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  totalResidents: number;
}

export const HostelWardenDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<WardenStats>({
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    totalResidents: 0
  });
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch complaints data
      const { data: complaints } = await supabase
        .from('hostel_complaints')
        .select(`
          *,
          student_profile:profiles!hostel_complaints_student_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      const totalComplaints = complaints?.length || 0;
      const pendingComplaints = complaints?.filter(c => c.status === 'Pending').length || 0;
      const resolvedComplaints = complaints?.filter(c => c.status === 'Resolved').length || 0;

      // Get recent complaints
      const recent = complaints?.slice(0, 5) || [];

      // Get total residents (students with hostel info)
      const { data: residents } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'Student')
        .not('batch', 'is', null);

      setStats({
        totalComplaints,
        pendingComplaints,
        resolvedComplaints,
        totalResidents: residents?.length || 0
      });

      setRecentComplaints(recent);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Resolved': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'Maintenance': return <Wrench className="h-4 w-4" />;
      case 'Cleanliness': return <Home className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold">Hostel Warden Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.fullName}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComplaints}</div>
            <p className="text-xs text-muted-foreground">
              all time
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingComplaints}</div>
            <p className="text-xs text-muted-foreground">
              need attention
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolvedComplaints}</div>
            <p className="text-xs text-muted-foreground">
              this month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Residents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResidents}</div>
            <p className="text-xs text-muted-foreground">
              total students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Complaints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Recent Complaints
          </CardTitle>
          <CardDescription>Latest hostel complaints from students</CardDescription>
        </CardHeader>
        <CardContent>
          {recentComplaints.length > 0 ? (
            <div className="space-y-4">
              {recentComplaints.map((complaint) => (
                <div key={complaint.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getIssueTypeIcon(complaint.issue_type)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{complaint.issue_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {complaint.hostel_block} - Room {complaint.room_number}
                        </p>
                      </div>
                      <Badge className={getStatusColor(complaint.status)}>
                        {complaint.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {complaint.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>By: {complaint.student_profile?.full_name}</span>
                      <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No recent complaints
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common warden tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-16 flex-col">
              <AlertTriangle className="h-6 w-6 mb-2" />
              <span className="text-sm">View Complaints</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Users className="h-6 w-6 mb-2" />
              <span className="text-sm">Resident List</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Bell className="h-6 w-6 mb-2" />
              <span className="text-sm">Send Notice</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <FileText className="h-6 w-6 mb-2" />
              <span className="text-sm">Generate Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};