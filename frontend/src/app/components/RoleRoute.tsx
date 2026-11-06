import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Role = 'user' | 'admin' | 'shelter' | 'vet';

interface RoleRouteProps {
  allowedRole: Role;
}

export default function RoleRoute({ allowedRole }: RoleRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Wrong role
  if (user.role !== allowedRole) {
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;

      case 'shelter':
        return <Navigate to="/shelter/dashboard" replace />;

      case 'vet':
        return <Navigate to="/vet/dashboard" replace />;

      case 'user':
      default:
        return <Navigate to="/user/home" replace />;
    }
  }

  return <Outlet />;
}