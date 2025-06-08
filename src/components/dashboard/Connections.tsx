import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Plus, 
  Hash, 
  Copy, 
  Check, 
  Calendar, 
  Crown, 
  LogOut,
  X,
  Mail,
  AlertCircle,
  Heart,
  Link,
  Send,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { User, GroupWithMembers } from '../../types';
import JoinGroup from '../JoinGroup';

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

interface ConnectionsProps {
  currentUser: User | null;
  onUpdate?: () => void;
}

const Connections: React.FC<ConnectionsProps> = ({ currentUser, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'groups' | 'linked'>('groups');
  
  // Groups state
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [showJoinPage, setShowJoinPage] = useState(false);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  // Linked accounts state
  const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [newInvite, setNewInvite] = useState({
    role: '',
    firstName: '',
    email: ''
  });
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  
  // Shared state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadGroupsData();
      loadLinkedUsers();
    }
  }, [currentUser]);

  const loadGroupsData = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setError(null);

      // First, get user's group memberships with explicit column selection to avoid recursion
      const { data: membershipData, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id, is_owner, joined_at')
        .eq('user_id', currentUser.id);

      if (membershipError) {
        console.error('Error loading user memberships:', membershipError);
        setError(`Failed to load group memberships: ${membershipError.message}`);
        return;
      }

      if (!membershipData || membershipData.length === 0) {
        setGroups([]);
        return;
      }

      const groupIds = membershipData.map(m => m.group_id);
      
      // Get groups data separately to avoid any potential recursion
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, name, invite_code, created_by_user_id, created_at, updated_at')
        .in('id', groupIds);

      if (groupsError) {
        console.error('Error loading groups data:', groupsError);
        setError(`Failed to load groups: ${groupsError.message}`);
        return;
      }

      const groupsWithMembers: GroupWithMembers[] = [];
      
      // For each group, get all members separately
      for (const group of groupsData || []) {
        // Get all members for this specific group
        const { data: allMembers, error: membersError } = await supabase
          .from('group_members')
          .select('user_id, is_owner, joined_at')
          .eq('group_id', group.id);

        if (membersError) {
          console.error('Error loading group members:', membersError);
          continue;
        }

        const membersWithUserData = [];
        
        // Get user data for each member
        for (const member of allMembers || []) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('first_name, user_role')
            .eq('id', member.user_id)
            .single();

          if (userError) {
            console.error('Error loading user data:', userError);
            continue;
          }

          membersWithUserData.push({
            ...member,
            users: userData
          });
        }

        groupsWithMembers.push({
          ...group,
          group_members: membersWithUserData
        });
      }

      setGroups(groupsWithMembers);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLinkedUsers = async () => {
    if (!currentUser) return;

    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, user_role, fitness_enabled, created_at, updated_at, linked_to_user_id')
        .eq('linked_to_user_id', currentUser.id);

      if (usersError) {
        throw new Error(`Failed to load linked users: ${usersError.message}`);
      }

      const usersWithPlans: LinkedUser[] = [];
      
      for (const user of users || []) {
        let userWithPlan: LinkedUser = { ...user };

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

  const handleCreateGroup = async () => {
    if (!currentUser || !newGroupName.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      let newInviteCode = generateInviteCode();
      let isUnique = false;
      
      while (!isUnique) {
        const { data: existingGroup } = await supabase
          .from('groups')
          .select('id')
          .eq('invite_code', newInviteCode)
          .maybeSingle();
        
        if (!existingGroup) {
          isUnique = true;
        } else {
          newInviteCode = generateInviteCode();
        }
      }

      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: newGroupName.trim(),
          invite_code: newInviteCode,
          created_by_user_id: currentUser.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: currentUser.id,
          is_owner: true
        });

      if (memberError) throw memberError;

      setNewGroupName('');
      setShowCreateGroupForm(false);
      loadGroupsData();
      if (onUpdate) onUpdate();

    } catch (err) {
      console.error('Error creating group:', err);
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const createInvite = async () => {
    if (!newInvite.role || !currentUser) {
      setError('Please select a role for the invite');
      return;
    }

    try {
      setIsCreatingInvite(true);
      setError(null);

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

      setCreatedInviteCode(data.invite_code);
      await copyToClipboard(data.invite_code);

    } catch (err) {
      console.error('Error creating invite:', err);
      setError(err instanceof Error ? err.message : 'Failed to create invite');
    } finally {
      setIsCreatingInvite(false);
    }
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

  const handleJoinSuccess = () => {
    setShowJoinPage(false);
    loadGroupsData();
    if (onUpdate) onUpdate();
  };

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!currentUser) return;

    const confirmLeave = window.confirm(`Are you sure you want to leave "${groupName}"?`);
    if (!confirmLeave) return;

    try {
      setIsLoading(true);
      setError(null);

      const { error: memberError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id);

      if (memberError) throw memberError;

      loadGroupsData();
      if (onUpdate) onUpdate();

    } catch (err) {
      console.error('Error leaving group:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave group');
    } finally {
      setIsLoading(false);
    }
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

  const userRoles = [
    'Dad', 'Mom', 'Son', 'Daughter', 
    'Single Man', 'Single Woman', 'Church Leader', 'Coach'
  ];

  const isUserOwner = (group: GroupWithMembers) => {
    return group.group_members?.find(
      member => member.user_id === currentUser?.id
    )?.is_owner || false;
  };

  // Show Join Group page if requested
  if (showJoinPage && currentUser) {
    return (
      <JoinGroup
        currentUserId={currentUser.id}
        onSuccess={handleJoinSuccess}
        onBack={() => setShowJoinPage(false)}
      />
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

          <div className="space-y-3">
            <button
              onClick={() => {
                setCreatedInviteCode(null);
                setNewInvite({ role: '', firstName: '', email: '' });
                setShowCreateInvite(false);
                setError(null);
              }}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ width: '300px' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Connections</h2>
            <p className="text-xs text-gray-600">Groups & linked accounts</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'groups'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          🔹 My Groups
        </button>
        <button
          onClick={() => setActiveTab('linked')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'linked'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          🔸 Linked Accounts
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-xs">{error}</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="h-80 overflow-y-auto bg-gray-50">
        {activeTab === 'groups' ? (
          <div className="p-4 space-y-3">
            {/* Create Group Form */}
            {showCreateGroupForm ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-blue-900">Create New Group</h3>
                  <button
                    onClick={() => {
                      setShowCreateGroupForm(false);
                      setNewGroupName('');
                      setError(null);
                    }}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    maxLength={50}
                    autoFocus
                  />
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCreateGroup}
                      disabled={!newGroupName.trim() || isLoading}
                      className={`flex-1 px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                        newGroupName.trim() && !isLoading
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? 'Creating...' : 'Create'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowCreateGroupForm(false);
                        setNewGroupName('');
                      }}
                      disabled={isLoading}
                      className="px-3 py-2 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Action Buttons */
              <div className="space-y-2">
                <button
                  onClick={() => setShowJoinPage(true)}
                  className="w-full flex items-center justify-center px-3 py-2 text-sm border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <Hash className="w-4 h-4 mr-2" />
                  Join with Code
                </button>
                
                <button
                  onClick={() => setShowCreateGroupForm(true)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </button>
              </div>
            )}

            {/* Groups List */}
            {groups.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-gray-700 mb-2">
                  Your Groups ({groups.length})
                </h3>
                
                {groups.map((group) => {
                  const isOwner = isUserOwner(group);
                  
                  return (
                    <div key={group.id} className="bg-white rounded-lg border border-gray-200 p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{group.name}</h4>
                            <p className="text-xs text-gray-500">
                              {group.group_members?.length || 0} members
                            </p>
                          </div>
                        </div>
                        {isOwner && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            <Crown className="w-3 h-3 inline mr-1" />
                            Owner
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{new Date(group.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                            {group.invite_code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(group.invite_code)}
                            className="p-1 text-gray-500 hover:text-purple-600 transition-colors"
                            title="Copy invite code"
                          >
                            {copiedCode === group.invite_code ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleLeaveGroup(group.id, group.name)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center px-2 py-1 text-xs border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <LogOut className="w-3 h-3 mr-1" />
                        Leave Group
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-xs text-gray-600 mb-2">No groups yet</p>
                <p className="text-xs text-gray-500">
                  Join or create your first group!
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Linked Accounts Tab */
          <div className="p-4 space-y-3">
            {/* Create Invite Form */}
            {showCreateInvite ? (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-purple-900">Create Invite</h3>
                  <button
                    onClick={() => {
                      setShowCreateInvite(false);
                      setNewInvite({ role: '', firstName: '', email: '' });
                      setError(null);
                    }}
                    className="p-1 text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <select
                    value={newInvite.role}
                    onChange={(e) => setNewInvite(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Select role</option>
                    {userRoles.map(role => (
                      <option key={role} value={role}>
                        {getRoleIcon(role)} {role}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={newInvite.firstName}
                    onChange={(e) => setNewInvite(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="First name (optional)"
                    className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={createInvite}
                      disabled={!newInvite.role || isCreatingInvite}
                      className={`flex-1 px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                        newInvite.role && !isCreatingInvite
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isCreatingInvite ? 'Creating...' : 'Create Invite'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowCreateInvite(false);
                        setNewInvite({ role: '', firstName: '', email: '' });
                      }}
                      className="px-3 py-2 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Create Invite Button */
              <button
                onClick={() => setShowCreateInvite(true)}
                className="w-full flex items-center justify-center px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create Invite
              </button>
            )}

            {/* Linked Users List */}
            {linkedUsers.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-gray-700 mb-2">
                  Connected Users ({linkedUsers.length})
                </h3>
                
                {linkedUsers.map((user) => (
                  <div key={user.id} className="bg-white rounded-lg border border-gray-200 p-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">{getRoleIcon(user.user_role)}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">{user.first_name}</h4>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {user.user_role}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-600 mb-2">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </div>

                        {user.current_plan ? (
                          <div className="text-xs text-blue-600">
                            📖 {user.current_plan.title} - Day {user.current_plan.current_day}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            No active plan
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Link className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-xs text-gray-600 mb-2">No linked accounts yet</p>
                <p className="text-xs text-gray-500">
                  Invite a family member or mentee
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State for Both Tabs */}
        {groups.length === 0 && linkedUsers.length === 0 && !showCreateGroupForm && !showCreateInvite && (
          <div className="p-4 text-center">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 mb-2">
              Create your first group or invite a companion to grow together
            </p>
            <p className="text-xs text-gray-500">
              Build meaningful connections on your spiritual journey
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;