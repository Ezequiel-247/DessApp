/**
 * AuthContext - Contexto de autenticación
 * Implementación con llamadas reales al backend via Session entity
 * Stitch Design System - Academic Precision
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login, register, getMe } from '@/entities/Session';

export interface AuthUser {
  id: string;
  name: string;
  lastname: string;
  email: string;
  avatar?: string | null;
  role: string;
  is_active: boolean;
  careerId?: string;
  planId?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: any) => Promise<AuthUser>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: () => boolean;
  isStudent: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('desapp_token');
      if (token) {
        try {
          const userData = await getMe();
          setUser(userData);
        } catch (error) {
          console.error('Failed to recover session:', error);
          localStorage.removeItem('desapp_token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const loginAction = async (email: string, password: string): Promise<AuthUser> => {
    try {
      const { user: userData, token } = await login({ email, password });
      localStorage.setItem('desapp_token', token);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const registerAction = async (data: any): Promise<AuthUser> => {
    try {
      const { user: userData, token } = await register(data);
      localStorage.setItem('desapp_token', token);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('desapp_token');
    localStorage.removeItem('selected_enrollment_id');
    setUser(null);
  };

  const isAdmin = () => user?.role === 'admin';
  const isStudent = () => user?.role === 'student';

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login: loginAction, 
      register: registerAction, 
      logout, 
      isAdmin,
      isStudent,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
