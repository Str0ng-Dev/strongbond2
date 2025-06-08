// File: src/types/ai.ts
// AI Assistant type definitions

import { User } from './index';

export type UserRole = 'Dad' | 'Mom' | 'Son' | 'Daughter' | 'Single Man' | 'Single Woman' | 'Church Leader' | 'Coach';

export type ConversationStyle = 'brief' | 'balanced' | 'detailed';

export type MessageSender = 'user' | 'assistant';

export interface AIAssistant {
  id: string;
  org_id?: string | null;
  user_role: UserRole;
  name: string;
  description?: string;
  personality_prompt: string;
  openai_assistant_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  assistant_id: string;
  title?: string | null;
  devotional_context?: DevotionalContext | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;

  // Populated via joins
  ai_assistant?: AIAssistant;
  message_count?: number;
  last_message?: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  sender_type: MessageSender;
  content: string;
  metadata?: MessageMetadata | null;
  created_at: string;
}

export interface UserAIPreferences {
  user_id: string;
  preferred_assistant_role?: UserRole | null;
  include_devotional_context: boolean;
  include_journal_history: boolean;
  include_fitness_progress: boolean;
  conversation_style: ConversationStyle;
  created_at: string;
  updated_at: string;
}

// Context and metadata interfaces
export interface DevotionalContext {
  devotional_id?: string;
  day_number?: number;
  week_theme?: string;
  scripture_reference?: string;
  current_challenge?: string;
}

export interface MessageMetadata {
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  response_time_ms?: number;
  model?: string;
  temperature?: number;
  error?: string;
}

// Hook and component interfaces
export interface ChatState {
  conversation: AIConversation | null;
  messages: AIMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
}

export interface SendMessageOptions {
  includeDevotionalContext?: boolean;
  includeJournalHistory?: boolean;
  includeFitnessProgress?: boolean;
}

export interface AssistantPersonality {
  role: UserRole;
  name: string;
  description: string;
  icon: string;
  color: string;
  greeting: string;
  specialties: string[];
}

// API response types
export interface CreateConversationRequest {
  assistant_id: string;
  title?: string;
  devotional_context?: DevotionalContext;
}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
  options?: SendMessageOptions;
}

export interface AIResponse {
  message: string;
  metadata: MessageMetadata;
  conversation_updated: boolean;
}

// Assistant selector types
export interface AssistantOption {
  assistant: AIAssistant;
  personality: AssistantPersonality;
  isRecommended: boolean;
  matchReason?: string;
}

// Conversation management
export interface ConversationSummary {
  id: string;
  title: string;
  assistant_name: string;
  assistant_role: UserRole;
  last_message_preview: string;
  last_message_at: string;
  message_count: number;
  has_unread: boolean;
}

// Error types
export class AIAssistantError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AIAssistantError';
  }
}

export type AIErrorCode =
  | 'ASSISTANT_NOT_FOUND'
  | 'CONVERSATION_NOT_FOUND'
  | 'OPENAI_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_PERMISSIONS'
  | 'CONTEXT_TOO_LARGE'
  | 'NETWORK_ERROR';
