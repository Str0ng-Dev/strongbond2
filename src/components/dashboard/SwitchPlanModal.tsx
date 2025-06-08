import React, { useState, useEffect } from 'react';
import { X, BookOpen, CheckCircle, Play, Clock, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  };
}

interface SwitchPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanSwitched: () => void;
  currentUserId: string;
}

const SwitchPlanModal: React.FC<SwitchPlanModalProps> = ({
  isOpen,
  onClose,
  onPlanSwitched,
  currentUserId
}) => {
  const [plans, setPlans] = useState<UserDevotionalPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUserId) {
      loadUserPlans();
    }
  }, [isOpen, currentUserId]);

  const loadUserPlans = async () => {
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
            description
          )
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to load plans: ${fetchError.message}`);
      }

      setPlans(data || []);
    } catch (err) {
      console.error('Error loading user plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchPlan = async (planId: string, planTitle: string) => {
    try {
      setIsSwitching(planId);
      setError(null);

      // First, deactivate all plans for this user
      const { error: deactivateError } = await supabase
        .from('user_devotional_plan')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUserId);

      if (deactivateError) {
        throw new Error(`Failed to deactivate current plans: ${deactivateError.message}`);
      }

      // Then, activate the selected plan
      const { error: activateError } = await supabase
        .from('user_devotional_plan')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (activateError) {
        throw new Error(`Failed to activate plan: ${activateError.message}`);
      }

      // Success! Close modal and refresh dashboard
      onPlanSwitched();
      onClose();

    } catch (err) {
      console.error('Error switching plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch plan');
    } finally {
      setIsSwitching(null);
    }
  };

  const getStatusInfo = (plan: UserDevotionalPlan) => {
    if (plan.is_active) {
      return {
        status: 'Active',
        icon: Play,
        color: 'text-green-600 bg-green-50 border-green-200',
        iconColor: 'text-green-600'
      };
    } else if (plan.completed_at) {
      return {
        status: 'Completed',
        icon: CheckCircle,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        iconColor: 'text-blue-600'
      };
    } else {
      return {
        status: 'In Progress',
        icon: Clock,
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        iconColor: 'text-orange-600'
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Switch Devotional Plan</h2>
              <p className="text-sm text-gray-600">Choose which plan to make active</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Plans Found</h3>
              <p className="text-gray-600">
                You haven't started any devotional plans yet. Visit the marketplace to begin your journey.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Your Devotional Plans ({plans.length})
              </h3>
              
              {plans.map((plan) => {
                const statusInfo = getStatusInfo(plan);
                const StatusIcon = statusInfo.icon;
                const progressText = getProgressText(plan);
                const progressPercentage = getProgressPercentage(plan);
                const isSwitchingThis = isSwitching === plan.id;
                
                return (
                  <div
                    key={plan.id}
                    className={`border rounded-xl p-4 transition-all duration-200 ${
                      plan.is_active 
                        ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-100' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {plan.fk_user_devotional_plan_devotional.title}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                            <StatusIcon className={`w-3 h-3 mr-1 ${statusInfo.iconColor}`} />
                            {statusInfo.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          by {plan.fk_user_devotional_plan_devotional.author}
                        </p>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Started {new Date(plan.start_date).toLocaleDateString()}</span>
                          <span className="mx-2">•</span>
                          <span>{progressText}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">Progress</span>
                            <span className="text-xs font-medium text-gray-600">
                              {Math.round(progressPercentage)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                plan.completed_at 
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                                  : 'bg-gradient-to-r from-green-500 to-green-600'
                              }`}
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end">
                      {plan.is_active ? (
                        <div className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="font-medium">Currently Active</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSwitchPlan(plan.id, plan.fk_user_devotional_plan_devotional.title)}
                          disabled={isSwitchingThis}
                          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            isSwitchingThis
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md transform hover:scale-105'
                          }`}
                        >
                          {isSwitchingThis ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Switching...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Make Active
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwitchPlanModal;