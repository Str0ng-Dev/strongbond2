import React from 'react';
import { Users, Plus, Hash, Clock } from 'lucide-react';
import { OnboardingData } from '../../types';

interface StepFourProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const StepFour: React.FC<StepFourProps> = ({ data, updateData }) => {
  const options = [
    {
      value: 'Create Group',
      label: 'Create Group',
      description: 'Start a new group and invite others',
      icon: Plus,
      color: 'blue'
    },
    {
      value: 'Join with Code',
      label: 'Join with Code',
      description: 'Join an existing group with an invite code',
      icon: Hash,
      color: 'green'
    },
    {
      value: 'Not now',
      label: 'Not now',
      description: 'Skip group setup, you can join later',
      icon: Clock,
      color: 'gray'
    }
  ] as const;

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      blue: isSelected ? 'bg-blue-500 text-white border-blue-500 ring-blue-200' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      green: isSelected ? 'bg-green-500 text-white border-green-500 ring-green-200' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      gray: isSelected ? 'bg-gray-500 text-white border-gray-500 ring-gray-200' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
    };
    return colors[color as keyof typeof colors];
  };

  const handleGroupActionChange = (action: 'Create Group' | 'Join with Code' | 'Not now') => {
    updateData({ 
      group_action: action,
      invite_code: action === 'Join with Code' ? data.invite_code : undefined
    });
  };

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Users className="w-8 h-8 text-indigo-600" />
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Join the Community</h2>
      <p className="text-gray-600 mb-8 text-lg">Would you like to create or join a group?</p>
      
      <div className="space-y-4 max-w-md mx-auto">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = data.group_action === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => handleGroupActionChange(option.value)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                isSelected 
                  ? `${getColorClasses(option.color, true)} ring-4 shadow-lg` 
                  : `${getColorClasses(option.color, false)} hover:shadow-md`
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-white bg-opacity-20' : 'bg-white'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    isSelected ? 'text-white' : `text-${option.color}-600`
                  }`} />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-lg">{option.label}</h3>
                  <p className={`text-sm ${
                    isSelected ? 'text-white text-opacity-90' : 'text-gray-600'
                  }`}>
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Conditional input field for joining with code */}
      {data.group_action === 'Join with Code' && (
        <div className="mt-6 max-w-md mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <label htmlFor="inviteCode" className="block text-sm font-medium text-green-900 mb-2">
              Enter Group Invite Code
            </label>
            <input
              type="text"
              id="inviteCode"
              value={data.invite_code || ''}
              onChange={(e) => updateData({ invite_code: e.target.value.toUpperCase() })}
              placeholder="Enter 6-character code"
              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none uppercase text-center text-lg font-mono tracking-wider"
              maxLength={6}
              autoFocus
            />
            <p className="text-xs text-green-700 mt-2">
              Ask your group leader for the group invite code
            </p>
          </div>
        </div>
      )}

      {/* Show confirmation for creating a group */}
      {data.group_action === 'Create Group' && (
        <div className="mt-6 max-w-md mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <Plus className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">
                Creating "{data.first_name}'s Group"
              </span>
            </div>
            <p className="text-xs text-blue-700">
              You'll receive an invite code to share with others after completing setup
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepFour;