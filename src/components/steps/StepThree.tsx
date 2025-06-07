import React from 'react';
import { Target, Zap } from 'lucide-react';
import { OnboardingData } from '../OnboardingFlow';

interface StepThreeProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const StepThree: React.FC<StepThreeProps> = ({ data, updateData }) => {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Target className="w-8 h-8 text-green-600" />
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Fitness Challenges</h2>
      <p className="text-gray-600 mb-8 text-lg">Would you like to include fitness challenges in your experience?</p>
      
      <div className="max-w-md mx-auto">
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Fitness Challenges</h3>
                <p className="text-sm text-gray-600">Get workout plans and track progress</p>
              </div>
            </div>
            
            <button
              onClick={() => updateData({ fitness_enabled: !data.fitness_enabled })}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ${
                data.fitness_enabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ${
                  data.fitness_enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {data.fitness_enabled && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>Great choice!</strong> You'll receive personalized workout plans and be able to track your fitness progress.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepThree;