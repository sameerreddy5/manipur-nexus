import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  UtensilsCrossed, Calendar, Users, TrendingUp, 
  Plus, Clock, Bell, FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface MessStats {
  todayMenus: number;
  weekMenus: number;
  totalStudents: number;
  menuUpdates: number;
}

export const MessSupervisorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<MessStats>({
    todayMenus: 0,
    weekMenus: 0,
    totalStudents: 0,
    menuUpdates: 0
  });
  const [todayMenus, setTodayMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's menus
      const { data: todayMenuData } = await supabase
        .from('mess_menus')
        .select('*')
        .eq('date', today)
        .order('meal_type');

      // Fetch this week's menus
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const { data: weekMenuData } = await supabase
        .from('mess_menus')
        .select('*')
        .gte('date', weekStart.toISOString().split('T')[0])
        .lte('date', weekEnd.toISOString().split('T')[0]);

      // Get total students
      const { data: students } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'Student');

      // Get recent menu updates (this month)
      const monthStart = new Date();
      monthStart.setDate(1);
      const { data: recentUpdates } = await supabase
        .from('mess_menus')
        .select('id')
        .gte('created_at', monthStart.toISOString())
        .eq('created_by', user.email);

      setStats({
        todayMenus: todayMenuData?.length || 0,
        weekMenus: weekMenuData?.length || 0,
        totalStudents: students?.length || 0,
        menuUpdates: recentUpdates?.length || 0
      });

      setTodayMenus(todayMenuData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snacks': return '🍪';
      default: return '🍽️';
    }
  };

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold">Mess Supervisor Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.fullName}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Menus</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayMenus}</div>
            <p className="text-xs text-muted-foreground">
              meals planned
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Week Menus</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekMenus}</div>
            <p className="text-xs text-muted-foreground">
              this week
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              to serve
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menu Updates</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.menuUpdates}</div>
            <p className="text-xs text-muted-foreground">
              this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Menu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UtensilsCrossed className="mr-2 h-5 w-5" />
            Today's Menu
          </CardTitle>
          <CardDescription>Planned meals for today</CardDescription>
        </CardHeader>
        <CardContent>
          {todayMenus.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {todayMenus.map((menu) => (
                <div key={menu.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getMealTypeIcon(menu.meal_type)}</span>
                      <h3 className="font-medium capitalize">{menu.meal_type}</h3>
                    </div>
                    <Badge variant="outline">{menu.items.length} items</Badge>
                  </div>
                  <div className="space-y-1">
                    {menu.items.slice(0, 3).map((item: string, index: number) => (
                      <p key={index} className="text-sm text-muted-foreground">• {item}</p>
                    ))}
                    {menu.items.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{menu.items.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No menu planned for today</p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Today's Menu
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common mess management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-16 flex-col">
              <Plus className="h-6 w-6 mb-2" />
              <span className="text-sm">Add Menu</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Calendar className="h-6 w-6 mb-2" />
              <span className="text-sm">View Schedule</span>
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