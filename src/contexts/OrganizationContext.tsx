import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  custom_domain?: string | null;
  logo_url?: string | null;
  admin_user_id: string;
  plan_tier: string;
  created_at: string;
  updated_at: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  error: string | null;
  refreshOrganization: () => Promise<void>;
  updateOrganization: (updates: Partial<Organization>) => Promise<void>;
  clearError: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { user } = useUser();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.org_id) {
      loadOrganization(user.org_id);
    } else {
      setOrganization(null);
      setError(null);
    }
  }, [user?.org_id]);

  const loadOrganization = async (orgId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to load organization: ${fetchError.message}`);
      }

      setOrganization(data);
    } catch (err) {
      console.error('Error loading organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to load organization');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOrganization = async () => {
    if (user?.org_id) {
      await loadOrganization(user.org_id);
    }
  };

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!organization) {
      throw new Error('No organization loaded');
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('organizations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', organization.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update organization: ${updateError.message}`);
      }

      setOrganization(data);
    } catch (err) {
      console.error('Error updating organization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update organization';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue: OrganizationContextType = {
    organization,
    isLoading,
    error,
    refreshOrganization,
    updateOrganization,
    clearError,
  };

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
};