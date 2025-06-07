import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { OrgOnboardingData } from '../../utils/orgOnboarding';

interface StepTwoAdminUserProps {
  data: OrgOnboardingData;
  updateData: (updates: Partial<OrgOnboardingData>) => void;
}

const StepTwoAdminUser: React.FC<StepTwoAdminUserProps> = ({ data, updateData }) => {
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Too short', color: 'text-red-500' };
    if (password.length < 8) return { strength: 2, label: 'Weak', color: 'text-orange-500' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score >= 4) return { strength: 4, label: 'Strong', color: 'text-green-500' };
    if (score >= 3) return { strength: 3, label: 'Good', color: 'text-blue-500' };
    return { strength: 2, label: 'Fair', color: 'text-yellow-500' };
  };

  const passwordStrength = getPasswordStrength(data.adminPassword);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-gray-600">
          Create the admin account for your organization. This will be the primary administrator account.
        </p>
      </div>

      {/* First Name */}
      <div>
        <label htmlFor="adminFirstName" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            First Name *
          </div>
        </label>
        <input
          type="text"
          id="adminFirstName"
          value={data.adminFirstName}
          onChange={(e) => updateData({ adminFirstName: e.target.value })}
          placeholder="Enter your first name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
          maxLength={50}
          autoFocus
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center">
            <Mail className="w-4 h-4 mr-2" />
            Email Address *
          </div>
        </label>
        <input
          type="email"
          id="adminEmail"
          value={data.adminEmail}
          onChange={(e) => updateData({ adminEmail: e.target.value })}
          placeholder="admin@yourdomain.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
        />
        <p className="text-xs text-gray-500 mt-1">
          This will be your login email and primary contact for the organization
        </p>
      </div>

      {/* Password */}
      <div>
        <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center">
            <Lock className="w-4 h-4 mr-2" />
            Password *
          </div>
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="adminPassword"
            value={data.adminPassword}
            onChange={(e) => updateData({ adminPassword: e.target.value })}
            placeholder="Create a secure password"
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Password Strength Indicator */}
        {data.adminPassword && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Password strength:</span>
              <span className={`text-xs font-medium ${passwordStrength.color}`}>
                {passwordStrength.label}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  passwordStrength.strength === 1 ? 'bg-red-500 w-1/4' :
                  passwordStrength.strength === 2 ? 'bg-orange-500 w-2/4' :
                  passwordStrength.strength === 3 ? 'bg-blue-500 w-3/4' :
                  passwordStrength.strength === 4 ? 'bg-green-500 w-full' :
                  'bg-gray-300 w-0'
                }`}
              />
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-1">
          Password must be at least 6 characters long. For better security, use a mix of letters, numbers, and symbols.
        </p>
      </div>

      {/* Admin Role Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Admin Account Privileges</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Full access to organization settings and configuration</li>
          <li>• Ability to invite and manage users</li>
          <li>• Access to analytics and reporting</li>
          <li>• Billing and subscription management</li>
          <li>• Content and devotional management</li>
        </ul>
      </div>

      {/* Security Notice */}
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h3 className="text-sm font-medium text-amber-900 mb-1">Security Notice</h3>
        <p className="text-xs text-amber-700">
          Keep your admin credentials secure. You can add additional administrators later from your organization dashboard.
        </p>
      </div>
    </div>
  );
};

export default StepTwoAdminUser;