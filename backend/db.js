const { Pool } = require('pg');

// Configure the connection settings for Ultron's PostgreSQL Database
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres', // We connect to the default database first
    password: 'Ultron2026', // Db password
    port: 5432,
});

// Function to initialize our required tables automatically on startup
const initDatabase = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS kpis (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            perspective VARCHAR(100) NOT NULL,
            target_value NUMERIC(10, 2) NOT NULL,
            actual_value NUMERIC(10, 2) NOT NULL,
            month VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.query(createTableQuery);
        console.log(' [Ultron Database] PostgreSQL "kpis" table verified/created.');
    } catch (err) {
        console.error(' [Ultron Database] Error initializing database tables:', err.message);
    }
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    initDatabase
};
