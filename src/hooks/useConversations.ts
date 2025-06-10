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

  const fetchConversations = async () => {
    if (!userId || !isAuthenticated || !selectedAssistant?.assistantId) return;

    try {
      console.log('💬 Fetching conversations...');

      const queryPromise = supabase
        .from('ai_conversations')
        .select('id, title, last_message_at, created_at')
        .eq('user_id', userId)
        .eq('assistant_id', selectedAssistant.assistantId)
        .order('last_message_at', { ascending: false })
        .limit(10);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Conversations query timeout')), 15000)
      );

      const result = await Promise.race([queryPromise, timeoutPromise]);

      if ('error' in result && result.error) {
        throw result.error;
      }

      const convData = 'data' in result ? result.data : [];
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

      const result = await Promise.race([query, timeoutPromise]);

      if ('error' in result && result.error) {
        throw result.error;
      }

      const uiMessages: Message[] = ('data' in result ? result.data : []).map((dbMsg: DBMessage) => ({
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

  useEffect(() => {
    if (selectedAssistant) {
      setCurrentConversationId(null);
      setMessages([]);
      setConversations([]);
      setConversationsLoaded(false);
      setError(null);
    }
  }, [selectedAssistant]);

  useEffect(() => {
    if (selectedAssistant && assistantsLoaded && isAuthenticated && session) {
      fetchConversations();
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
    sendMessage: () => {},
    loadConversation,
    startNewConversation: () => {},
    testConnection: () => {}
  };
};
