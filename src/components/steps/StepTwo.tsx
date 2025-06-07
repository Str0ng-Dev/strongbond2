import React from 'react';
import { Users, Heart, Baby, User, UserCheck, Church, Trophy } from 'lucide-react';
import { OnboardingData } from '../OnboardingFlow';

interface StepTwoProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const StepTwo: React.FC<StepTwoProps> = ({ data, updateData }) => {
  const roles = [
    { value: 'Dad', label: 'Dad', icon: User, color: 'blue' },
    { value: 'Mom', label: 'Mom', icon: Heart, color: 'pink' },
    { value: 'Son', label: 'Son', icon: Baby, color: 'green' },
    { value: 'Daughter', label: 'Daughter', icon: Baby, color: 'purple' },
    { value: 'Single Man', label: 'Single Man', icon: UserCheck, color: 'indigo' },
    { value: 'Single Woman', label: 'Single Woman', icon: UserCheck, color: 'rose' },
    { value: 'Church Leader', label: 'Church Leader', icon: Church, color: 'amber' },
    { value: 'Coach', label: 'Coach', icon: Trophy, color: 'orange' }
  ] as const;

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      blue: isSelected ? 'bg-blue-500 text-white ring-blue-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      pink: isSelected ? 'bg-pink-500 text-white ring-pink-200' : 'bg-pink-50 text-pink-700 hover:bg-pink-100',
      green: isSelected ? 'bg-green-500 text-white ring-green-200' : 'bg-green-50 text-green-700 hover:bg-green-100',
      purple: isSelected ? 'bg-purple-500 text-white ring-purple-200' : 'bg-purple-50 text-purple-700 hover:bg-purple-100',
      indigo: isSelected ? 'bg-indigo-500 text-white ring-indigo-200' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
      rose: isSelected ? 'bg-rose-500 text-white ring-rose-200' : 'bg-rose-50 text-rose-700 hover:bg-rose-100',
      amber: isSelected ? 'bg-amber-500 text-white ring-amber-200' : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
      orange: isSelected ? 'bg-orange-500 text-white ring-orange-200' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Users className="w-8 h-8 text-purple-600" />
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Role</h2>
      <p className="text-gray-600 mb-8 text-lg">This helps us personalize your experience.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = data.user_role === role.value;
          
          return (
            <button
              key={role.value}
              onClick={() => updateData({ user_role: role.value })}
              className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                isSelected 
                  ? `${getColorClasses(role.color, true)} border-transparent ring-4 shadow-lg` 
                  : `${getColorClasses(role.color, false)} border-gray-200 hover:border-gray-300 hover:shadow-md`
              }`}
            >
              <Icon className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm font-medium block">{role.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StepTwo;