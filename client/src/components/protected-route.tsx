import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuthContext } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, showLoginDialog } = useAuthContext();
  const [, setLocation] = useLocation();
  const [isCurrentRoute] = useRoute(useLocation()[0]);
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);

  useEffect(() => {
    // If user is not authenticated and the loading has finished
    // and we haven't already attempted to authenticate
    if (!isLoading && !isAuthenticated && isCurrentRoute && !hasAttemptedAuth) {
      setHasAttemptedAuth(true);
      
      // Show login dialog, but if cancelled, redirect to home
      showLoginDialog(() => {
        // After successful login, we'll stay on this page
        console.log('Successful login, staying on protected page');
      });

      // We'll handle the cancellation in the parent component
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          // Redirect to explore page if ESC is pressed
          setLocation('/');
        }
      };

      // Add event listener for ESC key
      window.addEventListener('keydown', handleEsc);
      
      // Clean up
      return () => {
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isAuthenticated, isLoading, isCurrentRoute, showLoginDialog, hasAttemptedAuth, setLocation]);

  // Show the content if authenticated or if still loading
  if (isAuthenticated || isLoading) {
    return <>{children}</>;
  }

  // Redirect to home page if not authenticated and not loading
  if (!isAuthenticated && !isLoading) {
    setLocation('/');
    return null;
  }

  // This shouldn't happen
  return null;
}