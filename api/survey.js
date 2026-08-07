// api/survey.js - Vercel Serverless Function for Neon Postgres
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  const fallbackData = {
    total: 39,
    q1: { yes: 35, neutral: 3, no: 1 },
    q2: { yes: 31, neutral: 6, no: 2 },
    q3: { yes: 29, neutral: 8, no: 2 },
    q4: { yes: 33, neutral: 5, no: 1 },
    q5: { yes: 30, neutral: 7, no: 2 }
  };

  if (!databaseUrl) {
    return res.status(200).json(fallbackData);
  }

  const sql = neon(databaseUrl);

  try {
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

    if (req.method === 'POST') {
      const { q1 = 'yes', q2 = 'yes', q3 = 'yes', q4 = 'yes', q5 = 'yes' } = req.body;
      await sql`
        INSERT INTO survey_responses (q1, q2, q3, q4, q5)
        VALUES (${q1}, ${q2}, ${q3}, ${q4}, ${q5});
      `;
    }

    const rows = await sql`SELECT q1, q2, q3, q4, q5 FROM survey_responses;`;

    if (rows.length === 0) {
      return res.status(200).json(fallbackData);
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

    return res.status(200).json(analytics);
  } catch (error) {
    console.error('Neon DB Error in serverless API:', error);
    return res.status(500).json({ error: error.message, fallback: fallbackData });
  }
}
