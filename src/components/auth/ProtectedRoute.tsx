import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/lib/constants';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

/**
 * Wraps a route to enforce authentication and optionally role-based access.
 * Redirects unauthenticated users to /auth.
 * Redirects authenticated users with the wrong role to /unauthorised.
 * Shows a loading spinner during auth state resolution.
 */
export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userRole, loading, isInitialised } = useAuth();

  // 1. While auth is still initialising for the first time, show the spinner.
  // loading may also be true during transitions (sign in/out).
  if (!isInitialised || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 2. Auth state is fully initialised and not loading a transition.
  // If no user is found, redirect to auth immediately.
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // 3. User is authenticated and state is not loading.
  // If a specific role is required and the user does not match, redirect to unauthorised.
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorised" replace />;
  }

  return <>{children}</>;
}
