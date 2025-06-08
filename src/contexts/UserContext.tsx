import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface User {
  id: string;
  first_name: string;
  user_role: 'Dad' | 'Mom' | 'Son' | 'Daughter' | 'Single Man' | 'Single Woman' | 'Church Leader' | 'Coach';
  fitness_enabled: boolean;
  org_id?: string | null;
  linked_to_user_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && authUser) {
      loadUser(authUser.id);
    } else {
      setUser(null);
      setError(null);
    }
  }, [isAuthenticated, authUser]);

  const loadUser = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to load user: ${fetchError.message}`);
      }

      setUser(data);
    } catch (err) {
      console.error('Error loading user:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (authUser) {
      await loadUser(authUser.id);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!authUser || !user) {
      throw new Error('No authenticated user');
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update user: ${updateError.message}`);
      }

      setUser(data);
    } catch (err) {
      console.error('Error updating user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue: UserContextType = {
    user,
    isLoading,
    error,
    refreshUser,
    updateUser,
    clearError,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};