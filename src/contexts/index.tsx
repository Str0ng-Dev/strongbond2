// Export all contexts and hooks from a single file for easy importing
export { AppProvider, useAppContext, AppContext } from './AppContext';
export { AuthProvider, useAuth } from './AuthContext';
export { UserProvider, useUser } from './UserContext';
export { OrganizationProvider, useOrganization } from './OrganizationContext';

// Combined provider component that wraps all contexts in the correct order
import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { UserProvider } from './UserContext';
import { OrganizationProvider } from './OrganizationContext';
import { AppProvider } from './AppContext';

interface AllProvidersProps {
  children: ReactNode;
}

export const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <UserProvider>
        <OrganizationProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </OrganizationProvider>
      </UserProvider>
    </AuthProvider>
  );
};