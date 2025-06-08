// Re-export the useAppContext hook for convenience
export { useAppContext } from '../contexts/AppContext';

// Additional custom hooks that use the app context
import { useAppContext } from '../contexts/AppContext';

// Hook to check if user has specific permissions
export const usePermissions = () => {
  const { user, organization, isOrgUser } = useAppContext();

  const isOrgAdmin = isOrgUser && organization && user?.id === organization.admin_user_id;
  const canManageOrg = isOrgAdmin;
  const canInviteUsers = isOrgAdmin;
  const canManageGroups = isOrgUser || user !== null; // Org users or individual users can manage groups
  const canAccessDevotionals = user !== null; // Any authenticated user

  return {
    isOrgAdmin,
    canManageOrg,
    canInviteUsers,
    canManageGroups,
    canAccessDevotionals,
  };
};

// Hook to get user display information
export const useUserDisplay = () => {
  const { user, organization, isOrgUser, isIndividualUser } = useAppContext();

  const displayName = user?.first_name || 'User';
  const displayRole = user?.user_role || 'Member';
  const displayContext = isOrgUser 
    ? `${organization?.name} - ${displayRole}`
    : isIndividualUser 
    ? `Individual - ${displayRole}`
    : 'Guest';

  const avatarInitials = displayName.charAt(0).toUpperCase();

  return {
    displayName,
    displayRole,
    displayContext,
    avatarInitials,
  };
};

// Hook to get navigation context
export const useNavigation = () => {
  const { isOrgUser, isIndividualUser, isAuthenticated } = useAppContext();

  const getDefaultRoute = () => {
    if (!isAuthenticated) return 'home';
    if (isOrgUser) return 'org-dashboard';
    if (isIndividualUser) return 'individual-dashboard';
    return 'home';
  };

  const getAvailableRoutes = () => {
    const routes = ['home'];
    
    if (isAuthenticated) {
      if (isOrgUser) {
        routes.push('org-dashboard');
      }
      if (isIndividualUser) {
        routes.push('individual-dashboard');
      }
    } else {
      routes.push('individual-onboarding', 'org-onboarding');
    }

    return routes;
  };

  return {
    getDefaultRoute,
    getAvailableRoutes,
  };
};