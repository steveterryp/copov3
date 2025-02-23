'use client';

import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth';
import { UserRole, ResourceType, ResourceAction, type User, type ApiResponseWithCookies, type AuthResponse, type LoginData, type RegisterData, convertUserResponse } from '@/lib/types/auth';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoadingUser: boolean;
  login: (data: LoginData) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  isLoggingIn: boolean;
  isRegistering: boolean;
  isLoggingOut: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (resourceType: ResourceType, action: ResourceAction) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user, setUser, clearUser, accessToken } = useAuthStore();

  const loginMutation = useMutation<AuthResponse, Error, LoginData>({
    mutationFn: async (data) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const responseData = await response.json() as ApiResponseWithCookies<AuthResponse>;
      if (!responseData.data) {
        throw new Error('Invalid response format');
      }
      return responseData.data;
    },
    onSuccess: (data) => {
      setUser(convertUserResponse(data.user), data.accessToken);
    },
  });

  const registerMutation = useMutation<AuthResponse, Error, RegisterData>({
    mutationFn: async (data) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const responseData = await response.json() as ApiResponseWithCookies<AuthResponse>;
      if (!responseData.data) {
        throw new Error('Invalid response format');
      }
      return responseData.data;
    },
    onSuccess: (data) => {
      setUser(convertUserResponse(data.user), data.accessToken);
    },
  });

  const logoutMutation = useMutation<void, Error>({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Logout failed');
      }
    },
    onSuccess: () => {
      clearUser();
      queryClient.clear();
    },
  });

  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        if (response.status === 401) {
          clearUser();
          return null;
        }
        throw new Error('Failed to fetch user');
      }
      const data = await response.json() as ApiResponseWithCookies<{ user: User; accessToken: string }>;
      if (!data.data?.user || !data.data?.accessToken) {
        throw new Error('Invalid response format');
      }
      setUser(convertUserResponse(data.data.user), data.data.accessToken);
      return data.data.user;
    },
    retry: false,
  });

  const hasRole = (role: UserRole) => {
    if (!user) return false;
    if (user.role === UserRole.SUPER_ADMIN) return true;
    if (user.role === UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) return true;
    return user.role === role;
  };

  const hasPermission = (resourceType: ResourceType, action: ResourceAction) => {
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.role === UserRole.SUPER_ADMIN) return true;
    
    // For admin sections, check if the user is an admin
    if ([
    ResourceType.USER_MANAGEMENT,
    ResourceType.PERMISSIONS,
    ResourceType.JOB_TITLES,
    ResourceType.CRM,
    ResourceType.CRM_SETTINGS,
    ResourceType.CRM_MAPPING,
    ResourceType.CRM_SYNC,
    ResourceType.AUDIT
  ].includes(resourceType)) {
      return [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);
    }

    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoadingUser,
        login: loginMutation.mutateAsync,
        register: registerMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,
        isRegistering: registerMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
        hasRole,
        hasPermission,
      }}
    >
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
