import { useQuery } from "@tanstack/react-query";

export interface User {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isAuthenticated: boolean;
}

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: true,
  });

  const isAuthenticated = !!user?.isAuthenticated;

  const login = () => {
    // Redirect to the login endpoint
    window.location.href = "/api/login";
  };

  const logout = () => {
    // Redirect to the logout endpoint
    window.location.href = "/api/logout";
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    refetch,
  };
}