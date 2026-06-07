import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/lib/constants';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

/**
 * Component to restrict access based on user role.
 * If the user's role is not in the allowedRoles array, it redirects.
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo = '/dashboard' 
}: RoleGuardProps) {
  const { user, userRole, loading, isInitialised } = useAuth();

  // 1. While auth is still initialising or loading a transition, show the spinner.
  if (!isInitialised || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 2. If the user is not logged in, do not redirect or render anything.
  // Let the ProtectedRoute component handle the authentication check.
  if (!user) {
    return null;
  }

  // 3. If the user role is not in the allowed list, redirect.
  if (!allowedRoles.includes(userRole as UserRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
