import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.38.2'

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check for required environment variables with detailed logging
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Debug logging for environment variables (without exposing actual keys)
    console.log('Environment check:')
    console.log('- OPENAI_API_KEY exists:', !!openaiApiKey)
    console.log('- OPENAI_API_KEY length:', openaiApiKey?.length || 0)
    console.log('- SUPABASE_URL exists:', !!supabaseUrl)
    console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey)

    if (!openaiApiKey || openaiApiKey.trim() === '') {
      console.error('OpenAI API key is missing or empty')
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured',
          details: 'The OPENAI_API_KEY environment variable is not set or is empty. Please check your Supabase Edge Function secrets configuration.',
          debug: {
            keyExists: !!openaiApiKey,
            keyLength: openaiApiKey?.length || 0,
            keyStartsWith: openaiApiKey ? openaiApiKey.substring(0, 7) + '...' : 'N/A'
          }
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
    
    // Initialize OpenAI with explicit error handling and v2 Assistants API
    let openai;
    try {
      openai = new OpenAI({ 
        apiKey: openaiApiKey.trim(), // Ensure no whitespace
        defaultHeaders: {
          'OpenAI-Beta': 'assistants=v2'
        }
      })
      console.log('OpenAI client initialized successfully with Assistants API v2')
    } catch (openaiInitError) {
      console.error('Failed to initialize OpenAI client:', openaiInitError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to initialize OpenAI client',
          details: openaiInitError instanceof Error ? openaiInitError.message : 'Unknown initialization error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const { conversationId, userId, message, assistantRole }: SendMessageRequest = await req.json()

    if (!userId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing message for user ${userId} with role ${assistantRole || 'default'}`)

    // Step 1: Get user's preferred assistant or use provided role
    let targetAssistantRole = assistantRole || 'Coach' // Default fallback

    if (!assistantRole) {
      const { data: userPrefs } = await supabaseClient
        .from('user_ai_preferences')
        .select('preferred_assistant_role')
        .eq('user_id', userId)
        .single()
      
      if (userPrefs?.preferred_assistant_role) {
        targetAssistantRole = userPrefs.preferred_assistant_role
      }
    }

    // Step 2: Get assistant details from ai_assistants table
    const { data: assistant, error: assistantError } = await supabaseClient
      .from('ai_assistants')
      .select('*')
      .eq('user_role', targetAssistantRole)
      .eq('is_active', true)
      .single()

    // If no custom assistant found, create a simple response using chat completions
    if (assistantError || !assistant || !assistant.openai_assistant_id) {
      console.log(`No assistant found for role ${targetAssistantRole}, using chat completion fallback`)
      
      // Create a simple personality prompt based on role
      const rolePrompts = {
        'Dad': 'You are a wise, caring father figure and spiritual mentor. Provide guidance with warmth, wisdom, and biblical insight.',
        'Mom': 'You are a nurturing, loving mother figure. Offer comfort, encouragement, and gentle spiritual guidance.',
        'Coach': 'You are an enthusiastic, motivational coach. Encourage spiritual and physical growth with energy and positivity.',
        'Son': 'You are a supportive peer and friend. Share insights with humility and relatability.',
        'Daughter': 'You are a caring, insightful companion. Offer support with empathy and understanding.',
        'Single Man': 'You are a thoughtful single man sharing your spiritual journey. Provide honest, relatable guidance.',
        'Single Woman': 'You are a wise single woman offering spiritual insights. Share with authenticity and grace.',
        'Church Leader': 'You are a pastoral leader offering biblical wisdom and spiritual guidance with authority and care.'
      }

      const systemPrompt = rolePrompts[targetAssistantRole as keyof typeof rolePrompts] || rolePrompts['Coach']

      try {
        console.log('Making OpenAI chat completion request...')
        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.7
        })

        console.log('OpenAI request successful')
        const responseText = completion.choices[0]?.message?.content || 'I apologize, but I encountered an issue generating a response.'

        // Handle conversation storage (simplified for fallback)
        let conversation;
        if (conversationId) {
          const { data: existingConv } = await supabaseClient
            .from('ai_conversations')
            .select('*')
            .eq('id', conversationId)
            .eq('user_id', userId)
            .single()
          conversation = existingConv
        }

        if (!conversation) {
          // Create new conversation with a mock assistant ID
          const { data: newConv, error: convError } = await supabaseClient
            .from('ai_conversations')
            .insert({
              user_id: userId,
              assistant_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
              title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
              last_message_at: new Date().toISOString()
            })
            .select()
            .single()

          if (!convError) {
            conversation = newConv
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
                assistant_role: targetAssistantRole
              },
              created_at: new Date().toISOString()
            }
          ]

          await supabaseClient
            .from('ai_messages')
            .insert(messagesToInsert)

          await supabaseClient
            .from('ai_conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversation.id)
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: responseText,
            conversationId: conversation?.id,
            assistantRole: targetAssistantRole,
            mode: 'fallback'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError)
        
        // Provide more specific error information
        let errorDetails = 'Unknown OpenAI error'
        if (openaiError instanceof Error) {
          errorDetails = openaiError.message
          
          // Check for specific API key related errors
          if (openaiError.message.includes('401') || openaiError.message.includes('Incorrect API key')) {
            errorDetails = `API key authentication failed. Please verify your OpenAI API key is correct and has sufficient credits. Error: ${openaiError.message}`
          }
        }
        
        return new Response(
          JSON.stringify({ 
            error: 'OpenAI API error',
            details: errorDetails,
            debug: {
              hasApiKey: !!openaiApiKey,
              keyLength: openaiApiKey?.length || 0,
              keyPrefix: openaiApiKey ? openaiApiKey.substring(0, 7) + '...' : 'N/A'
            }
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Original assistant-based flow (if assistant exists and has openai_assistant_id)
    let conversation;
    let threadId;

    if (conversationId) {
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
        await supabaseClient
          .from('ai_conversations')
          .update({ thread_id: threadId })
          .eq('id', conversation.id)
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
          .single()

        if (convError) {
          throw new Error(`Failed to create conversation: ${convError.message}`)
        }
        conversation = newConv
      }
    }

    // Add user message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message
    })

    // Create and run assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistant.openai_assistant_id,
      instructions: assistant.personality_prompt
    })

    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)
    let attempts = 0
    const maxAttempts = 30 // 30 seconds timeout
    
    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)
      attempts++
    }

    if (runStatus.status !== 'completed') {
      throw new Error(`Assistant run failed with status: ${runStatus.status}`)
    }

    // Get assistant response
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

    // Store messages in database
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

    // Update conversation timestamp
    await supabaseClient
      .from('ai_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: responseText,
        conversationId: conversation.id,
        assistantRole: targetAssistantRole,
        mode: 'assistant'
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