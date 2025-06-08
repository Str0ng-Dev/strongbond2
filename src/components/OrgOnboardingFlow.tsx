import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Building2 } from 'lucide-react';
import StepOneOrgDetails from './orgOnboarding/StepOneOrgDetails';
import StepTwoAdminUser from './orgOnboarding/StepTwoAdminUser';
import StepThreePlanSelect from './orgOnboarding/StepThreePlanSelect';
import StepFourConfirmation from './orgOnboarding/StepFourConfirmation';
import ProgressIndicator from './ProgressIndicator';
import { createOrganization, OrgOnboardingData, OrganizationResult } from '../utils/orgOnboarding';
import { supabase } from '../lib/supabase';

interface OrgOnboardingFlowProps {
  onComplete: (result: OrganizationResult) => void;
  onBack?: () => void;
}

const OrgOnboardingFlow: React.FC<OrgOnboardingFlowProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OrgOnboardingData>({
    orgName: '',
    subdomain: '',
    customDomain: '',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    planTier: 'free'
  });
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrganizationResult | null>(null);

  const totalSteps = 4;

  const updateData = (updates: Partial<OrgOnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
    setError(null); // Clear errors when data changes
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const orgResult = await createOrganization(data);
      setResult(orgResult);
      setIsComplete(true);
      
      // Store the organization result in localStorage
      localStorage.setItem('org_onboarding_result', JSON.stringify(orgResult));
      
      // Ensure the admin user is properly logged in by refreshing the session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        // Continue with redirect even if session check fails
      } else if (sessionData.session) {
        console.log('Admin user session confirmed:', sessionData.session.user.email);
      }
      
      // Redirect to organization dashboard after 2 seconds
      setTimeout(() => {
        // In a real app, you would use React Router to navigate to '/org-dashboard'
        // For now, we'll trigger the completion callback which should handle the redirect
        onComplete(orgResult);
      }, 2000);

    } catch (err) {
      console.error('Organization onboarding error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return data.orgName.trim().length > 0 && data.subdomain.trim().length > 0;
      case 1:
        return data.adminFirstName.trim().length > 0 && 
               data.adminEmail.trim().length > 0 && 
               data.adminEmail.includes('@') && 
               data.adminPassword.length >= 6;
      case 2:
        return data.planTier !== '';
      case 3:
        return true; // Confirmation step
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0: return 'Organization Details';
      case 1: return 'Admin Account';
      case 2: return 'Select Plan';
      case 3: return 'Confirmation';
      default: return 'Setup';
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Organization Created!</h2>
          <p className="text-gray-600 mb-6">
            Welcome to your new organization! Your admin account has been created and you're ready to start building your community.
          </p>
          
          {result && (
            <div className="space-y-2 text-sm text-gray-500 mb-6">
              <p><strong>Organization:</strong> {result.organization.name}</p>
              <p><strong>Subdomain:</strong> {result.organization.subdomain}.yourapp.com</p>
              {result.organization.custom_domain && (
                <p><strong>Custom Domain:</strong> {result.organization.custom_domain}</p>
              )}
              <p><strong>Plan:</strong> {result.organization.plan_tier}</p>
              <p><strong>Admin Email:</strong> {result.adminUser.email}</p>
            </div>
          )}
          
          {/* Loading animation */}
          <div className="mt-6">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Redirecting to your organization dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Organization</h1>
          <p className="text-gray-600">Set up your organization to start building your community</p>
        </div>

        <ProgressIndicator currentStep={currentStep + 1} totalSteps={totalSteps} />
        
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-8 transition-all duration-300">
          {/* Step Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{getStepTitle()}</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 0 && (
            <StepOneOrgDetails 
              data={data} 
              updateData={updateData} 
            />
          )}
          {currentStep === 1 && (
            <StepTwoAdminUser 
              data={data} 
              updateData={updateData} 
            />
          )}
          {currentStep === 2 && (
            <StepThreePlanSelect 
              data={data} 
              updateData={updateData} 
            />
          )}
          {currentStep === 3 && (
            <StepFourConfirmation 
              data={data} 
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <div className="flex space-x-3">
              {onBack && currentStep === 0 && (
                <button
                  onClick={onBack}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg font-medium transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to Login
                </button>
              )}
              
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg font-medium transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </button>
              )}
            </div>

            <button
              onClick={nextStep}
              disabled={!canProceed() || isLoading}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                canProceed() && !isLoading
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  {currentStep === totalSteps - 1 ? 'Create Organization' : 'Continue'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgOnboardingFlow;