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

  const extractAuthData = (response: any) => {
    let user = null;
    let token = null;

    if (!response) return { user: null, token: null };

    // Case 1: Direct properties (response.user, response.token)
    if (response.user) user = response.user;
    if (response.token) token = response.token;

    // Case 2: Within 'data' property (standard API pattern)
    if (response.data) {
      if (response.data.user) user = response.data.user;
      if (response.data.token) token = response.data.token;

      // Case 3: Nested twice (some wrappers or response envelopes)
      if (response.data.data) {
        if (response.data.data.user) user = response.data.data.user;
        if (response.data.data.token) token = response.data.data.token;
      }
    }

    // Fallback: If the object itself looks like a user object
    if (!user && response.email) {
      user = response;
    }

    return { user, token };
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("[AuthContext] Attempting login for:", email);
      const response = await authAPI.login({ email, password });

      // Diagnostic logging to see the ACTUAL shape in the console
      console.log("[AuthContext] Login response (detailed):", JSON.stringify(response, null, 2));

      const { user: userData, token: userToken } = extractAuthData(response);

      if (!userData || !userToken) {
        console.error("[AuthContext] Extraction failed. Response keys:", Object.keys(response || {}));
        throw new Error("Invalid response from server");
      }

      console.log("[AuthContext] Login successful for:", userData.email);
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
    } catch (error: any) {
      console.error("[AuthContext] Login error:", error.message || error);
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

      console.log("[AuthContext] Register response (detailed):", JSON.stringify(response, null, 2));

      const { user: userData, token: userToken } = extractAuthData(response);

      if (!userData || !userToken) {
        throw new Error("Invalid response from server");
      }

      console.log("[AuthContext] Registration successful for:", userData.email);
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
    } catch (error: any) {
      console.error("[AuthContext] Register error:", error.message || error);
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
