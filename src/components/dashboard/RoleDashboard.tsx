import { QuickStatsCard } from "./QuickStatsCard";
import { RecentActivity } from "./RecentActivity";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, BookOpen, AlertCircle, FileText, 
  Clock, Utensils, Calendar, GraduationCap,
  PieChart, Building, MessageSquare, CheckCircle
} from "lucide-react";

interface RoleDashboardProps {
  userRole: string;
  userEmail: string;
}

export const RoleDashboard = ({ userRole, userEmail }: RoleDashboardProps) => {
  const getDashboardData = (role: string) => {
    const commonActivities = [
      {
        id: '1',
        type: 'announcement' as const,
        title: 'New Academic Calendar Released',
        description: 'Academic year 2024-25 calendar is now available',
        timestamp: '2 hours ago',
        user: 'Academic Section'
      }
    ];

    switch (role) {
      case 'Admin':
        return {
          stats: [
            { title: "Total Users", value: "1,234", description: "Active users", icon: Users, trend: { value: 12, isPositive: true } },
            { title: "Departments", value: "5", description: "Academic departments", icon: Building },
            { title: "Pending Complaints", value: "23", description: "Awaiting resolution", icon: AlertCircle, trend: { value: 8, isPositive: false } },
            { title: "System Health", value: "98%", description: "Uptime this month", icon: CheckCircle, trend: { value: 2, isPositive: true } }
          ],
          activities: [
            ...commonActivities,
            {
              id: '2',
              type: 'complaint' as const,
              title: 'Hostel Complaint Resolved',
              description: 'Water supply issue in Block A fixed',
              timestamp: '4 hours ago',
              status: 'resolved' as const,
              user: 'Hostel Warden'
            }
          ]
        };

      case 'Faculty':
        return {
          stats: [
            { title: "My Courses", value: "3", description: "This semester", icon: BookOpen },
            { title: "Students", value: "156", description: "Across all courses", icon: Users },
            { title: "Pending Queries", value: "12", description: "Student questions", icon: MessageSquare, trend: { value: 5, isPositive: false } },
            { title: "Classes Today", value: "4", description: "Scheduled lectures", icon: Clock }
          ],
          activities: [
            ...commonActivities,
            {
              id: '2',
              type: 'query' as const,
              title: 'New Academic Query',
              description: 'Student question about Data Structures assignment',
              timestamp: '1 hour ago',
              status: 'pending' as const,
              user: 'John Doe'
            }
          ]
        };

      case 'Student':
        return {
          stats: [
            { title: "Enrolled Courses", value: "6", description: "This semester", icon: BookOpen },
            { title: "Attendance", value: "87%", description: "Overall percentage", icon: CheckCircle, trend: { value: 3, isPositive: true } },
            { title: "Pending Queries", value: "2", description: "Awaiting response", icon: MessageSquare },
            { title: "Next Class", value: "2:30 PM", description: "Data Structures", icon: Clock }
          ],
          activities: [
            ...commonActivities,
            {
              id: '2',
              type: 'assignment' as const,
              title: 'Assignment Submitted',
              description: 'Data Structures Lab Assignment 3',
              timestamp: '3 hours ago',
              status: 'resolved' as const
            }
          ]
        };

      case 'Director':
        return {
          stats: [
            { title: "Total Students", value: "856", description: "All programs", icon: GraduationCap, trend: { value: 15, isPositive: true } },
            { title: "Faculty Members", value: "67", description: "Active faculty", icon: Users },
            { title: "Research Projects", value: "23", description: "Ongoing projects", icon: FileText, trend: { value: 18, isPositive: true } },
            { title: "Department Rating", value: "4.7", description: "Out of 5.0", icon: PieChart, trend: { value: 5, isPositive: true } }
          ],
          activities: [
            ...commonActivities,
            {
              id: '2',
              type: 'announcement' as const,
              title: 'Budget Allocation Approved',
              description: 'Research fund allocation for Q2 2024',
              timestamp: '6 hours ago',
              user: 'Finance Department'
            }
          ]
        };

      default:
        return {
          stats: [
            { title: "Dashboard", value: "Ready", description: "System operational", icon: CheckCircle },
            { title: "Notifications", value: "3", description: "Unread messages", icon: MessageSquare },
            { title: "Status", value: "Active", description: "Account status", icon: Users },
            { title: "Last Login", value: "Today", description: "Current session", icon: Clock }
          ],
          activities: commonActivities
        };
    }
  };

  const dashboardData = getDashboardData(userRole);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">
          Welcome back, {userEmail.split('@')[0]}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your {userRole.toLowerCase()} dashboard today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardData.stats.map((stat, index) => (
          <QuickStatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="academic-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Frequently used actions for {userRole.toLowerCase()}s
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {userRole === 'Admin' && (
              <>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Add New User
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Building className="mr-2 h-4 w-4" />
                  Manage Departments
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Holiday Calendar
                </Button>
              </>
            )}
            {userRole === 'Faculty' && (
              <>
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View Courses
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Academic Queries
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Create Announcement
                </Button>
              </>
            )}
            {userRole === 'Student' && (
              <>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="mr-2 h-4 w-4" />
                  View Timetable
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Utensils className="mr-2 h-4 w-4" />
                  Mess Menu
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Hostel Complaints
                </Button>
              </>
            )}
            {['Academic Section', 'Director', 'Hostel Warden', 'Mess Supervisor'].includes(userRole) && (
              <>
                <Button variant="outline" className="w-full justify-start">
                  <PieChart className="mr-2 h-4 w-4" />
                  View Reports
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Create Announcement
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity activities={dashboardData.activities} userRole={userRole} />
        </div>
      </div>
    </div>
  );
};