import { useState } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { 
  Users, BookOpen, Calendar, Settings, Bell, 
  LogOut, Menu, X, Home, Building, MessageSquare,
  FileText, Clock, Utensils, AlertCircle, GraduationCap,
  User, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleDashboard } from "@/components/dashboard/RoleDashboard";
import { AnnouncementsPage } from "@/pages/Announcements";
import { ProfilePage } from "@/pages/Profile";
import { UsersPage } from "@/pages/Users";
import { DepartmentsPage } from "@/pages/Departments";

interface DashboardLayoutProps {
  userEmail: string;
  userRole: string;
  onLogout: () => Promise<{ error: any }>;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navigationItems: NavItem[] = [
  { name: "Dashboard", path: "/", icon: Home, roles: ["Admin", "Faculty", "Student", "Director"] },
  { name: "Announcements", path: "/announcements", icon: Bell, roles: ["Admin", "Faculty", "Student", "Director"] },
  { name: "Users", path: "/users", icon: Users, roles: ["Admin"] },
  { name: "Departments", path: "/departments", icon: Building, roles: ["Admin"] },
  { name: "Academic Queries", path: "/queries", icon: MessageSquare, roles: ["Faculty", "Student"] },
  { name: "Timetable", path: "/timetable", icon: Clock, roles: ["Student", "Faculty"] },
  { name: "Mess Menu", path: "/mess", icon: Utensils, roles: ["Student"] },
  { name: "Hostel Complaints", path: "/complaints", icon: AlertCircle, roles: ["Student"] },
  { name: "Reports", path: "/reports", icon: FileText, roles: ["Admin", "Director"] },
];

export const DashboardLayout = ({ userEmail, userRole, onLogout }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const filteredNavItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  const handleLogout = async () => {
    await onLogout();
  };

  const getActiveClass = (path: string) => {
    if (path === "/" && location.pathname === "/") return "bg-primary text-primary-foreground";
    if (path !== "/" && location.pathname.startsWith(path)) return "bg-primary text-primary-foreground";
    return "text-muted-foreground hover:text-foreground hover:bg-accent";
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-heading font-bold text-lg">IIIT Manipur</h1>
              <p className="text-xs text-muted-foreground">Academic Portal</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${getActiveClass(item.path)}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarFallback>
                    {userEmail.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{userEmail.split('@')[0]}</p>
                  <p className="text-xs text-muted-foreground">{userRole}</p>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <NavLink to="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {userRole}
            </Badge>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                3
              </Badge>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <Routes>
              <Route path="/" element={<RoleDashboard userRole={userRole} userEmail={userEmail} />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/queries" element={<div className="text-center py-8 text-muted-foreground">Academic Queries - Coming Soon</div>} />
              <Route path="/timetable" element={<div className="text-center py-8 text-muted-foreground">Timetable - Coming Soon</div>} />
              <Route path="/mess" element={<div className="text-center py-8 text-muted-foreground">Mess Menu - Coming Soon</div>} />
              <Route path="/complaints" element={<div className="text-center py-8 text-muted-foreground">Hostel Complaints - Coming Soon</div>} />
              <Route path="/reports" element={<div className="text-center py-8 text-muted-foreground">Reports - Coming Soon</div>} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};