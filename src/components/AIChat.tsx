import React, { useState, useEffect } from 'react';
import { Send, Bot, User, Heart, Book, Zap, Crown, Plus, RefreshCw } from 'lucide-react';
import { UserRole } from '../types/ai';
import { supabase } from '../lib/supabase'; // Import singleton client

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  role?: UserRole;
}

interface Assistant {
  id: string;
  name: string;
  role: UserRole;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  assistantId?: string;
  openai_assistant_id?: string;
}

interface Conversation {
  id: string;
  title: string;
  last_message_at: string;
  created_at: string;
}

interface DBAssistant {
  id: string;
  user_role: string;
  name: string;
  description: string;
  openai_assistant_id: string;
  is_active: boolean;
  org_id: string | null;
}

interface DBMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const mockAssistants: Omit<Assistant, 'assistantId'>[] = [
  {
    id: '1',
    name: 'Dad',
    role: 'Dad',
    icon: Crown,
    color: 'bg-blue-500',
    description: 'Wise father figure and spiritual mentor'
  },
  {
    id: '2',
    name: 'Mom',
    role: 'Mom',
    icon: Heart,
    color: 'bg-pink-500',
    description: 'Nurturing mother figure and guide'
  },
  {
    id: '3',
    name: 'Coach',
    role: 'Coach',
    icon: Zap,
    color: 'bg-green-500',
    description: 'Motivational coach and fitness guide'
  },
  {
    id: '4',
    name: 'Son',
    role: 'Son',
    icon: User,
    color: 'bg-purple-500',
    description: 'Peer companion and friend'
  },
  {
    id: '5',
    name: 'Daughter',
    role: 'Daughter',
    icon: Heart,
    color: 'bg-rose-500',
    description: 'Caring companion and friend'
  },
  {
    id: '6',
    name: 'Church Leader',
    role: 'Church Leader',
    icon: Book,
    color: 'bg-indigo-500',
    description: 'Pastoral guide and biblical teacher'
  },
  {
    id: '7',
    name: 'Single Man',
    role: 'Single Man',
    icon: User,
    color: 'bg-teal-500',
    description: 'Single man of faith and purpose'
  },
  {
    id: '8',
    name: 'Single Woman',
    role: 'Single Woman',
    icon: Heart,
    color: 'bg-violet-500',
    description: 'Single woman of faith and strength'
  }
];

const AIChat: React.FC = () => {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('testing');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [availableAssistants, setAvailableAssistants] = useState<Assistant[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [session, setSession] = useState<any>(null);
  
  // Loading states
  const [assistantsLoaded, setAssistantsLoaded] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [lastAuthEvent, setLastAuthEvent] = useState<string | null>(null);
  // Test login function
  const handleTestLogin = async () => {
    try {
      setError(null);
      setIsLoggingIn(true);
      
      console.log('🔑 Starting real login...');
      
      const loginPromise = supabase.auth.signInWithPassword({
        email: 'gale@yocom.us',
        password: 'C0vetrix'
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout after 8 seconds')), 8000)
      );
      
      const result = await Promise.race([loginPromise, timeoutPromise]) as any;
      
      console.log('🔑 Login response:', { success: !result.error, error: result.error?.message });

      if (result.error) {
        console.error('🔑 Login failed:', result.error.message);
        setError(`Login failed: ${result.error.message}`);
      } else {
        console.log('🔑 Login successful, waiting for auth state change...');
      }
    } catch (loginError) {
      console.error('🔑 Login error:', loginError);
      setError(`Login failed: ${loginError instanceof Error ? loginError.message : 'Network error'}`);
    } finally {
      console.log('🔑 Setting isLoggingIn to false');
      setIsLoggingIn(false);
    }
  };

  // Initialize authentication and user data
  useEffect(() => {
    let mounted = true;
    let authTimeout: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      try {
        console.log('🔐 Starting auth initialization...');
        
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          throw new Error('Missing Supabase environment variables');
        }
        
        console.log('🔐 Setting up auth listener only...');

      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        if (mounted) {
          setError(`Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsAuthenticated(false);
          setUserId(null);
          setUserOrgId(null);
          setSession(null);
          setAuthLoaded(true);
        }
      }
    };

    authTimeout = setTimeout(() => {
      if (mounted && !authLoaded) {
        console.warn('⏰ Auth initialization timed out, showing login screen');
        setIsAuthenticated(false);
        setUserId(null);
        setUserOrgId(null);
        setSession(null);
        setAuthLoaded(true);
      }
    }, 2000);

    initializeAuth();

 const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
  if (!mounted) return;
  
  console.log('🔐 Auth state changed:', event, session?.user?.id);
  
  // ✅ Prevent duplicate processing
  if (isInitializing || (event === lastAuthEvent && session?.user?.id === userId)) {
    console.log('🔐 Skipping duplicate auth event');
    return;
  }
  
  setIsInitializing(true);
  setLastAuthEvent(event);
  clearTimeout(authTimeout);
  setSession(session);
  
  if (event === 'SIGNED_IN' && session?.user) {
    console.log('🔐 User signed in:', session.user.id);
    setIsAuthenticated(true);
    setUserId(session.user.id);
    setError(null);
    setUserOrgId(null);
    
    try {
      console.log('👤 Fetching user org data with timeout...');
      
      const userQuery = supabase
        .from('users')
        .select('org_id')
        .eq('id', session.user.id)
        .single();
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User query timeout')), 15000)
      );
      
      const userData = await Promise.race([userQuery, timeoutPromise]) as any;

      if (mounted && userData.data?.org_id) {
        console.log('👤 User org_id found:', userData.data.org_id);
        setUserOrgId(userData.data.org_id);
      } else {
        console.log('👤 No org_id found, using null');
      }
    } catch (error) {
      console.log('👤 User org lookup failed/timed out, continuing with null org_id:', error);
    }
    
    setAuthLoaded(true);
    setIsInitializing(false); // ✅ Reset flag
    
  } else if (event === 'SIGNED_OUT' || !session) {
    console.log('🔐 User signed out or no session');
    if (mounted) {
      setIsAuthenticated(false);
      setUserId(null);
      setUserOrgId(null);
      setSession(null);
      setAvailableAssistants([]);
      setSelectedAssistant(null);
      setMessages([]);
      setConversations([]);
      setCurrentConversationId(null);
      setError(null);
      setAuthLoaded(true);
      setIsInitializing(false); // ✅ Reset flag
    }
  }
});
        
        try {
          console.log('👤 Fetching user org data with timeout...');
          
          const userQuery = supabase
            .from('users')
            .select('org_id')
            .eq('id', session.user.id)
            .single();
            
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('User query timeout')), 15000)
          );
          
          const userData = await Promise.race([userQuery, timeoutPromise]) as any;

          if (mounted && userData.data?.org_id) {
            console.log('👤 User org_id found:', userData.data.org_id);
            setUserOrgId(userData.data.org_id);
          } else {
            console.log('👤 No org_id found, using null');
          }
        } catch (error) {
          console.log('👤 User org lookup failed/timed out, continuing with null org_id:', error);
        }
        
setAuthLoaded(true);
        setIsInitializing(false); // ✅ Reset flag
        
      } else if (event === 'SIGNED_OUT' || !session) {
        console.log('🔐 User signed out or no session');
        if (mounted) {
          setIsAuthenticated(false);
          setUserId(null);
          setUserOrgId(null);
          setSession(null);
          setAvailableAssistants([]);
          setSelectedAssistant(null);
          setMessages([]);
          setConversations([]);
          setCurrentConversationId(null);
          setError(null);
          setAuthLoaded(true);
          setIsInitializing(false); // ✅ Reset flag

        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Fetch available assistants based on user's org
  const fetchAssistants = async () => {
    if (!userId || !isAuthenticated) return;

    try {
      console.log('🤖 Fetching assistants from database...');
      setError(null);
      
      // Get user's role first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_role, org_id')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.log('Could not get user role, showing all assistants');
      }
      
      const userRole = userData?.user_role;
      console.log('👤 User role:', userRole);
      
      let query = supabase
        .from('ai_assistants')
        .select('*')
        .eq('is_active', true);

      // Filter based on org and user role
      if (userOrgId || userData?.org_id) {
        query = query.or(`org_id.is.null,org_id.eq.${userOrgId || userData?.org_id}`);
      } else {
        query = query.is('org_id', null);
      }
      
      // Additional filtering based on user role if available
      if (userRole) {
        console.log('🤖 Showing all assistants for user role:', userRole);
      }

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Assistants query timeout')), 8000)
      );
      
      const result = await Promise.race([query, timeoutPromise]) as any;

      if (result.error) {
        throw result.error;
      }

      const dbAssistants = result.data || [];
      console.log('🤖 Found assistants in DB:', dbAssistants.length);

      const mappedAssistants = mockAssistants.map(mockAssistant => {
        const dbAssistant = dbAssistants.find((db: DBAssistant) => 
          db.user_role === mockAssistant.role
        );
        
        return {
          ...mockAssistant,
          assistantId: dbAssistant?.id,
          openai_assistant_id: dbAssistant?.openai_assistant_id,
          name: dbAssistant?.name || mockAssistant.name,
          description: dbAssistant?.description || mockAssistant.description
        };
      }).filter(assistant => assistant.assistantId);

      console.log('🤖 Mapped assistants:', mappedAssistants.length);
      setAvailableAssistants(mappedAssistants);
      
      if (mappedAssistants.length > 0 && !selectedAssistant) {
        setSelectedAssistant(mappedAssistants[0]);
      }

    } catch (error) {
      console.error('Failed to fetch assistants:', error);
      setError(`Unable to load AI assistants: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAssistantsLoaded(true);
    }
  };

  // Fetch conversations for selected assistant
  const fetchConversations = async () => {
    if (!userId || !isAuthenticated || !selectedAssistant?.assistantId) return;

    try {
      console.log('💬 Fetching conversations...');
      
      const query = supabase
        .from('ai_conversations')
        .select('id, title, last_message_at, created_at')
        .eq('user_id', userId)
        .eq('assistant_id', selectedAssistant.assistantId)
        .order('last_message_at', { ascending: false })
        .limit(10);
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Conversations query timeout')), 15000)
      );
      
      const result = await Promise.race([query, timeoutPromise]) as any;

      if (result.error) {
        throw result.error;
      }

      const convData = result.data || [];
      setConversations(convData);
      
      if (convData.length > 0) {
        await loadConversation(convData[0].id);
      } else {
        setMessages([]);
        setCurrentConversationId(null);
        addWelcomeMessage();
      }

    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setError(`Unable to load conversation history: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessages([]);
      setCurrentConversationId(null);
      addWelcomeMessage();
    } finally {
      setConversationsLoaded(true);
    }
  };

  // Load specific conversation and its messages
  const loadConversation = async (conversationId: string) => {
    if (!userId || !isAuthenticated) return;

    try {
      setIsLoading(true);
      setCurrentConversationId(conversationId);

      const query = supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Messages query timeout')), 5000)
      );
      
      const result = await Promise.race([query, timeoutPromise]) as any;

      if (result.error) {
        throw result.error;
      }

      const uiMessages: Message[] = (result.data || []).map((dbMsg: DBMessage) => ({
        id: dbMsg.id,
        content: dbMsg.content,
        sender: dbMsg.sender_type === 'user' ? 'user' : 'ai',
        timestamp: new Date(dbMsg.created_at),
        role: selectedAssistant?.role
      }));

      setMessages(uiMessages);
      setError(null);

    } catch (error) {
      console.error('Failed to load conversation:', error);
      setError(`Unable to load conversation messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addWelcomeMessage();
    } finally {
      setIsLoading(false);
    }
  };

  // Add welcome message
  const addWelcomeMessage = () => {
    if (!selectedAssistant) return;

    const welcomeMessage: Message = {
      id: 'welcome-' + Date.now(),
      content: `Hello! I'm ${selectedAssistant.name}, your ${selectedAssistant.description}. I'm here to support you on your spiritual journey. How can I help you today?`,
      sender: 'ai',
      timestamp: new Date(),
      role: selectedAssistant.role
    };
    setMessages([welcomeMessage]);
  };

  // Start new conversation
  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    addWelcomeMessage();
    setError(null);
  };

  // Send message to AI - FIXED URL PATH
  const sendMessage = async () => {
    if (!input.trim() || isLoading || !selectedAssistant?.assistantId || !userId || !isAuthenticated || !session) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      console.log('💬 Sending message to AI...');
      
const requestBody = {
  userId: userId,            // ✅ FIXED - removed underscore
  message: messageText,      
  assistantRole: selectedAssistant.role,  
  conversationId: currentConversationId   // ✅ FIXED - removed underscore
};

      console.log('📤 Request body:', requestBody);
      
      const requestPromise = fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-sendMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Message send timeout')), 30000)
      );
      
      const response = await Promise.race([requestPromise, timeoutPromise]) as Response;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        if (data.conversation_id && !currentConversationId) {
          setCurrentConversationId(data.conversation_id);
          fetchConversations();
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.message,
          sender: 'ai',
          timestamp: new Date(),
          role: selectedAssistant.role
        };

        setMessages(prev => [...prev, aiMessage]);
        setConnectionStatus('connected');
        console.log('💬 AI response received');
      } else {
        throw new Error(data.error || 'Unknown error');
      }

    } catch (error) {
      console.error('Send message failed:', error);
      setConnectionStatus('disconnected');
      setError(`Message failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        content: 'I apologize, but I encountered an issue. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Test connection - FIXED URL PATH
  const testConnection = async () => {
    if (!selectedAssistant?.assistantId || !userId || !isAuthenticated || !session) {
      setConnectionStatus('disconnected');
      setError('Assistant not configured, user not authenticated, or no session');
      return;
    }

    try {
      console.log('🔗 Testing AI connection...');
      setConnectionStatus('testing');
      
      // ✅ Fixed field names to match edge function expectations
const testBody = {
  userId: userId,            // ✅ FIXED - removed underscore
  message: 'Hello',          
  assistantRole: selectedAssistant.role
};

      console.log('🧪 Test body:', testBody);
      
      const requestPromise = fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-sendMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testBody)
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection test timeout')), 10000)
      );
      
      const response = await Promise.race([requestPromise, timeoutPromise]) as Response;

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('🔗 Connection test successful');
          setConnectionStatus('connected');
          setError(null);
        } else {
          throw new Error(data.details || data.error || 'Unknown error');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('disconnected');
      setError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle assistant selection
  const switchAssistant = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setCurrentConversationId(null);
    setMessages([]);
    setConversations([]);
    setConversationsLoaded(false);
    setError(null);
  };

 // Initialize data when auth is loaded and user is authenticated
useEffect(() => {
  if (authLoaded && userId && isAuthenticated && session) {
    fetchAssistants();
  }
}, [authLoaded, userId, isAuthenticated, userOrgId, session]);

// Load conversations when assistant is selected
useEffect(() => {
  if (selectedAssistant && assistantsLoaded && isAuthenticated && session) {
    fetchConversations();
    if (selectedAssistant.assistantId) {
      testConnection();
    }
  }
}, [selectedAssistant, assistantsLoaded, isAuthenticated, session]);

// ADD THIS NEW useEffect HERE:
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden && isAuthenticated) {
      console.log('👁️ Tab focus returned, skipping re-fetch to avoid timeouts');
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [isAuthenticated]);

  // Loading screen
  if (!authLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Bot className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
          <p className="text-xs text-gray-400 mt-2">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - Show sign in screen
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <Bot className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to StrongBond AI</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access your AI spiritual companions and continue your faith journey.
          </p>
          <button 
            onClick={handleTestLogin}
            disabled={isLoggingIn}
            className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 disabled:bg-purple-300 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto transition-colors"
          >
            {isLoggingIn ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In (Test)</span>
            )}
          </button>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading assistants
  if (!assistantsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Bot className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading AI assistants...</p>
        </div>
      </div>
    );
  }

  // No assistants available
  if (availableAssistants.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <Bot className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No AI Assistants Available</h2>
          <p className="text-gray-600 mb-4">
            No active AI assistants were found in the database. Please contact your administrator to set up AI assistants.
          </p>
          <button 
            onClick={fetchAssistants}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">StrongBond AI Assistants</h1>
                <p className="text-sm text-gray-600">OpenAI-powered spiritual companions</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* New Conversation Button */}
              <button
                onClick={startNewConversation}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New Chat</span>
              </button>

              {/* Connection Status */}
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                connectionStatus === 'connected' ? 'bg-green-100 text-green-700' :
                connectionStatus === 'disconnected' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {connectionStatus === 'connected' ? '🟢 Connected' :
                 connectionStatus === 'disconnected' ? '🔴 Disconnected' :
                 '🟡 Testing...'}
              </div>

              {/* User Info */}
              <div className="text-xs text-gray-500">
                User: {userId?.substring(0, 8)}...
                {userOrgId && <span className="ml-1">(Org: {userOrgId.substring(0, 8)}...)</span>}
                {session && <span className="ml-1">✓</span>}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {/* Assistant Selector */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Choose your spiritual companion:</p>
            <div className="flex space-x-2 overflow-x-auto">
              {availableAssistants.map((assistant) => {
                const IconComponent = assistant.icon;
                return (
                  <button
                    key={assistant.id}
                    onClick={() => switchAssistant(assistant)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                      selectedAssistant?.id === assistant.id
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                    disabled={!assistant.assistantId}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      assistant.assistantId ? assistant.color : 'bg-gray-400'
                    }`}>
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{assistant.name}</span>
                    {!assistant.assistantId && (
                      <span className="text-xs text-red-500">(Not configured)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversation History */}
          {conversations.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Recent conversations:</p>
              <div className="flex space-x-2 overflow-x-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`px-3 py-2 rounded-lg border text-sm whitespace-nowrap transition-all ${
                      currentConversationId === conv.id
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {conv.title || 'Untitled'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user' ? 'bg-blue-500' : selectedAssistant?.color || 'bg-gray-500'
              }`}>
                {message.sender === 'user' ?
                  <User className="w-4 h-4 text-white" /> :
                  selectedAssistant ? React.createElement(selectedAssistant.icon, { className: "w-4 h-4 text-white" }) :
                  <Bot className="w-4 h-4 text-white" />
                }
              </div>
              <div className={`p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 shadow-sm border'
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedAssistant?.color || 'bg-gray-500'}`}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={selectedAssistant ? `Share your heart with ${selectedAssistant.name}...` : 'Select an assistant to start chatting...'}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading || !selectedAssistant?.assistantId || !isAuthenticated || !session}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || !selectedAssistant?.assistantId || !isAuthenticated || !session}
            className="bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Status Messages */}
        {connectionStatus === 'connected' && selectedAssistant?.assistantId && isAuthenticated && session && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              <strong>Live Mode:</strong> Connected to OpenAI Assistants API via Supabase Edge Function.
              {currentConversationId && <span className="ml-2">Conversation ID: {currentConversationId.substring(0, 8)}...</span>}
            </p>
          </div>
        )}

        {connectionStatus === 'disconnected' && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Connection Issue:</strong> Unable to reach the AI service. Please check your configuration and try again.
            </p>
            <button 
              onClick={testConnection}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              disabled={!selectedAssistant?.assistantId || !isAuthenticated || !session}
            >
              Retry Connection
            </button>
          </div>
        )}

        {!selectedAssistant?.assistantId && selectedAssistant && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              <strong>Assistant Not Configured:</strong> This assistant needs to be set up in the database before it can be used.
            </p>
          </div>
        )}

        {!isAuthenticated && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Authentication Required:</strong> Please sign in to use the AI assistants.
            </p>
          </div>
        )}

        {!session && isAuthenticated && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-700">
              <strong>Session Required:</strong> Waiting for authentication session to be established.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChat;