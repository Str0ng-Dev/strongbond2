import { useState, useEffect } from 'react';
import { Crown, Heart, Zap, User, Book } from 'lucide-react';
import { UserRole } from '../types/ai';
import { supabase } from '../lib/supabase';

export interface Assistant {
  id: string;
  name: string;
  role: UserRole;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  assistantId?: string;
  openai_assistant_id?: string;
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

interface UseAssistantsProps {
  userId: string | null;
  userOrgId: string | null;
  isAuthenticated: boolean;
  authLoaded: boolean;
  session: any;
}

export const useAssistants = ({ userId, userOrgId, isAuthenticated, authLoaded, session }: UseAssistantsProps) => {
  const [availableAssistants, setAvailableAssistants] = useState<Assistant[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [assistantsLoaded, setAssistantsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Handle assistant selection
  const switchAssistant = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setError(null);
  };

  // Initialize assistants when auth is ready
  useEffect(() => {
    if (authLoaded && userId && isAuthenticated && session) {
      fetchAssistants();
    }
  }, [authLoaded, userId, isAuthenticated, userOrgId, session]);

  return {
    availableAssistants,
    selectedAssistant,
    assistantsLoaded,
    error,
    switchAssistant,
    fetchAssistants
  };
};
