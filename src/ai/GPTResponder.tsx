// File: src/ai/GPTResponder.tsx

import { useState } from 'react';
import { useUser, useSession } from '@supabase/auth-helpers-react';

export default function GPTResponder() {
  const { user } = useUser();
  const session = useSession();

  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!user || !session) {
      console.warn('User or session missing');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/functions/v1/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: user.id,
          message
        })
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.message || 'No response received.');
    } catch (err) {
      console.error('Error sending message:', err);
      setResponse('Something went wrong while contacting the assistant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-2">Ask your mentor</h2>
      <textarea
        rows={3}
        className="w-full p-2 border rounded"
        placeholder="Type your question or reflection..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded"
        onClick={sendMessage}
        disabled={loading || !message}
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
      {response && (
        <div className="mt-4 p-3 bg-gray-100 border rounded">
          <strong>AI:</strong> {response}
        </div>
      )}
    </div>
  );
}
