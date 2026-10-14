require('dotenv').config();
const { Client } = require('pg');

async function setupDatabase() {
    // 1. Connect to the default 'postgres' database to create the new one
    const sysClient = new Client({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: 'postgres', // The default DB every server has
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
    });

    try {
        await sysClient.connect();
        console.log("⏳ Connected to PostgreSQL System...");
        
        // Check if ultron_db exists, create it if not
        const checkDb = await sysClient.query("SELECT 1 FROM pg_database WHERE datname = 'ultron_db'");
        if (checkDb.rowCount === 0) {
            console.log("🔨 Creating 'ultron_db' database...");
            await sysClient.query('CREATE DATABASE ultron_db');
        } else {
            console.log("✅ 'ultron_db' database already exists.");
        }
        await sysClient.end();

        // 2. Connect to our new 'ultron_db' to build the tables
        const appClient = new Client({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: 'ultron_db',
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 5432,
        });

        await appClient.connect();
        
        console.log("🔨 Creating 'users' table (Security)...");
        await appClient.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL,
                department VARCHAR(50)
            );
        `);

        console.log("🔨 Creating 'kpis' table (Scorecards)...");
        await appClient.query(`
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

        console.log("✅ SUCCESS: Database and all tables are ready for deployment!");
        await appClient.end();
        process.exit(0);

    } catch (err) {
        console.error("❌ CRITICAL ERROR:", err.message);
        process.exit(1);
    }
}

setupDatabase();