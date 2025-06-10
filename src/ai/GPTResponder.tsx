import { useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';

export default function GPTResponder() {
  const user = useUser();

  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!user) return;
    setLoading(true);
      const res = await fetch('/functions/v1/ai-sendMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.access_token}`
      },
      body: JSON.stringify({
        userId: user.id,
        message
      })
    });

    const data = await res.json();
    setResponse(data.message || 'No response received.');
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="p-4 max-w-xl mx-auto">
        <p className="text-red-500 font-medium">You must be signed in to use the AI assistant.</p>
      </div>
    );
  }

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
        disabled={loading}
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
