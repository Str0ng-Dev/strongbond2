import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.38.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SendMessageRequest {
  user_id: string;
  message: string;
  assistant_id: string;
  conversation_id?: string;
}

interface AssistantRecord {
  id: string;
  org_id: string | null;
  user_role: string;
  name: string;
  description: string | null;
  personality_prompt: string;
  openai_assistant_id: string | null;
  is_active: boolean;
}

interface ConversationRecord {
  id: string;
  user_id: string;
  assistant_id: string;
  title: string | null;
  thread_id: string | null;
  last_message_at: string;
  created_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!openaiApiKey?.trim()) {
      console.error('OpenAI API key is missing or empty')
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured',
          details: 'Please set the OPENAI_API_KEY environment variable in your Supabase project settings'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing')
      return new Response(
        JSON.stringify({ 
          error: 'Supabase configuration missing',
          details: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize clients
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
    const openai = new OpenAI({ 
      apiKey: openaiApiKey.trim(),
      defaultHeaders: {
        'OpenAI-Beta': 'assistants=v2'
      }
    })

    // Parse and validate request
    const { user_id, message, assistant_id, conversation_id }: SendMessageRequest = await req.json()

    if (!user_id || !message || !assistant_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: 'user_id, message, and assistant_id are required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing message for user ${user_id}, assistant ${assistant_id}`)

    // Extract org_id from JWT if available
    const authHeader = req.headers.get('authorization')
    let userOrgId: string | null = null
    
    if (authHeader) {
      try {
        // Get user info from Supabase auth
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
          authHeader.replace('Bearer ', '')
        )
        
        if (!authError && user) {
          // Get user's org_id from users table
          const { data: userData } = await supabaseClient
            .from('users')
            .select('org_id')
            .eq('id', user.id)
            .single()
          
          userOrgId = userData?.org_id || null
        }
      } catch (authParseError) {
        console.warn('Could not parse auth token:', authParseError)
      }
    }

    // Step 1: Look up the assistant and verify access
    const { data: assistant, error: assistantError } = await supabaseClient
      .from('ai_assistants')
      .select('*')
      .eq('id', assistant_id)
      .eq('is_active', true)
      .single()

    if (assistantError || !assistant) {
      console.error('Assistant not found:', assistantError)
      return new Response(
        JSON.stringify({ 
          error: 'Assistant not found',
          details: 'The specified assistant does not exist or is not active'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const assistantRecord = assistant as AssistantRecord

    // Verify org access - assistant must be global (org_id = null) or match user's org
    if (assistantRecord.org_id !== null && assistantRecord.org_id !== userOrgId) {
      console.error(`Access denied: user org ${userOrgId} cannot access assistant org ${assistantRecord.org_id}`)
      return new Response(
        JSON.stringify({ 
          error: 'Access denied',
          details: 'You do not have access to this assistant'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!assistantRecord.openai_assistant_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Assistant not configured',
          details: 'This assistant does not have an OpenAI assistant ID configured'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Handle conversation and thread
    let conversation: ConversationRecord | null = null
    let threadId: string | null = null

    if (conversation_id) {
      // Fetch existing conversation
      const { data: existingConv, error: convError } = await supabaseClient
        .from('ai_conversations')
        .select('*')
        .eq('id', conversation_id)
        .eq('user_id', user_id)
        .eq('assistant_id', assistant_id)
        .single()

      if (convError) {
        console.error('Conversation not found:', convError)
        return new Response(
          JSON.stringify({ 
            error: 'Conversation not found',
            details: 'The specified conversation does not exist or you do not have access to it'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      conversation = existingConv as ConversationRecord
      threadId = conversation.thread_id
    }

    // Step 3: Create or use existing OpenAI thread
    if (!threadId) {
      console.log('Creating new OpenAI thread...')
      const thread = await openai.beta.threads.create()
      threadId = thread.id
      console.log(`Created thread: ${threadId}`)

      if (conversation) {
        // Update existing conversation with thread_id
        const { error: updateError } = await supabaseClient
          .from('ai_conversations')
          .update({ thread_id: threadId })
          .eq('id', conversation.id)

        if (updateError) {
          console.error('Failed to update conversation with thread_id:', updateError)
        }
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabaseClient
          .from('ai_conversations')
          .insert({
            user_id,
            assistant_id,
            thread_id: threadId,
            title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
            last_message_at: new Date().toISOString()
          })
          .select()
          .single()

        if (convError) {
          console.error('Failed to create conversation:', convError)
          return new Response(
            JSON.stringify({ 
              error: 'Failed to create conversation',
              details: convError.message
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        conversation = newConv as ConversationRecord
      }
    }

    if (!conversation) {
      return new Response(
        JSON.stringify({ 
          error: 'Conversation error',
          details: 'Failed to establish conversation context'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 4: Add user message to thread
    console.log(`Adding user message to thread ${threadId}...`)
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message
    })

    // Step 5: Create and run assistant
    console.log(`Starting assistant run with ${assistantRecord.openai_assistant_id}...`)
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantRecord.openai_assistant_id,
      instructions: assistantRecord.personality_prompt
    })

    // Step 6: Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)
    let attempts = 0
    const maxAttempts = 60 // 60 seconds timeout
    
    console.log(`Polling for run completion... Initial status: ${runStatus.status}`)
    
    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)
      attempts++
      
      if (attempts % 10 === 0) {
        console.log(`Still polling... Status: ${runStatus.status}, Attempt: ${attempts}`)
      }
    }

    console.log(`Run completed with status: ${runStatus.status}`)

    if (runStatus.status !== 'completed') {
      console.error(`Assistant run failed with status: ${runStatus.status}`)
      
      let errorDetails = `Assistant run failed with status: ${runStatus.status}`
      if (runStatus.last_error) {
        errorDetails += `. Error: ${runStatus.last_error.message}`
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Assistant run failed',
          details: errorDetails
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 7: Get assistant response
    console.log('Fetching assistant response...')
    const messages = await openai.beta.threads.messages.list(threadId, {
      order: 'desc',
      limit: 1
    })

    const assistantMessage = messages.data[0]
    if (!assistantMessage || assistantMessage.role !== 'assistant') {
      console.error('No assistant response found')
      return new Response(
        JSON.stringify({ 
          error: 'No response',
          details: 'Assistant did not provide a response'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const assistantContent = assistantMessage.content[0]
    let responseText = 'I apologize, but I encountered an issue generating a response.'
    
    if (assistantContent.type === 'text') {
      responseText = assistantContent.text.value
    }

    console.log('Assistant response received, storing messages...')

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
          openai_message_id: assistantMessage.id,
          assistant_id: assistantRecord.id,
          model: 'gpt-4-turbo-preview',
          thread_id: threadId
        },
        created_at: new Date().toISOString()
      }
    ]

    const { error: messageError } = await supabaseClient
      .from('ai_messages')
      .insert(messagesToInsert)

    if (messageError) {
      console.error('Failed to store messages:', messageError)
      // Don't fail the request, just log the error
    }

    // Step 9: Update conversation timestamp
    const { error: updateError } = await supabaseClient
      .from('ai_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id)

    if (updateError) {
      console.error('Failed to update conversation timestamp:', updateError)
      // Don't fail the request, just log the error
    }

    console.log('Message processing completed successfully')

    // Step 10: Return response
    return new Response(
      JSON.stringify({
        success: true,
        message: responseText,
        conversation_id: conversation.id,
        assistant: {
          id: assistantRecord.id,
          name: assistantRecord.name,
          role: assistantRecord.user_role
        },
        metadata: {
          thread_id: threadId,
          run_id: run.id,
          message_id: assistantMessage.id
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('AI sendMessage error:', error)
    
    let errorMessage = 'Internal server error'
    let errorDetails = 'An unexpected error occurred'
    
    if (error instanceof Error) {
      errorDetails = error.message
      
      // Handle specific OpenAI errors
      if (error.message.includes('401') || error.message.includes('Incorrect API key')) {
        errorMessage = 'OpenAI authentication failed'
        errorDetails = 'Invalid or expired OpenAI API key'
      } else if (error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded'
        errorDetails = 'OpenAI API rate limit exceeded. Please try again later.'
      } else if (error.message.includes('insufficient_quota')) {
        errorMessage = 'OpenAI quota exceeded'
        errorDetails = 'OpenAI API quota exceeded. Please check your billing.'
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})