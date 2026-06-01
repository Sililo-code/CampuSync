import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'lecturer' | 'student';
}

/**
 * Wraps a route to enforce authentication and optionally role-based access.
 * Redirects unauthenticated users to /auth.
 * Redirects authenticated users with the wrong role to /dashboard.
 * Shows a loading spinner during auth state resolution.
 *
 * NOTE: This component is scaffolded. Full implementation is pending Phase 2
 * of the CampuSync development roadmap (Core Architecture).
 */
export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
