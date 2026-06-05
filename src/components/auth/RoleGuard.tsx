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
 * If the user's role is not in the allowedRoles array, it redirects or renders null.
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo = '/dashboard' 
}: RoleGuardProps) {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!userRole || !allowedRoles.includes(userRole as UserRole)) {
    // Redirect to unauthorised or dashboard if role doesn't match
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
