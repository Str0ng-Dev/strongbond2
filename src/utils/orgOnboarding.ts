import { supabase } from '../lib/supabase';

export interface OrgOnboardingData {
  orgName: string;
  subdomain: string;
  customDomain?: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  planTier: 'free' | 'pro' | 'enterprise';
}

export interface OrganizationResult {
  organization: {
    id: string;
    name: string;
    subdomain: string;
    custom_domain?: string;
    plan_tier: string;
  };
  adminUser: {
    id: string;
    email: string;
  };
}

// Check if subdomain is available
export const checkSubdomainAvailability = async (subdomain: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('subdomain', subdomain.toLowerCase())
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check subdomain availability: ${error.message}`);
    }

    return !data; // Returns true if subdomain is available (no existing record)
  } catch (err) {
    console.error('Error checking subdomain availability:', err);
    throw err;
  }
};

// Check if custom domain is available
export const checkCustomDomainAvailability = async (domain: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('custom_domain', domain.toLowerCase())
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check domain availability: ${error.message}`);
    }

    return !data; // Returns true if domain is available
  } catch (err) {
    console.error('Error checking domain availability:', err);
    throw err;
  }
};

// Validate subdomain format
export const validateSubdomain = (subdomain: string): { isValid: boolean; error?: string } => {
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  
  if (!subdomain) {
    return { isValid: false, error: 'Subdomain is required' };
  }
  
  if (subdomain.length < 3) {
    return { isValid: false, error: 'Subdomain must be at least 3 characters long' };
  }
  
  if (subdomain.length > 63) {
    return { isValid: false, error: 'Subdomain must be less than 63 characters long' };
  }
  
  if (!subdomainRegex.test(subdomain)) {
    return { isValid: false, error: 'Subdomain can only contain lowercase letters, numbers, and hyphens' };
  }
  
  // Reserved subdomains
  const reserved = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'support', 'help'];
  if (reserved.includes(subdomain.toLowerCase())) {
    return { isValid: false, error: 'This subdomain is reserved' };
  }
  
  return { isValid: true };
};

// Validate custom domain format
export const validateCustomDomain = (domain: string): { isValid: boolean; error?: string } => {
  if (!domain) {
    return { isValid: true }; // Custom domain is optional
  }
  
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
  
  if (!domainRegex.test(domain)) {
    return { isValid: false, error: 'Please enter a valid domain name' };
  }
  
  return { isValid: true };
};

// Create organization and admin user
export const createOrganization = async (data: OrgOnboardingData): Promise<OrganizationResult> => {
  try {
    // Step 1: Create the admin user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.adminEmail,
      password: data.adminPassword,
      options: {
        emailRedirectTo: undefined // Disable email confirmation for now
      }
    });

    if (authError) {
      throw new Error(`Failed to create admin account: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Failed to create admin user session');
    }

    const adminUserId = authData.user.id;

    // Step 2: Create the organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: data.orgName,
        subdomain: data.subdomain.toLowerCase(),
        custom_domain: data.customDomain?.toLowerCase() || null,
        admin_user_id: adminUserId,
        plan_tier: data.planTier,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orgError) {
      // If org creation fails, we should clean up the auth user
      // Note: In production, you might want to handle this more gracefully
      console.error('Organization creation failed, auth user may need cleanup:', orgError);
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    // Step 3: Create the admin user profile
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: adminUserId,
        first_name: data.adminFirstName,
        user_role: 'Church Leader', // Default role for org admins
        fitness_enabled: false,
        org_id: orgData.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (userError) {
      console.error('User profile creation failed:', userError);
      throw new Error(`Failed to create admin user profile: ${userError.message}`);
    }

    return {
      organization: {
        id: orgData.id,
        name: orgData.name,
        subdomain: orgData.subdomain,
        custom_domain: orgData.custom_domain,
        plan_tier: orgData.plan_tier
      },
      adminUser: {
        id: adminUserId,
        email: data.adminEmail
      }
    };

  } catch (err) {
    console.error('Error creating organization:', err);
    throw err;
  }
};

// Get plan features and pricing
export const getPlanFeatures = () => {
  return {
    free: {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        'Up to 50 users',
        'Basic devotional content',
        'Community features',
        'Email support'
      ],
      limitations: [
        'Limited customization',
        'Basic analytics',
        'Standard support'
      ]
    },
    pro: {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      features: [
        'Up to 500 users',
        'Premium devotional content',
        'Advanced group features',
        'Custom branding',
        'Analytics dashboard',
        'Priority support'
      ],
      limitations: [
        'Advanced integrations available in Enterprise'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: 'Custom',
      period: 'pricing',
      features: [
        'Unlimited users',
        'All premium content',
        'Full customization',
        'Advanced analytics',
        'API access',
        'Custom integrations',
        'Dedicated support',
        'Custom domain included'
      ],
      limitations: []
    }
  };
};