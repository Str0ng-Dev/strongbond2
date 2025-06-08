import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Settings, 
  BookOpen,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronDown,
  User,
  Bell,
  Search,
  Plus
} from 'lucide-react';
import { OrganizationResult } from '../utils/orgOnboarding';
import { supabase } from '../lib/supabase';

interface OrgDashboardProps {
  onLogout: () => void;
}

const OrgDashboard: React.FC<OrgDashboardProps> = ({ onLogout }) => {
  const [organizationData, setOrganizationData] = useState<OrganizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'members' | 'groups' | 'devotionals' | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      // Check authentication status
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        console.error('Authentication error:', authError);
        onLogout();
        return;
      }

      setIsAuthenticated(true);

      // Load organization data from localStorage
      const orgData = localStorage.getItem('org_onboarding_result');
      if (orgData) {
        const parsedData = JSON.parse(orgData);
        
        // Verify the authenticated user matches the org admin
        if (session.user.id !== parsedData.adminUser.id) {
          console.error('User mismatch - not authorized for this organization');
          onLogout();
          return;
        }

        setOrganizationData(parsedData);
      } else {
        console.error('No organization data found');
        onLogout();
        return;
      }
    } catch (error) {
      console.error('Error loading organization data:', error);
      onLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (confirmLogout) {
      try {
        await supabase.auth.signOut();
        localStorage.removeItem('org_onboarding_result');
        onLogout();
      } catch (error) {
        console.error('Error during logout:', error);
        // Force logout even if there's an error
        localStorage.removeItem('org_onboarding_result');
        onLogout();
      }
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'devotionals', label: 'Devotionals', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !organizationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access this organization.</p>
          <button
            onClick={onLogout}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const { organization, adminUser } = organizationData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and org name */}
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Logo and org name */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-gray-900">{organization.name}</h1>
                  <p className="text-xs text-gray-500">{organization.subdomain}.yourapp.com</p>
                </div>
              </div>
            </div>

            {/* Center - Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as any)}
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

            {/* Right side - Search, notifications, user menu */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="hidden sm:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{adminUser.email}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{adminUser.email}</p>
                      <p className="text-xs text-gray-500">Organization Admin</p>
                    </div>
                    <button
                      onClick={() => setActiveSection('settings')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Settings className="w-4 h-4 inline mr-2" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id as any);
                      setIsMobileMenuOpen(false);
                    }}
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
          </div>
        )}
      </nav>

      {/* Sidebar for larger screens */}
      <div className="hidden lg:flex">
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as any)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Member
                </button>
                <button className="w-full flex items-center px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </button>
              </div>
            </div>

            {/* Organization Info */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{organization.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{organization.plan_tier} Plan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:ml-64">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeSection === 'dashboard' && (
            <DashboardContent organization={organization} />
          )}
          {activeSection === 'members' && (
            <MembersContent organization={organization} />
          )}
          {activeSection === 'groups' && (
            <GroupsContent organization={organization} />
          )}
          {activeSection === 'devotionals' && (
            <DevotionalsContent organization={organization} />
          )}
          {activeSection === 'settings' && (
            <SettingsContent organization={organization} />
          )}
        </main>
      </div>

      {/* Click outside to close dropdowns */}
      {(isUserMenuOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </div>
  );
};

// Dashboard Content Component
const DashboardContent: React.FC<{ organization: any }> = ({ organization }) => (
  <div className="space-y-8">
    {/* Welcome Header */}
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
      <h1 className="text-3xl font-bold mb-2">Welcome to {organization.name}!</h1>
      <p className="text-blue-100 text-lg">
        Your organization dashboard is ready. Start building your community today.
      </p>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Members</p>
            <p className="text-3xl font-bold text-gray-900">1</p>
          </div>
          <Users className="w-8 h-8 text-blue-600" />
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Active Groups</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <Users className="w-8 h-8 text-green-600" />
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Devotionals</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <BookOpen className="w-8 h-8 text-purple-600" />
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Engagement</p>
            <p className="text-3xl font-bold text-gray-900">0%</p>
          </div>
          <BarChart3 className="w-8 h-8 text-orange-600" />
        </div>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
          <Users className="w-6 h-6 text-blue-600 mb-2" />
          <h3 className="font-medium text-gray-900">Invite Members</h3>
          <p className="text-sm text-gray-600">Add team members to your organization</p>
        </button>
        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
          <Users className="w-6 h-6 text-green-600 mb-2" />
          <h3 className="font-medium text-gray-900">Create Group</h3>
          <p className="text-sm text-gray-600">Set up devotional groups</p>
        </button>
        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
          <BookOpen className="w-6 h-6 text-purple-600 mb-2" />
          <h3 className="font-medium text-gray-900">Add Content</h3>
          <p className="text-sm text-gray-600">Create devotional content</p>
        </button>
      </div>
    </div>
  </div>
);

// Members Content Component
const MembersContent: React.FC<{ organization: any }> = ({ organization }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-gray-900">Members</h1>
      <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        <Plus className="w-4 h-4 mr-2" />
        Invite Members
      </button>
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No members yet</h3>
        <p className="text-gray-600">Start building your community by inviting members.</p>
      </div>
    </div>
  </div>
);

// Groups Content Component
const GroupsContent: React.FC<{ organization: any }> = ({ organization }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
      <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
        <Plus className="w-4 h-4 mr-2" />
        Create Group
      </button>
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups created</h3>
        <p className="text-gray-600">Create groups to organize your community.</p>
      </div>
    </div>
  </div>
);

// Devotionals Content Component
const DevotionalsContent: React.FC<{ organization: any }> = ({ organization }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-gray-900">Devotionals</h1>
      <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
        <Plus className="w-4 h-4 mr-2" />
        Add Content
      </button>
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No devotional content</h3>
        <p className="text-gray-600">Start creating devotional content for your community.</p>
      </div>
    </div>
  </div>
);

// Settings Content Component
const SettingsContent: React.FC<{ organization: any }> = ({ organization }) => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Organization Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
            <input
              type="text"
              value={organization.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subdomain</label>
            <input
              type="text"
              value={`${organization.subdomain}.yourapp.com`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              readOnly
            />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Plan & Billing</h2>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900 capitalize">{organization.plan_tier} Plan</p>
            <p className="text-sm text-gray-600">Active subscription</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default OrgDashboard;