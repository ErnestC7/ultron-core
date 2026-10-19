require('dotenv').config();
const { Client } = require('pg');

async function setupDatabase() {
    // Connect directly to the database Render already made
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
    });

    try {
        await client.connect();
        console.log("⏳ Connected to Render PostgreSQL...");

        console.log("🔨 Creating 'users' table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL,
                department VARCHAR(50)
            );
        `);

        console.log("🔨 Creating 'kpis' table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS kpis (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                perspective VARCHAR(100),
                department VARCHAR(100),
                target_value NUMERIC,
                actual_value NUMERIC,
                month VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("✅ SUCCESS: All tables created successfully!");
        await client.end();
        process.exit(0);

    } catch (err) {
        console.error("❌ CRITICAL ERROR:", err.message);
        process.exit(1);
    }
}

setupDatabase();