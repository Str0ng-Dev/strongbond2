import React, { useState, useEffect } from 'react';
import OnboardingFlow from './components/OnboardingFlow';
import OrgOnboardingFlow from './components/OrgOnboardingFlow';
import Dashboard from './components/Dashboard';
import { initializeRevenueCat } from './lib/revenuecat';
import { OrganizationResult } from './utils/orgOnboarding';

function App() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOrgOnboarding, setShowOrgOnboarding] = useState(false);
  const [orgOnboardingComplete, setOrgOnboardingComplete] = useState(false);
  const [organizationData, setOrganizationData] = useState<OrganizationResult | null>(null);

  useEffect(() => {
    // Initialize RevenueCat and check onboarding status
    const initializeApp = async () => {
      try {
        // Initialize RevenueCat
        await initializeRevenueCat();
        
        // Check if individual onboarding is complete
        const savedData = localStorage.getItem('onboarding_data');
        setIsOnboardingComplete(!!savedData);
        
        // Check if organization onboarding is complete
        const orgData = localStorage.getItem('org_onboarding_result');
        if (orgData) {
          const parsedOrgData = JSON.parse(orgData);
          setOrganizationData(parsedOrgData);
          setOrgOnboardingComplete(true);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        // Continue with app initialization even if RevenueCat fails
        const savedData = localStorage.getItem('onboarding_data');
        setIsOnboardingComplete(!!savedData);
        
        const orgData = localStorage.getItem('org_onboarding_result');
        if (orgData) {
          const parsedOrgData = JSON.parse(orgData);
          setOrganizationData(parsedOrgData);
          setOrgOnboardingComplete(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleOnboardingComplete = () => {
    setIsOnboardingComplete(true);
  };

  const handleOrgOnboardingComplete = (result: OrganizationResult) => {
    setOrganizationData(result);
    setOrgOnboardingComplete(true);
    setShowOrgOnboarding(false);
    
    // Store organization data in localStorage for persistence
    localStorage.setItem('org_onboarding_result', JSON.stringify(result));
    
    // In a real app with React Router, you would navigate to '/org-dashboard' here
    // For now, we'll show the organization dashboard state
    console.log('Organization created successfully, redirecting to dashboard:', result);
  };

  const handleLogout = () => {
    // Reset to onboarding flow
    setIsOnboardingComplete(false);
    setOrgOnboardingComplete(false);
    setOrganizationData(null);
    localStorage.removeItem('onboarding_data');
    localStorage.removeItem('org_onboarding_result');
  };

  // Show loading state briefly while checking localStorage and initializing RevenueCat
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  // Show Organization Onboarding Flow
  if (showOrgOnboarding) {
    return (
      <OrgOnboardingFlow
        onComplete={handleOrgOnboardingComplete}
        onBack={() => setShowOrgOnboarding(false)}
      />
    );
  }

  // Show Organization Dashboard if organization onboarding is complete
  if (orgOnboardingComplete && organizationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
          {/* Organization Dashboard Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Dashboard</h1>
            <p className="text-gray-600">Welcome to {organizationData.organization.name}</p>
          </div>

          {/* Organization Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {organizationData.organization.name}</p>
                <p><strong>Subdomain:</strong> {organizationData.organization.subdomain}.yourapp.com</p>
                {organizationData.organization.custom_domain && (
                  <p><strong>Custom Domain:</strong> {organizationData.organization.custom_domain}</p>
                )}
                <p><strong>Plan:</strong> {organizationData.organization.plan_tier}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Account</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> {organizationData.adminUser.email}</p>
                <p><strong>Role:</strong> Organization Administrator</p>
                <p><strong>Status:</strong> <span className="text-green-600">Active</span></p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span className="font-medium text-blue-900">Invite Users</span>
              </div>
              <p className="text-sm text-blue-700">Add team members to your organization</p>
            </button>

            <button className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="font-medium text-green-900">Manage Content</span>
              </div>
              <p className="text-sm text-green-700">Create and organize devotional content</p>
            </button>

            <button className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium text-purple-900">Settings</span>
              </div>
              <p className="text-sm text-purple-700">Configure organization preferences</p>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Organization ID: {organizationData.organization.id}
            </div>
            
            <div className="space-x-3">
              <button
                onClick={() => {
                  setOrgOnboardingComplete(false);
                  setShowOrgOnboarding(false);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Home
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show regular user dashboard if individual onboarding is complete
  if (isOnboardingComplete) {
    return <Dashboard onLogout={handleLogout} />;
  }

  // Show main landing/selection screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to StrongBond</h1>
          <p className="text-xl text-gray-600 mb-8">
            Build stronger spiritual communities through devotionals, fitness, and connection
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Individual User */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Join as Individual</h3>
            <p className="text-gray-600 mb-6">
              Start your personal spiritual journey with devotionals, fitness challenges, and community connection.
            </p>
            <button
              onClick={() => setIsOnboardingComplete(false)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started
            </button>
          </div>

          {/* Organization */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Create Organization</h3>
            <p className="text-gray-600 mb-6">
              Set up your church, ministry, or organization with custom branding and advanced features.
            </p>
            <button
              onClick={() => setShowOrgOnboarding(true)}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Create Organization
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Why Choose StrongBond?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Rich Devotional Content</h3>
              <p className="text-gray-600 text-sm">Curated devotionals for every role and season of life</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Fitness Integration</h3>
              <p className="text-gray-600 text-sm">Honor your body as God's temple with guided workouts</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Community Connection</h3>
              <p className="text-gray-600 text-sm">Build accountability and grow together in faith</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;