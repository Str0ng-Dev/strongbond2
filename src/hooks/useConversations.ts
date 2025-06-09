import { useState, useEffect } from 'react';
import { UserRole } from '../types/ai';
import { Assistant } from './useAssistants';
import { supabase } from '../lib/supabase';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  role?: UserRole;
}

export interface Conversation {
  id: string;
  title: string;
  last_message_at: string;
  created_at: string;
}

interface DBMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface UseConversationsProps {
  userId: string | null;
  isAuthenticated: boolean;
  selectedAssistant: Assistant | null;
  assistantsLoaded: boolean;
  session: any;
}

export const useConversations = ({ 
  userId, 
  isAuthenticated, 
  selectedAssistant, 
  assistantsLoaded, 
  session 
}: UseConversationsProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('testing');
  const [error, setError] = useState<string | null>(null);

  // Add welcome message
  const addWelcomeMessage = () => {
    if (!selectedAssistant) return;

    const welcomeMessage: Message = {
      id: 'welcome-' + Date.now(),
      content: `Hello! I'm ${selectedAssistant.name}, your ${selectedAssistant.description}. I'm here to support you on your spiritual journey. How can I help you today?`,
      sender: 'ai',
      timestamp: new Date(),
      role: selectedAssistant.role
    };
    setMessages([welcomeMessage]);
  };

  // Fetch conversations for selected assistant
  const fetchConversations = async () => {
    if (!userId || !isAuthenticated || !selectedAssistant?.assistantId) return;

    try {
      console.log('💬 Fetching conversations...');
      
      const query = supabase
        .from('ai_conversations')
        .select('id, title, last_message_at, created_at')
        .eq('user_id', userId)
        .eq('assistant_id', selectedAssistant.assistantId)
        .order('last_message_at', { ascending: false })
        .limit(10);
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Conversations query timeout')), 15000)
      );
      
      const result = await Promise.race([query, timeoutPromise]) as any;

      if (result.error) {
        throw result.error;
      }

      const convData = result.data || [];
      setConversations(convData);
      
      if (convData.length > 0) {
        await loadConversation(convData[0].id);
      } else {
        setMessages([]);
        setCurrentConversationId(null);
        addWelcomeMessage();
      }

    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setError(`Unable to load conversation history: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessages([]);
      setCurrentConversationId(null);
      addWelcomeMessage();
    } finally {
      setConversationsLoaded(true);
    }
  };

  // Load specific conversation and its messages
  const loadConversation = async (conversationId: string) => {
    if (!userId || !isAuthenticated) return;

    try {
      setIsLoading(true);
      setCurrentConversationId(conversationId);

      const query = supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Messages query timeout')), 5000)
      );
      
      const result = await Promise.race([query, timeoutPromise]) as any;

      if (result.error) {
        throw result.error;
      }

      const uiMessages: Message[] = (result.data || []).map((dbMsg: DBMessage) => ({
        id: dbMsg.id,
        content: dbMsg.content,
        sender: dbMsg.sender_type === 'user' ? 'user' : 'ai',
        timestamp: new Date(dbMsg.created_at),
        role: selectedAssistant?.role
      }));

      setMessages(uiMessages);
      setError(null);

    } catch (error) {
      console.error('Failed to load conversation:', error);
      setError(`Unable to load conversation messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addWelcomeMessage();
    } finally {
      setIsLoading(false);
    }
  };

  // Start new conversation
  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    addWelcomeMessage();
    setError(null);
  };

  // Send message to AI
  const sendMessage = async (input: string) => {
    if (!input.trim() || isLoading || !selectedAssistant?.assistantId || !userId || !isAuthenticated || !session) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      console.log('💬 Sending message to AI...');
      
      const requestBody = {
        userId: userId,
        message: input,
        assistantRole: selectedAssistant.role,
        conversationId: currentConversationId
      };

      console.log('📤 Request body:', requestBody);
      
      const requestPromise = fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-sendMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Message send timeout')), 30000)
      );
      
      const response = await Promise.race([requestPromise, timeoutPromise]) as Response;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        if (data.conversationId && !currentConversationId) {
          setCurrentConversationId(data.conversationId);
          fetchConversations();
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
        console.log('💬 AI response received');
      } else {
        throw new Error(data.error || 'Unknown error');
      }

    } catch (error) {
      console.error('Send message failed:', error);
      setConnectionStatus('disconnected');
      setError(`Message failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
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

  // Test connection
  const testConnection = async () => {
    if (!selectedAssistant?.assistantId || !userId || !isAuthenticated || !session) {
      setConnectionStatus('disconnected');
      setError('Assistant not configured, user not authenticated, or no session');
      return;
    }

    try {
      console.log('🔗 Testing AI connection...');
      setConnectionStatus('testing');
      
      const testBody = {
        userId: userId,
        message: 'Hello',
        assistantRole: selectedAssistant.role
      };

      console.log('🧪 Test body:', testBody);
      
      const requestPromise = fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-sendMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testBody)
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection test timeout')), 10000)
      );
      
      const response = await Promise.race([requestPromise, timeoutPromise]) as Response;

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('🔗 Connection test successful');
          setConnectionStatus('connected');
          setError(null);
        } else {
          throw new Error(data.details || data.error || 'Unknown error');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('disconnected');
      setError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Reset conversations when assistant changes
  useEffect(() => {
    if (selectedAssistant) {
      setCurrentConversationId(null);
      setMessages([]);
      setConversations([]);
      setConversationsLoaded(false);
      setError(null);
    }
  }, [selectedAssistant]);

  // Load conversations when assistant is selected
  useEffect(() => {
    if (selectedAssistant && assistantsLoaded && isAuthenticated && session) {
      fetchConversations();
      if (selectedAssistant.assistantId) {
        testConnection();
      }
    }
  }, [selectedAssistant, assistantsLoaded, isAuthenticated, session]);

  return {
    messages,
    conversations,
    currentConversationId,
    conversationsLoaded,
    isLoading,
    connectionStatus,
    error,
    sendMessage,
    loadConversation,
    startNewConversation,
    testConnection
  };
};
