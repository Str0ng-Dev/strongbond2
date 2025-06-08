import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Search, 
  Check, 
  X, 
  Heart,
  AlertCircle,
  Link
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  first_name: string;
  user_role: string;
  linked_to_user_id?: string;
}

interface UserConnection {
  user_id: string;
  user_name: string;
  user_role: string;
  connected_user_id: string;
  connected_user_name: string;
  connected_user_role: string;
  connection_type: 'linked_to' | 'linked_from';
}

interface UserLinkingProps {
  currentUser: User;
  onUserLinked?: () => void;
}

const UserLinking: React.FC<UserLinkingProps> = ({ currentUser, onUserLinked }) => {
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadConnections();
  }, [currentUser.id]);

  const loadConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select('*')
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error loading connections:', error);
        return;
      }

      setConnections(data || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);

      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, user_role, linked_to_user_id')
        .ilike('first_name', `%${searchTerm}%`)
        .neq('id', currentUser.id)
        .limit(10);

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      // Filter out users already connected
      const connectedUserIds = connections.map(c => c.connected_user_id);
      const filteredResults = (data || []).filter(user => 
        !connectedUserIds.includes(user.id) && 
        user.id !== currentUser.linked_to_user_id
      );

      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Error searching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const linkToUser = async (targetUserId: string, targetUserName: string) => {
    try {
      setIsLinking(targetUserId);
      setError(null);

      // Check if current user is already linked to someone
      if (currentUser.linked_to_user_id) {
        throw new Error('You are already linked to another user. Please unlink first.');
      }

      const { error } = await supabase
        .from('users')
        .update({ 
          linked_to_user_id: targetUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) {
        throw new Error(`Failed to link users: ${error.message}`);
      }

      // Refresh connections and search results
      await loadConnections();
      setSearchResults([]);
      setSearchTerm('');
      setShowSearch(false);

      if (onUserLinked) {
        onUserLinked();
      }

    } catch (err) {
      console.error('Error linking users:', err);
      setError(err instanceof Error ? err.message : 'Failed to link users');
    } finally {
      setIsLinking(null);
    }
  };

  const unlinkUser = async () => {
    const confirmUnlink = window.confirm('Are you sure you want to remove your user connection?');
    if (!confirmUnlink) return;

    try {
      setIsUnlinking(true);
      setError(null);

      const { error } = await supabase
        .from('users')
        .update({ 
          linked_to_user_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) {
        throw new Error(`Failed to unlink users: ${error.message}`);
      }

      // Refresh connections
      await loadConnections();

      if (onUserLinked) {
        onUserLinked();
      }

    } catch (err) {
      console.error('Error unlinking users:', err);
      setError(err instanceof Error ? err.message : 'Failed to unlink users');
    } finally {
      setIsUnlinking(false);
    }
  };

  const getConnectionTypeLabel = (connection: UserConnection) => {
    switch (connection.connection_type) {
      case 'linked_to':
        return 'You are connected to';
      case 'linked_from':
        return 'Connected to you';
      default:
        return 'Connected';
    }
  };

  const getConnectionIcon = (userRole: string) => {
    switch (userRole) {
      case 'Dad':
      case 'Mom':
        return '👨‍👩‍👧‍👦';
      case 'Son':
      case 'Daughter':
        return '👶';
      case 'Church Leader':
        return '⛪';
      case 'Coach':
        return '🏃‍♂️';
      default:
        return '👤';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Link className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Connections</h2>
            <p className="text-gray-600">Connect with family, mentors, or accountability partners</p>
          </div>
        </div>
        
        {!showSearch && (
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Connect
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Search Section */}
      {showSearch && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-900">Find Users to Connect</h3>
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchTerm('');
                setSearchResults([]);
              }}
              className="p-1 text-purple-600 hover:text-purple-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex space-x-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by first name..."
                className="w-full pl-10 pr-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              />
            </div>
            <button
              onClick={searchUsers}
              disabled={!searchTerm.trim() || isSearching}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                searchTerm.trim() && !isSearching
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-purple-900 mb-2">Search Results</h4>
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white border border-purple-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">{getConnectionIcon(user.user_role)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.first_name}</p>
                      <p className="text-sm text-gray-600">{user.user_role}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => linkToUser(user.id, user.first_name)}
                    disabled={isLinking === user.id}
                    className={`flex items-center px-3 py-1 rounded-lg font-medium transition-colors ${
                      isLinking === user.id
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {isLinking === user.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 mr-1" />
                        Connect
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchTerm && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-4">
              <p className="text-gray-600">No users found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}

      {/* Current Connections */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Connections ({connections.length})
        </h3>
        
        {connections.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Connections Yet</h4>
            <p className="text-gray-600 mb-4">
              Connect with family members, mentors, or accountability partners to share your spiritual journey.
            </p>
            {!showSearch && (
              <button
                onClick={() => setShowSearch(true)}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Find People to Connect
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((connection) => (
              <div key={`${connection.connected_user_id}-${connection.connection_type}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">{getConnectionIcon(connection.connected_user_role)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{connection.connected_user_name}</p>
                    <p className="text-sm text-gray-600">{connection.connected_user_role}</p>
                    <p className="text-xs text-purple-600">{getConnectionTypeLabel(connection)}</p>
                  </div>
                </div>
                
                {connection.connection_type === 'linked_to' && (
                  <button
                    onClick={unlinkUser}
                    disabled={isUnlinking}
                    className={`flex items-center px-3 py-1 rounded-lg font-medium transition-colors ${
                      isUnlinking
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {isUnlinking ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                        Removing...
                      </>
                    ) : (
                      <>
                        <UserMinus className="w-3 h-3 mr-1" />
                        Remove
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connection Benefits */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Heart className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Benefits of Connecting</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Share journal reflections with your connected user</li>
              <li>• Receive encouragement and accountability</li>
              <li>• Track each other's devotional progress</li>
              <li>• Build stronger spiritual relationships</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLinking;