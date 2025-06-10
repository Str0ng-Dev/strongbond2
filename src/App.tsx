// File: src/App.tsx
// Minimal app focused purely on AI testing

import React from 'react';
import AIChat from './components/AIChat';
import GPTResponder from './ai/GPTResponder'; // ✅ Add this import

function App() {
  return (
    <div className="h-screen w-full">
      <AIChat />
      <GPTResponder /> {/* ✅ Make sure this is rendered */}
    </div>
  );
}

export default App;
