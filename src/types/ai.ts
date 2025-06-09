// File: src/types/ai.ts
// Essential AI types only - stripped down for minimal branch

export type UserRole = 'Dad' | 'Mom' | 'Son' | 'Daughter' | 'Coach' | 'Church Leader' | 'Single Man' | 'Single Woman';

export interface AIAssistant {
  id: string;
  name: string;
  user_role: UserRole;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'assistant';
  content: string;
  metadata?: MessageMetadata | null;
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  assistant_id: string;
  title: string;
  last_message_at: string;
  created_at: string;
  ai_assistant?: AIAssistant;
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
