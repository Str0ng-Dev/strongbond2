import React, { useState, useEffect } from 'react';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import { initializeRevenueCat } from './lib/revenuecat';

function App() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize RevenueCat and check onboarding status
    const initializeApp = async () => {
      try {
        // Initialize RevenueCat
        await initializeRevenueCat();
        
        // Check if onboarding is complete
        const savedData = localStorage.getItem('onboarding_data');
        setIsOnboardingComplete(!!savedData);
      } catch (error) {
        console.error('Error initializing app:', error);
        // Continue with app initialization even if RevenueCat fails
        const savedData = localStorage.getItem('onboarding_data');
        setIsOnboardingComplete(!!savedData);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleOnboardingComplete = () => {
    setIsOnboardingComplete(true);
  };

  const handleLogout = () => {
    // Reset to onboarding flow
    setIsOnboardingComplete(false);
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

  return isOnboardingComplete ? (
    <Dashboard onLogout={handleLogout} />
  ) : (
    <OnboardingFlow onComplete={handleOnboardingComplete} />
  );
}

export default App;