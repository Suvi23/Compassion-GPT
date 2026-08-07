/**
 * CompassionGPT - Express Backend Server
 * 🚀 Groq AI proxy & PostgreSQL database endpoints
 * 
 * Usage: node server.js
 * Runs on http://localhost:3001
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========== DATABASE ==========
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Initialize database tables
async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS survey_responses (
                id SERIAL PRIMARY KEY,
                session_id TEXT NOT NULL,
                question_id TEXT NOT NULL,
                question_text TEXT NOT NULL,
                answer_value INTEGER NOT NULL,
                answer_label TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                created_at TIMESTAMP DEFAULT NOW()
            );
            
            CREATE TABLE IF NOT EXISTS survey_results (
                id SERIAL PRIMARY KEY,
                session_id TEXT UNIQUE NOT NULL,
                pre_score INTEGER,
                post_score INTEGER,
                responses JSONB DEFAULT '{}',
                completed_at TIMESTAMP DEFAULT NOW()
            );
            
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id SERIAL PRIMARY KEY,
                session_id TEXT UNIQUE NOT NULL,
                messages JSONB DEFAULT '[]',
                moral_circle_score INTEGER,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ Database tables initialized');
    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
    }
}

// ========== GROQ AI CONFIG ==========
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

// ========== ROUTES ==========

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ ok: true, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// Chat endpoint - Groq AI proxy
app.post('/api/chat', async (req, res) => {
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
        
        // Build messages array
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.slice(-20),
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
        
        res.json({
            reply,
            usage: data.usage,
            model: data.model
        });
        
    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({
            error: 'Internal server error',
            reply: "Something went wrong on my end. Let's try again — compassion requires patience! 🌱"
        });
    }
});

// Survey endpoint - Save/retrieve survey responses
app.post('/api/survey', async (req, res) => {
    try {
        const { sessionId, responses, surveyType } = req.body;
        
        if (!sessionId || !responses || !Array.isArray(responses)) {
            return res.status(400).json({ error: 'sessionId and responses array are required' });
        }
        
        // Insert individual responses
        for (const resp of responses) {
            await pool.query(
                `INSERT INTO survey_responses (session_id, question_id, question_text, answer_value, answer_label, category)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [sessionId, resp.questionId, resp.questionText, resp.answerValue, resp.answerLabel, resp.category || 'general']
            );
        }
        
        // Calculate total score
        const totalScore = responses.reduce((sum, r) => sum + r.answerValue, 0);
        const maxScore = responses.length * 5;
        const percentage = Math.round((totalScore / maxScore) * 100);
        
        // Upsert survey results
        if (surveyType === 'pre') {
            await pool.query(
                `INSERT INTO survey_results (session_id, pre_score, responses)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (session_id) 
                 DO UPDATE SET pre_score = $2, responses = jsonb_set(COALESCE(survey_results.responses, '{}'::jsonb), '{pre}', $3::jsonb)`,
                [sessionId, percentage, JSON.stringify(responses)]
            );
        } else {
            await pool.query(
                `INSERT INTO survey_results (session_id, post_score, responses)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (session_id) 
                 DO UPDATE SET post_score = $2, responses = jsonb_set(COALESCE(survey_results.responses, '{}'::jsonb), '{post}', $3::jsonb)`,
                [sessionId, percentage, JSON.stringify(responses)]
            );
        }
        
        res.json({
            success: true,
            sessionId,
            totalScore: percentage,
            surveyType,
            message: `${surveyType === 'pre' ? 'Pre' : 'Post'}-survey saved successfully`
        });
        
    } catch (error) {
        console.error('Survey POST error:', error);
        res.status(500).json({ error: 'Failed to save survey responses' });
    }
});

app.get('/api/survey', async (req, res) => {
    try {
        const { sessionId } = req.query;
        
        if (!sessionId) {
            // Return aggregate stats
            const result = await pool.query(`
                SELECT 
                    COUNT(DISTINCT session_id) as total_sessions,
                    AVG(pre_score) as avg_pre_score,
                    AVG(post_score) as avg_post_score,
                    COUNT(CASE WHEN post_score > pre_score THEN 1 END) as improved_count,
                    COUNT(CASE WHEN post_score IS NOT NULL AND pre_score IS NOT NULL THEN 1 END) as completed_both
                FROM survey_results
            `);
            
            return res.json({
                success: true,
                stats: result.rows[0] || {}
            });
        }
        
        const result = await pool.query(
            'SELECT * FROM survey_results WHERE session_id = $1 LIMIT 1',
            [sessionId]
        );
        
        res.json({
            success: true,
            results: result.rows[0] || null
        });
        
    } catch (error) {
        console.error('Survey GET error:', error);
        res.status(500).json({ error: 'Failed to retrieve survey results' });
    }
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========== START SERVER ==========
app.listen(PORT, async () => {
    console.log(`
🌱 CompassionGPT Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Server running on http://localhost:${PORT}
📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}
🤖 Groq API: ${process.env.GROQ_API_KEY ? 'Configured' : 'Not configured'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    await initDatabase();
});
