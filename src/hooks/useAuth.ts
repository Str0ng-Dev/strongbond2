import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AuthState {
  userId: string | null;
  userOrgId: string | null;
  isAuthenticated: boolean;
  session: any;
  authLoaded: boolean;
  isLoggingIn: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    userId: null,
    userOrgId: null,
    isAuthenticated: false,
    session: null,
    authLoaded: false,
    isLoggingIn: false,
    error: null
  });

  const [isInitializing, setIsInitializing] = useState(false);
  const [lastAuthEvent, setLastAuthEvent] = useState<string | null>(null);

  // Test login function
  const handleTestLogin = async () => {
    try {
      setAuthState(prev => ({ ...prev, error: null, isLoggingIn: true }));
      
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
        setAuthState(prev => ({ ...prev, error: `Login failed: ${result.error.message}` }));
      } else {
        console.log('🔑 Login successful, waiting for auth state change...');
      }
    } catch (loginError) {
      console.error('🔑 Login error:', loginError);
      setAuthState(prev => ({ 
        ...prev, 
        error: `Login failed: ${loginError instanceof Error ? loginError.message : 'Network error'}` 
      }));
    } finally {
      console.log('🔑 Setting isLoggingIn to false');
      setAuthState(prev => ({ ...prev, isLoggingIn: false }));
    }
  };

  // Initialize authentication
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
          setAuthState(prev => ({
            ...prev,
            error: `Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`,
            isAuthenticated: false,
            userId: null,
            userOrgId: null,
            session: null,
            authLoaded: true
          }));
        }
      }
    };

    authTimeout = setTimeout(() => {
      if (mounted && !authState.authLoaded) {
        console.warn('⏰ Auth initialization timed out, showing login screen');
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          userId: null,
          userOrgId: null,
          session: null,
          authLoaded: true
        }));
      }
    }, 2000);

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔐 Auth state changed:', event, session?.user?.id);
      
      // Prevent duplicate processing
      if (isInitializing || (event === lastAuthEvent && session?.user?.id === authState.userId)) {
        console.log('🔐 Skipping duplicate auth event');
        return;
      }
      
      setIsInitializing(true);
      setLastAuthEvent(event);
      clearTimeout(authTimeout);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔐 User signed in:', session.user.id);
        
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

          if (mounted) {
            const orgId = userData.data?.org_id || null;
            console.log(orgId ? `👤 User org_id found: ${orgId}` : '👤 No org_id found, using null');
            
            setAuthState(prev => ({
              ...prev,
              isAuthenticated: true,
              userId: session.user.id,
              userOrgId: orgId,
              session,
              error: null,
              authLoaded: true
            }));
          }
        } catch (error) {
          console.log('👤 User org lookup failed/timed out, continuing with null org_id:', error);
          if (mounted) {
            setAuthState(prev => ({
              ...prev,
              isAuthenticated: true,
              userId: session.user.id,
              userOrgId: null,
              session,
              error: null,
              authLoaded: true
            }));
          }
        }
        
        setIsInitializing(false);
        
      } else if (event === 'SIGNED_OUT' || !session) {
        console.log('🔐 User signed out or no session');
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: false,
            userId: null,
            userOrgId: null,
            session: null,
            error: null,
            authLoaded: true
          }));
          setIsInitializing(false);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Handle tab visibility to prevent re-fetching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && authState.isAuthenticated) {
        console.log('👁️ Tab focus returned, skipping re-fetch to avoid timeouts');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [authState.isAuthenticated]);

  return {
    ...authState,
    handleTestLogin
  };
};
