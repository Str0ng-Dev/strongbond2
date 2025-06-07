import React, { useState, useEffect } from 'react';
import { Building2, Globe, Check, X, Loader2 } from 'lucide-react';
import { OrgOnboardingData, checkSubdomainAvailability, validateSubdomain, validateCustomDomain } from '../../utils/orgOnboarding';

interface StepOneOrgDetailsProps {
  data: OrgOnboardingData;
  updateData: (updates: Partial<OrgOnboardingData>) => void;
}

const StepOneOrgDetails: React.FC<StepOneOrgDetailsProps> = ({ data, updateData }) => {
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [domainStatus, setDomainStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [checkingTimeout, setCheckingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Validate and check subdomain availability
  useEffect(() => {
    if (!data.subdomain) {
      setSubdomainStatus('idle');
      return;
    }

    // Clear existing timeout
    if (checkingTimeout) {
      clearTimeout(checkingTimeout);
    }

    // Validate format first
    const validation = validateSubdomain(data.subdomain);
    if (!validation.isValid) {
      setSubdomainStatus('invalid');
      return;
    }

    // Set checking status and debounce the API call
    setSubdomainStatus('checking');
    const timeout = setTimeout(async () => {
      try {
        const isAvailable = await checkSubdomainAvailability(data.subdomain);
        setSubdomainStatus(isAvailable ? 'available' : 'taken');
      } catch (error) {
        console.error('Error checking subdomain:', error);
        setSubdomainStatus('invalid');
      }
    }, 500);

    setCheckingTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [data.subdomain]);

  // Validate custom domain
  useEffect(() => {
    if (!data.customDomain) {
      setDomainStatus('idle');
      return;
    }

    const validation = validateCustomDomain(data.customDomain);
    setDomainStatus(validation.isValid ? 'valid' : 'invalid');
  }, [data.customDomain]);

  const getSubdomainStatusIcon = () => {
    switch (subdomainStatus) {
      case 'checking':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'available':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'taken':
      case 'invalid':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getSubdomainStatusMessage = () => {
    switch (subdomainStatus) {
      case 'checking':
        return 'Checking availability...';
      case 'available':
        return 'Available!';
      case 'taken':
        return 'This subdomain is already taken';
      case 'invalid':
        const validation = validateSubdomain(data.subdomain);
        return validation.error || 'Invalid subdomain format';
      default:
        return '';
    }
  };

  const getDomainStatusIcon = () => {
    if (!data.customDomain) return null;
    
    switch (domainStatus) {
      case 'valid':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'invalid':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Organization Name */}
      <div>
        <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center">
            <Building2 className="w-4 h-4 mr-2" />
            Organization Name *
          </div>
        </label>
        <input
          type="text"
          id="orgName"
          value={data.orgName}
          onChange={(e) => updateData({ orgName: e.target.value })}
          placeholder="Enter your organization name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
          maxLength={100}
          autoFocus
        />
        <p className="text-xs text-gray-500 mt-1">
          This will be displayed as your organization's name throughout the platform
        </p>
      </div>

      {/* Subdomain */}
      <div>
        <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            Subdomain *
          </div>
        </label>
        <div className="relative">
          <div className="flex">
            <input
              type="text"
              id="subdomain"
              value={data.subdomain}
              onChange={(e) => updateData({ subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              placeholder="yourorg"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              maxLength={63}
            />
            <div className="px-4 py-3 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-gray-600 flex items-center">
              .yourapp.com
            </div>
          </div>
          
          {/* Status indicator */}
          {data.subdomain && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 mr-24">
              {getSubdomainStatusIcon()}
            </div>
          )}
        </div>
        
        {/* Status message */}
        {data.subdomain && (
          <div className={`text-xs mt-1 flex items-center ${
            subdomainStatus === 'available' ? 'text-green-600' : 
            subdomainStatus === 'taken' || subdomainStatus === 'invalid' ? 'text-red-600' : 
            'text-blue-600'
          }`}>
            {getSubdomainStatusMessage()}
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-1">
          Your organization will be accessible at this subdomain. Use only lowercase letters, numbers, and hyphens.
        </p>
      </div>

      {/* Custom Domain (Optional) */}
      <div>
        <label htmlFor="customDomain" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            Custom Domain (Optional)
          </div>
        </label>
        <div className="relative">
          <input
            type="text"
            id="customDomain"
            value={data.customDomain}
            onChange={(e) => updateData({ customDomain: e.target.value.toLowerCase() })}
            placeholder="yourdomain.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
          />
          
          {/* Status indicator */}
          {data.customDomain && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getDomainStatusIcon()}
            </div>
          )}
        </div>
        
        {/* Status message */}
        {data.customDomain && domainStatus === 'invalid' && (
          <div className="text-xs mt-1 text-red-600">
            Please enter a valid domain name
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-1">
          Use your own domain instead of the subdomain. You'll need to configure DNS settings after setup.
        </p>
      </div>

      {/* Preview */}
      {data.orgName && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Preview</h3>
          <div className="space-y-1 text-sm text-blue-700">
            <p><strong>Organization:</strong> {data.orgName}</p>
            <p><strong>URL:</strong> {data.customDomain || `${data.subdomain || 'yourorg'}.yourapp.com`}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepOneOrgDetails;