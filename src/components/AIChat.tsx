import React from 'react';
import { Bot, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAssistants } from '../hooks/useAssistants';
import { useConversations } from '../hooks/useConversations';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const AIChat: React.FC = () => {
  // Custom hooks for state management
  const auth = useAuth();
  const assistants = useAssistants({
    userId: auth.userId,
    userOrgId: auth.userOrgId,
    isAuthenticated: auth.isAuthenticated,
    authLoaded: auth.authLoaded,
    session: auth.session
  });
  const conversations = useConversations({
    userId: auth.userId,
    isAuthenticated: auth.isAuthenticated,
    selectedAssistant: assistants.selectedAssistant,
    assistantsLoaded: assistants.assistantsLoaded,
    session: auth.session
  });

  // Loading screen
  if (!auth.authLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Bot className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
          <p className="text-xs text-gray-400 mt-2">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - Show sign in screen
  if (!auth.isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <Bot className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to StrongBond AI</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access your AI spiritual companions and continue your faith journey.
          </p>
          <button 
            onClick={auth.handleTestLogin}
            disabled={auth.isLoggingIn}
            className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 disabled:bg-purple-300 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto transition-colors"
          >
            {auth.isLoggingIn ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In (Test)</span>
            )}
          </button>
          {auth.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{auth.error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading assistants
  if (!assistants.assistantsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Bot className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading AI assistants...</p>
        </div>
      </div>
    );
  }

  // No assistants available
  if (assistants.availableAssistants.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <Bot className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No AI Assistants Available</h2>
          <p className="text-gray-600 mb-4">
            No active AI assistants were found in the database. Please contact your administrator to set up AI assistants.
          </p>
          <button 
            onClick={assistants.fetchAssistants}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ChatHeader
        availableAssistants={assistants.availableAssistants}
        selectedAssistant={assistants.selectedAssistant}
        conversations={conversations.conversations}
        currentConversationId={conversations.currentConversationId}
        connectionStatus={conversations.connectionStatus}
        userId={auth.userId}
        userOrgId={auth.userOrgId}
        session={auth.session}
        error={assistants.error || conversations.error}
        onSwitchAssistant={assistants.switchAssistant}
        onLoadConversation={conversations.loadConversation}
        onStartNewConversation={conversations.startNewConversation}
      />

      <MessageList
        messages={conversations.messages}
        selectedAssistant={assistants.selectedAssistant}
        isLoading={conversations.isLoading}
      />

      <ChatInput
        selectedAssistant={assistants.selectedAssistant}
        isLoading={conversations.isLoading}
        isAuthenticated={auth.isAuthenticated}
        session={auth.session}
        connectionStatus={conversations.connectionStatus}
        currentConversationId={conversations.currentConversationId}
        error={conversations.error}
        onSendMessage={conversations.sendMessage}
        onTestConnection={conversations.testConnection}
      />
    </div>
  );
};

export default AIChat;
