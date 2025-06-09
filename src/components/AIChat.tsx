// File: src/components/AIChat.tsx
// AI chat interface integrated with Supabase Edge Function

import React, { useState, useEffect } from 'react';
import { Send, Bot, User, Heart, Book, Zap, Crown } from 'lucide-react';
import { UserRole } from '../types/ai';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  role?: UserRole;
}

interface Assistant {
  id: string;
  name: string;
  role: UserRole;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  assistantId?: string; // Real database ID
}

const mockAssistants: Assistant[] = [
  {
    id: '1',
    name: 'Dad',
    role: 'Dad',
    icon: Crown,
    color: 'bg-blue-500',
    description: 'Wise father figure and spiritual mentor'
  },
  {
    id: '2',
    name: 'Mom',
    role: 'Mom',
    icon: Heart,
    color: 'bg-pink-500',
    description: 'Nurturing mother figure and guide'
  },
  {
    id: '3',
    name: 'Coach',
    role: 'Coach',
    icon: Zap,
    color: 'bg-green-500',
    description: 'Motivational coach and fitness guide'
  },
  {
    id: '4',
    name: 'Son',
    role: 'Son',
    icon: User,
    color: 'bg-purple-500',
    description: 'Peer companion and friend'
  }
];

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedAssistant, setSelectedAssistant] = useState(mockAssistants[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('testing');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableAssistants, setAvailableAssistants] = useState<Assistant[]>([]);
  const [assistantsLoaded, setAssistantsLoaded] = useState(false);

  // Valid UUID for testing - in production, get from auth
  const userId = '39ce1d87-e47c-455c-951a-644a849b2a11';

  // Fetch available assistants from database
  const fetchAssistants = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/ai_assistants?is_active=eq.true&select=*`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const dbAssistants = await response.json();
        
        // Map database assistants to our UI assistants
        const updatedAssistants = mockAssistants.map(assistant => {
          const dbAssistant = dbAssistants.find((db: any) => db.user_role === assistant.role);
          return {
            ...assistant,
            assistantId: dbAssistant?.id
          };
        }).filter(assistant => assistant.assistantId); // Only include assistants that exist in DB

        setAvailableAssistants(updatedAssistants);
        
        if (updatedAssistants.length > 0) {
          setSelectedAssistant(updatedAssistants[0]);
        } else {
          setError('No AI assistants are available. Please contact your administrator.');
        }
      } else {
        throw new Error('Failed to fetch assistants');
      }
    } catch (error) {
      console.error('Failed to fetch assistants:', error);
      setError('Unable to load AI assistants. Using fallback mode.');
      setAvailableAssistants(mockAssistants); // Fallback to mock assistants
    } finally {
      setAssistantsLoaded(true);
    }
  };

  // Initialize component
  useEffect(() => {
    fetchAssistants();
  }, []);

  // Initialize with welcome message when assistant is selected
  useEffect(() => {
    if (selectedAssistant && assistantsLoaded) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Hello! I'm ${selectedAssistant.name}, your ${selectedAssistant.description}. I'm here to support you on your spiritual journey. How can I help you today?`,
        sender: 'ai',
        timestamp: new Date(),
        role: selectedAssistant.role
      };
      setMessages([welcomeMessage]);

      // Test connection only if we have a real assistant ID
      if (selectedAssistant.assistantId) {
        testConnection();
      } else {
        setConnectionStatus('disconnected');
        setError('This assistant is not configured in the database.');
      }
    }
  }, [selectedAssistant, assistantsLoaded]);

  const testConnection = async () => {
    if (!selectedAssistant.assistantId) {
      setConnectionStatus('disconnected');
      setError('Assistant not configured');
      return;
    }

    try {
      setConnectionStatus('testing');
      
      // Test with a simple message using the new endpoint
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-sendMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          message: 'Hello',
          assistant_id: selectedAssistant.assistantId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConnectionStatus('connected');
          setError(null);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('disconnected');
      setError(error instanceof Error ? error.message : 'Connection failed');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !selectedAssistant.assistantId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-sendMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          message: messageText,
          assistant_id: selectedAssistant.assistantId,
          conversation_id: conversationId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update conversation ID if this is a new conversation
        if (data.conversation_id && !conversationId) {
          setConversationId(data.conversation_id);
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.message,
          sender: 'ai',
          timestamp: new Date(),
          role: selectedAssistant.role
        };

        setMessages(prev => [...prev, aiMessage]);
        setConnectionStatus('connected');
      } else {
        throw new Error(data.error || 'Unknown error');
      }

    } catch (error) {
      console.error('Send message failed:', error);
      setConnectionStatus('disconnected');
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        content: 'I apologize, but I encountered an issue. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const switchAssistant = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setMessages([]); // Clear messages when switching
    setConversationId(null); // Reset conversation
    setError(null);
  };

  if (!assistantsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Bot className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading AI assistants...</p>
        </div>
      </div>
    );
  }

  if (availableAssistants.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <Bot className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No AI Assistants Available</h2>
          <p className="text-gray-600 mb-4">
            No active AI assistants were found in the database. Please contact your administrator to set up AI assistants.
          </p>
          <button 
            onClick={fetchAssistants}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
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

            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              connectionStatus === 'connected' ? 'bg-green-100 text-green-700' :
              connectionStatus === 'disconnected' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {connectionStatus === 'connected' ? '🟢 Edge Function Ready' :
               connectionStatus === 'disconnected' ? '🔴 Connection Failed' :
               '🟡 Testing...'}
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
                    onClick={() => switchAssistant(assistant)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                      selectedAssistant.id === assistant.id
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
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user' ? 'bg-blue-500' : selectedAssistant.color
              }`}>
                {message.sender === 'user' ?
                  <User className="w-4 h-4 text-white" /> :
                  React.createElement(selectedAssistant.icon, { className: "w-4 h-4 text-white" })
                }
              </div>
              <div className={`p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 shadow-sm border'
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedAssistant.color}`}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={`Share your heart with ${selectedAssistant.name}...`}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading || !selectedAssistant.assistantId}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || !selectedAssistant.assistantId}
            className="bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {connectionStatus === 'connected' && selectedAssistant.assistantId && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              <strong>Live Mode:</strong> Connected to OpenAI Assistants API via Supabase Edge Function.
              {conversationId && <span className="ml-2">Conversation ID: {conversationId.substring(0, 8)}...</span>}
            </p>
          </div>
        )}

        {connectionStatus === 'disconnected' && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Connection Issue:</strong> Unable to reach the AI service. Please check your configuration and try again.
            </p>
            <button 
              onClick={testConnection}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              disabled={!selectedAssistant.assistantId}
            >
              Retry Connection
            </button>
          </div>
        )}

        {!selectedAssistant.assistantId && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              <strong>Assistant Not Configured:</strong> This assistant needs to be set up in the database before it can be used.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChat;