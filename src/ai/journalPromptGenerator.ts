import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateWeeklyPrompt(userId: string) {
  // 1. Get last 7 days of user entries
  const { data: entries, error } = await supabase
    .from('ai_messages')
    .select('content')
    .eq('sender_type', 'user')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (error || !entries?.length) return 'Reflect on your week and reconnect with God.';

  const context = entries.map((e) => e.content).join('\n---\n');

  // 2. Use GPT to generate a follow-up prompt
  const result = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a spiritual growth mentor. Based on the user’s past week of journaling, generate a devotional reflection or journaling prompt that encourages emotional honesty, faith, and growth.'
      },
      {
        role: 'user',
        content: `Here is the user’s past week:\n\n${context}`
      }
    ],
    temperature: 0.7,
    max_tokens: 250
  });

  return result.choices[0].message.content?.trim() || 'Take time to reflect on your heart this week.';
}
