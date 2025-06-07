import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  Star, 
  Zap, 
  BookOpen, 
  Users, 
  Heart,
  Sparkles,
  Gift
} from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe?: () => void;
  planTitle?: string;
}

const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onSubscribe,
  planTitle
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const handleSubscribe = async () => {
    setIsLoading(true);
    
    try {
      // Here you would integrate with RevenueCat
      // For now, we'll simulate the subscription process
      console.log('Starting subscription process for:', selectedPlan);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would:
      // 1. Call RevenueCat to initiate purchase
      // 2. Handle the purchase result
      // 3. Update user entitlements
      
      if (onSubscribe) {
        onSubscribe();
      }
      
      onClose();
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const features = [
    {
      icon: BookOpen,
      title: 'Unlimited Premium Devotionals',
      description: 'Access our entire library of 100+ premium devotional plans'
    },
    {
      icon: Users,
      title: 'Family & Group Features',
      description: 'Share devotionals with family and create accountability groups'
    },
    {
      icon: Heart,
      title: 'Personalized Recommendations',
      description: 'AI-powered suggestions based on your spiritual journey'
    },
    {
      icon: Sparkles,
      title: 'Advanced Progress Tracking',
      description: 'Detailed analytics and milestone celebrations'
    },
    {
      icon: Star,
      title: 'Exclusive Content',
      description: 'Early access to new devotionals and special series'
    },
    {
      icon: Zap,
      title: 'Offline Access',
      description: 'Download devotionals for reading anywhere, anytime'
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white p-8 rounded-t-2xl">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full hover:bg-opacity-30 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-20 h-20 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                <Crown className="w-10 h-10 text-yellow-300" />
              </div>
              
              <h2 className="text-3xl font-bold mb-3">Unlock Premium Access</h2>
              {planTitle && (
                <p className="text-blue-100 mb-4">
                  "{planTitle}" requires a premium subscription
                </p>
              )}
              <p className="text-white text-opacity-90 text-lg">
                Join thousands growing deeper in their faith with premium devotionals
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Pricing Plans */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">Choose Your Plan</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monthly Plan */}
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedPlan === 'monthly'
                      ? 'border-purple-500 bg-purple-50 ring-4 ring-purple-100'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">Monthly</h4>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      selectedPlan === 'monthly'
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedPlan === 'monthly' && (
                        <Check className="w-3 h-3 text-white m-0.5" />
                      )}
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-gray-900">$9.99</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600">Perfect for trying premium features</p>
                </button>

                {/* Yearly Plan */}
                <button
                  onClick={() => setSelectedPlan('yearly')}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 text-left relative ${
                    selectedPlan === 'yearly'
                      ? 'border-purple-500 bg-purple-50 ring-4 ring-purple-100'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  {/* Popular Badge */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      MOST POPULAR
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">Yearly</h4>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      selectedPlan === 'yearly'
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedPlan === 'yearly' && (
                        <Check className="w-3 h-3 text-white m-0.5" />
                      )}
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-gray-900">$79.99</span>
                    <span className="text-gray-600">/year</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm text-gray-500 line-through">$119.88</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Save 33%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Best value for committed growth</p>
                </button>
              </div>
            </div>

            {/* Features List */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                What You'll Get
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">{feature.title}</h4>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Social Proof */}
            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-3">
                  "This app has transformed my daily devotional time. The premium content is incredible!"
                </p>
                <p className="text-sm text-gray-600">- Sarah M., Premium Member</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className={`w-full flex items-center justify-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="w-6 h-6 mr-3" />
                    Start {selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'} Subscription
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">
                  7-day free trial • Cancel anytime • No commitment
                </p>
                <button
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Maybe later
                </button>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                <div className="flex items-center">
                  <Gift className="w-4 h-4 mr-1" />
                  <span>7-day free trial</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 mr-1" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  <span>10,000+ happy users</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaywallModal;