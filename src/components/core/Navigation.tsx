import React from 'react';
import { useAppContext } from '../../contexts';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Settings, 
  User,
  Heart,
  UserPlus
} from 'lucide-react';

interface NavigationProps {
  isMobile?: boolean;
  onItemClick?: () => void;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  isMobile = false, 
  onItemClick,
  activeSection = 'dashboard',
  onSectionChange
}) => {
  const { isOrgUser, isIndividualUser } = useAppContext();

  // Define navigation items based on context
  const getNavigationItems = () => {
    if (isOrgUser) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'members', label: 'Members', icon: Users },
        { id: 'groups', label: 'Groups', icon: Users },
        { id: 'devotionals', label: 'Devotionals', icon: BookOpen },
        { id: 'settings', label: 'Settings', icon: Settings },
      ];
    } else if (isIndividualUser) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'my-groups', label: 'My Groups', icon: Users },
        { id: 'devotionals', label: 'Devotionals', icon: BookOpen },
        { id: 'connections', label: 'Connections', icon: UserPlus },
        { id: 'profile', label: 'Profile', icon: User },
      ];
    }
    
    return [];
  };

  const navigationItems = getNavigationItems();

  const handleItemClick = (itemId: string) => {
    if (onSectionChange) {
      onSectionChange(itemId);
    }
    if (onItemClick) {
      onItemClick();
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4 mr-3" />
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === item.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default Navigation;