import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts';
import { supabase } from '../../lib/supabase';
import GroupCard from './GroupCard';
import { Users, Plus, AlertCircle } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  is_owner?: boolean;
  org_id?: string;
}

interface GroupListProps {
  onGroupSelect?: (group: Group) => void;
  onCreateGroup?: () => void;
  showCreateButton?: boolean;
}

const GroupList: React.FC<GroupListProps> = ({ 
  onGroupSelect, 
  onCreateGroup,
  showCreateButton = true 
}) => {
  const { user, organization, isOrgUser, isIndividualUser } = useAppContext();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user, organization]);

  const loadGroups = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      if (isOrgUser && organization) {
        // Load organization groups
        await loadOrganizationGroups();
      } else if (isIndividualUser) {
        // Load user's personal groups
        await loadPersonalGroups();
      }
    } catch (err) {
      console.error('Error loading groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrganizationGroups = async () => {
    if (!organization) return;

    // For organization users, load all groups in the organization
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        invite_code,
        created_by_user_id,
        created_at,
        updated_at,
        org_id
      `)
      .eq('org_id', organization.id)
      .order('created_at', { ascending: false });

    if (groupsError) {
      throw new Error(`Failed to load organization groups: ${groupsError.message}`);
    }

    // Get member counts for each group
    const groupsWithCounts = await Promise.all(
      (groupsData || []).map(async (group) => {
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        return {
          ...group,
          member_count: count || 0,
          is_owner: group.created_by_user_id === user?.id
        };
      })
    );

    setGroups(groupsWithCounts);
  };

  const loadPersonalGroups = async () => {
    if (!user) return;

    // For individual users, load groups they are members of
    const { data: membershipData, error: membershipError } = await supabase
      .from('group_members')
      .select('group_id, is_owner')
      .eq('user_id', user.id);

    if (membershipError) {
      throw new Error(`Failed to load group memberships: ${membershipError.message}`);
    }

    if (!membershipData || membershipData.length === 0) {
      setGroups([]);
      return;
    }

    const groupIds = membershipData.map(m => m.group_id);
    
    // Get group details
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        invite_code,
        created_by_user_id,
        created_at,
        updated_at,
        org_id
      `)
      .in('id', groupIds)
      .order('created_at', { ascending: false });

    if (groupsError) {
      throw new Error(`Failed to load groups: ${groupsError.message}`);
    }

    // Get member counts and ownership info
    const groupsWithCounts = await Promise.all(
      (groupsData || []).map(async (group) => {
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        const membership = membershipData.find(m => m.group_id === group.id);

        return {
          ...group,
          member_count: count || 0,
          is_owner: membership?.is_owner || false
        };
      })
    );

    setGroups(groupsWithCounts);
  };

  const handleCreateGroup = () => {
    if (onCreateGroup) {
      onCreateGroup();
    }
  };

  const getEmptyStateMessage = () => {
    if (isOrgUser) {
      return {
        title: 'No Groups Created',
        description: 'Create groups to organize your organization members into smaller communities.',
        actionText: 'Create First Group'
      };
    } else {
      return {
        title: 'No Groups Joined',
        description: 'Join or create groups to connect with others on your spiritual journey.',
        actionText: 'Create Group'
      };
    }
  };

  const emptyState = getEmptyStateMessage();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-800 font-medium">Error Loading Groups</p>
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={loadGroups}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isOrgUser ? 'Organization Groups' : 'My Groups'}
          </h2>
          <p className="text-sm text-gray-600">
            {groups.length} {groups.length === 1 ? 'group' : 'groups'}
          </p>
        </div>
        
        {showCreateButton && (
          <button
            onClick={handleCreateGroup}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </button>
        )}
      </div>

      {/* Groups List */}
      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onClick={() => onGroupSelect?.(group)}
              showOrgBadge={isIndividualUser && !!group.org_id}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{emptyState.title}</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {emptyState.description}
          </p>
          {showCreateButton && (
            <button
              onClick={handleCreateGroup}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              {emptyState.actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupList;