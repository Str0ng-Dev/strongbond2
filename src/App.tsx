// File: src/App.tsx
import React from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import AIChat from './components/AIChat';
import GPTResponder from './ai/GPTResponder';

const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

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
