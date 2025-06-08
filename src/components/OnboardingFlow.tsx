import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Users, Target, UserCheck, Gift } from 'lucide-react';
import StepOne from './steps/StepOne';
import StepTwo from './steps/StepTwo';
import StepThree from './steps/StepThree';
import StepFour from './steps/StepFour';
import ProgressIndicator from './ProgressIndicator';
import { supabase } from '../lib/supabase';
import { OnboardingData, PendingInvite } from '../types';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0); // Start at step 0 for invite code
  const [data, setData] = useState<OnboardingData>({
    first_name: '',
    user_role: '',
    fitness_enabled: false,
    group_action: '',
    email: '',
    password: '',
    pending_invite_code: ''
  });
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);

const totalSteps = 5; // Invite + Name + Role + Fitness + Group
  
  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
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

  const checkInviteCode = async (inviteCode: string) => {
    if (!inviteCode.trim()) {
      setPendingInvite(null);
      return;
    }

    try {
      const { data: invite, error } = await supabase
        .from('pending_invites')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .is('used_by_user_id', null)
        .maybeSingle();

      if (error) {
        console.error('Error checking invite code:', error);
        throw new Error('Failed to validate invite code');
      }

      if (invite) {
        setPendingInvite(invite);
        // Pre-fill form data
        updateData({
          user_role: invite.invited_role,
          first_name: invite.invited_first_name || '',
          pending_invite_code: inviteCode.toUpperCase()
        });
        return true;
      } else {
        setPendingInvite(null);
        throw new Error('Invalid or expired invite code');
      }
    } catch (err) {
      setPendingInvite(null);
      throw err;
    }
  };

  // Generate a random 6-character invite code
  const generateInviteCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Sign up the user with email and password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: undefined // Disable email confirmation
        }
      });
      
      if (authError) {
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create user session');
      }

      const userId = authData.user.id;

      // Prepare user data for insertion
      const userData = {
        id: userId,
        first_name: data.first_name,
        user_role: data.user_role as 'Dad' | 'Mom' | 'Son' | 'Daughter' | 'Single Man' | 'Single Woman' | 'Church Leader' | 'Coach',
        fitness_enabled: data.fitness_enabled,
        linked_to_user_id: pendingInvite ? pendingInvite.inviter_user_id : null
      };

      // Insert user data
      const { error: userError } = await supabase
        .from('users')
        .insert(userData);

      if (userError) {
        throw new Error(`Failed to save user data: ${userError.message}`);
      }

      // If using a pending invite, mark it as used
      if (pendingInvite) {
        const { error: inviteError } = await supabase
          .from('pending_invites')
          .update({
            used_by_user_id: userId,
            used_at: new Date().toISOString()
          })
          .eq('id', pendingInvite.id);

        if (inviteError) {
          console.error('Failed to mark invite as used:', inviteError);
          // Don't throw error here as user creation was successful
        }
      }

      // Handle group actions (only if not using pending invite)
      if (!pendingInvite) {
        if (data.group_action === 'Create Group') {
          await handleCreateGroup(userId);
        } else if (data.group_action === 'Join with Code' && data.invite_code) {
          await handleJoinGroup(userId);
        }
      }

      // Save data to localStorage for the dashboard
      localStorage.setItem('onboarding_data', JSON.stringify({
        ...data,
        user_id: userId
      }));

      setIsComplete(true);
      
      // Trigger the completion callback after a brief delay to show the completion screen
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (userId: string) => {
    // Generate a unique invite code
    let inviteCode = generateInviteCode();
    let isUnique = false;
    
    // Ensure the invite code is unique
    while (!isUnique) {
      const { data: existingGroup } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', inviteCode)
        .maybeSingle();
      
      if (!existingGroup) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
      }
    }

    // Create the group with name = user's first name + "'s Group"
    const groupName = `${data.first_name}'s Group`;
    
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: groupName,
        invite_code: inviteCode,
        created_by_user_id: userId
      })
      .select()
      .single();

    if (groupError) {
      throw new Error(`Failed to create group: ${groupError.message}`);
    }

    // Add user as owner member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupData.id,
        user_id: userId,
        is_owner: true
      });

    if (memberError) {
      throw new Error(`Failed to add user to group: ${memberError.message}`);
    }

    // Store the invite code for display
    updateData({ invite_code: inviteCode });
  };

  const handleJoinGroup = async (userId: string) => {
    if (!data.invite_code) {
      throw new Error('Please enter an invite code');
    }

    // Find the group by invite code (case-insensitive)
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', data.invite_code.toUpperCase())
      .maybeSingle();

    if (groupError) {
      console.error("Supabase error:", groupError);
      throw new Error('Something went wrong. Please try again.');
    }

    if (!groupData) {
      throw new Error('Invalid invite code. Please check and try again.');
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupData.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMember) {
      throw new Error('You are already a member of this group.');
    }

    // Add user as member (not owner)
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupData.id,
        user_id: userId,
        is_owner: false
      });

    if (memberError) {
      throw new Error(`Failed to join group: ${memberError.message}`);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true; // Invite code is optional
      case 1:
        return data.first_name.trim().length > 0;
      case 2:
        return data.user_role !== '';
      case 3:
        return true; // Fitness toggle doesn't require validation
      case 4:
        if (pendingInvite) return true; // Skip group selection if using invite
        if (data.group_action === '') return false;
        if (data.group_action === 'Join with Code') {
          return data.invite_code && data.invite_code.trim().length === 6;
        }
        return true; // "Create Group" and "Not now" options
      case 5:
        return data.email.trim().length > 0 && 
               data.email.includes('@') && 
               data.password.length >= 6;
      default:
        return false;
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome, {data.first_name}!</h2>
          <p className="text-gray-600 mb-6">Your profile has been created successfully. Redirecting to your dashboard...</p>
          <div className="space-y-2 text-sm text-gray-500">
            <p><strong>Role:</strong> {data.user_role}</p>
            <p><strong>Fitness:</strong> {data.fitness_enabled ? 'Enabled' : 'Disabled'}</p>
            {pendingInvite ? (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-purple-900 font-medium">Connected via Invite!</p>
                <p className="text-xs text-purple-600 mt-1">You've been linked to your inviter</p>
              </div>
            ) : (
              <>
                <p><strong>Group:</strong> {data.group_action}</p>
                {data.group_action === 'Create Group' && data.invite_code && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-900 font-medium">Your Group Invite Code:</p>
                    <p className="text-xl font-bold text-blue-700 tracking-wider">{data.invite_code}</p>
                    <p className="text-xs text-blue-600 mt-1">Share this code with others to invite them</p>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Loading animation */}
          <div className="mt-6">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <ProgressIndicator currentStep={currentStep + 1} totalSteps={totalSteps} />
        
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-8 transition-all duration-300">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {currentStep === 0 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Have an Invite Code?</h2>
              <p className="text-gray-600 mb-8">If someone invited you to join, enter their invite code below</p>
              
              <div className="max-w-sm mx-auto space-y-4">
                <div>
                  <input
                    type="text"
                    value={data.pending_invite_code || ''}
                    onChange={(e) => updateData({ pending_invite_code: e.target.value.toUpperCase() })}
                    placeholder="Enter invite code (optional)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-lg text-center font-mono tracking-wider uppercase"
                    maxLength={8}
                  />
                </div>
                
                {data.pending_invite_code && (
                  <button
                    onClick={async () => {
                      try {
                        setError(null);
                        await checkInviteCode(data.pending_invite_code || '');
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Invalid invite code');
                      }
                    }}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Validate Code
                  </button>
                )}

                {pendingInvite && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Check className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="text-purple-900 font-medium">Valid Invite!</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      You've been invited as a <strong>{pendingInvite.invited_role}</strong>
                      {pendingInvite.invited_first_name && (
                        <span> with the name <strong>{pendingInvite.invited_first_name}</strong></span>
                      )}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  Don't have an invite code? No problem! You can continue without one.
                </p>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <StepOne 
              data={data} 
              updateData={updateData} 
            />
          )}
          {currentStep === 2 && (
            <StepTwo 
              data={data} 
              updateData={updateData} 
            />
          )}
          {currentStep === 3 && (
            <StepThree 
              data={data} 
              updateData={updateData} 
            />
          )}
          {currentStep === 4 && !pendingInvite && (
            <StepFour 
              data={data} 
              updateData={updateData} 
            />
          )}
          {(currentStep === 4 && pendingInvite) || currentStep === 5 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserCheck className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
              <p className="text-gray-600 mb-8">Set up your login credentials to secure your profile</p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={data.email}
                    onChange={(e) => updateData({ email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={data.password}
                    onChange={(e) => updateData({ password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Create a password (min. 6 characters)"
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1 text-left">Password must be at least 6 characters long</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentStep === 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </button>

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
                  Saving...
                </>
              ) : (
                <>
                  {currentStep === totalSteps - 1 ? 'Complete' : 'Continue'}
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

export default OnboardingFlow;