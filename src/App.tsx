import React from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from './lib/supabase'; // uses your initialized Supabase client
import AIChat from './components/AIChat';
import GPTResponder from './ai/GPTResponder';

function App() {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <div className="h-screen w-full">
       <AIChat />
        <GPTResponder />
      </div>
    </SessionContextProvider>
  );
}

export default App;
