import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user.isAuthenticated) {
      navigate("/auth");
    }
  }, [user.isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-center space-y-4">
          <GraduationCap className="h-16 w-16 text-white mx-auto animate-pulse" />
          <p className="text-white text-lg">Loading IIIT Manipur Portal...</p>
        </div>
      </div>
    );
  }

  if (!user.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-3">
            <GraduationCap className="h-16 w-16 text-white" />
            <div>
              <h1 className="text-4xl font-heading font-bold text-white">IIIT Manipur</h1>
              <p className="text-white/80 text-lg">Academic Portal</p>
            </div>
          </div>
          <Button 
            variant="academic" 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="bg-white/10 border border-white/20 hover:bg-white/20"
          >
            Access Portal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      userEmail={user.email} 
      userRole={user.role} 
      onLogout={signOut} 
    />
  );
};

export default Index;
