import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Assistant } from '../hooks/useAssistants';

interface ChatInputProps {
  selectedAssistant: Assistant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  session: any;
  connectionStatus: 'connected' | 'disconnected' | 'testing';
  currentConversationId: string | null;
  error: string | null;
  onSendMessage: (message: string) => void;
  onTestConnection: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  selectedAssistant,
  isLoading,
  isAuthenticated,
  session,
  connectionStatus,
  currentConversationId,
  error,
  onSendMessage,
  onTestConnection
}) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="border-t bg-white p-4">
      <div className="flex space-x-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={selectedAssistant ? `Share your heart with ${selectedAssistant.name}...` : 'Select an assistant to start chatting...'}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          disabled={isLoading || !selectedAssistant?.assistantId || !isAuthenticated || !session}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading || !selectedAssistant?.assistantId || !isAuthenticated || !session}
          className="bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Status Messages */}
      {connectionStatus === 'connected' && selectedAssistant?.assistantId && isAuthenticated && session && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            <strong>Live Mode:</strong> Connected to OpenAI Assistants API via Supabase Edge Function.
            {currentConversationId && <span className="ml-2">Conversation ID: {currentConversationId.substring(0, 8)}...</span>}
          </p>
        </div>
      )}

      {connectionStatus === 'disconnected' && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>Connection Issue:</strong> Unable to reach the AI service. Please check your configuration and try again.
          </p>
          <button 
            onClick={onTestConnection}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            disabled={!selectedAssistant?.assistantId || !isAuthenticated || !session}
          >
            Retry Connection
          </button>
        </div>
      )}

      {!selectedAssistant?.assistantId && selectedAssistant && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            <strong>Assistant Not Configured:</strong> This assistant needs to be set up in the database before it can be used.
          </p>
        </div>
      )}

      {!isAuthenticated && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Authentication Required:</strong> Please sign in to use the AI assistants.
          </p>
        </div>
      )}

      {!session && isAuthenticated && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700">
            <strong>Session Required:</strong> Waiting for authentication session to be established.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
