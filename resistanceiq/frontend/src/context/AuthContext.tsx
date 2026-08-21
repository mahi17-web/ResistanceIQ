import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.ts';
import { User, Organization } from '../api/types.ts';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        return await api.getCurrentUser();
      } catch {
        return null;
      }
    },
    staleTime: 60000,
  });

  const { data: organization } = useQuery({
    queryKey: ['settings-org'],
    queryFn: async () => {
      try {
        return await api.getOrganization();
      } catch {
        return null;
      }
    },
    enabled: !!user,
  });

  const login = async (email: string, password?: string) => {
    await api.login(email, password);
    await refetchUser();
    queryClient.invalidateQueries();
  };

  const logout = () => {
    api.logout();
    queryClient.clear();
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        organization: organization || null,
        isAuthenticated: !!user,
        isLoading: isUserLoading,
        login,
        logout,
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
