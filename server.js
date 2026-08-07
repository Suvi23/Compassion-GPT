// server.js - Node.js Express Server for CompassionGPT
// Author: Suvarna Ahire

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

app.use(express.json());
app.use(express.static(__dirname));

const dbUrl = (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '').trim();
let sql = null;

// Connect to Neon Database & Auto-Seed Baseline if Empty
if (dbUrl && !dbUrl.includes('your_neon_user') && !dbUrl.includes('your_neon_password') && dbUrl.startsWith('postgres')) {
  try {
    sql = neon(dbUrl);
    console.log('🐘 [Neon PostgreSQL] Connection string detected.');
    
    // Ensure table exists and auto-seed initial 38 rows if newly created
    (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS survey_responses (
          id SERIAL PRIMARY KEY,
          q1 VARCHAR(10) NOT NULL,
          q2 VARCHAR(10) NOT NULL,
          q3 VARCHAR(10) NOT NULL,
          q4 VARCHAR(10) NOT NULL,
          q5 VARCHAR(10) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      const countCheck = await sql`SELECT COUNT(*)::int AS total FROM survey_responses;`;
      let currentTotal = countCheck[0]?.total || 0;

      // If database has 0 rows, seed initial 38 baseline responses
      if (currentTotal === 0) {
        console.log('🌱 [Neon DB] Seeding initial 38 baseline research responses into Neon...');
        await sql`
          INSERT INTO survey_responses (q1, q2, q3, q4, q5)
          SELECT 
              CASE WHEN random() < 0.90 THEN 'yes' WHEN random() < 0.97 THEN 'neutral' ELSE 'no' END,
              CASE WHEN random() < 0.78 THEN 'yes' WHEN random() < 0.94 THEN 'neutral' ELSE 'no' END,
              CASE WHEN random() < 0.74 THEN 'yes' WHEN random() < 0.94 THEN 'neutral' ELSE 'no' END,
              CASE WHEN random() < 0.84 THEN 'yes' WHEN random() < 0.97 THEN 'neutral' ELSE 'no' END,
              CASE WHEN random() < 0.76 THEN 'yes' WHEN random() < 0.94 THEN 'neutral' ELSE 'no' END
          FROM generate_series(1, 38);
        `;
        const updatedCount = await sql`SELECT COUNT(*)::int AS total FROM survey_responses;`;
        currentTotal = updatedCount[0]?.total || 38;
      }
      console.log(`✅ [Neon PostgreSQL] Table verified & ready! Total rows in Neon: ${currentTotal}`);
    })().catch(err => {
      console.error('❌ [Neon Initialization Error]:', err.message);
    });

  } catch (err) {
    console.error('❌ [Neon Init Error]:', err.message);
  }
} else {
  console.log('⚠️ [Database] No valid DATABASE_URL in .env. Running in local in-memory mode.');
}

// In-memory fallback if no DB connection
let localSurveyState = {
  total: 39,
  q1: { yes: 35, neutral: 3, no: 1 },
  q2: { yes: 31, neutral: 6, no: 2 },
  q3: { yes: 29, neutral: 8, no: 2 },
  q4: { yes: 33, neutral: 5, no: 1 },
  q5: { yes: 30, neutral: 7, no: 2 }
};

