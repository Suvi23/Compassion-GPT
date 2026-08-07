// Vercel Serverless Function: api/chat.js
// Handles server-side Groq API calls securely using environment variable GROQ_API_KEY

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const {
      messages,
      model = 'llama-3.3-70b-versatile',
      temperature = 0.7,
      max_tokens = 1024
    } = req.body;

    // Use environment variable GROQ_API_KEY, or fallback to header Bearer token
    const apiKey =
      process.env.GROQ_API_KEY ||
      (req.headers.authorization
        ? req.headers.authorization.replace('Bearer ', '').trim()
        : null);

    if (!apiKey) {
      return res.status(400).json({
        error:
          'Groq API Key missing. Please configure GROQ_API_KEY in Vercel Environment Variables or pass your key in the frontend settings modal.'
      });
    }

    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: max_tokens
        })
      }
    );

    if (!groqResponse.ok) {
      const errData = await groqResponse.json().catch(() => ({}));
      return res.status(groqResponse.status).json({
        error: errData.error?.message || 'Groq API request failed',
        details: errData
      });
    }

    const data = await groqResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Serverless function error calling Groq:', error);
    return res
      .status(500)
      .json({ error: 'Internal Server Error', message: error.message });
  }
}
