import React, { useState, useEffect } from 'react';
import { Users, Plus, Hash, LogOut, Crown, Calendar, Copy, Check } from 'lucide-react';
import { User } from '../../types';
import { supabase } from '../../lib/supabase';
import JoinGroup from '../JoinGroup';

interface GroupMember {
  user_id: string;
  is_owner: boolean;
  joined_at: string;
  users: {
    first_name: string;
    user_role: string;
  };
}

interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  group_members: GroupMember[];
}

interface MyGroupProps {
  currentUser: User | null;
  onGroupUpdate: () => void;
}

const MyGroup: React.FC<MyGroupProps> = ({ currentUser, onGroupUpdate }) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJoinPage, setShowJoinPage] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (currentUser?.group_id) {
      loadGroupData();
    }
  }, [currentUser]);

  const loadGroupData = async () => {
    if (!currentUser?.group_id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members (
            user_id,
            is_owner,
            joined_at,
            users (
              first_name,
              user_role
            )
          )
        `)
        .eq('id', currentUser.group_id)
        .single();

      if (error) {
        console.error('Error loading group data:', error);
        setError('Failed to load group information');
      } else {
        setGroup(data);
      }
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
    if (!currentUser) return;

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
          .single();
        
        if (!existingGroup) {
          isUnique = true;
        } else {
          newInviteCode = generateInviteCode();
        }
      }

      // Create the group
      const groupName = `${currentUser.first_name}'s Group`;
      
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName,
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

      // Update user's group_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ group_id: groupData.id })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      // Refresh the parent component
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
    onGroupUpdate();
  };

  const handleLeaveGroup = async () => {
    if (!currentUser?.group_id || !group) return;

    const confirmLeave = window.confirm('Are you sure you want to leave this group?');
    if (!confirmLeave) return;

    try {
      setIsLoading(true);
      setError(null);

      // Remove user from group_members
      const { error: memberError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', currentUser.group_id)
        .eq('user_id', currentUser.id);

      if (memberError) throw memberError;

      // Clear user's group_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ group_id: null })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      // Reset local state
      setGroup(null);
      onGroupUpdate();

    } catch (err) {
      console.error('Error leaving group:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave group');
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteCode = async () => {
    if (!group?.invite_code) return;

    try {
      await navigator.clipboard.writeText(group.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy invite code:', err);
    }
  };

  const isUserOwner = group?.group_members?.find(
    member => member.user_id === currentUser?.id
  )?.is_owner || false;

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
        <h2 className="text-2xl font-bold text-gray-900">My Group</h2>
        <Users className="w-6 h-6 text-blue-600" />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : group ? (
        // User has a group
        <div className="space-y-6">
          {/* Group Info */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
              {isUserOwner && (
                <span className="flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  <Crown className="w-3 h-3 mr-1" />
                  Owner
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Invite Code:</span>
                <code className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">
                  {group.invite_code}
                </code>
                <button
                  onClick={copyInviteCode}
                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                  title="Copy invite code"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Members ({group.group_members?.length || 0})
            </h4>
            <div className="space-y-2">
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
          </div>

          {/* Leave Group Button */}
          <button
            onClick={handleLeaveGroup}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Leave Group
          </button>
        </div>
      ) : (
        // User doesn't have a group
        <div className="space-y-4">
          <p className="text-gray-600 text-center mb-6">
            You're not part of any group yet. Join or create one to connect with others!
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setShowJoinPage(true)}
              className="w-full flex items-center justify-center px-4 py-3 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
            >
              <Hash className="w-4 h-4 mr-2" />
              Join Group with Code
            </button>
            
            <button
              onClick={handleCreateGroup}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyGroup;