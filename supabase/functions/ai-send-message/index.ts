import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SendMessageRequest {
  conversationId?: string;
  userId: string;
  message: string;
  assistantRole?: string;
}

interface ConversationContext {
  devotional_context?: any;
  include_journal_history?: boolean;
  include_fitness_progress?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize clients
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') ?? '',
    })

    // Parse request
    const { conversationId, userId, message, assistantRole }: SendMessageRequest = await req.json()

    if (!userId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 1: Get user's preferred assistant or use provided role
    let targetAssistantRole = assistantRole;
    
    if (!targetAssistantRole) {
      const { data: userPrefs } = await supabaseClient
        .from('user_ai_preferences')
        .select('preferred_assistant_role')
        .eq('user_id', userId)
        .single()
      
      targetAssistantRole = userPrefs?.preferred_assistant_role || 'Coach' // Default fallback
    }

    // Step 2: Get assistant details from ai_assistants table
    const { data: assistant, error: assistantError } = await supabaseClient
      .from('ai_assistants')
      .select('*')
      .eq('user_role', targetAssistantRole)
      .eq('is_active', true)
      .single()

    if (assistantError || !assistant) {
      return new Response(
        JSON.stringify({ error: `No active assistant found for role: ${targetAssistantRole}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Handle conversation and thread management
    let conversation;
    let threadId;

    if (conversationId) {
      // Fetch existing conversation
      const { data: existingConv } = await supabaseClient
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single()

      if (existingConv) {
        conversation = existingConv
        threadId = existingConv.thread_id
      }
    }

    // Create new thread if needed
    if (!threadId) {
      const thread = await openai.beta.threads.create()
      threadId = thread.id

      if (conversation) {
        // Update existing conversation with thread_id
        await supabaseClient
          .from('ai_conversations')
          .update({ thread_id: threadId })
          .eq('id', conversation.id)
      } else {
        // Create new conversation
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
          .single()

        if (convError) {
          throw new Error(`Failed to create conversation: ${convError.message}`)
        }
        conversation = newConv
      }
    }

    // Step 4: Add user message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message
    })

    // Step 5: Create and run assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistant.openai_assistant_id || 'asst_default', // Fallback if no assistant_id
      instructions: assistant.personality_prompt
    })

    // Step 6: Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)
    
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)
    }

    if (runStatus.status !== 'completed') {
      throw new Error(`Assistant run failed with status: ${runStatus.status}`)
    }

    // Step 7: Get assistant response
    const messages = await openai.beta.threads.messages.list(threadId, {
      order: 'desc',
      limit: 1
    })

    const assistantMessage = messages.data[0]
    if (!assistantMessage || assistantMessage.role !== 'assistant') {
      throw new Error('No assistant response found')
    }

    const assistantContent = assistantMessage.content[0]
    let responseText = 'I apologize, but I encountered an issue generating a response.'
    
    if (assistantContent.type === 'text') {
      responseText = assistantContent.text.value
    }

    // Step 8: Store messages in database
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
          assistant_id: assistant.id,
          model: 'gpt-4-turbo-preview'
        },
        created_at: new Date().toISOString()
      }
    ]

    const { error: messageError } = await supabaseClient
      .from('ai_messages')
      .insert(messagesToInsert)

    if (messageError) {
      console.error('Failed to store messages:', messageError)
    }

    // Step 9: Update conversation timestamp
    await supabaseClient
      .from('ai_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id)

    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        message: responseText,
        conversationId: conversation.id,
        assistantRole: targetAssistantRole
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('AI sendMessage error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})