/**
 * CompassionGPT - Vercel Serverless Function for Survey
 * 🐘 /api/survey - PostgreSQL database endpoint for survey responses
 */

import { Pool } from 'pg';

// Database connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // POST - Save survey responses
    if (req.method === 'POST') {
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
            
            return res.status(200).json({
                success: true,
                sessionId,
                totalScore: percentage,
                surveyType,
                message: `${surveyType === 'pre' ? 'Pre' : 'Post'}-survey saved successfully`
            });
            
        } catch (error) {
            console.error('Survey POST error:', error);
            return res.status(500).json({ error: 'Failed to save survey responses' });
        }
    }
    
    // GET - Retrieve survey results
    if (req.method === 'GET') {
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
                
                return res.status(200).json({
                    success: true,
                    stats: result.rows[0] || {}
                });
            }
            
            const result = await pool.query(
                'SELECT * FROM survey_results WHERE session_id = $1 LIMIT 1',
                [sessionId]
            );
            
            return res.status(200).json({
                success: true,
                results: result.rows[0] || null
            });
            
        } catch (error) {
            console.error('Survey GET error:', error);
            return res.status(500).json({ error: 'Failed to retrieve survey results' });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}
