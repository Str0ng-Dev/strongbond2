import React from 'react';
import { Building2, Globe, User, Mail, Crown, Check } from 'lucide-react';
import { OrgOnboardingData, getPlanFeatures } from '../../utils/orgOnboarding';

interface StepFourConfirmationProps {
  data: OrgOnboardingData;
}

const StepFourConfirmation: React.FC<StepFourConfirmationProps> = ({ data }) => {
  const plans = getPlanFeatures();
  const selectedPlan = plans[data.planTier];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Review Your Organization Setup</h3>
        <p className="text-gray-600">
          Please review the information below before creating your organization.
        </p>
      </div>

      {/* Organization Details */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Building2 className="w-5 h-5 text-blue-600 mr-2" />
          <h4 className="text-lg font-semibold text-gray-900">Organization Details</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Organization Name</p>
            <p className="font-medium text-gray-900">{data.orgName}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-1">Subdomain</p>
            <p className="font-medium text-gray-900">{data.subdomain}.yourapp.com</p>
          </div>
          
          {data.customDomain && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600 mb-1">Custom Domain</p>
              <p className="font-medium text-gray-900">{data.customDomain}</p>
            </div>
          )}
        </div>
      </div>

      {/* Admin Account */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <User className="w-5 h-5 text-green-600 mr-2" />
          <h4 className="text-lg font-semibold text-gray-900">Admin Account</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">First Name</p>
            <p className="font-medium text-gray-900">{data.adminFirstName}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-1">Email Address</p>
            <p className="font-medium text-gray-900">{data.adminEmail}</p>
          </div>
          
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600 mb-1">Role</p>
            <p className="font-medium text-gray-900">Organization Administrator</p>
          </div>
        </div>
      </div>

      {/* Selected Plan */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Crown className="w-5 h-5 text-purple-600 mr-2" />
          <h4 className="text-lg font-semibold text-gray-900">Selected Plan</h4>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xl font-bold text-gray-900">{selectedPlan.name}</p>
            <p className="text-gray-600">
              {selectedPlan.price}
              {selectedPlan.period !== 'pricing' && ` per ${selectedPlan.period}`}
            </p>
          </div>
          
          {data.planTier === 'pro' && (
            <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              MOST POPULAR
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {selectedPlan.features.slice(0, 6).map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
        
        {selectedPlan.features.length > 6 && (
          <p className="text-sm text-gray-600 mt-2">
            And {selectedPlan.features.length - 6} more features...
          </p>
        )}
      </div>

      {/* Access URLs */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Globe className="w-5 h-5 text-blue-600 mr-2" />
          <h4 className="text-lg font-semibold text-blue-900">Your Organization URLs</h4>
        </div>
        
        <div className="space-y-2">
          <div>
            <p className="text-sm text-blue-700 mb-1">Primary URL</p>
            <p className="font-mono text-blue-900 bg-white px-3 py-2 rounded border">
              https://{data.customDomain || `${data.subdomain}.yourapp.com`}
            </p>
          </div>
          
          {data.customDomain && (
            <div>
              <p className="text-sm text-blue-700 mb-1">Subdomain (Backup)</p>
              <p className="font-mono text-blue-900 bg-white px-3 py-2 rounded border">
                https://{data.subdomain}.yourapp.com
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-green-900 mb-3">What happens next?</h4>
        <div className="space-y-2 text-sm text-green-700">
          <div className="flex items-start space-x-2">
            <span className="font-bold">1.</span>
            <span>Your organization and admin account will be created</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-bold">2.</span>
            <span>You'll be automatically logged in to your organization dashboard</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-bold">3.</span>
            <span>You can start inviting users and customizing your organization</span>
          </div>
          {data.customDomain && (
            <div className="flex items-start space-x-2">
              <span className="font-bold">4.</span>
              <span>You'll receive instructions for setting up your custom domain DNS</span>
            </div>
          )}
        </div>
      </div>

      {/* Terms Notice */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          By creating your organization, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
          <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default StepFourConfirmation;