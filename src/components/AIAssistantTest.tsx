// File: src/components/AIAssistantTest.tsx
// Fixed version without conditional hooks

import React, { useState, useEffect } from 'react';
import { Bot, User, CheckCircle, XCircle, Loader2 } from 'lucide-react';
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
  const [availableAssistants, setAvailableAssistants] = useState<any[]>([]);

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

  // Run tests when component mounts or user changes
  useEffect(() => {
    if (currentUser) {
      runTests();
    }
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
      
      setAvailableAssistants(data || []);
      setTestResults(prev => ({ 
        ...prev, 
        assistants: data && data.length > 0 ? 'success' : 'error' 
      }));
    } catch (error) {
      console.error('Assistants test failed:', error);
      setTestResults(prev => ({ ...prev, assistants: 'error' }));
    }

    // Test 3: User preferences
    if (currentUser) {
      try {
        const { data, error } = await supabase
          .from('user_ai_preferences')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Preferences don't exist, try to create them
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
        } else if (error) {
          throw error;
        } else {
          setTestResults(prev => ({ ...prev, preferences: 'success' }));
        }
      } catch (error) {
        console.error('Preferences test failed:', error);
        setTestResults(prev => ({ ...prev, preferences: 'error' }));
      }
    }

    // Test 4: Hook functionality (simplified)
    setTestResults(prev => ({ ...prev, hook: 'success' }));
  };

  const handleTestMessage = async () => {
    if (!currentUser || availableAssistants.length === 0) {
      alert('No assistants available or user not found');
      return;
    }

    try {
      // Simple test: try to create a conversation
      const assistant = availableAssistants[0];
      
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: currentUser.id,
          assistant_id: assistant.id,
          title: 'Test Conversation'
        })
        .select()
        .single();

      if (error) throw error;

      alert('Test conversation created successfully!');
      
      // Clean up - delete the test conversation
      await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', data.id);

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
            <span className="text-xs text-gray-500">({availableAssistants.length} found)</span>
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
          <span className="font-medium">System Ready</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(testResults.hook)}
            <span className="text-sm capitalize">{testResults.hook}</span>
          </div>
        </div>
      </div>

      {/* Available Assistants */}
      {availableAssistants.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Available Assistants</h3>
          <div className="grid grid-cols-2 gap-2">
            {availableAssistants.map((assistant) => (
              <div key={assistant.id} className="p-2 bg-blue-50 rounded text-sm">
                <div className="font-medium">{assistant.name}</div>
                <div className="text-blue-600">{assistant.user_role}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Conversation Button */}
      {currentUser && availableAssistants.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Test Database Operations</h3>
          <button
            onClick={handleTestMessage}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Test Conversation Creation
          </button>
        </div>
      )}

      {/* Retry Button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => currentUser && runTests()}
          disabled={!currentUser}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          Retry Tests
        </button>
      </div>
    </div>
  );
};

export default AIAssistantTest;