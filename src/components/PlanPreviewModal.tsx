import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Calendar, 
  Tag, 
  Gift, 
  Heart, 
  DollarSign, 
  Play, 
  Share2, 
  Bookmark,
  Clock,
  User,
  Star,
  CheckCircle,
  Crown,
  Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { revenueCat } from '../lib/revenuecat';
import PaywallModal from './PaywallModal';

interface DevotionalPlan {
  id: string;
  title: string;
  author: string;
  description: string;
  price_type: 'free' | 'donation' | 'paid';
  price?: number;
  image_url?: string;
  tags: string[];
  duration_days: number;
}

interface PlanPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  devotional: DevotionalPlan | null;
  onStartPlan?: (planId: string) => void;
}

const PlanPreviewModal: React.FC<PlanPreviewModalProps> = ({
  isOpen,
  onClose,
  devotional,
  onStartPlan
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isCheckingEntitlement, setIsCheckingEntitlement] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsStarting(false);
      setShowPaywall(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !showPaywall) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, showPaywall]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getPriceDisplay = (devotional: DevotionalPlan) => {
    switch (devotional.price_type) {
      case 'free':
        return { 
          text: 'Free', 
          icon: Gift, 
          color: 'text-green-600 bg-green-50 border-green-200',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800'
        };
      case 'donation':
        return { 
          text: 'Donation Based', 
          icon: Heart, 
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800'
        };
      case 'paid':
        return { 
          text: `$${devotional.price}`, 
          icon: Crown, 
          color: 'text-purple-600 bg-purple-50 border-purple-200',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-800'
        };
      default:
        return { 
          text: 'Free', 
          icon: Gift, 
          color: 'text-green-600 bg-green-50 border-green-200',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800'
        };
    }
  };

  const checkEntitlementAndStartPlan = async () => {
    if (!devotional) return;

    setIsCheckingEntitlement(true);
    setError(null);

    try {
      // Step 1: Fetch the plan's price_type from Supabase
      const { data: planData, error: planError } = await supabase
        .from('devotional_marketplace')
        .select('price_type, price')
        .eq('id', devotional.id)
        .single();

      if (planError) {
        throw new Error(`Failed to fetch plan details: ${planError.message}`);
      }

      const priceType = planData.price_type;

      // Step 2: Handle based on price_type
      switch (priceType) {
        case 'free':
          // Allow immediately
          await startPlan();
          break;
          
        case 'donation':
          // Allow with optional Stripe link (future implementation)
          await startPlan();
          // TODO: Show optional donation link
          break;
          
        case 'paid':
          // Check RevenueCat entitlement
          const hasProAccess = await revenueCat.hasActiveEntitlement('pro_user');
          
          if (hasProAccess) {
            // User has active entitlement, allow access
            await startPlan();
          } else {
            // User doesn't have entitlement, show paywall
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
      setIsCheckingEntitlement(false);
    }
  };

  const startPlan = async () => {
    if (!devotional) return;

    const userData = localStorage.getItem('onboarding_data');
    if (!userData) {
      setError('Please log in to start a devotional plan.');
      return;
    }

    const { user_id } = JSON.parse(userData);
    if (!user_id) {
      setError('User session not found. Please log in again.');
      return;
    }

    const confirmStart = window.confirm('Starting a new plan will archive your current plan. Are you sure you want to continue?');
    if (!confirmStart) return;

    setIsStarting(true);
    setError(null);

    try {
      // Archive current active plan
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

      // Check if a record already exists for this user and devotional
      const { data: existingPlan, error: checkError } = await supabase
        .from('user_devotional_plan')
        .select('id')
        .eq('user_id', user_id)
        .eq('devotional_id', devotional.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected if no record exists
        throw new Error(`Failed to check existing plan: ${checkError.message}`);
      }

      if (existingPlan) {
        // Update existing record
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
        // Insert new record
        const { error: insertError } = await supabase
          .from('user_devotional_plan')
          .insert({
            user_id: user_id,
            devotional_id: devotional.id,
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

      // Success! Close modal and trigger callback
      onClose();
      if (onStartPlan) {
        onStartPlan(devotional.id);
      }

    } catch (err) {
      console.error('Error starting plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to start plan');
    } finally {
      setIsStarting(false);
    }
  };

  const handleSubscriptionSuccess = async () => {
    // User completed subscription, now start the plan
    setShowPaywall(false);
    await startPlan();
  };

  const handleSaveForLater = () => {
    setIsSaved(!isSaved);
    // Here you could implement actual save functionality
    // For now, just toggle the visual state
  };

  const handleShare = async () => {
    if (!devotional) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: devotional.title,
          text: `Check out this devotional: ${devotional.title} by ${devotional.author}`,
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        const shareText = `Check out this devotional: ${devotional.title} by ${devotional.author}`;
        await navigator.clipboard.writeText(shareText);
        alert('Share text copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (!isOpen || !devotional) return null;

  const priceInfo = getPriceDisplay(devotional);
  const PriceIcon = priceInfo.icon;
  const isPaidPlan = devotional.price_type === 'paid';

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="relative">
            {/* Hero Image */}
            <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 relative overflow-hidden">
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
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-full hover:bg-opacity-30 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Price badge */}
              <div className="absolute top-4 left-4">
                <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium border backdrop-blur-sm ${priceInfo.color} bg-white bg-opacity-90`}>
                  <PriceIcon className="w-4 h-4 mr-1" />
                  {priceInfo.text}
                  {isPaidPlan && (
                    <Lock className="w-3 h-3 ml-1" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Title and Author */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{devotional.title}</h2>
              <div className="flex items-center text-gray-600 mb-4">
                <User className="w-4 h-4 mr-2" />
                <span>by {devotional.author}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center text-gray-600 mb-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Duration</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{devotional.duration_days} days</p>
              </div>
              
              <div className={`rounded-lg p-3 ${priceInfo.bgColor}`}>
                <div className={`flex items-center mb-1 ${priceInfo.textColor}`}>
                  <PriceIcon className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">
                    {isPaidPlan ? 'Premium' : 'Price'}
                  </span>
                </div>
                <p className={`text-lg font-bold ${priceInfo.textColor}`}>
                  {isPaidPlan ? 'Pro Required' : priceInfo.text}
                </p>
              </div>
            </div>

            {/* Premium Notice */}
            {isPaidPlan && (
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Crown className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-1">Premium Content</h3>
                    <p className="text-sm text-purple-700">
                      This devotional requires a premium subscription to access. Unlock unlimited premium content with our Pro plan.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Devotional</h3>
              <p className="text-gray-700 leading-relaxed">{devotional.description}</p>
            </div>

            {/* Tags */}
            {devotional.tags && devotional.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Topics Covered</h3>
                <div className="flex flex-wrap gap-2">
                  {devotional.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* What You'll Get */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What You'll Experience</h3>
              <div className="space-y-2">
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                  <span>Daily scripture readings and reflections</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                  <span>Personal journal prompts for deeper growth</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                  <span>Progress tracking and milestone celebrations</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                  <span>Community sharing and encouragement</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            {/* Secondary Actions */}
            <div className="flex justify-center space-x-4 mb-4">
              <button
                onClick={handleSaveForLater}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isSaved
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Bookmark className={`w-4 h-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved!' : 'Save for Later'}
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
            </div>

            {/* Primary Action */}
            <button
              onClick={checkEntitlementAndStartPlan}
              disabled={isStarting || isCheckingEntitlement}
              className={`w-full flex items-center justify-center px-6 py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
                isStarting || isCheckingEntitlement
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isPaidPlan
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg transform hover:scale-105'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transform hover:scale-105'
              }`}
            >
              {isCheckingEntitlement ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Checking Access...
                </>
              ) : isStarting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Starting Plan...
                </>
              ) : (
                <>
                  {isPaidPlan ? (
                    <Crown className="w-5 h-5 mr-3" />
                  ) : (
                    <Play className="w-5 h-5 mr-3" />
                  )}
                  {isPaidPlan ? 'Unlock & Start Plan' : 'Start This Plan'}
                </>
              )}
            </button>

            {/* Duration reminder */}
            <div className="flex items-center justify-center mt-3 text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              <span>{devotional.duration_days}-day spiritual journey</span>
            </div>
          </div>
        </div>
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={handleSubscriptionSuccess}
        planTitle={devotional?.title}
      />
    </>
  );
};

export default PlanPreviewModal;