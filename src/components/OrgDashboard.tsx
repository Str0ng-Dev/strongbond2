import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Settings, 
  Plus, 
  Mail, 
  Globe, 
  BarChart3, 
  BookOpen, 
  Crown, 
  LogOut,
  ArrowRight,
  CheckCircle,
  Clock,
  UserPlus,
  MessageSquare,
  Zap,
  Shield,
  ExternalLink
} from 'lucide-react';
import { OrganizationResult } from '../utils/orgOnboarding';

interface OrgDashboardProps {
  onLogout: () => void;
}

const OrgDashboard: React.FC<OrgDashboardProps> = ({ onLogout }) => {
  const [organizationData, setOrganizationData] = useState<OrganizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'members' | 'groups' | 'settings'>('overview');

  useEffect(() => {
    // Load organization data from localStorage
    const loadOrgData = () => {
      try {
        const orgData = localStorage.getItem('org_onboarding_result');
        if (orgData) {
          const parsedData = JSON.parse(orgData);
          setOrganizationData(parsedData);
        }
      } catch (error) {
        console.error('Error loading organization data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrgData();
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (confirmLogout) {
      localStorage.removeItem('org_onboarding_result');
      onLogout();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  if (!organizationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Organization Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to load organization data.</p>
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

  const quickActions = [
    {
      title: 'Invite Members',
      description: 'Add team members to your organization',
      icon: UserPlus,
      color: 'bg-blue-500',
      action: () => setActiveSection('members')
    },
    {
      title: 'Create Groups',
      description: 'Set up devotional groups for your community',
      icon: Users,
      color: 'bg-green-500',
      action: () => setActiveSection('groups')
    },
    {
      title: 'Manage Content',
      description: 'Create and organize devotional content',
      icon: BookOpen,
      color: 'bg-purple-500',
      action: () => console.log('Navigate to content management')
    },
    {
      title: 'View Analytics',
      description: 'Track engagement and growth metrics',
      icon: BarChart3,
      color: 'bg-orange-500',
      action: () => console.log('Navigate to analytics')
    }
  ];

  const nextSteps = [
    {
      title: 'Invite your first members',
      description: 'Start building your community by inviting team members',
      completed: false,
      action: () => setActiveSection('members')
    },
    {
      title: 'Create your first group',
      description: 'Set up a devotional group for your community',
      completed: false,
      action: () => setActiveSection('groups')
    },
    {
      title: 'Customize your branding',
      description: 'Upload your logo and customize your organization\'s appearance',
      completed: false,
      action: () => setActiveSection('settings')
    },
    {
      title: 'Set up your custom domain',
      description: organization.custom_domain ? 'Configure DNS for your custom domain' : 'Add a custom domain to your organization',
      completed: false,
      action: () => setActiveSection('settings')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Org Name */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{organization.name}</h1>
                <p className="text-sm text-gray-500">{organization.subdomain}.yourapp.com</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-6">
              <nav className="flex space-x-6">
                <button
                  onClick={() => setActiveSection('overview')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === 'overview'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveSection('members')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === 'members'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Members
                </button>
                <button
                  onClick={() => setActiveSection('groups')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === 'groups'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Groups
                </button>
                <button
                  onClick={() => setActiveSection('settings')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === 'settings'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Settings
                </button>
              </nav>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{adminUser.email}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'overview' && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Welcome to {organization.name}!</h2>
                  <p className="text-blue-100 text-lg mb-4">
                    Your organization is ready to go. Let's get started building your community.
                  </p>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center">
                      <Crown className="w-4 h-4 mr-2" />
                      <span>{organization.plan_tier.charAt(0).toUpperCase() + organization.plan_tier.slice(1)} Plan</span>
                    </div>
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      <span>{organization.custom_domain || `${organization.subdomain}.yourapp.com`}</span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={action.action}
                      className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200 text-left group"
                    >
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{action.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                      <div className="flex items-center text-blue-600 text-sm font-medium">
                        Get started
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Steps */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Next Steps</h3>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="space-y-4">
                  {nextSteps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        step.completed ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{step.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                        <button
                          onClick={step.action}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {step.completed ? 'View' : 'Start now'} →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Organization Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Members</p>
                      <p className="text-3xl font-bold text-gray-900">1</p>
                      <p className="text-sm text-green-600">+1 this month</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Active Groups</p>
                      <p className="text-3xl font-bold text-gray-900">0</p>
                      <p className="text-sm text-gray-500">Ready to create</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Plan Status</p>
                      <p className="text-3xl font-bold text-gray-900 capitalize">{organization.plan_tier}</p>
                      <p className="text-sm text-purple-600">Active</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Crown className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'members' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Members</h2>
                <p className="text-gray-600">Manage your organization's members and their roles</p>
              </div>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Invite Members
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No members yet</h3>
                <p className="text-gray-600 mb-6">Start building your community by inviting your first members.</p>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Send First Invitation
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'groups' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Groups</h2>
                <p className="text-gray-600">Create and manage devotional groups for your community</p>
              </div>
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups created</h3>
                <p className="text-gray-600 mb-6">Groups help organize your community around specific devotional topics or demographics.</p>
                <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Create Your First Group
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
              <p className="text-gray-600">Configure your organization preferences and settings</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Organization Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Organization Details</h3>
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
                    <div className="flex">
                      <input
                        type="text"
                        value={organization.subdomain}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        readOnly
                      />
                      <div className="px-3 py-2 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
                        .yourapp.com
                      </div>
                    </div>
                  </div>
                  {organization.custom_domain && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custom Domain</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={organization.custom_domain}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          readOnly
                        />
                        <button className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-800 text-sm">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Configure DNS
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Plan & Billing */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Plan & Billing</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{organization.plan_tier} Plan</p>
                      <p className="text-sm text-gray-600">
                        {organization.plan_tier === 'free' ? 'No billing required' : 'Active subscription'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Crown className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-600">Active</span>
                    </div>
                  </div>
                  
                  {organization.plan_tier === 'free' && (
                    <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      Upgrade Plan
                    </button>
                  )}
                </div>
              </div>

              {/* Security */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Security</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-600">Add an extra layer of security</p>
                    </div>
                    <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      Enable
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Session Management</p>
                      <p className="text-sm text-gray-600">Manage active sessions</p>
                    </div>
                    <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      View
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                <h3 className="text-xl font-semibold text-red-900 mb-4">Danger Zone</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-medium text-red-900 mb-2">Delete Organization</p>
                    <p className="text-sm text-red-700 mb-3">
                      This action cannot be undone. All data will be permanently deleted.
                    </p>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                      Delete Organization
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgDashboard;