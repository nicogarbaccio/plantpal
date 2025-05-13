import { ReactNode, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuthContext } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, showLoginDialog } = useAuthContext();
  const [, setLocation] = useLocation();
  const [isCurrentRoute] = useRoute(useLocation()[0]);

  useEffect(() => {
    // If user is not authenticated and the loading has finished
    // Show the login dialog with a callback to stay on the page
    if (!isLoading && !isAuthenticated && isCurrentRoute) {
      showLoginDialog(() => {
        // After successful login, we'll stay on this page
        console.log('Successful login, staying on protected page');
      });
    }
  }, [isAuthenticated, isLoading, isCurrentRoute, showLoginDialog]);

  // Show the content if authenticated or if still loading
  if (isAuthenticated || isLoading) {
    return <>{children}</>;
  }

  // Return null while the login dialog handles the auth flow
  return null;
}