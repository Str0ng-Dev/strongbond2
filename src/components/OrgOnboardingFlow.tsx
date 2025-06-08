import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Building2 } from 'lucide-react';
import StepOneOrgDetails from './orgOnboarding/StepOneOrgDetails';
import StepTwoAdminUser from './orgOnboarding/StepTwoAdminUser';
import StepThreePlanSelect from './orgOnboarding/StepThreePlanSelect';
import StepFourConfirmation from './orgOnboarding/StepFourConfirmation';
import { createOrganization, OrgOnboardingData, OrganizationResult } from '../utils/orgOnboarding';
import { supabase } from '../lib/supabase';

interface OrgOnboardingFlowProps {
  onComplete: (result: OrganizationResult) => void;
  onBack?: () => void;
}

const ProgressIndicator: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-300 ${
                step < currentStep
                  ? 'bg-green-500 text-white shadow-lg'
                  : step === currentStep
                  ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="text-sm">{step}</span>
              )}
            </div>
            <div className="mt-2 text-xs font-medium text-gray-500">
              {step === 1 && 'Details'}
              {step === 2 && 'Admin'}
              {step === 3 && 'Plan'}
              {step === 4 && 'Confirm'}
            </div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-16 h-0.5 mx-2 transition-all duration-300 ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

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
    setError(null);
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
      
      localStorage.setItem('org_onboarding_result', JSON.stringify(orgResult));
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
      }
      
      setTimeout(() => {
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
        return true;
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
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Organization</h1>
          <p className="text-gray-600">Set up your organization to start building your community</p>
        </div>

        <ProgressIndicator currentStep={currentStep + 1} totalSteps={totalSteps} />
        
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-8 transition-all duration-300">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{getStepTitle()}</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

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