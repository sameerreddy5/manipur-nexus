import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, Users, Calendar, GraduationCap, 
  Clock, TrendingUp, Plus, FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AcademicStats {
  totalCourses: number;
  totalAssignments: number;
  totalStudents: number;
  totalFaculty: number;
}

export const AcademicSectionDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AcademicStats>({
    totalCourses: 0,
    totalAssignments: 0,
    totalStudents: 0,
    totalFaculty: 0
  });
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch courses
      const { data: courses } = await supabase
        .from('courses')
        .select('*');

      // Fetch course assignments
      const { data: assignments } = await supabase
        .from('course_assignments')
        .select(`
          *,
          course:courses(name, code),
          faculty:profiles!course_assignments_faculty_id_fkey(full_name),
          batch:batches(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch students and faculty counts
      const { data: students } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'Student');

      const { data: faculty } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'Faculty');

      // Fetch departments
      const { data: departmentsData } = await supabase
        .from('departments')
        .select('*')
        .eq('type', 'academic');

      setStats({
        totalCourses: courses?.length || 0,
        totalAssignments: assignments?.length || 0,
        totalStudents: students?.length || 0,
        totalFaculty: faculty?.length || 0
      });

      setRecentAssignments(assignments || []);
      setDepartments(departmentsData || []);
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
        <h1 className="text-3xl font-heading font-bold">Academic Section Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.fullName}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              offered this year
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              course-faculty pairs
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              enrolled students
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFaculty}</div>
            <p className="text-xs text-muted-foreground">
              active faculty
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Course Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Recent Course Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAssignments.length > 0 ? (
              <div className="space-y-3">
                {recentAssignments.map((assignment) => (
                  <div key={assignment.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{assignment.course?.name}</p>
                      <Badge variant="outline">{assignment.course?.code}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Faculty: {assignment.faculty?.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Batch: {assignment.batch?.name} | {assignment.semester}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Assigned: {new Date(assignment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No recent assignments
              </p>
            )}
          </CardContent>
        </Card>

        {/* Departments Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Academic Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {departments.length > 0 ? (
              <div className="space-y-3">
                {departments.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{dept.name}</p>
                      <p className="text-sm text-muted-foreground">{dept.code}</p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No departments found
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common academic administration tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-16 flex-col">
              <Plus className="h-6 w-6 mb-2" />
              <span className="text-sm">Create Course</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Users className="h-6 w-6 mb-2" />
              <span className="text-sm">Assign Faculty</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Calendar className="h-6 w-6 mb-2" />
              <span className="text-sm">Manage Timetable</span>
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