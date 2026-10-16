import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { StaffProfile } from '@/types';
import { apiAuth } from '@/services/api';

interface AuthContextType {
  user: StaffProfile | null;
  isLoading: boolean;
  error: string | null;
  isSuperAdmin: boolean;
  login: (staffId: string, pass: string) => Promise<StaffProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const current = await apiAuth.getCurrentUser();
      setUser(current);
      setError(null);
    } catch (err: any) {
      setUser(null);
      setError(err?.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (staffId: string, pass: string): Promise<StaffProfile> => {
    setError(null);
    try {
      const loggedIn = await apiAuth.loginWithStaffId(staffId, pass);
      setUser(loggedIn);
      return loggedIn;
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      throw err;
    }
  };

  const logout = async () => {
    await apiAuth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
