import React from 'react';
import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, totalSteps }) => {
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
              {step === 1 && 'Invite'}
              {step === 2 && 'Name'}
              {step === 3 && 'Role'}
              {step === 4 && 'Fitness'}
              {step === 5 && 'Group'}
              {step === 6 && 'Account'}
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

export default ProgressIndicator;