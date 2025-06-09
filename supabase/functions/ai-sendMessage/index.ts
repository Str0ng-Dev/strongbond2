import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.38.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface SendMessageRequest {
  userId: string;
  message: string;
  assistantRole?: string;
  conversationId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openaiApiKey?.trim()) {
      console.error('OpenAI API key is missing or empty');
      return new Response(JSON.stringify({
        error: 'OpenAI API key not configured',
        details: 'Please set the OPENAI_API_KEY environment variable'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(JSON.stringify({
        error: 'Supabase configuration missing',
        details: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize clients
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const openai = new OpenAI({
      apiKey: openaiApiKey.trim(),
      defaultHeaders: { 'OpenAI-Beta': 'assistants=v2' }
    });

    // Parse request body - matches your current client
    const { userId, message, assistantRole, conversationId }: SendMessageRequest = await req.json();

    if (!userId || !message) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: userId, message'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing message for user ${userId} with role ${assistantRole || 'default'}`);

    // Extract user context from JWT token
    const authHeader = req.headers.get('authorization');
    let userOrgId = null;
    let authenticatedUserId = null;

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        console.log(`Processing auth token: ${token.substring(0, 20)}...`);
        
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
        
        if (authError) {
          console.error('Auth verification failed:', authError);
          return new Response(JSON.stringify({
            error: 'Authentication failed',
            details: authError.message
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        if (user) {
          authenticatedUserId = user.id;
          console.log(`Authenticated user: ${user.id}`);
          
          // Verify user ID matches
          if (authenticatedUserId !== userId) {
            return new Response(JSON.stringify({
              error: 'Access denied',
              details: 'User ID mismatch'
            }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          // Get user's org_id from users table for multi-tenant context
          const { data: userData, error: userDataError } = await supabaseClient
            .from('users')
            .select('org_id')
            .eq('id', user.id)
            .single();
          
          if (userDataError) {
            console.warn('Could not fetch user org data:', userDataError);
          } else {
            userOrgId = userData?.org_id || null;
            console.log(`User org context: ${userOrgId ? userOrgId : 'individual'}`);
          }
        }
      } catch (authParseError) {
        console.error('Auth token parsing failed:', authParseError);
        return new Response(JSON.stringify({
          error: 'Invalid authentication token',
          details: 'Could not parse authorization header'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      return new Response(JSON.stringify({
        error: 'Missing authorization',
        details: 'Authorization header is required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get target assistant role
    let targetAssistantRole = assistantRole || 'Coach'; // Default fallback

    if (!assistantRole) {
      const { data: userPrefs } = await supabaseClient
        .from('user_ai_preferences')
        .select('preferred_assistant_role')
        .eq('user_id', userId)
        .single();
      
      if (userPrefs?.preferred_assistant_role) {
        targetAssistantRole = userPrefs.preferred_assistant_role;
      }
    }

    // Look up assistant in database
    let query = supabaseClient
      .from('ai_assistants')
      .select('*')
      .eq('user_role', targetAssistantRole)
      .eq('is_active', true);

    // Apply multi-tenant filtering
    if (userOrgId) {
      query = query.or(`org_id.is.null,org_id.eq.${userOrgId}`);
    } else {
      query = query.is('org_id', null);
    }

    const { data: assistant, error: assistantError } = await query.single();

    // If assistant found and has OpenAI ID, use Assistants API
    if (assistant && assistant.openai_assistant_id) {
      console.log(`Using OpenAI Assistant: ${assistant.openai_assistant_id}`);

      // Handle conversation and thread
      let conversation = null;
      let threadId = null;

      if (conversationId) {
        const { data: existingConv, error: convError } = await supabaseClient
          .from('ai_conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('user_id', userId)
          .eq('assistant_id', assistant.id)
          .single();

        if (!convError && existingConv) {
          conversation = existingConv;
          threadId = existingConv.thread_id;
        }
      }

      // Create new thread if needed
      if (!threadId) {
        console.log('Creating new OpenAI thread...');
        const thread = await openai.beta.threads.create();
        threadId = thread.id;
        console.log(`Created thread: ${threadId}`);

        if (conversation) {
          await supabaseClient
            .from('ai_conversations')
            .update({ thread_id: threadId })
            .eq('id', conversation.id);
        } else {
          const { data: newConv, error: convError } = await supabaseClient
            .from('ai_conversations')
            .insert({
              user_id: userId,
              assistant_id: assistant.id,
              thread_id: threadId,
              title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
              last_message_at: new Date().toISOString()
            })
            .select()
            .single();

          if (!convError) {
            conversation = newConv;
          }
        }
      }

      // Add user message to thread
      console.log(`Adding user message to thread ${threadId}...`);
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: message
      });

      // Create and run assistant with context-aware instructions
      console.log(`Starting assistant run with ${assistant.openai_assistant_id}...`);
      
      let contextualInstructions = assistant.personality_prompt || '';
      if (userOrgId) {
        contextualInstructions += `\n\nContext: This user is part of an organization. Tailor responses for organizational/group devotional context.`;
      } else {
        contextualInstructions += `\n\nContext: This is an individual user. Tailor responses for personal devotional practice.`;
      }

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistant.openai_assistant_id,
        instructions: contextualInstructions
      });

      // Poll for completion
      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      let attempts = 0;
      const maxAttempts = 60;

      console.log(`Polling for run completion... Initial status: ${runStatus.status}`);
      
      while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        attempts++;
        
        if (attempts % 10 === 0) {
          console.log(`Still polling... Status: ${runStatus.status}, Attempt: ${attempts}`);
        }
      }

      console.log(`Run completed with status: ${runStatus.status}`);

      if (runStatus.status !== 'completed') {
        console.error(`Assistant run failed with status: ${runStatus.status}`);
        let errorDetails = `Assistant run failed with status: ${runStatus.status}`;
        if (runStatus.last_error) {
          errorDetails += `. Error: ${runStatus.last_error.message}`;
        }
        return new Response(JSON.stringify({
          error: 'Assistant run failed',
          details: errorDetails
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get assistant response
      console.log('Fetching assistant response...');
      const messages = await openai.beta.threads.messages.list(threadId, {
        order: 'desc',
        limit: 1
      });

      const assistantMessage = messages.data[0];
      if (!assistantMessage || assistantMessage.role !== 'assistant') {
        console.error('No assistant response found');
        return new Response(JSON.stringify({
          error: 'No response',
          details: 'Assistant did not provide a response'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const assistantContent = assistantMessage.content[0];
      let responseText = 'I apologize, but I encountered an issue generating a response.';
      
      if (assistantContent.type === 'text') {
        responseText = assistantContent.text.value;
      }

      console.log('Assistant response received, storing messages...');

      // Store messages in database
      if (conversation) {
        const messagesToInsert = [
          {
            conversation_id: conversation.id,
            sender_type: 'user',
            content: message,
            created_at: new Date().toISOString()
          },
          {
            conversation_id: conversation.id,
            sender_type: 'assistant',
            content: responseText,
            metadata: {
              openai_run_id: run.id,
              openai_message_id: assistantMessage.id,
              assistant_id: assistant.id,
              model: 'gpt-4-turbo-preview',
              thread_id: threadId,
              user_context: userOrgId ? 'organization' : 'individual'
            },
            created_at: new Date().toISOString()
          }
        ];

        await supabaseClient.from('ai_messages').insert(messagesToInsert);
        await supabaseClient
          .from('ai_conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversation.id);
      }

      console.log('Message processing completed successfully');

      return new Response(JSON.stringify({
        success: true,
        message: responseText,
        conversationId: conversation?.id,
        assistant: {
          id: assistant.id,
          name: assistant.name,
          role: assistant.user_role
        },
        metadata: {
          thread_id: threadId,
          run_id: run.id,
          message_id: assistantMessage.id,
          user_context: userOrgId ? 'organization' : 'individual'
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      // Fallback: Use chat completions API
      console.log(`No assistant found for role ${targetAssistantRole}, using chat completion fallback`);
      
      const rolePrompts = {
        'Dad': 'You are a wise, caring father figure and spiritual mentor. Provide guidance with warmth, wisdom, and biblical insight.',
        'Mom': 'You are a nurturing, loving mother figure. Offer comfort, encouragement, and gentle spiritual guidance.',
        'Coach': 'You are an enthusiastic, motivational coach. Encourage spiritual and physical growth with energy and positivity.',
        'Son': 'You are a supportive peer and friend. Share insights with humility and relatability.',
        'Daughter': 'You are a caring, insightful companion. Offer support with empathy and understanding.',
        'Single Man': 'You are a thoughtful single man sharing your spiritual journey. Provide honest, relatable guidance.',
        'Single Woman': 'You are a wise single woman offering spiritual insights. Share with authenticity and grace.',
        'Church Leader': 'You are a pastoral leader offering biblical wisdom and spiritual guidance with authority and care.'
      };

      const systemPrompt = rolePrompts[targetAssistantRole as keyof typeof rolePrompts] || rolePrompts['Coach'];

      try {
        console.log('Making OpenAI chat completion request...');
        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.7
        });

        console.log('OpenAI request successful');
        const responseText = completion.choices[0]?.message?.content || 'I apologize, but I encountered an issue generating a response.';

        // Handle conversation storage (simplified for fallback)
        let conversation = null;
        if (conversationId) {
          const { data: existingConv } = await supabaseClient
            .from('ai_conversations')
            .select('*')
            .eq('id', conversationId)
            .eq('user_id', userId)
            .single();
          conversation = existingConv;
        }

        if (!conversation) {
          const { data: newConv, error: convError } = await supabaseClient
            .from('ai_conversations')
            .insert({
              user_id: userId,
              assistant_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
              title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
              last_message_at: new Date().toISOString()
            })
            .select()
            .single();

          if (!convError) {
            conversation = newConv;
          }
        }

        // Store messages if conversation exists
        if (conversation) {
          const messagesToInsert = [
            {
              conversation_id: conversation.id,
              sender_type: 'user',
              content: message,
              created_at: new Date().toISOString()
            },
            {
              conversation_id: conversation.id,
              sender_type: 'assistant',
              content: responseText,
              metadata: {
                model: 'gpt-4-turbo-preview',
                fallback_mode: true,
                assistant_role: targetAssistantRole,
                user_context: userOrgId ? 'organization' : 'individual'
              },
              created_at: new Date().toISOString()
            }
          ];

          await supabaseClient.from('ai_messages').insert(messagesToInsert);
          await supabaseClient
            .from('ai_conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversation.id);
        }

        return new Response(JSON.stringify({
          success: true,
          message: responseText,
          conversationId: conversation?.id,
          assistantRole: targetAssistantRole,
          mode: 'fallback'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        
        let errorDetails = 'Unknown OpenAI error';
        if (openaiError instanceof Error) {
          errorDetails = openaiError.message;
          
          if (openaiError.message.includes('401') || openaiError.message.includes('Incorrect API key')) {
            errorDetails = `API key authentication failed. Please verify your OpenAI API key is correct and has sufficient credits. Error: ${openaiError.message}`;
          }
        }
        
        return new Response(JSON.stringify({
          error: 'OpenAI API error',
          details: errorDetails
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

  } catch (error) {
    console.error('AI sendMessage error:', error);
    
    let errorMessage = 'Internal server error';
    let errorDetails = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
      if (error.message.includes('401') || error.message.includes('Incorrect API key')) {
        errorMessage = 'OpenAI authentication failed';
        errorDetails = 'Invalid or expired OpenAI API key';
      } else if (error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded';
        errorDetails = 'OpenAI API rate limit exceeded. Please try again later.';
      } else if (error.message.includes('insufficient_quota')) {
        errorMessage = 'OpenAI quota exceeded';
        errorDetails = 'OpenAI API quota exceeded. Please check your billing.';
      }
    }

    return new Response(JSON.stringify({
      error: errorMessage,
      details: errorDetails
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});