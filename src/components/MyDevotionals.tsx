import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Play, 
  Clock, 
  CheckCircle, 
  RotateCcw, 
  ArrowLeft,
  Eye,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  fk_user_devotional_plan_devotional: {
    id: string;
    title: string;
    author: string;
    duration_days: number;
    description: string;
    image_url?: string;
  };
}

interface MyDevotionalsProps {
  onBack: () => void;
  onNavigateToDashboard: () => void;
}

const MyDevotionals: React.FC<MyDevotionalsProps> = ({ onBack, onNavigateToDashboard }) => {
  const [plans, setPlans] = useState<UserDevotionalPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserPlans();
  }, []);

  const getCurrentUserId = () => {
    const userData = localStorage.getItem('onboarding_data');
    if (userData) {
      const { user_id } = JSON.parse(userData);
      return user_id;
    }
    return null;
  };

  const loadUserPlans = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError('User not found. Please log in again.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_devotional_plan')
        .select(`
          *,
          fk_user_devotional_plan_devotional:devotional_marketplace!fk_user_devotional_plan_devotional (
            id,
            title,
            author,
            duration_days,
            description,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to load devotional plans: ${fetchError.message}`);
      }

      setPlans(data || []);
    } catch (err) {
      console.error('Error loading user plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load devotional plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async (planId: string, planTitle: string) => {
    try {
      setActionLoading(planId);
      setError(null);

      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('User not found');
      }

      // Deactivate all other plans
      const { error: deactivateError } = await supabase
        .from('user_devotional_plan')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (deactivateError) {
        throw new Error(`Failed to deactivate other plans: ${deactivateError.message}`);
      }

      // Activate the selected plan
      const { error: activateError } = await supabase
        .from('user_devotional_plan')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (activateError) {
        throw new Error(`Failed to resume plan: ${activateError.message}`);
      }

      // Navigate to dashboard
      onNavigateToDashboard();

    } catch (err) {
      console.error('Error resuming plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to resume plan');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestart = async (planId: string, planTitle: string) => {
    const confirmRestart = window.confirm(
      `Are you sure you want to restart "${planTitle}"? This will reset your progress to Day 1.`
    );
    
    if (!confirmRestart) return;

    try {
      setActionLoading(planId);
      setError(null);

      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('User not found');
      }

      // Deactivate all other plans first
      const { error: deactivateError } = await supabase
        .from('user_devotional_plan')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (deactivateError) {
        throw new Error(`Failed to deactivate other plans: ${deactivateError.message}`);
      }

      // Restart the selected plan
      const { error: restartError } = await supabase
        .from('user_devotional_plan')
        .update({ 
          current_day: 1,
          is_active: true,
          completed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (restartError) {
        throw new Error(`Failed to restart plan: ${restartError.message}`);
      }

      // Navigate to dashboard
      onNavigateToDashboard();

    } catch (err) {
      console.error('Error restarting plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to restart plan');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusInfo = (plan: UserDevotionalPlan) => {
    if (plan.is_active) {
      return {
        status: 'Active',
        icon: Play,
        color: 'text-green-600 bg-green-50 border-green-200',
        iconColor: 'text-green-600',
        emoji: '🟢'
      };
    } else if (plan.completed_at) {
      return {
        status: 'Completed',
        icon: CheckCircle,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        iconColor: 'text-blue-600',
        emoji: '✅'
      };
    } else {
      return {
        status: 'In Progress',
        icon: Clock,
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        iconColor: 'text-orange-600',
        emoji: '🕓'
      };
    }
  };

  const getProgressText = (plan: UserDevotionalPlan) => {
    const devotional = plan.fk_user_devotional_plan_devotional;
    if (plan.completed_at) {
      return `Completed on ${new Date(plan.completed_at).toLocaleDateString()}`;
    }
    return `Day ${plan.current_day} of ${devotional.duration_days}`;
  };

  const getProgressPercentage = (plan: UserDevotionalPlan) => {
    const devotional = plan.fk_user_devotional_plan_devotional;
    return Math.min((plan.current_day / devotional.duration_days) * 100, 100);
  };

  const getActionButton = (plan: UserDevotionalPlan) => {
    const statusInfo = getStatusInfo(plan);
    const isLoading = actionLoading === plan.id;

    if (plan.is_active) {
      return (
        <button
          onClick={onNavigateToDashboard}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
        >
          <Play className="w-4 h-4 mr-2" />
          Continue
        </button>
      );
    } else if (plan.completed_at) {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => handleRestart(plan.id, plan.fk_user_devotional_plan_devotional.title)}
            disabled={isLoading}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md transform hover:scale-105'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Restarting...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </>
            )}
          </button>
          <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Eye className="w-4 h-4 mr-2" />
            View Reflections
          </button>
        </div>
      );
    } else {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => handleResume(plan.id, plan.fk_user_devotional_plan_devotional.title)}
            disabled={isLoading}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md transform hover:scale-105'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Resuming...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Resume
              </>
            )}
          </button>
          <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Eye className="w-4 h-4 mr-2" />
            View Reflections
          </button>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Devotionals</h1>
                  <p className="text-gray-600">Manage your devotional journey</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900">Loading your devotionals...</h2>
            </div>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Devotionals Yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't started any devotional plans yet. Visit the marketplace to begin your spiritual journey.
            </p>
            <button
              onClick={onBack}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Browse Devotionals
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Your Devotional Plans ({plans.length})
              </h2>
              <p className="text-gray-600">
                Manage your devotional journey and track your spiritual growth
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {plans.map((plan) => {
                const statusInfo = getStatusInfo(plan);
                const progressText = getProgressText(plan);
                const progressPercentage = getProgressPercentage(plan);
                const devotional = plan.fk_user_devotional_plan_devotional;
                
                return (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl ${
                      plan.is_active ? 'ring-2 ring-blue-200 border-blue-300' : 'border border-gray-200'
                    }`}
                  >
                    {/* Card Header with Image */}
                    <div className="relative h-48 bg-gradient-to-br from-blue-500 to-indigo-600">
                      {devotional.image_url ? (
                        <img
                          src={devotional.image_url}
                          alt={devotional.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-white opacity-50" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white shadow-lg ${statusInfo.iconColor}`}>
                          {statusInfo.emoji} {statusInfo.status}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{devotional.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">by {devotional.author}</p>
                        <p className="text-gray-700 text-sm line-clamp-2">{devotional.description}</p>
                      </div>

                      {/* Progress Section */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm font-medium text-blue-600">
                            {Math.round(progressPercentage)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                          <div 
                            className={`h-3 rounded-full transition-all duration-300 ${
                              plan.completed_at 
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                                : plan.is_active
                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                : 'bg-gradient-to-r from-orange-500 to-orange-600'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Started {new Date(plan.start_date).toLocaleDateString()}</span>
                          </div>
                          <span>{progressText}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end">
                        {getActionButton(plan)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDevotionals;