import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Users, Target, UserCheck, Gift, Hash, Plus, Clock } from 'lucide-react';
import StepOne from './steps/StepOne';
import StepTwo from './steps/StepTwo';
import StepThree from './steps/StepThree';
import ProgressIndicator from './ProgressIndicator';
import { supabase } from '../lib/supabase';
import { OnboardingData, PendingInvite } from '../types';

interface OnboardingFlowProps {
  onComplete: () => void;
}

type ConnectionAction = 'link-user' | 'join-group' | 'create-group' | 'skip';

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
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
  const [connectionAction, setConnectionAction] = useState<ConnectionAction | ''>('');
  const [userInviteCode, setUserInviteCode] = useState('');
  const [groupInviteCode, setGroupInviteCode] = useState('');

  const totalSteps = 5; // Simplified to 5 steps

  const updateData = (updates: Partial<OnboardingData>) => {
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

  const checkUserInviteCode = async (inviteCode: string) => {
    if (!inviteCode.trim()) {
      setPendingInvite(null);
      return false;
    }

    try {
      console.log('🔍 Checking user invite code:', inviteCode.toUpperCase());
      
      const { data: invite, error } = await supabase
        .from('pending_invites')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .is('used_by_user_id', null)
        .maybeSingle();

      console.log('🔍 User invite query result:', { invite, error });

      if (error) {
        console.error('Error checking user invite code:', error);
        throw new Error('Failed to validate invite code');
      }

      if (invite) {
        setPendingInvite(invite);
        // Pre-fill form data if invite has info
        if (invite.invited_role && !data.user_role) {
          updateData({ user_role: invite.invited_role });
        }
        if (invite.invited_first_name && !data.first_name) {
          updateData({ first_name: invite.invited_first_name });
        }
        return true;
      } else {
        setPendingInvite(null);
        throw new Error('Invalid or expired user invite code');
      }
    } catch (err) {
      setPendingInvite(null);
      throw err;
    }
  };

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
      console.log('🚀 Starting onboarding completion with connection action:', connectionAction);

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
        user_role: data.user_role,
        fitness_enabled: data.fitness_enabled,
        linked_to_user_id: pendingInvite ? pendingInvite.inviter_user_id : null
      };

      console.log('👤 Creating user with data:', userData);

      // Insert user data
      const { error: userError } = await supabase
        .from('users')
        .insert(userData);

      if (userError) {
        throw new Error(`Failed to save user data: ${userError.message}`);
      }

      // Handle connection actions
      if (connectionAction === 'link-user' && pendingInvite) {
        console.log('🔗 Marking user invite as used');
        await markInviteAsUsed(pendingInvite, userId);
      } else if (connectionAction === 'create-group') {
        console.log('🏗️ Creating group');
        await handleCreateGroup(userId);
      } else if (connectionAction === 'join-group' && groupInviteCode) {
        console.log('🚪 Joining group');
        await handleJoinGroup(userId, groupInviteCode);
      }

      // Save data to localStorage for the dashboard
      localStorage.setItem('onboarding_data', JSON.stringify({
        ...data,
        user_id: userId
      }));

      setIsComplete(true);
      
      // Trigger the completion callback after a brief delay
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

  const markInviteAsUsed = async (invite: PendingInvite, userId: string) => {
    const { error } = await supabase
      .from('pending_invites')
      .update({
        used_by_user_id: userId,
        used_at: new Date().toISOString()
      })
      .eq('id', invite.id);

    if (error) {
      console.error('Failed to mark invite as used:', error);
      // Don't throw error here as user creation was successful
    }
  };

  const handleCreateGroup = async (userId: string) => {
    let inviteCode = generateInviteCode();
    let isUnique = false;
    
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

    updateData({ invite_code: inviteCode });
  };

  const handleJoinGroup = async (userId: string, inviteCode: string) => {
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', inviteCode.toUpperCase())
      .maybeSingle();

    if (groupError || !groupData) {
      throw new Error('Invalid group invite code. Please check and try again.');
    }

    const { data: existingMember } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupData.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMember) {
      throw new Error('You are already a member of this group.');
    }

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
      case 0: // Name
        return data.first_name.trim().length > 0;
      case 1: // Role
        return data.user_role !== '';
      case 2: // Fitness
        return true;
      case 3: // Connections
        if (connectionAction === '') return false;
        if (connectionAction === 'link-user') {
          return userInviteCode.trim().length > 0 && pendingInvite !== null;
        }
        if (connectionAction === 'join-group') {
          return groupInviteCode.trim().length === 6;
        }
        return true; // create-group and skip are always valid
      case 4: // Account
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
            {connectionAction === 'link-user' && pendingInvite && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-purple-900 font-medium">Connected via User Invite!</p>
                <p className="text-xs text-purple-600 mt-1">You've been linked to {pendingInvite.invited_role}</p>
              </div>
            )}
            {connectionAction === 'create-group' && data.invite_code && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-900 font-medium">Your Group Invite Code:</p>
                <p className="text-xl font-bold text-blue-700 tracking-wider">{data.invite_code}</p>
                <p className="text-xs text-blue-600 mt-1">Share this code with others to invite them</p>
              </div>
            )}
            {connectionAction === 'join-group' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-900 font-medium">Joined Group!</p>
                <p className="text-xs text-green-600 mt-1">You're now part of the community</p>
              </div>
            )}
          </div>
          
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

          {/* Step 0: Name */}
          {currentStep === 0 && (
            <StepOne 
              data={data} 
              updateData={updateData} 
            />
          )}

          {/* Step 1: Role */}
          {currentStep === 1 && (
            <StepTwo 
              data={data} 
              updateData={updateData} 
            />
          )}

          {/* Step 2: Fitness */}
          {currentStep === 2 && (
            <StepThree 
              data={data} 
              updateData={updateData} 
            />
          )}

          {/* Step 3: Connections */}
          {currentStep === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Connect with Others</h2>
              <p className="text-gray-600 mb-8 text-lg">How would you like to connect?</p>
              
              <div className="space-y-4 max-w-md mx-auto">
                {/* Link with Family/Mentor */}
                <div className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  connectionAction === 'link-user' 
                    ? 'bg-purple-50 border-purple-500 ring-4 ring-purple-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-purple-50 hover:border-purple-300'
                }`}
                onClick={() => setConnectionAction('link-user')}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Gift className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-gray-900">Link with Family/Mentor</h3>
                      <p className="text-sm text-gray-600">Someone invited you with an 8-character code</p>
                    </div>
                  </div>
                  
                  {connectionAction === 'link-user' && (
                    <div className="mt-4 space-y-3">
                      <input
                        type="text"
                        value={userInviteCode}
                        onChange={(e) => setUserInviteCode(e.target.value.toUpperCase())}
                        placeholder="Enter 8-character invite code"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center font-mono"
                        maxLength={8}
                      />
                      
                      {userInviteCode && (
                        <button
                          onClick={async () => {
                            try {
                              await checkUserInviteCode(userInviteCode);
                              setError(null);
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Invalid invite code');
                            }
                          }}
                          className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Validate Code
                        </button>
                      )}
                      
                      {pendingInvite && (
                        <div className="p-3 bg-purple-100 border border-purple-300 rounded-lg">
                          <div className="flex items-center justify-center mb-1">
                            <Check className="w-4 h-4 text-purple-600 mr-1" />
                            <span className="text-purple-900 font-medium text-sm">Valid Invite!</span>
                          </div>
                          <p className="text-xs text-purple-700">
                            You'll be linked to <strong>{pendingInvite.invited_role}</strong>
                            {pendingInvite.invited_first_name && ` (${pendingInvite.invited_first_name})`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Join Group */}
                <div className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  connectionAction === 'join-group' 
                    ? 'bg-green-50 border-green-500 ring-4 ring-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-green-50 hover:border-green-300'
                }`}
                onClick={() => setConnectionAction('join-group')}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Hash className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-gray-900">Join a Group</h3>
                      <p className="text-sm text-gray-600">Join an existing community group with 6-character code</p>
                    </div>
                  </div>
                  
                  {connectionAction === 'join-group' && (
                    <div className="mt-4">
                      <input
                        type="text"
                        value={groupInviteCode}
                        onChange={(e) => setGroupInviteCode(e.target.value.toUpperCase())}
                        placeholder="Enter 6-character group code"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center font-mono"
                        maxLength={6}
                      />
                    </div>
                  )}
                </div>

                {/* Create Group */}
                <div className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  connectionAction === 'create-group' 
                    ? 'bg-blue-50 border-blue-500 ring-4 ring-blue-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                }`}
                onClick={() => setConnectionAction('create-group')}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Plus className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-gray-900">Create a Group</h3>
                      <p className="text-sm text-gray-600">Start your own community group</p>
                    </div>
                  </div>
                </div>

                {/* Skip */}
                <div className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  connectionAction === 'skip' 
                    ? 'bg-gray-50 border-gray-500 ring-4 ring-gray-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                }`}
                onClick={() => setConnectionAction('skip')}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-gray-900">Skip for Now</h3>
                      <p className="text-sm text-gray-600">You can connect with others later</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Account */}
          {currentStep === 4 && (
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

          {/* Navigation */}
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