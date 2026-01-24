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
            console.log("[AuthContext] Load user response:", response);

            // Extracts user object robustly
            const userData = (response.data || (response as any).user || response) as any;

            if (userData && userData.email) {
              setUser(userData);
              console.log("[AuthContext] Profile loaded:", userData.email);
            } else {
              throw new Error("Invalid user data in response");
            }
          } catch (error) {
            console.log('[AuthContext] Session invalid or server error:', error);
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Init error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("[AuthContext] Attempting login for:", email);
      const response = await authAPI.login({ email, password });
      console.log("[AuthContext] Raw login response:", response);

      // Handle various response formats: 
      // 1. { data: { user, token } }
      // 2. { user, token }
      // 3. { success: true, user, token }
      const data = (response.data || response) as any;
      const userData = data.user || (data.email ? data : null);
      const userToken = data.token || (response as any).token;

      if (!userData || !userToken) {
        console.error("[AuthContext] Incomplete response:", { userData: !!userData, userToken: !!userToken });
        throw new Error("Invalid response from server");
      }

      console.log("[AuthContext] Login successful for:", userData.email);
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
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
      console.log("[AuthContext] Attempting registration for:", email);
      const response = await authAPI.register({ name, email, password });
      console.log("[AuthContext] Raw register response:", response);

      const data = (response.data || response) as any;
      const userData = data.user || (data.email ? data : null);
      const userToken = data.token || (response as any).token;

      if (!userData || !userToken) {
        throw new Error("Invalid response from server");
      }

      console.log("[AuthContext] Registration successful for:", userData.email);
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
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
