import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, ArrowRight, Play, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SwitchPlanModal from './SwitchPlanModal';

interface UserDevotionalPlan {
  id: string;
  user_id: string;
  devotional_id: string;
  start_date: string;
  current_day: number;
  is_active: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DevotionalPlan {
  id: string;
  title: string;
  duration_days: number;
  author: string;
  description: string;
}

interface CurrentPlanProps {
  onPlanChange?: () => void;
}

const CurrentPlan: React.FC<CurrentPlanProps> = ({ onPlanChange }) => {
  const [currentPlan, setCurrentPlan] = useState<UserDevotionalPlan | null>(null);
  const [devotionalPlan, setDevotionalPlan] = useState<DevotionalPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadCurrentPlan();
  }, []);

  const loadCurrentPlan = async () => {
    const userData = localStorage.getItem('onboarding_data');
    if (!userData) {
      setIsLoading(false);
      return;
    }

    const { user_id } = JSON.parse(userData);
    if (!user_id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // First, ensure only one plan is active by fixing any data inconsistencies
      await ensureSingleActivePlan(user_id);

      // Get the user's active devotional plan
      const { data: planData, error: planError } = await supabase
        .from('user_devotional_plan')
        .select(`
          *,
          fk_user_devotional_plan_devotional:devotional_marketplace!fk_user_devotional_plan_devotional (
            id,
            title,
            duration_days,
            author,
            description
          )
        `)
        .eq('user_id', user_id)
        .eq('is_active', true)
        .maybeSingle();

      if (planError) {
        console.error('Error loading current plan:', planError);
        setError('Failed to load current plan');
        return;
      }

      if (planData) {
        setCurrentPlan(planData);
        setDevotionalPlan(planData.fk_user_devotional_plan_devotional);
      } else {
        setCurrentPlan(null);
        setDevotionalPlan(null);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to ensure only one plan is active
  const ensureSingleActivePlan = async (userId: string) => {
    try {
      // Get all active plans for this user
      const { data: activePlans, error: activeError } = await supabase
        .from('user_devotional_plan')
        .select('id, updated_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (activeError) {
        console.error('Error checking active plans:', activeError);
        return;
      }

      // If there are multiple active plans, keep only the most recently updated one
      if (activePlans && activePlans.length > 1) {
        console.log(`Found ${activePlans.length} active plans, fixing...`);
        
        const mostRecentPlan = activePlans[0];
        const plansToDeactivate = activePlans.slice(1).map(plan => plan.id);

        // Deactivate all but the most recent plan
        const { error: deactivateError } = await supabase
          .from('user_devotional_plan')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .in('id', plansToDeactivate);

        if (deactivateError) {
          console.error('Error deactivating duplicate plans:', deactivateError);
        } else {
          console.log(`Deactivated ${plansToDeactivate.length} duplicate active plans`);
        }
      }
    } catch (err) {
      console.error('Error ensuring single active plan:', err);
    }
  };

  // Refresh when plan changes
  useEffect(() => {
    if (onPlanChange) {
      loadCurrentPlan();
    }
  }, [onPlanChange]);

  const handlePlanSwitched = () => {
    // Reload current plan data
    loadCurrentPlan();
    
    // Trigger callback to refresh other components
    if (onPlanChange) {
      onPlanChange();
    }
  };

  const getCurrentUserId = () => {
    const userData = localStorage.getItem('onboarding_data');
    if (userData) {
      const { user_id } = JSON.parse(userData);
      return user_id;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6" style={{ width: '300px' }}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!currentPlan || !devotionalPlan) {
    return (
      <>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ width: '300px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">My Current Plan</h2>
                  <p className="text-xs text-gray-600">No active plan</p>
                </div>
              </div>
              <button
                onClick={() => setShowSwitchModal(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Switch Plan"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 mb-2">No Active Plan</h3>
            <p className="text-xs text-gray-600 mb-4">
              Start a devotional plan to begin your spiritual journey.
            </p>
            
            <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <Play className="w-4 h-4 mr-2" />
              Browse Plans
            </button>
          </div>
        </div>

        {/* Switch Plan Modal */}
        <SwitchPlanModal
          isOpen={showSwitchModal}
          onClose={() => setShowSwitchModal(false)}
          onPlanSwitched={handlePlanSwitched}
          currentUserId={getCurrentUserId() || ''}
        />
      </>
    );
  }

  const progressPercentage = (currentPlan.current_day / devotionalPlan.duration_days) * 100;
  const daysRemaining = devotionalPlan.duration_days - currentPlan.current_day;
  const isCompleted = !currentPlan.is_active && currentPlan.completed_at;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ width: '300px' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">My Current Plan</h2>
                <p className="text-xs text-gray-600">
                  {isCompleted ? 'Completed!' : `Day ${currentPlan.current_day} of ${devotionalPlan.duration_days}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSwitchModal(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Switch Plan"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-xs">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="p-4">
          {/* Plan Title */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{devotionalPlan.title}</h3>
            
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">Progress</span>
                <span className="text-xs font-medium text-blue-600">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="mb-4">
            {currentPlan.is_active ? (
              <button className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105">
                <Play className="w-4 h-4 mr-2" />
                Continue Plan
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <div className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold rounded-lg">
                <span>🎉 Plan Completed!</span>
              </div>
            )}
          </div>

          {/* Show Details Accordion */}
          <div className="border-t border-gray-200 pt-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium">
                {showDetails ? 'Hide Details' : 'Show Details'}
              </span>
              {showDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* Collapsible Details */}
            {showDetails && (
              <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
                {/* Author */}
                <div>
                  <p className="text-xs text-gray-600 mb-1">Author</p>
                  <p className="text-sm font-medium text-gray-900">{devotionalPlan.author}</p>
                </div>

                {/* Timeline Info */}
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>Started {new Date(currentPlan.start_date).toLocaleDateString()}</span>
                  </div>
                  {!isCompleted && (
                    <span>{daysRemaining} days left</span>
                  )}
                  {isCompleted && (
                    <span>Completed {new Date(currentPlan.completed_at!).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Switch Plan Modal */}
      <SwitchPlanModal
        isOpen={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
        onPlanSwitched={handlePlanSwitched}
        currentUserId={getCurrentUserId() || ''}
      />
    </>
  );
};

export default CurrentPlan;