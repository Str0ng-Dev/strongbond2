import React from 'react';
import { Check, Crown, Zap, Building2 } from 'lucide-react';
import { OrgOnboardingData, getPlanFeatures } from '../../utils/orgOnboarding';

interface StepThreePlanSelectProps {
  data: OrgOnboardingData;
  updateData: (updates: Partial<OrgOnboardingData>) => void;
}

const StepThreePlanSelect: React.FC<StepThreePlanSelectProps> = ({ data, updateData }) => {
  const plans = getPlanFeatures();

  const getPlanIcon = (planKey: string) => {
    switch (planKey) {
      case 'free':
        return <Zap className="w-6 h-6" />;
      case 'pro':
        return <Crown className="w-6 h-6" />;
      case 'enterprise':
        return <Building2 className="w-6 h-6" />;
      default:
        return <Zap className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planKey: string) => {
    switch (planKey) {
      case 'free':
        return 'from-green-500 to-emerald-600';
      case 'pro':
        return 'from-blue-500 to-indigo-600';
      case 'enterprise':
        return 'from-purple-500 to-violet-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <p className="text-gray-600">
          Choose the plan that best fits your organization's needs. You can upgrade or downgrade at any time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(plans).map(([planKey, plan]) => {
          const isSelected = data.planTier === planKey;
          const isPopular = planKey === 'pro';
          
          return (
            <div
              key={planKey}
              className={`relative rounded-2xl border-2 transition-all duration-200 cursor-pointer transform hover:scale-105 ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
              }`}
              onClick={() => updateData({ planTier: planKey as 'free' | 'pro' | 'enterprise' })}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className={`w-12 h-12 bg-gradient-to-r ${getPlanColor(planKey)} rounded-full flex items-center justify-center mx-auto mb-4 text-white`}>
                    {getPlanIcon(planKey)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period !== 'pricing' && (
                      <span className="text-gray-600 ml-1">/{plan.period}</span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-500 mb-2">Limitations:</p>
                    <div className="space-y-1">
                      {plan.limitations.map((limitation, index) => (
                        <p key={index} className="text-xs text-gray-500">• {limitation}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selection Indicator */}
                <div className="mt-6 text-center">
                  <div className={`w-6 h-6 rounded-full border-2 mx-auto ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <Check className="w-4 h-4 text-white m-0.5" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Comparison Note */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Plan Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
          <div>
            <p className="font-medium text-green-700 mb-1">Free Plan</p>
            <p>Perfect for small communities just getting started with basic features.</p>
          </div>
          <div>
            <p className="font-medium text-blue-700 mb-1">Pro Plan</p>
            <p>Ideal for growing organizations that need advanced features and customization.</p>
          </div>
          <div>
            <p className="font-medium text-purple-700 mb-1">Enterprise Plan</p>
            <p>For large organizations requiring unlimited scale and custom integrations.</p>
          </div>
        </div>
      </div>

      {/* Billing Notice */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-1">Billing Information</h3>
        <p className="text-xs text-blue-700">
          You can start with any plan and upgrade or downgrade at any time. 
          {data.planTier === 'free' ? ' No credit card required for the free plan.' : ' Billing will be set up after organization creation.'}
        </p>
      </div>
    </div>
  );
};

export default StepThreePlanSelect;