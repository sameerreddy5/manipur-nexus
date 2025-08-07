import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Index from "./pages/Index";
import { AuthPage } from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { AdminDashboardPage } from "./pages/AdminDashboard";
import { DepartmentManagementPage } from "./pages/DepartmentManagement";
import { EnhancedUserCreationPage } from "./pages/EnhancedUserCreation";
import { BatchManagementPage } from "./pages/BatchManagement";
import { EnhancedAcademicQueriesPage } from "./pages/EnhancedAcademicQueries";
import { BackendHealthMonitorPage } from "./pages/BackendHealthMonitor";
import Reports from "./pages/Reports";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user.isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (user.isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          } />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/users/create" element={
            <ProtectedRoute>
              <EnhancedUserCreationPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/departments" element={
            <ProtectedRoute>
              <DepartmentManagementPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/batches" element={
            <ProtectedRoute>
              <BatchManagementPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/health" element={
            <ProtectedRoute>
              <BackendHealthMonitorPage />
            </ProtectedRoute>
          } />
          
          <Route path="/academic-queries" element={
            <ProtectedRoute>
              <EnhancedAcademicQueriesPage />
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;