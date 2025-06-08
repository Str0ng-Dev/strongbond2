import React, { useState, useEffect } from 'react';
import OrgOnboardingFlow from './components/OrgOnboardingFlow';
import OrgDashboard from './components/OrgDashboard';
import { OrganizationResult } from './utils/orgOnboarding';

type Route = 'home' | 'org-onboarding' | 'org-dashboard';

function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('home');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const orgData = localStorage.getItem('org_onboarding_result');
        if (orgData) {
          setCurrentRoute('org-dashboard');
        } else {
          setCurrentRoute('home');
        }
      } catch (error) {
        setCurrentRoute('home');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleOrgOnboardingComplete = (result: OrganizationResult) => {
    localStorage.setItem('org_onboarding_result', JSON.stringify(result));
    setCurrentRoute('org-dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('org_onboarding_result');
    setCurrentRoute('home');
  };

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

  switch (currentRoute) {
    case 'org-onboarding':
      return (
        <OrgOnboardingFlow
          onComplete={handleOrgOnboardingComplete}
          onBack={() => setCurrentRoute('home')}
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
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to StrongBond</h1>
              <p className="text-xl text-gray-600 mb-8">
                Build stronger spiritual communities through devotionals, fitness, and connection
              </p>
            </div>

            <div className="max-w-md mx-auto">
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
          </div>
        </div>
      );
  }
}

export default App;