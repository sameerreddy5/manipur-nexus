import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Home, Users, BookOpen, Calendar, MessageSquare, 
  Settings, FileText, Building, Utensils, Clock,
  UserPlus, GraduationCap, AlertCircle, PieChart,
  BarChart3
} from "lucide-react";

interface SidebarItem {
  title: string;
  icon: any;
  href: string;
  roles?: string[];
}

const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", icon: Home, href: "/dashboard" },
  { title: "Profile", icon: Users, href: "/profile" },
  
  // Admin specific
  { title: "Admin Dashboard", icon: PieChart, href: "/admin/dashboard", roles: ["Admin"] },
  { title: "Add User", icon: UserPlus, href: "/admin/add-user", roles: ["Admin"] },
  { title: "Manage Departments", icon: Building, href: "/admin/departments", roles: ["Admin"] },
  { title: "Batch Management", icon: Calendar, href: "/admin/batches", roles: ["Admin"] },
  { title: "Backend Health", icon: AlertCircle, href: "/admin/health", roles: ["Admin"] },
  
  // Reports (for Admin, Academic Section, Faculty)
  { title: "Reports & Analytics", icon: BarChart3, href: "/reports", roles: ["Admin", "Academic Section", "Faculty"] },
  
  // Faculty specific
  { title: "My Courses", icon: BookOpen, href: "/faculty/courses", roles: ["Faculty"] },
  { title: "Academic Queries", icon: MessageSquare, href: "/faculty/queries", roles: ["Faculty"] },
  { title: "Announcements", icon: FileText, href: "/faculty/announcements", roles: ["Faculty"] },
  
  // Student specific
  { title: "Timetable", icon: Clock, href: "/student/timetable", roles: ["Student"] },
  { title: "Hostel Complaints", icon: AlertCircle, href: "/student/complaints", roles: ["Student"] },
  { title: "Mess Menu", icon: Utensils, href: "/student/mess", roles: ["Student"] },
  { title: "Academic Queries", icon: MessageSquare, href: "/student/queries", roles: ["Student"] },
  
  // Academic Section specific
  { title: "Timetable Management", icon: Clock, href: "/academic/timetables", roles: ["Academic Section"] },
  { title: "Course Assignment", icon: GraduationCap, href: "/academic/assignments", roles: ["Academic Section"] },
  
  // Director specific
  { title: "Institution Overview", icon: PieChart, href: "/director/overview", roles: ["Director"] },
  { title: "Department Reports", icon: FileText, href: "/director/reports", roles: ["Director"] },
  
  // Hostel Warden specific
  { title: "Hostel Complaints", icon: AlertCircle, href: "/warden/complaints", roles: ["Hostel Warden"] },
  
  // Mess Supervisor specific
  { title: "Menu Management", icon: Utensils, href: "/mess/management", roles: ["Mess Supervisor"] },
  
  // Common items
  { title: "Announcements", icon: FileText, href: "/announcements" },
  { title: "Settings", icon: Settings, href: "/settings" },
];

interface DashboardSidebarProps {
  userRole: string;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const DashboardSidebar = ({ userRole, currentPath, onNavigate }: DashboardSidebarProps) => {
  const filteredItems = sidebarItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      {/* Sidebar Header */}
      <div className="flex h-16 items-center border-b px-6">
        <GraduationCap className="h-6 w-6 text-primary" />
        <span className="ml-2 text-lg font-heading font-semibold">IIIT Portal</span>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {filteredItems.map((item) => (
            <Button
              key={item.href}
              variant={currentPath === item.href ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start transition-colors",
                currentPath === item.href && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => onNavigate(item.href)}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.title}
            </Button>
          ))}
        </nav>
      </ScrollArea>

      {/* User Role Badge */}
      <div className="border-t p-4">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">Logged in as</p>
          <p className="text-sm font-medium text-primary">{userRole}</p>
        </div>
      </div>
    </div>
  );
};