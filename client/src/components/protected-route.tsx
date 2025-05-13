import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthContext } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthContext();
  const [, setLocation] = useLocation();
  
  // If not authenticated, redirect to explore page
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Navigate to explore page if not authenticated
      setLocation('/explore');
    }
  }, [isAuthenticated, isLoading, setLocation]);
  
  // Show the content if authenticated or if still loading
  if (isAuthenticated || isLoading) {
    return <>{children}</>;
  }
  
  // Return null while redirecting
  return null;
}