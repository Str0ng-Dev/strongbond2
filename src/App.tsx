import React, { useState, useEffect } from 'react';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';

// Simple routing state management for individual app
type Route = 'home' | 'individual-onboarding' | 'individual-dashboard';

function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('home');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize app and determine initial route
    const initializeApp = async () => {
      try {
        // Check if individual onboarding is complete
        const savedData = localStorage.getItem('onboarding_data');
        const isIndividualComplete = !!savedData;

        // Determine initial route based on completion status
        if (isIndividualComplete) {
          setCurrentRoute('individual-dashboard');
        } else {
          setCurrentRoute('home');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        // Continue with app initialization even if there's an error
        const savedData = localStorage.getItem('onboarding_data');

        if (savedData) {
          setCurrentRoute('individual-dashboard');
        } else {
          setCurrentRoute('home');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleIndividualOnboardingComplete = () => {
    setCurrentRoute('individual-dashboard');
  };

  const handleLogout = () => {
    // Clear all stored data and return to home
    localStorage.removeItem('onboarding_data');
    setCurrentRoute('home');
  };

  // Show loading state briefly while checking localStorage
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

  // Route rendering
  switch (currentRoute) {
    case 'individual-onboarding':
      return (
        <OnboardingFlow
          onComplete={handleIndividualOnboardingComplete}
        />
      );

    case 'individual-dashboard':
      return (
        <Dashboard
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
                Start your personal spiritual journey with devotionals, fitness, and community connection
              </p>
            </div>

            {/* Individual User Option */}
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Personal Journey</h3>
                <p className="text-gray-600 mb-6">
                  Start your spiritual growth with devotionals, fitness challenges, and community connection.
                </p>
                <button
                  onClick={() => setCurrentRoute('individual-onboarding')}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Get Started
                </button>
              </div>
            </div>

            {/* Features Preview */}
            <div className="mt-16 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Your Spiritual Growth Journey</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Devotionals</h3>
                  <p className="text-gray-600">Personalized Bible study plans for your spiritual journey</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Fitness Challenges</h3>
                  <p className="text-gray-600">Honor God with your body through faith-based fitness</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Community</h3>
                  <p className="text-gray-600">Connect with like-minded believers in your journey</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-16 text-center text-gray-500">
              <p>&copy; 2024 StrongBond. Strengthening faith and community.</p>
            </div>
          </div>
        </div>
      );
  }
}

export default App;
