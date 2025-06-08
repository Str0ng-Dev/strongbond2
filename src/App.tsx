import React, { useState, useEffect } from 'react';
import OnboardingFlow from './components/OnboardingFlow';
import OrgOnboardingFlow from './components/OrgOnboardingFlow';
import OrgDashboard from './components/OrgDashboard';
import Dashboard from './components/Dashboard';
import { initializeRevenueCat } from './lib/revenuecat';
import { OrganizationResult } from './utils/orgOnboarding';
import { AllProviders, useAppContext } from './contexts';

// Simple routing state management
type Route = 'home' | 'individual-onboarding' | 'org-onboarding' | 'individual-dashboard' | 'org-dashboard';

// Main App Component (wrapped with contexts)
function AppContent() {
  const {
    user,
    organization,
    isOrgUser,
    isIndividualUser,
    isAuthenticated,
    isLoading,
    error,
    logout
  } = useAppContext();

  const [currentRoute, setCurrentRoute] = useState<Route>('home');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize RevenueCat and determine initial route
    const initializeApp = async () => {
      try {
        // Initialize RevenueCat
        await initializeRevenueCat();
        
        // Determine route based on context state
        if (isAuthenticated && user) {
          if (isOrgUser) {
            setCurrentRoute('org-dashboard');
          } else if (isIndividualUser) {
            setCurrentRoute('individual-dashboard');
          } else {
            // User exists but context is unclear, go to home
            setCurrentRoute('home');
          }
        } else {
          setCurrentRoute('home');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        // Continue with app initialization even if RevenueCat fails
        if (isAuthenticated && user) {
          if (isOrgUser) {
            setCurrentRoute('org-dashboard');
          } else if (isIndividualUser) {
            setCurrentRoute('individual-dashboard');
          } else {
            setCurrentRoute('home');
          }
        } else {
          setCurrentRoute('home');
        }
      } finally {
        setIsInitializing(false);
      }
    };

    // Only initialize once the context has finished loading
    if (!isLoading) {
      initializeApp();
    }
  }, [isLoading, isAuthenticated, user, isOrgUser, isIndividualUser]);

  const handleIndividualOnboardingComplete = () => {
    setCurrentRoute('individual-dashboard');
  };

  const handleOrgOnboardingComplete = (result: OrganizationResult) => {
    // Store organization data in localStorage for persistence
    localStorage.setItem('org_onboarding_result', JSON.stringify(result));
    
    // Navigate to organization dashboard
    setCurrentRoute('org-dashboard');
    
    console.log('Organization created successfully, navigating to dashboard:', result);
  };

  const handleLogout = async () => {
    await logout();
    setCurrentRoute('home');
  };

  // Show loading state while context is loading or app is initializing
  if (isLoading || isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Route rendering
  switch (currentRoute) {
    case 'individual-onboarding':
      return (
        <OnboardingFlow 
          onComplete={handleIndividualOnboardingComplete} 
        />
      );

    case 'org-onboarding':
      return (
        <OrgOnboardingFlow
          onComplete={handleOrgOnboardingComplete}
          onBack={() => setCurrentRoute('home')}
        />
      );

    case 'individual-dashboard':
      return (
        <Dashboard 
          onLogout={handleLogout} 
        />
      );

    case 'org-dashboard':
      return (
        <OrgDashboard 
          onLogout={handleLogout} 
        />
      );

    case 'home':
    default:
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to StrongBond</h1>
              <p className="text-xl text-gray-600 mb-8">
                Build stronger spiritual communities through devotionals, fitness, and connection
              </p>
              
              {/* Context Debug Info (only in development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left max-w-md mx-auto">
                  <h3 className="font-semibold text-yellow-900 mb-2">Context Debug Info:</h3>
                  <div className="text-xs text-yellow-800 space-y-1">
                    <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
                    <p>User: {user ? `${user.first_name} (${user.user_role})` : 'None'}</p>
                    <p>Organization: {organization ? organization.name : 'None'}</p>
                    <p>Is Org User: {isOrgUser ? 'Yes' : 'No'}</p>
                    <p>Is Individual User: {isIndividualUser ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Show different content based on authentication state */}
            {isAuthenticated && user ? (
              <div className="text-center">
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Welcome back, {user.first_name}!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {isOrgUser 
                      ? `Continue managing ${organization?.name}`
                      : 'Continue your spiritual journey'
                    }
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setCurrentRoute(isOrgUser ? 'org-dashboard' : 'individual-dashboard')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Go to Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Options for non-authenticated users */
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
                    onClick={() => setCurrentRoute('individual-onboarding')}
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
                    onClick={() => setCurrentRoute('org-onboarding')}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Create Organization
                  </button>
                </div>
              </div>
            )}

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
}

// Main App wrapper with context providers
function App() {
  return (
    <AllProviders>
      <AppContent />
    </AllProviders>
  );
}

export default App;