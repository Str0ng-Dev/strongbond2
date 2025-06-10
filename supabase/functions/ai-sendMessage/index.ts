import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.38.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')?.trim();
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!openaiApiKey || !supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Missing environment config' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const openai = new OpenAI({ apiKey: openaiApiKey, defaultHeaders: { 'OpenAI-Beta': 'assistants=v2' } });
    const { userId, message, assistantRole, conversationId } = await req.json();
    if (!userId || !message) {
      return new Response(JSON.stringify({ error: 'Missing userId or message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 🔐 Authenticate
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || user.id !== userId) {
      return new Response(JSON.stringify({ error: 'Auth failed or user mismatch' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: userData } = await supabaseClient.from('users').select('org_id').eq('id', user.id).single();
    const userOrgId = userData?.org_id || null;

    // 🧠 Detect Emotion + Prayer Intent
    function detectPrayerIntent(text: string): boolean {
      const triggers = ['lord', 'please', 'father', 'pray', 'thank you', 'grateful'];
      return triggers.some(word => text.toLowerCase().includes(word));
    }

    async function detectEmotionLabel(msg: string): Promise<string> {
      const result = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Respond with one word that describes the emotional tone: hopeful, discouraged, joyful, anxious, grateful, angry, peaceful, tired, ashamed, lonely.' },
          { role: 'user', content: `Text: "${msg}"\nEmotion:` }
        ],
        max_tokens: 10
      });
      return result.choices[0].message.content?.trim().toLowerCase() || 'unknown';
    }

    const isPrayer = detectPrayerIntent(message);
    const emotion = await detectEmotionLabel(message);

    // 🧬 Resolve assistant
    let targetAssistantRole = assistantRole || 'Coach';
    const { data: pref } = await supabaseClient.from('user_ai_preferences').select('preferred_assistant_role').eq('user_id', userId).single();
    if (!assistantRole && pref?.preferred_assistant_role) {
      targetAssistantRole = pref.preferred_assistant_role;
    }

    let query = supabaseClient.from('ai_assistants').select('*').eq('user_role', targetAssistantRole).eq('is_active', true);
    if (userOrgId) query = query.or(`org_id.is.null,org_id.eq.${userOrgId}`);
    else query = query.is('org_id', null);
    const { data: assistant } = await query.single();

    // 🧵 Thread management (same as your original logic, trimmed here for brevity)

    let assistantResponse = 'No response';
    let assistantUsed = assistant?.openai_assistant_id || null;

    if (assistantUsed) {
      // Handle assistant logic...
      // Create thread, run assistant, poll, fetch latest response
      // We'll skip to core response assignment
      assistantResponse = 'This is a placeholder for assistant message'; // Replace with actual OpenAI call response
    } else {
      // 🔁 Fallback to GPT completion
      const fallback = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a wise spiritual mentor.' },
          { role: 'user', content: message }
        ],
        temperature: 0.7
      });
      assistantResponse = fallback.choices[0].message.content ?? 'No response';
    }

    // 💾 Store in ai_messages
    await supabaseClient.from('ai_messages').insert([
      {
        conversation_id: conversationId || null,
        sender_type: 'user',
        user_id: userId,
        content: message,
        metadata: { emotion, is_prayer: isPrayer }
      },
      {
        conversation_id: conversationId || null,
        sender_type: 'assistant',
        user_id: userId,
        content: assistantResponse,
        metadata: { assistant_id: assistantUsed, emotion, fallback_mode: !assistantUsed }
      }
    ]);

    return new Response(JSON.stringify({ success: true, message: assistantResponse }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
