import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { hasRole } from '@/utils/jwt';

interface RoleGuardProps {
  requiredRole: string;
}

export function RoleGuard({ requiredRole }: RoleGuardProps) {
  const { isAuthenticated, accessToken } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (hasRole(accessToken, [requiredRole])) {
    return <Outlet />;
  }

  return <Navigate to="/?accessDenied=true" replace />;
}
