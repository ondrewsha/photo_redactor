
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthMeResponse } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: AuthMeResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.auth.me();
      setUser(data);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.error('Logout API call failed', e);
    } finally {
      // Полная очистка состояния
      setUser(null);
      // Перебрасываем на лендинг и сбрасываем URL
      window.location.href = '/';
    }
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
