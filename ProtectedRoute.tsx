import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/lib/constants";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirigir según el rol del usuario
    switch (user.role) {
      case UserRole.ALARM_OPERATOR:
        setLocation("/alarms");
        break;
      case UserRole.DISPATCHER:
        setLocation("/dispatch");
        break;
      case UserRole.SUPERVISOR:
        setLocation("/supervisor-panel");
        break;
      case UserRole.ADMIN:
      case UserRole.DIRECTOR:
        setLocation("/reports");
        break;
      default:
        setLocation("/login");
    }
    return null;
  }

  return <>{children}</>;
}