import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Types
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

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  custom_domain?: string | null;
  admin_user_id: string;
  plan_tier: string;
  created_at: string;
  updated_at: string;
}

interface AppContextType {
  // Auth state
  supabaseUser: SupabaseUser | null;
  isAuthenticated: boolean;
  
  // User state
  user: User | null;
  
  // Organization state
  organization: Organization | null;
  
  // Helper booleans
  isOrgUser: boolean;
  isIndividualUser: boolean;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshUser: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Custom hook to use the context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Auth state
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // User state
  const [user, setUser] = useState<User | null>(null);
  
  // Organization state
  const [organization, setOrganization] = useState<Organization | null>(null);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth listener and load initial data
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`);
        }

        if (mounted) {
          if (session?.user) {
            setSupabaseUser(session.user);
            setIsAuthenticated(true);
            await loadUserData(session.user.id);
          } else {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize authentication');
          setIsLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.email);

      if (session?.user) {
        setSupabaseUser(session.user);
        setIsAuthenticated(true);
        await loadUserData(session.user.id);
      } else {
        setSupabaseUser(null);
        setIsAuthenticated(false);
        setUser(null);
        setOrganization(null);
        setIsLoading(false);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load user data and determine context (individual vs organization)
  const loadUserData = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new Error(`Failed to load user data: ${userError.message}`);
      }

      setUser(userData);

      // Check if user belongs to an organization
      if (userData.org_id) {
        await loadOrganizationData(userData.org_id);
      } else {
        setOrganization(null);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load organization data
  const loadOrganizationData = async (orgId: string) => {
    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (orgError) {
        throw new Error(`Failed to load organization data: ${orgError.message}`);
      }

      setOrganization(orgData);
    } catch (err) {
      console.error('Error loading organization data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load organization data');
      // Don't set organization to null here - user might still be valid individual user
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (supabaseUser) {
      await loadUserData(supabaseUser.id);
    }
  };

  // Refresh organization data
  const refreshOrganization = async () => {
    if (user?.org_id) {
      await loadOrganizationData(user.org_id);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(`Logout failed: ${error.message}`);
      }

      // Clear local storage
      localStorage.removeItem('onboarding_data');
      localStorage.removeItem('org_onboarding_result');

      // Reset state
      setSupabaseUser(null);
      setIsAuthenticated(false);
      setUser(null);
      setOrganization(null);
      setError(null);
    } catch (err) {
      console.error('Error during logout:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
      
      // Force logout even if there's an error
      localStorage.removeItem('onboarding_data');
      localStorage.removeItem('org_onboarding_result');
      setSupabaseUser(null);
      setIsAuthenticated(false);
      setUser(null);
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper computed values
  const isOrgUser = Boolean(user?.org_id && organization);
  const isIndividualUser = Boolean(user && !user.org_id);

  const contextValue: AppContextType = {
    // Auth state
    supabaseUser,
    isAuthenticated,
    
    // User state
    user,
    
    // Organization state
    organization,
    
    // Helper booleans
    isOrgUser,
    isIndividualUser,
    
    // Loading and error states
    isLoading,
    error,
    
    // Actions
    refreshUser,
    refreshOrganization,
    logout,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Export the context for direct access if needed
export { AppContext };