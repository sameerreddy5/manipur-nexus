import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, BookOpen, MessageSquare, Calendar, 
  Clock, TrendingUp, Bell, GraduationCap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface FacultyStats {
  totalStudents: number;
  pendingQueries: number;
  todayClasses: number;
  courseAssignments: number;
}

export const FacultyDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<FacultyStats>({
    totalStudents: 0,
    pendingQueries: 0,
    todayClasses: 0,
    courseAssignments: 0
  });
  const [todayTimetable, setTodayTimetable] = useState<any[]>([]);
  const [pendingQueries, setPendingQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user.email]);

  const fetchDashboardData = async () => {
    try {
      // Fetch pending academic queries
      const { data: queries } = await supabase
        .from('academic_queries')
        .select(`
          *,
          student_profile:profiles!academic_queries_student_id_fkey(full_name)
        `)
        .eq('faculty_id', user.email)
        .eq('status', 'Open')
        .order('created_at', { ascending: false })
        .limit(5);

      const pendingQueriesCount = queries?.length || 0;

      // Fetch course assignments
      const { data: assignments } = await supabase
        .from('course_assignments')
        .select('*')
        .eq('faculty_id', user.email);

      const courseAssignments = assignments?.length || 0;

      // Fetch today's timetable
      const today = new Date().getDay();
      const { data: timetable } = await supabase
        .from('timetables')
        .select('*')
        .eq('faculty_id', user.email)
        .eq('day_of_week', today);

      const todayClasses = timetable?.length || 0;

      // Get total students (approximate)
      const { data: students } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'Student');

      setStats({
        totalStudents: students?.length || 0,
        pendingQueries: pendingQueriesCount,
        todayClasses,
        courseAssignments
      });

      setTodayTimetable(timetable || []);
      setPendingQueries(queries || []);
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
        <h1 className="text-3xl font-heading font-bold">Faculty Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.fullName}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              in the institute
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Queries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingQueries}</div>
            <p className="text-xs text-muted-foreground">
              need your response
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayClasses}</div>
            <p className="text-xs text-muted-foreground">
              scheduled classes
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Course Load</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.courseAssignments}</div>
            <p className="text-xs text-muted-foreground">
              assigned courses
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
              Today's Classes
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

        {/* Pending Student Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Recent Student Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingQueries.length > 0 ? (
              <div className="space-y-3">
                {pendingQueries.map((query) => (
                  <div key={query.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{query.subject}</p>
                      <Badge variant="outline">{query.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      From: {query.student_profile?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(query.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No pending queries
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common faculty tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-16 flex-col">
              <MessageSquare className="h-6 w-6 mb-2" />
              <span className="text-sm">Student Queries</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <GraduationCap className="h-6 w-6 mb-2" />
              <span className="text-sm">Grade Students</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Calendar className="h-6 w-6 mb-2" />
              <span className="text-sm">View Schedule</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Bell className="h-6 w-6 mb-2" />
              <span className="text-sm">Make Announcement</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};