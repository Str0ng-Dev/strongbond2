import React, { useState } from 'react';
import { Hash, ArrowLeft, Users, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface JoinGroupProps {
  currentUserId: string;
  onSuccess: () => void;
  onBack: () => void;
}

const JoinGroup: React.FC<JoinGroupProps> = ({ currentUserId, onSuccess, onBack }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleJoinGroup = async () => {
    if (!inviteCode.trim() || inviteCode.length !== 6) {
      setError('Please enter a valid 6-character invite code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Look up group by invite code
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('invite_code', inviteCode.toUpperCase())
        .maybeSingle();

      if (groupError) {
        console.error("Supabase error:", groupError);
        throw new Error('Something went wrong. Please try again.');
      }

      if (!groupData) {
        throw new Error('Invite code not found. Please check and try again.');
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupData.id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (existingMember) {
        throw new Error('You are already a member of this group.');
      }

      // Insert new row into GroupMembers
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: currentUserId,
          joined_at: new Date().toISOString(),
          is_admin: false
        });

      if (memberError) {
        throw new Error(`Failed to join group: ${memberError.message}`);
      }

      // Update current user's group_id in Users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ group_id: groupData.id })
        .eq('id', currentUserId);

      if (updateError) {
        throw new Error(`Failed to update user group: ${updateError.message}`);
      }

      // Show success message
      setSuccess(true);
      
      // Navigate to Dashboard after a brief delay
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err) {
      console.error('Error joining group:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setInviteCode(value);
    setError(null);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Successfully Joined!</h2>
          <p className="text-gray-600 mb-6">
            You've successfully joined the group. Redirecting to your dashboard...
          </p>
          
          {/* Loading animation */}
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Hash className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Group</h1>
          <p className="text-gray-600">Enter the invite code to join an existing group</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Invite Code
            </label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={handleInputChange}
              placeholder="ABC123"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-center text-xl font-mono tracking-wider uppercase"
              maxLength={6}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Ask your group leader for the 6-character invite code
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleJoinGroup}
              disabled={!inviteCode.trim() || inviteCode.length !== 6 || isLoading}
              className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                inviteCode.trim() && inviteCode.length === 6 && !isLoading
                  ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Joining Group...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 mr-2" />
                  Join Group
                </>
              )}
            </button>

            <button
              onClick={onBack}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Need help?</h3>
          <p className="text-xs text-blue-700">
            Invite codes are 6-character combinations of letters and numbers. 
            Contact your group leader if you don't have an invite code.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinGroup;