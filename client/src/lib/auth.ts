import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

const getStoredAuth = () => {
  const token = localStorage.getItem('token');
  if (!token) return { token: null, user: null };

  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return { token: null, user: null };
    }

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return { token, user };
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { token: null, user: null };
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  ...getStoredAuth(),
  isLoading: false,
  error: null,
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, error: null });
  },
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
}));
