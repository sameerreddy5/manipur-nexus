import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Settings, User, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  userEmail: string;
  userRole: string;
  onLogout: () => void;
}

export const DashboardHeader = ({ userEmail, userRole, onLogout }: DashboardHeaderProps) => {
  const getUserInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const getRoleColor = (role: string) => {
    const colors = {
      "Admin": "bg-destructive",
      "Faculty": "bg-primary",
      "Student": "bg-accent",
      "Academic Section": "bg-secondary",
      "Director": "bg-gradient-to-r from-primary to-accent",
      "Hostel Warden": "bg-warning",
      "Mess Supervisor": "bg-success"
    };
    return colors[role as keyof typeof colors] || "bg-muted";
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo and Institution Name */}
        <div className="flex items-center space-x-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-heading font-bold text-primary">IIIT Manipur</h1>
            <p className="text-xs text-muted-foreground">Academic Portal</p>
          </div>
        </div>

        {/* Right side - Notifications and User Menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 h-auto p-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{userEmail.split('@')[0]}</p>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={`${getRoleColor(userRole)} text-xs`}
                    >
                      {userRole}
                    </Badge>
                  </div>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials(userEmail)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{userEmail.split('@')[0]}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};