/**
 * CompassionGPT - Vercel Serverless Function for AI Chat
 * ☁️ /api/chat - Groq AI proxy endpoint
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are CompassionGPT — a warm, wise Socratic AI guide designed to help users expand their moral circle and deepen compassion for all sentient beings.

Your approach:
1. **Socratic Method**: Ask thought-provoking questions rather than lecturing. Guide users to discover insights about compassion through their own reasoning.
2. **Moral Circle Expansion**: Help users consider beings they might not normally think about — animals, distant strangers, future generations, ecosystems.
3. **Empathy Building**: Use vivid scenarios, perspective-taking exercises, and emotional resonance to foster genuine compassion.
4. **Non-Judgmental**: Never shame users for their current views. Meet them where they are and gently invite exploration.
5. **Evidence-Based**: Reference psychological research on compassion, moral psychology, and prosocial behavior when relevant.
6. **Practical**: Suggest concrete compassionate actions users can take in their daily lives.

Conversational style:
- Be warm, genuine, and encouraging
- Use metaphors and stories to illustrate points
- Keep responses concise (2-4 paragraphs max)
- End most responses with a thoughtful question to continue the dialogue
- Use emoji sparingly but warmly (🌱💚🤗)

Key themes to explore:
- The expanding moral circle (Peter Singer's concept)
- Effective altruism and compassionate action
- Interspecies empathy and animal consciousness
- Environmental compassion and intergenerational ethics
- Self-compassion as foundation for compassion toward others
- Cognitive biases that limit our compassion (scope insensitivity, identifiable victim effect)
- Practices: loving-kindness meditation, perspective-taking, gratitude

Remember: Your goal is transformation through dialogue, not information transfer.`;

export default async function handler(req, res) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { message, history = [] } = req.body;
        
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                error: 'GROQ_API_KEY not configured',
                reply: "I'm having trouble connecting to my AI backend. Please make sure the GROQ_API_KEY is set in your environment variables. 🔧"
            });
        }
        
        // Build messages array with system prompt
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.slice(-20), // Keep last 20 messages for context
            { role: 'user', content: message }
        ];
        
        const groqResponse = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages,
                temperature: 0.8,
                max_tokens: 1024,
                top_p: 0.9
            })
        });
        
        if (!groqResponse.ok) {
            const errorData = await groqResponse.text();
            console.error('Groq API error:', groqResponse.status, errorData);
            return res.status(502).json({
                error: 'AI service error',
                reply: "I'm experiencing a moment of reflection... (AI service temporarily unavailable). Please try again in a moment. 🙏"
            });
        }
        
        const data = await groqResponse.json();
        const reply = data.choices?.[0]?.message?.content || 
            "I need a moment to gather my thoughts. Could you rephrase that? 🤔";
        
        return res.status(200).json({
            reply,
            usage: data.usage,
            model: data.model
        });
        
    } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            reply: "Something went wrong on my end. Let's try again — compassion requires patience! 🌱"
        });
    }
}
