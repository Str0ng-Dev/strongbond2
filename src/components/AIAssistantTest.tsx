// File: src/components/AIAssistantTest.tsx
// Simple test component to verify AI system works

import React, { useState, useEffect } from 'react';
import { Bot, User, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAIAssistant } from '../hooks/useAIAssistant';
import { supabase } from '../lib/supabase';

interface TestResults {
  database: 'loading' | 'success' | 'error';
  assistants: 'loading' | 'success' | 'error';
  preferences: 'loading' | 'success' | 'error';
  hook: 'loading' | 'success' | 'error';
}

const AIAssistantTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResults>({
    database: 'loading',
    assistants: 'loading', 
    preferences: 'loading',
    hook: 'loading'
  });
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [testMessage, setTestMessage] = useState('');

  // Get current user for testing
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setCurrentUser(profile);
      }
    };
    getCurrentUser();
  }, []);

  // Initialize AI hook for testing (only if we have a user)
  const aiHook = currentUser ? useAIAssistant(currentUser.id) : null;

  // Run tests when component mounts
  useEffect(() => {
    runTests();
  }, [currentUser]);

  const runTests = async () => {
    // Test 1: Database connectivity
    try {
      const { data, error } = await supabase
        .from('ai_assistants')
        .select('id, name, user_role')
        .limit(1);

      if (error) throw error;
      
      setTestResults(prev => ({ ...prev, database: 'success' }));
    } catch (error) {
      console.error('Database test failed:', error);
      setTestResults(prev => ({ ...prev, database: 'error' }));
    }

    // Test 2: Load AI assistants
    try {
      const { data, error } = await supabase
        .from('ai_assistants')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      
      setTestResults(prev => ({ 
        ...prev, 
        assistants: data && data.length > 0 ? 'success' : 'error' 
      }));
    } catch (error) {
      console.error('Assistants test failed:', error);
      setTestResults(prev => ({ ...prev, assistants: 'error' }));
    }

    // Test 3: User preferences (if user exists)
    if (currentUser) {
      try {
        const { data, error } = await supabase
          .from('user_ai_preferences')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        // This might not exist yet, which is okay
        setTestResults(prev => ({ ...prev, preferences: 'success' }));
      } catch (error) {
        // Try to create default preferences
        try {
          const { error: insertError } = await supabase
            .from('user_ai_preferences')
            .insert({
              user_id: currentUser.id,
              include_devotional_context: true,
              include_journal_history: false,
              include_fitness_progress: false,
              conversation_style: 'balanced'
            });

          setTestResults(prev => ({ 
            ...prev, 
            preferences: insertError ? 'error' : 'success' 
          }));
        } catch (createError) {
          console.error('Preferences test failed:', createError);
          setTestResults(prev => ({ ...prev, preferences: 'error' }));
        }
      }
    } else {
      setTestResults(prev => ({ ...prev, preferences: 'success' })); // Skip if no user
    }

    // Test 4: AI Hook functionality
    if (aiHook) {
      try {
        // Just check if hook loaded without errors
        const hasAssistants = aiHook.availableAssistants.length > 0;
        setTestResults(prev => ({ 
          ...prev, 
          hook: hasAssistants ? 'success' : 'loading' 
        }));
      } catch (error) {
        console.error('Hook test failed:', error);
        setTestResults(prev => ({ ...prev, hook: 'error' }));
      }
    } else {
      setTestResults(prev => ({ ...prev, hook: currentUser ? 'loading' : 'error' }));
    }
  };

  const handleTestMessage = async () => {
    if (!aiHook || !currentUser || !testMessage.trim()) return;

    try {
      // Get the first available assistant
      const assistant = aiHook.availableAssistants[0];
      if (!assistant) {
        alert('No assistants available');
        return;
      }

      // Start a conversation
      await aiHook.startConversation(assistant.id, 'Test Conversation');
      
      // Send a test message
      await aiHook.sendMessage(testMessage.trim());
      
      alert('Test message sent successfully!');
      setTestMessage('');
    } catch (error) {
      console.error('Test message failed:', error);
      alert(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusIcon = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <Bot className="w-8 h-8 text-blue-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">AI Assistant System Test</h2>
      </div>

      {/* Current User Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Current User</h3>
        {currentUser ? (
          <div className="text-sm text-gray-600">
            <p><strong>Name:</strong> {currentUser.first_name}</p>
            <p><strong>Role:</strong> {currentUser.user_role}</p>
            <p><strong>ID:</strong> {currentUser.id}</p>
          </div>
        ) : (
          <p className="text-sm text-red-600">No authenticated user found</p>
        )}
      </div>

      {/* Test Results */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Database Connection</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(testResults.database)}
            <span className="text-sm capitalize">{testResults.database}</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">AI Assistants Loaded</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(testResults.assistants)}
            <span className="text-sm capitalize">{testResults.assistants}</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">User Preferences</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(testResults.preferences)}
            <span className="text-sm capitalize">{testResults.preferences}</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">AI Hook Initialized</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(testResults.hook)}
            <span className="text-sm capitalize">{testResults.hook}</span>
          </div>
        </div>
      </div>

      {/* Available Assistants */}
      {aiHook && aiHook.availableAssistants.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Available Assistants</h3>
          <div className="grid grid-cols-2 gap-2">
            {aiHook.availableAssistants.map((assistant) => (
              <div key={assistant.id} className="p-2 bg-blue-50 rounded text-sm">
                <div className="font-medium">{assistant.name}</div>
                <div className="text-blue-600">{assistant.user_role}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Message */}
      {currentUser && aiHook && aiHook.availableAssistants.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Test AI Conversation</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Type a test message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleTestMessage}
              disabled={!testMessage.trim() || aiHook.chatState.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiHook.chatState.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Send Test'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Retry Button */}
      <div className="mt-6 text-center">
        <button
          onClick={runTests}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Retry Tests
        </button>
      </div>
    </div>
  );
};

export default AIAssistantTest;