import React, { useState, useEffect } from 'react';
import { LogOut, BookOpen, Users as UsersIcon, Heart, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { OnboardingData, User } from '../types';
import CurrentPlan from './dashboard/CurrentPlan';
import TodaysExperience from './dashboard/TodaysExperience';
import Connections from './dashboard/Connections';
import DevotionalsPage from './DevotionalsPage';
import UserLinking from './UserLinking';
import FeaturedCarousel from './FeaturedCarousel';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  onLogout?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [userData, setUserData] = useState<OnboardingData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentView, setCurrentView] = useState<'dashboard' | 'devotionals' | 'user-connections'>('dashboard');
  const [isFeaturedCollapsed, setIsFeaturedCollapsed] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Load user data from localStorage
      const savedData = localStorage.getItem('onboarding_data');
      if (savedData) {
        const onboardingData = JSON.parse(savedData);
        setUserData(onboardingData);

        // If we have a user_id, fetch the current user data from Supabase
        if (onboardingData.user_id) {
          const { data: user, error } = await supabase
            .from('users')
            .select('id, first_name, user_role, fitness_enabled, created_at, updated_at, linked_to_user_id')
            .eq('id', onboardingData.user_id)
            .single();

          if (error) {
            console.error('Error fetching user data:', error);
          } else {
            setCurrentUser(user);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupUpdate = () => {
    // Refresh user data when group status changes
    loadUserData();
  };

  const handlePlanUpdate = () => {
    // Trigger refresh of plan-related components
    setRefreshKey(prev => prev + 1);
  };

  const handleUserLinked = () => {
    // Refresh user data when user linking changes
    loadUserData();
  };

  const handleNavigateToDevotionals = () => {
    setCurrentView('devotionals');
  };

  const handleNavigateToUserConnections = () => {
    setCurrentView('user-connections');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    // Refresh dashboard data when returning
    handlePlanUpdate();
  };

  const handleFeaturedPlanStarted = () => {
    // Refresh dashboard when a plan is started from featured carousel
    handlePlanUpdate();
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (!confirmLogout) return;

    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear localStorage
      localStorage.removeItem('onboarding_data');
      
      // Call the onLogout callback if provided
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, clear local data and redirect
      localStorage.removeItem('onboarding_data');
      if (onLogout) {
        onLogout();
      }
    }
  };

  const getEncouragementMessage = (userRole: string, fitnessEnabled: boolean) => {
    const messages = {
      'Dad': [
        "Leading your family with strength and wisdom! 💪",
        "You're doing something powerful here, Dad! 🙌",
        "Your leadership is making a difference! ✨"
      ],
      'Mom': [
        "Nurturing hearts and souls beautifully! 💝",
        "Your love is transforming lives! 🌸",
        "Keep shining your light, Mom! ✨"
      ],
      'Son': [
        "Growing stronger in faith every day! 🌱",
        "You're becoming the man God designed you to be! 💪",
        "Your journey is inspiring! 🚀"
      ],
      'Daughter': [
        "Blossoming into who God created you to be! 🌺",
        "Your heart for God is beautiful! 💖",
        "Keep growing in grace and strength! ✨"
      ],
      'Single Man': [
        "Using this season for incredible growth! 🌟",
        "Your dedication to God is inspiring! 💪",
        "Making the most of every opportunity! 🚀"
      ],
      'Single Woman': [
        "Embracing God's perfect timing! 🌸",
        "Your faith journey is beautiful! 💖",
        "Living with purpose and passion! ✨"
      ],
      'Church Leader': [
        "Shepherding hearts with love and wisdom! ⛪",
        "Your ministry is touching lives! 🙌",
        "Leading others closer to God! ✨"
      ],
      'Coach': [
        "Building champions in life and faith! 🏆",
        "Your influence goes beyond the game! 💪",
        "Shaping character and building dreams! 🌟"
      ]
    };

    const roleMessages = messages[userRole as keyof typeof messages] || [
      "You're doing something powerful here! 💪",
      "Keep growing stronger today! 🌟",
      "Your journey matters! ✨"
    ];

    if (fitnessEnabled) {
      const fitnessMessages = [
        "Strengthening body, mind, and spirit! 💪✨",
        "Honoring God with your whole being! 🙌",
        "Building strength inside and out! 💪❤️"
      ];
      return [...roleMessages, ...fitnessMessages];
    }

    return roleMessages;
  };

  const getRandomMessage = (messages: string[]) => {
    return messages[Math.floor(Math.random() * messages.length)];
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

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Dashboard...</h2>
          <p className="text-gray-600">Please complete onboarding first.</p>
        </div>
      </div>
    );
  }

  // Show Devotionals page
  if (currentView === 'devotionals') {
    return (
      <DevotionalsPage
        onBack={handleBackToDashboard}
        onPlanStarted={handlePlanUpdate}
      />
    );
  }

  // Show User Connections page
  if (currentView === 'user-connections' && currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Connections</h1>
                <p className="text-gray-600">Manage your spiritual connections</p>
              </div>
              <button
                onClick={handleBackToDashboard}
                className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <UserLinking 
            currentUser={currentUser}
            onUserLinked={handleUserLinked}
          />
        </div>
      </div>
    );
  }

  // Show main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Friendly Greeting Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {/* Main Greeting */}
              <div className="mb-4">
                <h1 className="text-4xl font-bold mb-2">
                  Hey {userData.first_name}! 👋
                </h1>
                <div className="flex items-center space-x-4 mb-3">
                  <span className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white font-medium">
                    <Heart className="w-4 h-4 mr-2" />
                    {userData.user_role}
                  </span>
                  {userData.fitness_enabled && (
                    <span className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white font-medium">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Fitness Enabled
                    </span>
                  )}
                </div>
                
                {/* Encouraging Message */}
                <p className="text-xl text-white text-opacity-90 font-medium">
                  {getRandomMessage(getEncouragementMessage(userData.user_role, userData.fitness_enabled))}
                </p>
              </div>
            </div>

            {/* Navigation & Logout */}
            <div className="flex items-center space-x-3">
              {/* Devotionals Button */}
              <button
                onClick={handleNavigateToDevotionals}
                className="flex items-center px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white hover:bg-opacity-30 rounded-lg transition-all duration-200 group"
                title="Devotionals"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                <span className="font-medium">Devotionals</span>
              </button>

              {/* User Connections Button */}
              <button
                onClick={handleNavigateToUserConnections}
                className="flex items-center px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white hover:bg-opacity-30 rounded-lg transition-all duration-200 group"
                title="User Connections"
              >
                <UsersIcon className="w-4 h-4 mr-2" />
                <span className="font-medium">Connections</span>
              </button>
              
              {/* Log Out Button */}
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white hover:bg-red-500 hover:bg-opacity-90 rounded-lg transition-all duration-200 group"
                title="Log Out"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="font-medium">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Devotionals Section - Collapsible Card */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
              <div className="px-6 py-4">
                <button
                  onClick={() => setIsFeaturedCollapsed(!isFeaturedCollapsed)}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xl">🔥</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                        Featured Devotionals
                      </h2>
                      <p className="text-gray-600 text-sm">
                        Explore new devotional journeys selected to inspire and challenge you
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 hidden sm:block">
                      {isFeaturedCollapsed ? 'Show' : 'Hide'}
                    </span>
                    <div className="p-2 rounded-lg bg-white bg-opacity-50 group-hover:bg-opacity-80 transition-all duration-200">
                      {isFeaturedCollapsed ? (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Collapsible Content */}
            <div className={`transition-all duration-300 ease-in-out ${
              isFeaturedCollapsed 
                ? 'max-h-0 opacity-0 overflow-hidden' 
                : 'max-h-[1000px] opacity-100'
            }`}>
              <div className="p-6">
                <FeaturedCarousel 
                  onPlanStarted={handleFeaturedPlanStarted}
                  onExploreMore={handleNavigateToDevotionals}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid: Current Plan, Connections, and Today's Devotional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Current Plan & Connections */}
          <div className="space-y-8">
            <CurrentPlan key={refreshKey} onPlanChange={handlePlanUpdate} />
            <Connections 
              currentUser={currentUser} 
              onUpdate={handleGroupUpdate}
            />
          </div>

          {/* Right Column: Today's Devotional – spans full width on mobile */}
          <div className="col-span-1 lg:col-span-2 w-full space-y-8">
            <TodaysExperience key={refreshKey} userData={userData} />
          </div>
        </div>
    
  );
};

export default Dashboard;