import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, Calendar, MessageSquare, UtensilsCrossed, 
  Home, Clock, TrendingUp, Bell
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface StudentStats {
  totalQueries: number;
  pendingQueries: number;
  upcomingClasses: number;
  hostelComplaints: number;
}

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats>({
    totalQueries: 0,
    pendingQueries: 0,
    upcomingClasses: 0,
    hostelComplaints: 0
  });
  const [todayTimetable, setTodayTimetable] = useState<any[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user.email]);

  const fetchDashboardData = async () => {
    try {
      // Fetch academic queries stats
      const { data: queries } = await supabase
        .from('academic_queries')
        .select('status')
        .eq('student_id', user.email);

      const totalQueries = queries?.length || 0;
      const pendingQueries = queries?.filter(q => q.status === 'Open').length || 0;

      // Fetch hostel complaints
      const { data: complaints } = await supabase
        .from('hostel_complaints')
        .select('status')
        .eq('student_id', user.email);

      const hostelComplaints = complaints?.filter(c => c.status === 'Pending').length || 0;

      // Fetch today's timetable (mock data for now)
      const today = new Date().getDay();
      const { data: timetable } = await supabase
        .from('timetables')
        .select('*')
        .eq('day_of_week', today)
        .limit(5);

      // Fetch recent announcements
      const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .contains('target_roles', ['Student'])
        .order('created_at', { ascending: false })
        .limit(3);

      setStats({
        totalQueries,
        pendingQueries,
        upcomingClasses: timetable?.length || 0,
        hostelComplaints
      });

      setTodayTimetable(timetable || []);
      setRecentAnnouncements(announcements || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.fullName}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Academic Queries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQueries}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingQueries} pending
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingClasses}</div>
            <p className="text-xs text-muted-foreground">
              scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hostel Issues</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hostelComplaints}</div>
            <p className="text-xs text-muted-foreground">
              pending complaints
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              this semester
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayTimetable.length > 0 ? (
              <div className="space-y-3">
                {todayTimetable.map((class_item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{class_item.subject}</p>
                      <p className="text-sm text-muted-foreground">{class_item.room}</p>
                    </div>
                    <Badge variant="outline">{class_item.time_slot}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No classes scheduled for today
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAnnouncements.length > 0 ? (
              <div className="space-y-3">
                {recentAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{announcement.title}</p>
                      {announcement.is_urgent && (
                        <Badge variant="destructive" className="text-xs">Urgent</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No recent announcements
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-16 flex-col">
              <MessageSquare className="h-6 w-6 mb-2" />
              <span className="text-sm">Ask Faculty</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Home className="h-6 w-6 mb-2" />
              <span className="text-sm">Hostel Complaint</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Calendar className="h-6 w-6 mb-2" />
              <span className="text-sm">View Timetable</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <UtensilsCrossed className="h-6 w-6 mb-2" />
              <span className="text-sm">Mess Menu</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};