import React from 'react';
import { User } from 'lucide-react';
import { OnboardingData } from '../OnboardingFlow';

interface StepOneProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const StepOne: React.FC<StepOneProps> = ({ data, updateData }) => {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <User className="w-8 h-8 text-blue-600" />
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome!</h2>
      <p className="text-gray-600 mb-8 text-lg">Let's start by getting to know you better.</p>
      
      <div className="max-w-sm mx-auto">
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2 text-left">
          What's your first name?
        </label>
        <input
          type="text"
          id="firstName"
          value={data.first_name}
          onChange={(e) => updateData({ first_name: e.target.value })}
          placeholder="Enter your first name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-lg"
          autoFocus
        />
      </div>
    </div>
  );
};

export default StepOne;