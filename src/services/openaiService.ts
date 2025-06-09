// File: src/services/openaiService.ts
// Real OpenAI integration for StrongBond AI assistants

import OpenAI from 'openai';
import { AIAssistant, MessageMetadata, DevotionalContext } from '../types/ai';

interface OpenAIConfig {
  apiKey: string;
  organization?: string;
}

interface ConversationContext {
  user_role: string;
  user_name: string;
  devotional_context?: DevotionalContext;
  recent_journal_entries?: any[];
  conversation_history: any[];
  fitness_enabled?: boolean;
}

export class OpenAIService {
  private client: OpenAI;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
      dangerouslyAllowBrowser: true // Only for development
    });
  }

  async createAssistantMessage(
    assistant: AIAssistant,
    userMessage: string,
    context: ConversationContext,
    signal?: AbortSignal
  ): Promise<{ message: string; metadata: MessageMetadata }> {
    const startTime = Date.now();

    try {
      // Build system prompt based on assistant role and context
      const systemPrompt = this.buildSystemPrompt(assistant, context);

      // Build conversation history for context
      const messages = this.buildMessageHistory(context.conversation_history, systemPrompt, userMessage);

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 500,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }, {
        signal
      });

      const endTime = Date.now();
      const response = completion.choices[0]?.message?.content || 'I apologize, but I encountered an issue. Please try again.';

      const metadata: MessageMetadata = {
        token_usage: {
          prompt_tokens: completion.usage?.prompt_tokens || 0,
          completion_tokens: completion.usage?.completion_tokens || 0,
          total_tokens: completion.usage?.total_tokens || 0
        },
        response_time_ms: endTime - startTime,
        model: completion.model,
        temperature: 0.7
      };

      return { message: response, metadata };

    } catch (error) {
      const endTime = Date.now();

      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }

      console.error('OpenAI API error:', error);

      const metadata: MessageMetadata = {
        response_time_ms: endTime - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      throw new Error(`OpenAI API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSystemPrompt(assistant: AIAssistant, context: ConversationContext): string {
    const basePrompts = {
      'Dad': `You are a wise, loving father figure and spiritual mentor. You provide guidance with patience, strength, and biblical wisdom. You understand the challenges of leadership, family responsibility, and growing in faith. Your responses are encouraging, practical, and rooted in Christian values. You speak with the authority of experience but also with humility and grace.`,

      'Mom': `You are a nurturing, wise mother figure and spiritual mentor. You provide guidance with compassion, intuition, and deep emotional understanding. You excel at helping people process their feelings and find hope in difficult situations. Your responses are warm, empathetic, and filled with biblical encouragement. You create a safe space for vulnerability and growth.`,

      'Son': `You are an enthusiastic, relatable young man who serves as a peer spiritual companion. You understand the challenges of growing up in faith, dealing with peer pressure, and finding your identity in Christ. Your responses are energetic, authentic, and encouraging. You're not afraid to admit when you don't have all the answers, but you're always pointing others toward Jesus.`,

      'Coach': `You are an encouraging, motivational coach who helps people grow both spiritually and physically. You understand goal-setting, overcoming obstacles, and pushing through challenges. Your responses are energetic, practical, and focused on action steps. You help people see their potential and take concrete steps toward their goals, always with a foundation in faith.`,

      'Church Leader': `You are a wise pastor and spiritual guide with deep biblical knowledge and pastoral care experience. You provide theological insight, biblical context, and pastoral guidance. Your responses are thoughtful, scripture-based, and demonstrate both scholarship and heart for people. You help people understand God's word and apply it to their lives.`,

      'Single Woman': `You are a strong, independent woman of faith who understands the unique joys and challenges of singleness. You provide encouragement about finding purpose, building community, and thriving as a single person. Your responses celebrate singleness as a gift while acknowledging its difficulties, always pointing to identity in Christ.`,

      'Single Man': `You are a confident man of faith who understands the journey of single men seeking to honor God. You provide guidance on purpose, purity, and building meaningful relationships. Your responses are honest about struggles while encouraging growth in character and faith. You help other men see their value and calling in Christ.`,

      'Daughter': `You are a vibrant young woman of faith who understands the unique challenges young women face today. You provide encouragement about identity, purpose, and navigating relationships while staying true to biblical values. Your responses are authentic, hopeful, and help other young women see their worth in Christ.`
    };

    let systemPrompt = basePrompts[assistant.user_role as keyof typeof basePrompts] || basePrompts['Coach'];

    // Add context-specific information
    if (context.user_name) {
      systemPrompt += ` You're talking with ${context.user_name}.`;
    }

    if (context.devotional_context) {
      systemPrompt += ` They're currently working through a devotional`;
      if (context.devotional_context.scripture_reference) {
        systemPrompt += ` focusing on ${context.devotional_context.scripture_reference}`;
      }
      if (context.devotional_context.week_theme) {
        systemPrompt += ` with the theme "${context.devotional_context.week_theme}"`;
      }
      systemPrompt += '.';
    }

    if (context.recent_journal_entries && context.recent_journal_entries.length > 0) {
      systemPrompt += ` Recent journal entries suggest they've been reflecting on themes like: ${context.recent_journal_entries.map(entry => entry.emotion_tag).filter(Boolean).join(', ')}.`;
    }

    systemPrompt += `

Guidelines:
- Keep responses to 2-3 paragraphs maximum
- Be conversational and warm, not preachy
- Include relevant scripture when appropriate, but don't over-quote
- Ask follow-up questions to encourage deeper conversation
- Be authentic to your role while being helpful
- If asked about topics outside your expertise, acknowledge limitations gracefully
- Always point toward hope, growth, and God's love
- Remember this is a devotional/spiritual growth context`;

    return systemPrompt;
  }

  private buildMessageHistory(
    conversationHistory: any[],
    systemPrompt: string,
    currentMessage: string
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add recent conversation history (last 10 messages)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach(msg => {
      if (msg.sender_type === 'user') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.sender_type === 'assistant') {
        messages.push({ role: 'assistant', content: msg.content });
      }
    });

    // Add current user message
    messages.push({ role: 'user', content: currentMessage });

    return messages;
  }

  // Method to test API connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      });
      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
let openaiService: OpenAIService | null = null;

export const getOpenAIService = (): OpenAIService => {
  if (!openaiService) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY environment variable.');
    }

    openaiService = new OpenAIService({ apiKey });
  }
  return openaiService;
};

export default OpenAIService;
