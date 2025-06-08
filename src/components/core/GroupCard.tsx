import React from 'react';
import { 
  Users, 
  Calendar, 
  Crown, 
  Building2,
  Hash,
  Copy,
  Check
} from 'lucide-react';

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

interface GroupCardProps {
  group: Group;
  onClick?: () => void;
  showOrgBadge?: boolean;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onClick, showOrgBadge = false }) => {
  const [copiedCode, setCopiedCode] = React.useState(false);

  const handleCopyInviteCode = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    try {
      await navigator.clipboard.writeText(group.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy invite code:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 p-6 transition-all duration-200 ${
        onClick ? 'hover:shadow-lg hover:border-gray-300 cursor-pointer transform hover:scale-105' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{group.name}</h3>
          <div className="flex items-center space-x-2">
            {group.is_owner && (
              <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                <Crown className="w-3 h-3 mr-1" />
                Owner
              </span>
            )}
            {showOrgBadge && group.org_id && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                <Building2 className="w-3 h-3 mr-1" />
                Organization
              </span>
            )}
          </div>
        </div>
        
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <span>{group.member_count || 0} members</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{formatDate(group.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Invite Code */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Hash className="w-4 h-4 text-gray-400" />
            <code className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
              {group.invite_code}
            </code>
          </div>
          
          <button
            onClick={handleCopyInviteCode}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Copy invite code"
          >
            {copiedCode ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Share this code to invite others
        </p>
      </div>
    </div>
  );
};

export default GroupCard;