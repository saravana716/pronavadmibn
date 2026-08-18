
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../supabase';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { email: string; name: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);

  // Monitor auth state session on mount
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          setIsAuthenticated(true);
          setUser({
            email: session.user.email || '',
            name: session.user.email?.split('@')[0] || 'Admin'
          });
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        setIsAuthenticated(true);
        setUser({
          email: session.user.email || '',
          name: session.user.email?.split('@')[0] || 'Admin'
        });
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      });

      if (error) {
        console.error('Login error:', error.message);
        setIsLoading(false);
        return false;
      }

      if (data && data.user) {
        setIsAuthenticated(true);
        setUser({
          email: data.user.email || '',
          name: data.user.email?.split('@')[0] || 'Admin'
        });
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
