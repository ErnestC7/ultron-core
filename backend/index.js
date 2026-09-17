const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./db'); // Import our new database configuration

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database Tables on Startup
db.initDatabase();

// 1. Health Route
app.get('/api/health', (req, res) => {
    res.json({ status: "Online", system: "Ultron API Core linked to PostgreSQL" });
});

// 2. GET Route: Fetch real KPIs from PostgreSQL
app.get('/api/kpis', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM kpis ORDER BY id DESC');
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Database read error." });
    }
});

// 3. POST Route: Save a new KPI directly into PostgreSQL
app.post('/api/kpis', async (req, res) => {
    const { name, perspective, targetValue, actualValue, month } = req.body;

    if (!name || !perspective || !targetValue || !actualValue || !month) {
        return res.status(400).json({ success: false, message: "Missing required attributes." });
    }

    try {
        const insertQuery = `
            INSERT INTO kpis (name, perspective, target_value, actual_value, month)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [name, perspective, parseFloat(targetValue), parseFloat(actualValue), month];
        const result = await db.query(insertQuery, values);

        console.log(` [Ultron DB Sync] Saved "${name}" into PostgreSQL.`);
        res.status(201).json({
            success: true,
            message: "KPI securely committed to PostgreSQL.",
            data: result.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Database write error." });
    }
});
// 4. AI Analytics Route: Pulls KPI from PostgreSQL and sends to Python ML Pipeline
app.post('/api/kpis/:id/analyze', async (req, res) => {
    try {
        const { id } = req.params;
        const dbRes = await db.query('SELECT * FROM kpis WHERE id = $1', [id]);

        if (dbRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'KPI not found' });
        }

        const kpi = dbRes.rows[0];

        // Send data payload to FastAPI Python Server
        const aiResponse = await axios.post('http://127.0.0.1:8000/api/predict', {
            name: kpi.name,
            target_value: parseFloat(kpi.target_value),
            actual_value: parseFloat(kpi.actual_value)
        });

        res.json({ success: true, analysis: aiResponse.data });
    } catch (err) {
        console.error('AI Bridge Error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to communicate with AI Core.' });
    }
});
app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(` ULTRON API v1.2 Database Core Active!`);
    console.log(` Connected live to PostgreSQL on port: ${PORT}`);
    console.log(`===================================================`);
});
