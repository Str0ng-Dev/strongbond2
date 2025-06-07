import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Play, 
  CheckCircle, 
  Clock,
  Send,
  Copy,
  Check,
  UserPlus,
  AlertCircle,
  ExternalLink,
  X,
  Mail,
  Hash
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { User } from '../../types';

interface LinkedUser extends User {
  current_plan?: {
    id: string;
    title: string;
    current_day: number;
    duration_days: number;
    is_active: boolean;
    completed_at: string | null;
  };
}

interface MyLinkedAccountsProps {
  currentUser: User;
}

const MyLinkedAccounts: React.FC<MyLinkedAccountsProps> = ({ currentUser }) => {
  const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [newInvite, setNewInvite] = useState({
    role: '',
    firstName: '',
    email: ''
  });
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);

  useEffect(() => {
    loadLinkedUsers();
  }, [currentUser.id]);

  const loadLinkedUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get users linked to current user
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, user_role, fitness_enabled, created_at, updated_at, linked_to_user_id')
        .eq('linked_to_user_id', currentUser.id);

      if (usersError) {
        throw new Error(`Failed to load linked users: ${usersError.message}`);
      }

      // For each linked user, get their current devotional plan
      const usersWithPlans: LinkedUser[] = [];
      
      for (const user of users || []) {
        let userWithPlan: LinkedUser = { ...user };

        // Get their active devotional plan
        const { data: planData, error: planError } = await supabase
          .from('user_devotional_plan')
          .select(`
            id,
            current_day,
            is_active,
            completed_at,
            fk_user_devotional_plan_devotional:devotional_marketplace!fk_user_devotional_plan_devotional (
              id,
              title,
              duration_days
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!planError && planData) {
          userWithPlan.current_plan = {
            id: planData.id,
            title: planData.fk_user_devotional_plan_devotional.title,
            current_day: planData.current_day,
            duration_days: planData.fk_user_devotional_plan_devotional.duration_days,
            is_active: planData.is_active,
            completed_at: planData.completed_at
          };
        }

        usersWithPlans.push(userWithPlan);
      }

      setLinkedUsers(usersWithPlans);
    } catch (err) {
      console.error('Error loading linked users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load linked accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const createInvite = async () => {
    if (!newInvite.role) {
      setError('Please select a role for the invite');
      return;
    }

    try {
      setIsCreatingInvite(true);
      setError(null);

      // If email is provided, we could send an email invite (future feature)
      // For now, we'll just create the pending invite
      const { data, error } = await supabase
        .from('pending_invites')
        .insert({
          inviter_user_id: currentUser.id,
          invited_role: newInvite.role,
          invited_first_name: newInvite.firstName || null
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create invite: ${error.message}`);
      }

      // Set the created invite code to show success modal
      setCreatedInviteCode(data.invite_code);

      // Copy invite code to clipboard
      await copyToClipboard(data.invite_code);

    } catch (err) {
      console.error('Error creating invite:', err);
      setError(err instanceof Error ? err.message : 'Failed to create invite');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleCloseInviteSuccess = () => {
    setCreatedInviteCode(null);
    setNewInvite({ role: '', firstName: '', email: '' });
    setShowCreateInvite(false);
    setError(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getProgressInfo = (user: LinkedUser) => {
    if (!user.current_plan) {
      return {
        status: 'No Active Plan',
        icon: Clock,
        color: 'text-gray-600 bg-gray-50',
        progress: 0
      };
    }

    if (user.current_plan.completed_at) {
      return {
        status: 'Completed',
        icon: CheckCircle,
        color: 'text-green-600 bg-green-50',
        progress: 100
      };
    }

    const progress = (user.current_plan.current_day / user.current_plan.duration_days) * 100;
    return {
      status: `Day ${user.current_plan.current_day} of ${user.current_plan.duration_days}`,
      icon: Play,
      color: 'text-blue-600 bg-blue-50',
      progress: Math.min(progress, 100)
    };
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Dad': return '👨';
      case 'Mom': return '👩';
      case 'Son': return '👦';
      case 'Daughter': return '👧';
      case 'Single Man': return '🧑';
      case 'Single Woman': return '👩';
      case 'Church Leader': return '⛪';
      case 'Coach': return '🏃‍♂️';
      default: return '👤';
    }
  };

  const getRoleRelationship = (role: string) => {
    switch (role) {
      case 'Son': return 'son';
      case 'Daughter': return 'daughter';
      case 'Dad': return 'husband';
      case 'Mom': return 'wife';
      case 'Single Man': return 'friend';
      case 'Single Woman': return 'friend';
      case 'Church Leader': return 'church leader';
      case 'Coach': return 'athlete';
      default: return 'person';
    }
  };

  const userRoles = [
    'Dad', 'Mom', 'Son', 'Daughter', 
    'Single Man', 'Single Woman', 'Church Leader', 'Coach'
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  // Success Modal for Created Invite
  if (createdInviteCode) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invite Created Successfully!</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center mb-4">
              <Hash className="w-6 h-6 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">Your Invite Code</span>
            </div>
            
            <div className="bg-white border border-blue-300 rounded-lg p-4 mb-4">
              <code className="text-2xl font-bold text-blue-700 tracking-wider">
                {createdInviteCode}
              </code>
            </div>
            
            <button
              onClick={() => copyToClipboard(createdInviteCode)}
              className="flex items-center justify-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copiedCode === createdInviteCode ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </>
              )}
            </button>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-purple-900 mb-2">Share this message:</h3>
            <p className="text-sm text-purple-800 italic">
              "Share this code with your {getRoleRelationship(newInvite.role)} so they can create their own login and be linked to you."
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-gray-600 text-sm">
              {newInvite.email ? (
                <>
                  An email invitation will be sent to <strong>{newInvite.email}</strong> with this code.
                </>
              ) : (
                <>
                  Share this code with your {getRoleRelationship(newInvite.role)} so they can create their account and be linked to you.
                </>
              )}
            </p>
            
            <div className="flex justify-center space-x-3">
              <button
                onClick={handleCloseInviteSuccess}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Done
              </button>
              
              <button
                onClick={() => {
                  setCreatedInviteCode(null);
                  setNewInvite({ role: '', firstName: '', email: '' });
                  // Keep the create invite modal open for creating another
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Linked Accounts</h2>
            <p className="text-gray-600">People connected to your account</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateInvite(!showCreateInvite)}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Create Invite
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Enhanced Create Invite Form */}
      {showCreateInvite && (
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-purple-900">Create New Invite</h3>
                <p className="text-sm text-purple-700">Invite someone to join and link to your account</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowCreateInvite(false);
                setNewInvite({ role: '', firstName: '', email: '' });
                setError(null);
              }}
              className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Role Selection */}
            <div>
              <label htmlFor="inviteRole" className="block text-sm font-medium text-purple-900 mb-2">
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Role *
                </span>
              </label>
              <select
                id="inviteRole"
                value={newInvite.role}
                onChange={(e) => setNewInvite(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                required
              >
                <option value="">Select a role</option>
                {userRoles.map(role => (
                  <option key={role} value={role}>
                    {getRoleIcon(role)} {role}
                  </option>
                ))}
              </select>
              <p className="text-xs text-purple-600 mt-1">
                Choose the role that best describes the person you're inviting
              </p>
            </div>

            {/* First Name */}
            <div>
              <label htmlFor="inviteFirstName" className="block text-sm font-medium text-purple-900 mb-2">
                <span className="flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  First Name (Optional)
                </span>
              </label>
              <input
                type="text"
                id="inviteFirstName"
                value={newInvite.firstName}
                onChange={(e) => setNewInvite(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Pre-fill their name"
                className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-purple-600 mt-1">
                If provided, their name will be pre-filled during signup
              </p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="inviteEmail" className="block text-sm font-medium text-purple-900 mb-2">
                <span className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email (Optional)
                </span>
              </label>
              <input
                type="email"
                id="inviteEmail"
                value={newInvite.email}
                onChange={(e) => setNewInvite(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Send invite directly to their email"
                className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-purple-600 mt-1">
                {newInvite.email 
                  ? "An email invitation will be sent with the invite code" 
                  : "Leave empty to generate a code you can share manually"
                }
              </p>
            </div>

            {/* Preview Message */}
            {newInvite.role && (
              <div className="bg-white border border-purple-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-purple-900 mb-2">Preview Message:</h4>
                <p className="text-sm text-gray-700 italic">
                  "Share this code with your {getRoleRelationship(newInvite.role)} so they can create their own login and be linked to you."
                </p>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              onClick={createInvite}
              disabled={!newInvite.role || isCreatingInvite}
              className={`flex-1 flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                newInvite.role && !isCreatingInvite
                  ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isCreatingInvite ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Invite...
                </>
              ) : (
                <>
                  <Hash className="w-5 h-5 mr-2" />
                  {newInvite.email ? 'Create & Send Invite' : 'Generate Invite Code'}
                </>
              )}
            </button>
            
            <button
              onClick={() => {
                setShowCreateInvite(false);
                setNewInvite({ role: '', firstName: '', email: '' });
                setError(null);
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Linked Users List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Connected Users ({linkedUsers.length})
        </h3>
        
        {linkedUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Linked Accounts</h4>
            <p className="text-gray-600 mb-4">
              Create an invite code to connect with family members, students, or mentees.
            </p>
            {!showCreateInvite && (
              <button
                onClick={() => setShowCreateInvite(true)}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create First Invite
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {linkedUsers.map((user) => {
              const progressInfo = getProgressInfo(user);
              const ProgressIcon = progressInfo.icon;
              
              return (
                <div key={user.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* User Avatar */}
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">{getRoleIcon(user.user_role)}</span>
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{user.first_name}</h4>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {user.user_role}
                          </span>
                          {user.fitness_enabled && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Fitness
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>

                        {/* Progress Section */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <ProgressIcon className={`w-4 h-4 ${progressInfo.color.split(' ')[0]}`} />
                              <span className="text-sm font-medium text-gray-700">
                                {user.current_plan ? user.current_plan.title : 'No Active Plan'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">{progressInfo.status}</span>
                          </div>
                          
                          {user.current_plan && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  user.current_plan.completed_at 
                                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                                }`}
                                style={{ width: `${progressInfo.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Log in as this user"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Log in as {user.first_name}
                      </button>
                      
                      <button
                        className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        title="Send reminder"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Send Reminder
                      </button>
                      
                      <button
                        onClick={() => copyToClipboard(`Join me on our devotional app! Use invite code: [Create new invite for ${user.first_name}]`)}
                        className="flex items-center px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                        title="Copy invite link"
                      >
                        {copiedCode ? (
                          <Check className="w-3 h-3 mr-1 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3 mr-1" />
                        )}
                        Copy Invite Link
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">How Linked Accounts Work</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Create invite codes for family members, students, or mentees</li>
          <li>• Track their devotional progress and spiritual growth</li>
          <li>• Send encouragement and reminders when needed</li>
          <li>• View their shared journal reflections and insights</li>
        </ul>
      </div>
    </div>
  );
};

export default MyLinkedAccounts;