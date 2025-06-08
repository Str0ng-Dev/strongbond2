import React, { useState, useEffect } from 'react';
import { Users, Plus, Hash, LogOut, Crown, Calendar, Copy, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { User, GroupWithMembers } from '../../types';
import { supabase } from '../../lib/supabase';
import JoinGroup from '../JoinGroup';

interface MyGroupsProps {
  currentUser: User | null;
  onGroupUpdate: () => void;
}

const MyGroups: React.FC<MyGroupsProps> = ({ currentUser, onGroupUpdate }) => {
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJoinPage, setShowJoinPage] = useState(false);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentUser) {
      loadGroupsData();
    }
  }, [currentUser]);

  const loadGroupsData = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Get group IDs the user is a member of
      const { data: membershipData, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id, is_owner, joined_at')
        .eq('user_id', currentUser.id);

      if (membershipError) {
        console.error('Error loading user memberships:', membershipError);
        setError('Failed to load group memberships');
        return;
      }

      if (!membershipData || membershipData.length === 0) {
        setGroups([]);
        return;
      }

      // Step 2: Get group details for those group IDs
      const groupIds = membershipData.map(m => m.group_id);
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, name, invite_code, created_by_user_id, created_at, updated_at')
        .in('id', groupIds);

      if (groupsError) {
        console.error('Error loading groups data:', groupsError);
        setError('Failed to load groups information');
        return;
      }

      // Step 3: For each group, get all members with their user details
      const groupsWithMembers: GroupWithMembers[] = [];
      
      for (const group of groupsData || []) {
        const { data: members, error: membersError } = await supabase
          .from('group_members')
          .select('user_id, is_owner, joined_at')
          .eq('group_id', group.id);

        if (membersError) {
          console.error('Error loading group members:', membersError);
          continue;
        }

        // Step 4: Get user details for each member
        const membersWithUserData = [];
        for (const member of members || []) {
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
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
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

      // Generate a unique invite code
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

      // Create the group with the custom name
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

      // Add user as owner member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: currentUser.id,
          is_owner: true
        });

      if (memberError) throw memberError;

      // Reset form and refresh data
      setNewGroupName('');
      setShowCreateGroupForm(false);
      loadGroupsData();
      onGroupUpdate();

    } catch (err) {
      console.error('Error creating group:', err);
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSuccess = () => {
    setShowJoinPage(false);
    loadGroupsData();
    onGroupUpdate();
  };

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!currentUser) return;

    const confirmLeave = window.confirm(`Are you sure you want to leave "${groupName}"?`);
    if (!confirmLeave) return;

    try {
      setIsLoading(true);
      setError(null);

      // Remove user from group_members
      const { error: memberError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id);

      if (memberError) throw memberError;

      // Refresh the groups data
      loadGroupsData();
      onGroupUpdate();

    } catch (err) {
      console.error('Error leaving group:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave group');
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteCode = async (inviteCode: string) => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopiedCode(inviteCode);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy invite code:', err);
    }
  };

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const isUserOwner = (group: GroupWithMembers) => {
    return group.group_members?.find(
      member => member.user_id === currentUser?.id
    )?.is_owner || false;
  };

  const handleCancelCreateGroup = () => {
    setShowCreateGroupForm(false);
    setNewGroupName('');
    setError(null);
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

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Groups</h2>
        <Users className="w-6 h-6 text-blue-600" />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Create Group Form */}
      {showCreateGroupForm ? (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Create New Group</h3>
            <button
              onClick={handleCancelCreateGroup}
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="groupName" className="block text-sm font-medium text-blue-900 mb-2">
                Group Name
              </label>
              <input
                type="text"
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                maxLength={50}
                autoFocus
              />
              <p className="text-xs text-blue-700 mt-1">
                Choose a descriptive name for your group (max 50 characters)
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || isLoading}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  newGroupName.trim() && !isLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group
                  </>
                )}
              </button>
              
              <button
                onClick={handleCancelCreateGroup}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Action Buttons */
        <div className="mb-6 space-y-3">
          <button
            onClick={() => setShowJoinPage(true)}
            className="w-full flex items-center justify-center px-4 py-3 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
          >
            <Hash className="w-4 h-4 mr-2" />
            Join Group with Code
          </button>
          
          <button
            onClick={() => setShowCreateGroupForm(true)}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Group
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : groups.length > 0 ? (
        // User has groups
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Your Groups ({groups.length})
          </h3>
          
          {groups.map((group) => {
            const isOwner = isUserOwner(group);
            const isExpanded = expandedGroups.has(group.id);
            
            return (
              <div key={group.id} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Group Header */}
                <div className="bg-blue-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-semibold text-gray-900">{group.name}</h4>
                      {isOwner && (
                        <span className="flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          <Crown className="w-3 h-3 mr-1" />
                          Owner
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => toggleGroupExpansion(group.id)}
                      className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Code:</span>
                      <code className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">
                        {group.invite_code}
                      </code>
                      <button
                        onClick={() => copyInviteCode(group.invite_code)}
                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Copy invite code"
                      >
                        {copiedCode === group.invite_code ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Members Section */}
                {isExpanded && (
                  <div className="p-4 bg-white">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Members ({group.group_members?.length || 0})
                    </h5>
                    <div className="space-y-2 mb-4">
                      {group.group_members?.map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {member.users.first_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{member.users.first_name}</p>
                              <p className="text-sm text-gray-600">{member.users.user_role}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {member.is_owner && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                Owner
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Leave Group Button */}
                    <button
                      onClick={() => handleLeaveGroup(group.id, group.name)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Leave Group
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // User doesn't have any groups
        <div className="text-center py-8">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            You're not part of any groups yet.
          </p>
          <p className="text-sm text-gray-500">
            Use the buttons above to join or create your first group!
          </p>
        </div>
      )}
    </div>
  );
};

export default MyGroups;