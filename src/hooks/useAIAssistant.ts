// File: src/hooks/useAIAssistant.ts
// Core hook for AI assistant functionality

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  AIAssistant,
  AIConversation,
  AIMessage,
  ChatState,
  SendMessageOptions,
  DevotionalContext,
  MessageMetadata,
  AIAssistantError,
  UserAIPreferences
} from '../types/ai';

// OpenAI integration (replace with actual OpenAI SDK)
interface OpenAIConfig {
  apiKey: string;
  assistantId?: string;
}

export const useAIAssistant = (userId: string) => {
  const [chatState, setChatState] = useState<ChatState>({
    conversation: null,
    messages: [],
    isLoading: false,
    isTyping: false,
    error: null
  });

  const [preferences, setPreferences] = useState<UserAIPreferences | null>(null);
  const [availableAssistants, setAvailableAssistants] = useState<AIAssistant[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load user preferences and available assistants
  useEffect(() => {
    loadUserPreferences();
    loadAvailableAssistants();
  }, [userId]);

  const loadUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_ai_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const defaultPrefs = {
          user_id: userId,
          include_devotional_context: true,
          include_journal_history: false,
          include_fitness_progress: false,
          conversation_style: 'balanced' as const
        };

        const { data: created } = await supabase
          .from('user_ai_preferences')
          .insert(defaultPrefs)
          .select()
          .single();

        setPreferences(created);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const loadAvailableAssistants = async () => {
    try {
      // Get user's org_id to filter assistants
      const { data: user } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', userId)
        .single();

      // Load assistants available to this user (org-specific + global)
      const { data, error } = await supabase
        .from('ai_assistants')
        .select('*')
        .eq('is_active', true)
        .or(`org_id.is.null,org_id.eq.${user?.org_id || 'null'}`)
        .order('user_role');

      if (error) throw error;
      setAvailableAssistants(data || []);
    } catch (error) {
      console.error('Error loading assistants:', error);
    }
  };

  const startConversation = async (
    assistantId: string,
    title?: string,
    devotionalContext?: DevotionalContext
  ): Promise<AIConversation> => {
    try {
      setChatState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          assistant_id: assistantId,
          title: title || `Chat with ${availableAssistants.find(a => a.id === assistantId)?.name}`,
          devotional_context: devotionalContext
        })
        .select(`
          *,
          ai_assistant:ai_assistants(*)
        `)
        .single();

      if (error) throw error;

      setChatState(prev => ({
        ...prev,
        conversation: data,
        messages: [],
        isLoading: false
      }));

      return data;
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start conversation'
      }));
      throw error;
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      setChatState(prev => ({ ...prev, isLoading: true, error: null }));

      // Load conversation details
      const { data: conversation, error: convError } = await supabase
        .from('ai_conversations')
        .select(`
          *,
          ai_assistant:ai_assistants(*)
        `)
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (convError) throw convError;

      // Load messages
      const { data: messages, error: msgError } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      setChatState({
        conversation,
        messages: messages || [],
        isLoading: false,
        isTyping: false,
        error: null
      });

    } catch (error) {
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load conversation'
      }));
    }
  };

  const sendMessage = async (
    content: string,
    options: SendMessageOptions = {}
  ): Promise<void> => {
    if (!chatState.conversation) {
      throw new AIAssistantError('No active conversation', 'CONVERSATION_NOT_FOUND');
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setChatState(prev => ({ ...prev, isTyping: true, error: null }));

      // Add user message to local state immediately
      const userMessage: AIMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: chatState.conversation.id,
        sender_type: 'user',
        content,
        created_at: new Date().toISOString()
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage]
      }));

      // Save user message to database
      const { data: savedUserMessage, error: userMsgError } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: chatState.conversation.id,
          sender_type: 'user',
          content
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;

      // Update local state with real message ID
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === userMessage.id ? savedUserMessage : msg
        )
      }));

      // Gather context for AI
      const context = await buildConversationContext(
        chatState.conversation,
        options
      );

      // Call OpenAI API (implement actual OpenAI integration)
      const aiResponse = await callOpenAI(
        chatState.conversation.ai_assistant,
        content,
        context,
        abortControllerRef.current.signal
      );

      // Save AI response to database
      const { data: aiMessage, error: aiMsgError } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: chatState.conversation.id,
          sender_type: 'assistant',
          content: aiResponse.message,
          metadata: aiResponse.metadata
        })
        .select()
        .single();

      if (aiMsgError) throw aiMsgError;

      // Update conversation timestamp
      await supabase
        .from('ai_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', chatState.conversation.id);

      // Add AI message to local state
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isTyping: false
      }));

    } catch (error) {
      setChatState(prev => ({
        ...prev,
        isTyping: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }));

      if (error instanceof Error && error.name !== 'AbortError') {
        throw error;
      }
    }
  };

  const buildConversationContext = async (
    conversation: AIConversation,
    options: SendMessageOptions
  ): Promise<any> => {
    const context: any = {
      user_role: null,
      conversation_history: chatState.messages.slice(-10), // Last 10 messages
    };

    // Get user role
    const { data: user } = await supabase
      .from('users')
      .select('user_role, first_name')
      .eq('id', userId)
      .single();

    context.user_role = user?.user_role;
    context.user_name = user?.first_name;

    // Add devotional context if enabled
    if (preferences?.include_devotional_context && conversation.devotional_context) {
      context.devotional_context = conversation.devotional_context;
    }

    // Add journal history if enabled
    if (preferences?.include_journal_history || options.includeJournalHistory) {
      const { data: journalEntries } = await supabase
        .from('journal_entries')
        .select('entry_text, emotion_tag, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      context.recent_journal_entries = journalEntries;
    }

    // Add fitness progress if enabled
    if (preferences?.include_fitness_progress || options.includeFitnessProgress) {
      // Add fitness data integration when available
      context.fitness_enabled = true;
    }

    return context;
  };

  const callOpenAI = async (
    assistant: AIAssistant,
    userMessage: string,
    context: any,
    signal: AbortSignal
  ): Promise<{ message: string; metadata: MessageMetadata }> => {
    // Mock implementation - replace with actual OpenAI SDK
    const startTime = Date.now();

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      if (signal.aborted) {
        throw new Error('Request was aborted');
      }

      // Mock response based on assistant personality
      const responses = {
        'Dad': `As a father, I understand the challenges you're facing. ${userMessage.includes('struggle') ? 'Remember that struggles are opportunities for growth. Let me share some wisdom...' : 'That\'s a great question. Here\'s what I\'ve learned...'}`,
        'Mom': `I hear your heart in this question. ${userMessage.includes('feel') ? 'Your feelings are valid, and God sees them too. Let\'s explore this together...' : 'Let me offer some gentle guidance...'}`,
        'Son': `Hey brother! ${userMessage.includes('afraid') || userMessage.includes('scared') ? 'I get it - those feelings are totally normal. You\'re not alone in this...' : 'That sounds exciting! Here\'s how I see it...'}`,
        'Coach': `Great question, champ! ${userMessage.includes('goal') ? 'I love that you\'re thinking about goals. Let\'s break this down...' : 'Here\'s how we can tackle this challenge...'}`,
      };

      const roleKey = assistant.user_role as keyof typeof responses;
      const mockResponse = responses[roleKey] || `Thank you for sharing that with me. Based on my role as a ${assistant.user_role}, here's my perspective...`;

      const endTime = Date.now();

      return {
        message: mockResponse,
        metadata: {
          response_time_ms: endTime - startTime,
          model: 'gpt-4-turbo-preview',
          token_usage: {
            prompt_tokens: Math.floor(Math.random() * 500) + 100,
            completion_tokens: Math.floor(Math.random() * 200) + 50,
            total_tokens: 0
          }
        }
      };
    } catch (error) {
      throw new AIAssistantError(
        'Failed to get AI response',
        'OPENAI_ERROR',
        error
      );
    }
  };

  const updatePreferences = async (updates: Partial<UserAIPreferences>) => {
    try {
      const { data, error } = await supabase
        .from('user_ai_preferences')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  const clearConversation = () => {
    setChatState({
      conversation: null,
      messages: [],
      isLoading: false,
      isTyping: false,
      error: null
    });
  };

  return {
    // State
    chatState,
    preferences,
    availableAssistants,

    // Actions
    startConversation,
    loadConversation,
    sendMessage,
    updatePreferences,
    clearConversation,

    // Utilities
    isConnected: !!chatState.conversation,
    canSendMessage: !!chatState.conversation && !chatState.isTyping && !chatState.isLoading
  };
};
