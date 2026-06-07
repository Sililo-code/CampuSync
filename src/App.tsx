import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { USER_ROLES } from "./lib/constants";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* Protected Dashboard Redirect */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* Role-Specific Protected Routes */}
            <Route 
              path="/dashboard/student" 
              element={
                <ProtectedRoute requiredRole={USER_ROLES.STUDENT}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/lecturer" 
              element={
                <ProtectedRoute requiredRole={USER_ROLES.LECTURER}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/admin" 
              element={
                <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* Fallback Routes */}
            <Route 
              path="/unauthorised" 
              element={
                <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <h1 className="text-4xl font-bold text-destructive">403 - Access Denied</h1>
                  <p className="text-muted-foreground max-w-md">
                    You do not have the required permissions to view this page.
                  </p>
                  <button 
                    onClick={() => window.location.href = '/dashboard'}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Return to My Dashboard
                  </button>
                </div>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
