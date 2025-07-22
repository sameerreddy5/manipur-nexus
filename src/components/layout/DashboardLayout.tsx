import { useState } from "react";
import { DashboardHeader } from "../dashboard/DashboardHeader";
import { DashboardSidebar } from "../dashboard/DashboardSidebar";
import { RoleDashboard } from "../dashboard/RoleDashboard";
import { AddUserForm } from "../admin/AddUserForm";

interface DashboardLayoutProps {
  userEmail: string;
  userRole: string;
  onLogout: () => void;
}

export const DashboardLayout = ({ userEmail, userRole, onLogout }: DashboardLayoutProps) => {
  const [currentPath, setCurrentPath] = useState("/dashboard");

  const renderContent = () => {
    switch (currentPath) {
      case "/dashboard":
        return <RoleDashboard userRole={userRole} userEmail={userEmail} />;
      case "/admin/add-user":
        return userRole === "Admin" ? <AddUserForm /> : <div>Access Denied</div>;
      case "/profile":
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-heading font-bold">Profile Management</h1>
            <p className="text-muted-foreground">Manage your personal information and settings.</p>
            <div className="academic-card p-6 rounded-lg">
              <p>Profile management interface coming soon...</p>
            </div>
          </div>
        );
      case "/admin/departments":
        return userRole === "Admin" ? (
          <div className="space-y-6">
            <h1 className="text-3xl font-heading font-bold">Department Management</h1>
            <p className="text-muted-foreground">Manage academic departments and batches.</p>
            <div className="academic-card p-6 rounded-lg">
              <p>Department management interface coming soon...</p>
            </div>
          </div>
        ) : <div>Access Denied</div>;
      case "/admin/holidays":
        return userRole === "Admin" ? (
          <div className="space-y-6">
            <h1 className="text-3xl font-heading font-bold">Holiday Calendar</h1>
            <p className="text-muted-foreground">Manage institutional holidays and events.</p>
            <div className="academic-card p-6 rounded-lg">
              <p>Holiday calendar interface coming soon...</p>
            </div>
          </div>
        ) : <div>Access Denied</div>;
      case "/faculty/courses":
        return userRole === "Faculty" ? (
          <div className="space-y-6">
            <h1 className="text-3xl font-heading font-bold">My Courses</h1>
            <p className="text-muted-foreground">Manage your assigned courses and students.</p>
            <div className="academic-card p-6 rounded-lg">
              <p>Course management interface coming soon...</p>
            </div>
          </div>
        ) : <div>Access Denied</div>;
      case "/student/timetable":
        return userRole === "Student" ? (
          <div className="space-y-6">
            <h1 className="text-3xl font-heading font-bold">My Timetable</h1>
            <p className="text-muted-foreground">View your class schedule and academic calendar.</p>
            <div className="academic-card p-6 rounded-lg">
              <p>Timetable interface coming soon...</p>
            </div>
          </div>
        ) : <div>Access Denied</div>;
      case "/student/complaints":
        return userRole === "Student" ? (
          <div className="space-y-6">
            <h1 className="text-3xl font-heading font-bold">Hostel Complaints</h1>
            <p className="text-muted-foreground">Submit and track your hostel-related complaints.</p>
            <div className="academic-card p-6 rounded-lg">
              <p>Complaint system interface coming soon...</p>
            </div>
          </div>
        ) : <div>Access Denied</div>;
      case "/student/mess":
        return userRole === "Student" ? (
          <div className="space-y-6">
            <h1 className="text-3xl font-heading font-bold">Mess Menu</h1>
            <p className="text-muted-foreground">View daily and weekly mess menu.</p>
            <div className="academic-card p-6 rounded-lg">
              <p>Mess menu interface coming soon...</p>
            </div>
          </div>
        ) : <div>Access Denied</div>;
      case "/announcements":
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-heading font-bold">Announcements</h1>
            <p className="text-muted-foreground">View latest announcements and notices.</p>
            <div className="academic-card p-6 rounded-lg">
              <p>Announcements interface coming soon...</p>
            </div>
          </div>
        );
      case "/settings":
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-heading font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences and settings.</p>
            <div className="academic-card p-6 rounded-lg">
              <p>Settings interface coming soon...</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-heading font-bold">Page Not Found</h1>
            <p className="text-muted-foreground">The requested page could not be found.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar 
        userRole={userRole} 
        currentPath={currentPath} 
        onNavigate={setCurrentPath} 
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          userEmail={userEmail} 
          userRole={userRole} 
          onLogout={onLogout} 
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};