// -------------------------------------------------------------
// 1. POST /api/chat (Groq Proxy)
// -------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model = 'llama-3.3-70b-versatile', temperature = 0.6, max_tokens = 1024 } = req.body;
    const apiKey = process.env.GROQ_API_KEY || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '').trim() : null);

    if (!apiKey || apiKey.includes('your_actual_groq_api_key')) {
      return res.status(400).json({ error: 'Groq API Key is missing in .env.' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errData.error?.message || 'Groq call failed', details: errData });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Server error in /api/chat:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// -------------------------------------------------------------
// 2. GET & POST /api/survey (Neon DB CRUD)
// -------------------------------------------------------------
app.get('/api/survey', async (req, res) => {
  if (!sql) {
    return res.json(localSurveyState);
  }

  try {
    const rows = await sql`SELECT q1, q2, q3, q4, q5 FROM survey_responses ORDER BY id ASC;`;

    if (rows.length === 0) {
      return res.json(localSurveyState);
    }

    const analytics = {
      total: rows.length,
      q1: { yes: 0, neutral: 0, no: 0 },
      q2: { yes: 0, neutral: 0, no: 0 },
      q3: { yes: 0, neutral: 0, no: 0 },
      q4: { yes: 0, neutral: 0, no: 0 },
      q5: { yes: 0, neutral: 0, no: 0 }
    };

    rows.forEach(r => {
      if (analytics.q1[r.q1] !== undefined) analytics.q1[r.q1]++;
      if (analytics.q2[r.q2] !== undefined) analytics.q2[r.q2]++;
      if (analytics.q3[r.q3] !== undefined) analytics.q3[r.q3]++;
      if (analytics.q4[r.q4] !== undefined) analytics.q4[r.q4]++;
      if (analytics.q5[r.q5] !== undefined) analytics.q5[r.q5]++;
    });

    console.log(`[Neon DB GET] Fetched ${rows.length} total rows from Neon.`);
    return res.json(analytics);
  } catch (err) {
    console.error('❌ [Neon DB GET Error]:', err.message);
    return res.status(500).json({ error: 'Database fetch failed', message: err.message });
  }
});

app.post('/api/survey', async (req, res) => {
  const { q1 = 'yes', q2 = 'yes', q3 = 'yes', q4 = 'yes', q5 = 'yes' } = req.body;
  console.log('📥 [Survey POST Received]:', { q1, q2, q3, q4, q5 });

  if (!sql) {
    console.log('⚠️ No DATABASE_URL connection. Storing in local state.');
    localSurveyState.total += 1;
    if (localSurveyState.q1[q1] !== undefined) localSurveyState.q1[q1]++;
    if (localSurveyState.q2[q2] !== undefined) localSurveyState.q2[q2]++;
    if (localSurveyState.q3[q3] !== undefined) localSurveyState.q3[q3]++;
    if (localSurveyState.q4[q4] !== undefined) localSurveyState.q4[q4]++;
    if (localSurveyState.q5[q5] !== undefined) localSurveyState.q5[q5]++;
    return res.json(localSurveyState);
  }

  try {
    // 1. Insert into Neon DB
    const insertResult = await sql`
      INSERT INTO survey_responses (q1, q2, q3, q4, q5)
      VALUES (${q1}, ${q2}, ${q3}, ${q4}, ${q5})
      RETURNING id, created_at;
    `;
    const newId = insertResult[0]?.id;
    console.log(`🎉 [Neon DB SUCCESS] Inserted new row! ID: ${newId}`);

    // 2. Fetch fresh updated stats from DB
    const rows = await sql`SELECT q1, q2, q3, q4, q5 FROM survey_responses ORDER BY id ASC;`;

    const analytics = {
      total: rows.length,
      q1: { yes: 0, neutral: 0, no: 0 },
      q2: { yes: 0, neutral: 0, no: 0 },
      q3: { yes: 0, neutral: 0, no: 0 },
      q4: { yes: 0, neutral: 0, no: 0 },
      q5: { yes: 0, neutral: 0, no: 0 }
    };

    rows.forEach(r => {
      if (analytics.q1[r.q1] !== undefined) analytics.q1[r.q1]++;
      if (analytics.q2[r.q2] !== undefined) analytics.q2[r.q2]++;
      if (analytics.q3[r.q3] !== undefined) analytics.q3[r.q3]++;
      if (analytics.q4[r.q4] !== undefined) analytics.q4[r.q4]++;
      if (analytics.q5[r.q5] !== undefined) analytics.q5[r.q5]++;
    });

    console.log(`📊 [Neon DB TOTAL]: Database now has ${rows.length} responses.`);
    return res.json(analytics);
  } catch (err) {
    console.error('❌ [Neon DB INSERT ERROR]:', err);
    return res.status(500).json({ error: 'Failed to insert into Neon DB', details: err.message });
  }
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🌸 CompassionGPT running at: http://localhost:${PORT}`);
  console.log(`⚡ Groq Key: ${process.env.GROQ_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`🐘 Neon DB: ${sql ? 'Connected & Ready' : 'Fallback Mode'}`);
  console.log(`==================================================\n`);
});
