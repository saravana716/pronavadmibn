
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

// Firebase configuration for Firestore/Database
const firestoreConfig = {
  apiKey: "AIzaSyA1mtHVRk0TyWhGFc50JGfVMsFK4tLoxWg",
  authDomain: "pranav-global-school---pgs.firebaseapp.com",
  projectId: "pranav-global-school---pgs",
  storageBucket: "pranav-global-school---pgs.firebasestorage.app",
  messagingSenderId: "1052193372039",
  appId: "1:1052193372039:web:f38831d3dbf591eee7c522"
};

// Initialize Firebase app for authentication
const firestoreApp = initializeApp(firestoreConfig, 'auth');
const db = getFirestore(firestoreApp);

const AUTH_STORAGE_KEY = 'admin_auth';

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

  // Check localStorage on mount to restore auth state
  useEffect(() => {
    const checkAuthState = () => {
      try {
        const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          setIsAuthenticated(true);
          setUser(authData.user);
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Query Firestore for admin with matching email
      // Normalize email: lowercase and trim
      const normalizedEmail = email.toLowerCase().trim();
      const adminRef = collection(db, 'admin');
      const q = query(adminRef, where('email', '==', normalizedEmail));
      const querySnapshot = await getDocs(q);
      
      console.log('Searching for email:', normalizedEmail);
      console.log('Query result count:', querySnapshot.size);

      if (querySnapshot.empty) {
        console.error('No admin found with email:', email);
        setIsLoading(false);
        return false;
      }

      // Check if password matches
      let adminFound = false;
      let adminData: { email: string; name: string } | null = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.password === password) {
          adminFound = true;
          adminData = {
            email: data.email,
            name: data.name || 'Admin'
          };
        }
      });

      if (adminFound && adminData) {
        setIsAuthenticated(true);
        setUser(adminData);
        
        // Save to localStorage
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          user: adminData,
          timestamp: Date.now()
        }));
        
        setIsLoading(false);
        return true;
      } else {
        console.error('Invalid password for email:', email);
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Check for Firestore permission errors
      if (error.code === 'permission-denied') {
        console.error('Firestore permission denied. Please check Firestore security rules.');
      }
      
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
