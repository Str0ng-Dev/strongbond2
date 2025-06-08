import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle,
  ArrowRight,
  Calendar,
  Clock
} from 'lucide-react';
import { OnboardingData } from '../../types';
import { todayContent } from '../../data/mockData';
import { supabase } from '../../lib/supabase';

interface TodaysExperienceProps {
  userData: OnboardingData;
}

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
}

const TodaysExperience: React.FC<TodaysExperienceProps> = ({ userData }) => {
  const [currentPlan, setCurrentPlan] = useState<UserDevotionalPlan | null>(null);
  const [devotionalPlan, setDevotionalPlan] = useState<DevotionalPlan | null>(null);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userData.user_id) {
      loadCurrentPlan();
    }
  }, [userData.user_id]);

  const loadCurrentPlan = async () => {
    if (!userData.user_id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get the user's active devotional plan
      const { data: planData, error: planError } = await supabase
        .from('user_devotional_plan')
        .select(`
          *,
          fk_user_devotional_plan_devotional:devotional_marketplace!fk_user_devotional_plan_devotional (
            id,
            title,
            duration_days
          )
        `)
        .eq('user_id', userData.user_id)
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
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkDayComplete = async () => {
    if (!currentPlan || !devotionalPlan || !userData.user_id) return;

    setIsMarkingComplete(true);
    setError(null);

    try {
      const nextDay = currentPlan.current_day + 1;
      const isLastDay = nextDay > devotionalPlan.duration_days;

      if (isLastDay) {
        // Complete the plan
        const { error: updateError } = await supabase
          .from('user_devotional_plan')
          .update({
            current_day: nextDay,
            is_active: false,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', currentPlan.id);

        if (updateError) {
          throw new Error(`Failed to complete plan: ${updateError.message}`);
        }

        // Show completion message
        alert(`🎉 Congratulations! You've completed "${devotionalPlan.title}"! The plan has been marked as complete.`);
        
        // Reload to reflect changes
        loadCurrentPlan();
      } else {
        // Move to next day
        const { error: updateError } = await supabase
          .from('user_devotional_plan')
          .update({
            current_day: nextDay,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentPlan.id);

        if (updateError) {
          throw new Error(`Failed to update progress: ${updateError.message}`);
        }

        // Show success message
        alert(`✅ Day ${currentPlan.current_day} completed! Moving to day ${nextDay}.`);
        
        // Reload to reflect changes
        loadCurrentPlan();
      }
    } catch (err) {
      console.error('Error marking day complete:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark day complete');
    } finally {
      setIsMarkingComplete(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!currentPlan || !devotionalPlan) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-8">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Devotional Plan</h3>
          <p className="text-gray-600 mb-4">
            You don't have an active devotional plan. Start one from the marketplace to begin your journey.
          </p>
        </div>
      </div>
    );
  }

  const progressPercentage = (currentPlan.current_day / devotionalPlan.duration_days) * 100;
  const isCompleted = !currentPlan.is_active && currentPlan.completed_at;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Today's Devotional</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    {isCompleted ? 'Plan Completed!' : `Day ${currentPlan.current_day} of ${devotionalPlan.duration_days}`}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{Math.round(progressPercentage)}% Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="p-6">
        {/* Day Title */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{todayContent.title}</h3>
        </div>

        {/* Light Divider */}
        <div className="border-t border-gray-100 mb-6"></div>

        {/* Scripture Quote with Bible Icon */}
        <div className="mb-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <blockquote className="text-blue-900 italic font-medium text-lg leading-relaxed">
                "{todayContent.scripture}"
              </blockquote>
            </div>
          </div>
        </div>

        {/* Light Divider */}
        <div className="border-t border-gray-100 mb-6"></div>

        {/* Devotional Content */}
        <div className="mb-8">
          <p className="text-gray-700 leading-relaxed text-lg">{todayContent.body}</p>
        </div>

        {/* Light Divider */}
        <div className="border-t border-gray-100 mb-6"></div>

        {/* Mark Complete Button - Prominent at Bottom */}
        <div className="text-center">
          {currentPlan.is_active ? (
            <button
              onClick={handleMarkDayComplete}
              disabled={isMarkingComplete}
              className={`w-full flex items-center justify-center px-8 py-4 rounded-xl font-bold text-xl transition-all duration-200 ${
                isMarkingComplete
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isMarkingComplete ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Updating Progress...
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6 mr-3" />
                  {currentPlan.current_day >= devotionalPlan.duration_days ? 'Complete Plan' : 'Mark Day Complete'}
                  {currentPlan.current_day < devotionalPlan.duration_days && (
                    <ArrowRight className="w-6 h-6 ml-3" />
                  )}
                </>
              )}
            </button>
          ) : (
            <div className="w-full flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl">
              <CheckCircle className="w-6 h-6 mr-3" />
              <span className="font-bold text-xl">Plan Completed! 🎉</span>
            </div>
          )}

          {/* Completion Details */}
          {isCompleted && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                You completed "{devotionalPlan.title}" on {new Date(currentPlan.completed_at!).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodaysExperience;