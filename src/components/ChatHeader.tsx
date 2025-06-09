import React from 'react';
import { Bot, Plus } from 'lucide-react';
import { Assistant } from '../hooks/useAssistants';
import { Conversation } from '../hooks/useConversations';

interface ChatHeaderProps {
  availableAssistants: Assistant[];
  selectedAssistant: Assistant | null;
  conversations: Conversation[];
  currentConversationId: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'testing';
  userId: string | null;
  userOrgId: string | null;
  session: any;
  error: string | null;
  onSwitchAssistant: (assistant: Assistant) => void;
  onLoadConversation: (conversationId: string) => void;
  onStartNewConversation: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  availableAssistants,
  selectedAssistant,
  conversations,
  currentConversationId,
  connectionStatus,
  userId,
  userOrgId,
  session,
  error,
  onSwitchAssistant,
  onLoadConversation,
  onStartNewConversation
}) => {
  return (
    <div className="bg-white border-b shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">StrongBond AI Assistants</h1>
              <p className="text-sm text-gray-600">OpenAI-powered spiritual companions</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* New Conversation Button */}
            <button
              onClick={onStartNewConversation}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">New Chat</span>
            </button>

            {/* Connection Status */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              connectionStatus === 'connected' ? 'bg-green-100 text-green-700' :
              connectionStatus === 'disconnected' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {connectionStatus === 'connected' ? '🟢 Connected' :
               connectionStatus === 'disconnected' ? '🔴 Disconnected' :
               '🟡 Testing...'}
            </div>

            {/* User Info */}
            <div className="text-xs text-gray-500">
              User: {userId?.substring(0, 8)}...
              {userOrgId && <span className="ml-1">(Org: {userOrgId.substring(0, 8)}...)</span>}
              {session && <span className="ml-1">✓</span>}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Assistant Selector */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Choose your spiritual companion:</p>
          <div className="flex space-x-2 overflow-x-auto">
            {availableAssistants.map((assistant) => {
              const IconComponent = assistant.icon;
              return (
                <button
                  key={assistant.id}
                  onClick={() => onSwitchAssistant(assistant)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                    selectedAssistant?.id === assistant.id
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                  disabled={!assistant.assistantId}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    assistant.assistantId ? assistant.color : 'bg-gray-400'
                  }`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">{assistant.name}</span>
                  {!assistant.assistantId && (
                    <span className="text-xs text-red-500">(Not configured)</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversation History */}
        {conversations.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Recent conversations:</p>
            <div className="flex space-x-2 overflow-x-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onLoadConversation(conv.id)}
                  className={`px-3 py-2 rounded-lg border text-sm whitespace-nowrap transition-all ${
                    currentConversationId === conv.id
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {conv.title || 'Untitled'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
