import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          try {
            const response = await authAPI.getMe();
            // Handle both { success: true, data: user } and { success: true, user }
            setUser(response.data || (response as any).user || response);
            console.log("[AuthContext] User loaded from token:", (response.data || (response as any).user || response).email);
          } catch (error) {
            console.log('[AuthContext] Backend not available or token invalid, clearing token.');
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        } else {
          console.log("[AuthContext] No token found in localStorage.");
        }
      } catch (error) {
        console.error('[AuthContext] Error during auth initialization:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });
      // Handle both { success: true, data: { user, token } } and { success: true, user, token }
      const authData = response.data || response;
      const { user, token } = authData as any;

      console.log("[AuthContext] Login success:", user.email);
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
    } catch (error: any) {
      console.error("[AuthContext] Login error:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.register({ name, email, password });
      // Handle both { success: true, data: { user, token } } and { success: true, user, token }
      const authData = response.data || response;
      const { user, token } = authData as any;

      console.log("[AuthContext] Register success:", user.email);
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
    } catch (error: any) {
      console.error("[AuthContext] Register error:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

