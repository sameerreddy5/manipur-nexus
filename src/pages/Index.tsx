import { LoginForm } from "@/components/auth/LoginForm";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, login, logout } = useAuth();

  if (!user.isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <DashboardLayout 
      userEmail={user.email} 
      userRole={user.role} 
      onLogout={logout} 
    />
  );
};

export default Index;
