const sendMessage = async () => {
  if (!user) return;
  setLoading(true);

  try {
    const res = await fetch('https://emffvbureyryjskxwwjt.supabase.co/functions/v1/ai-sendMessage', {
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

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Server responded with ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    setResponse(data.message || 'No response received.');
  } catch (err) {
    console.error('❌ Error sending message:', err);
    setResponse('There was an error sending your message.');
  } finally {
    setLoading(false);
  }
};
