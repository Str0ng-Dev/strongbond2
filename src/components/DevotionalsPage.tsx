import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  Search,
  Filter,
  Tag,
  DollarSign,
  Gift,
  Heart,
  Play,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  RotateCcw,
  AlertCircle,
  Crown,
  Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { revenueCat } from '../lib/revenuecat';
import { devotionalPlans } from '../data/mockData';
import { DevotionalPlan } from '../types';
import PlanPreviewModal from './PlanPreviewModal';
import PaywallModal from './PaywallModal';

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

interface DevotionalsPageProps {
  onBack: () => void;
  onPlanStarted?: () => void;
}

const DevotionalsPage: React.FC<DevotionalsPageProps> = ({ onBack, onPlanStarted }) => {
  // Marketplace state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [startingPlan, setStartingPlan] = useState<string | null>(null);
  const [selectedDevotional, setSelectedDevotional] = useState<DevotionalPlan | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isMarketplaceCollapsed, setIsMarketplaceCollapsed] = useState(false);
  const [isCheckingEntitlement, setIsCheckingEntitlement] = useState<string | null>(null);

  // My Devotionals state
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

  // Get all unique tags
  const allTags = Array.from(new Set(devotionalPlans.flatMap(plan => plan.tags)));

  // Filter plans based on search and filters
  const filteredPlans = devotionalPlans.filter(plan => {
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || plan.tags.includes(selectedTag);
    const matchesType = !selectedType || plan.price_type === selectedType;
    
    return matchesSearch && matchesTag && matchesType;
  });

  const getPriceDisplay = (plan: DevotionalPlan) => {
    switch (plan.price_type) {
      case 'free':
        return { text: 'Free', icon: Gift, color: 'text-green-600 bg-green-50' };
      case 'donation':
        return { text: 'Donation', icon: Heart, color: 'text-blue-600 bg-blue-50' };
      case 'paid':
        return { text: 'Premium', icon: Crown, color: 'text-purple-600 bg-purple-50' };
      default:
        return { text: 'Free', icon: Gift, color: 'text-green-600 bg-green-50' };
    }
  };

  const checkEntitlementAndStartPlan = async (planId: string) => {
    const userData = localStorage.getItem('onboarding_data');
    if (!userData) {
      setError('User data not found. Please log in again.');
      return;
    }

    const { user_id } = JSON.parse(userData);
    if (!user_id) {
      setError('User ID not found. Please log in again.');
      return;
    }

    setIsCheckingEntitlement(planId);
    setError(null);

    try {
      // Step 1: Fetch the plan's price_type from Supabase
      const { data: planData, error: planError } = await supabase
        .from('devotional_marketplace')
        .select('price_type, price, title')
        .eq('id', planId)
        .single();

      if (planError) {
        throw new Error(`Failed to fetch plan details: ${planError.message}`);
      }

      const priceType = planData.price_type;

      // Step 2: Handle based on price_type
      switch (priceType) {
        case 'free':
          // Allow immediately
          await startPlan(planId, planData.title);
          break;
          
        case 'donation':
          // Allow with optional Stripe link (future implementation)
          await startPlan(planId, planData.title);
          // TODO: Show optional donation link
          break;
          
        case 'paid':
          // Check RevenueCat entitlement
          const hasProAccess = await revenueCat.hasActiveEntitlement('pro_user');
          
          if (hasProAccess) {
            // User has active entitlement, allow access
            await startPlan(planId, planData.title);
          } else {
            // User doesn't have entitlement, show paywall
            const plan = devotionalPlans.find(p => p.id === planId);
            setSelectedDevotional(plan || null);
            setShowPaywall(true);
          }
          break;
          
        default:
          throw new Error('Unknown price type');
      }
    } catch (err) {
      console.error('Error checking entitlement:', err);
      setError(err instanceof Error ? err.message : 'Failed to check access permissions');
    } finally {
      setIsCheckingEntitlement(null);
    }
  };

  const startPlan = async (planId: string, planTitle: string) => {
    const userData = localStorage.getItem('onboarding_data');
    if (!userData) {
      setError('User data not found. Please log in again.');
      return;
    }

    const { user_id } = JSON.parse(userData);
    if (!user_id) {
      setError('User ID not found. Please log in again.');
      return;
    }

    const confirmStart = window.confirm('Starting a new plan will archive your current plan. Are you sure you want to continue?');
    if (!confirmStart) return;

    setStartingPlan(planId);
    setError(null);

    try {
      // Step 1: Archive current active plan (set is_active = false)
      const { error: archiveError } = await supabase
        .from('user_devotional_plan')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id)
        .eq('is_active', true);

      if (archiveError) {
        throw new Error(`Failed to archive current plan: ${archiveError.message}`);
      }

      // Step 2: Check if a record already exists for this user and devotional
      const { data: existingPlan, error: checkError } = await supabase
        .from('user_devotional_plan')
        .select('id')
        .eq('user_id', user_id)
        .eq('devotional_id', planId)
        .maybeSingle();

      if (checkError) {
        throw new Error(`Failed to check existing plan: ${checkError.message}`);
      }

      if (existingPlan) {
        // Step 3a: Update existing record
        const { error: updateError } = await supabase
          .from('user_devotional_plan')
          .update({
            start_date: new Date().toISOString(),
            current_day: 1,
            is_active: true,
            completed_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPlan.id);

        if (updateError) {
          throw new Error(`Failed to restart plan: ${updateError.message}`);
        }
      } else {
        // Step 3b: Insert new record
        const { error: insertError } = await supabase
          .from('user_devotional_plan')
          .insert({
            user_id: user_id,
            devotional_id: planId,
            start_date: new Date().toISOString(),
            current_day: 1,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          throw new Error(`Failed to start new plan: ${insertError.message}`);
        }
      }

      // Success! Show confirmation and trigger callback
      alert(`🎉 Successfully started "${planTitle}"! Your new devotional journey begins now.`);
      
      // Refresh my devotionals and trigger callback
      loadUserPlans();
      if (onPlanStarted) {
        onPlanStarted();
      }

    } catch (err) {
      console.error('Error starting new plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to start new plan');
    } finally {
      setStartingPlan(null);
    }
  };

  const handlePreview = (devotional: DevotionalPlan) => {
    setSelectedDevotional(devotional);
    setShowPreviewModal(true);
  };

  const handlePlanStartedFromModal = (planId: string) => {
    setShowPreviewModal(false);
    setSelectedDevotional(null);
    loadUserPlans();
    if (onPlanStarted) {
      onPlanStarted();
    }
  };

  const handleSubscriptionSuccess = async () => {
    // User completed subscription, now start the plan
    setShowPaywall(false);
    if (selectedDevotional) {
      await startPlan(selectedDevotional.id, selectedDevotional.title);
    }
    setSelectedDevotional(null);
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

      // Refresh data and navigate back
      loadUserPlans();
      if (onPlanStarted) {
        onPlanStarted();
      }

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

      // Refresh data and trigger callback
      loadUserPlans();
      if (onPlanStarted) {
        onPlanStarted();
      }

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
    const isLoading = actionLoading === plan.id;

    if (plan.is_active) {
      return (
        <button
          onClick={onBack}
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
                  <h1 className="text-2xl font-bold text-gray-900">Devotionals</h1>
                  <p className="text-gray-600">Explore and manage your spiritual journey</p>
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

        <div className="space-y-8">
          {/* Marketplace Section - Collapsible */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <div className="px-6 py-4">
                <button
                  onClick={() => setIsMarketplaceCollapsed(!isMarketplaceCollapsed)}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        Marketplace
                      </h2>
                      <p className="text-gray-600 text-sm">
                        Discover new devotional plans to grow your faith
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 hidden sm:block">
                      {isMarketplaceCollapsed ? 'Show' : 'Hide'}
                    </span>
                    <div className="p-2 rounded-lg bg-white bg-opacity-50 group-hover:bg-opacity-80 transition-all duration-200">
                      {isMarketplaceCollapsed ? (
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
              isMarketplaceCollapsed 
                ? 'max-h-0 opacity-0 overflow-hidden' 
                : 'max-h-[2000px] opacity-100'
            }`}>
              <div className="p-6">
                {/* Search and Filters */}
                <div className="space-y-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search devotionals..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">All Types</option>
                      <option value="free">Free</option>
                      <option value="donation">Donation</option>
                      <option value="paid">Premium</option>
                    </select>

                    <select
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">All Tags</option>
                      {allTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlans.map(plan => {
                    const priceInfo = getPriceDisplay(plan);
                    const PriceIcon = priceInfo.icon;
                    const isStarting = startingPlan === plan.id;
                    const isChecking = isCheckingEntitlement === plan.id;
                    const isPaidPlan = plan.price_type === 'paid';

                    return (
                      <div key={plan.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200">
                        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-indigo-600">
                          <img
                            src={plan.image}
                            alt={plan.title}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Price Badge */}
                          <div className="absolute top-3 right-3">
                            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${priceInfo.color}`}>
                              <PriceIcon className="w-3 h-3 mr-1" />
                              {priceInfo.text}
                              {isPaidPlan && (
                                <Lock className="w-3 h-3 ml-1" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">by {plan.author}</p>
                          <p className="text-sm text-gray-700 mb-4 line-clamp-2">{plan.description}</p>
                          
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-wrap gap-1">
                              {plan.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                                  <Tag className="w-3 h-3 mr-1 inline" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <span className="text-xs text-gray-500 font-medium">
                              {plan.duration_days} days
                            </span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handlePreview(plan)}
                              className="flex-1 flex items-center justify-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Preview
                            </button>
                            <button 
                              onClick={() => checkEntitlementAndStartPlan(plan.id)}
                              disabled={isStarting || isChecking}
                              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                                isStarting || isChecking
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : isPaidPlan
                                  ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md transform hover:scale-105'
                                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md transform hover:scale-105'
                              }`}
                            >
                              {isChecking ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  Checking...
                                </>
                              ) : isStarting ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  Starting...
                                </>
                              ) : (
                                <>
                                  {isPaidPlan ? (
                                    <Crown className="w-3 h-3 mr-1" />
                                  ) : (
                                    <Play className="w-3 h-3 mr-1" />
                                  )}
                                  {isPaidPlan ? 'Unlock' : 'Start Plan'}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredPlans.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No devotional plans match your search criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* My Devotionals Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Devotionals</h2>
                <p className="text-gray-600">Track your devotional journey and progress</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <h2 className="text-xl font-semibold text-gray-900">Loading your devotionals...</h2>
                </div>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">No Devotionals Yet</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  You haven't started any devotional plans yet. Browse the marketplace above to begin your spiritual journey.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Your Devotional Plans ({plans.length})
                  </h3>
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
                          plan.is_active ? 'ring-2 ring-purple-200 border-purple-300' : 'border border-gray-200'
                        }`}
                      >
                        {/* Card Header with Image */}
                        <div className="relative h-48 bg-gradient-to-br from-purple-500 to-indigo-600">
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
                              <span className="text-sm font-medium text-purple-600">
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
      </div>

      {/* Preview Modal */}
      <PlanPreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedDevotional(null);
        }}
        devotional={selectedDevotional}
        onStartPlan={handlePlanStartedFromModal}
      />

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => {
          setShowPaywall(false);
          setSelectedDevotional(null);
        }}
        onSubscribe={handleSubscriptionSuccess}
        planTitle={selectedDevotional?.title}
      />
    </div>
  );
};

export default DevotionalsPage;