require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ultron_db',
    password: process.env.DB_PASSWORD || 'yourpassword',
    port: process.env.DB_PORT || 5432,
});

// ==========================================
// SECURITY MIDDLEWARE (The Bouncer)
// ==========================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

    if (!token) return res.status(401).json({ success: false, message: "Access Denied. No token provided." });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: "Invalid or expired token." });
        req.user = user; // Attach the decoded user data (id, role, department) to the request
        next();
    });
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
// 1. Register a new user (Usually restricted to Admins in production)
app.post('/api/register', async (req, res) => {
    const { username, password, role, department } = req.body;
    try {
        // Encrypt the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO users (username, password_hash, role, department) VALUES (\$1, \$2, \$3, \$4) RETURNING id, username, role',
            [username, passwordHash, role || 'staff', department || 'Unassigned']
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error registering user. Username might exist." });
    }
});

// 2. Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Find the user
        const result = await pool.query('SELECT * FROM users WHERE username = \$1', [username]);
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: "User not found." });
        }

        const user = result.rows[0];

        // Check if password matches the hash
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ success: false, message: "Invalid password." });
        }

        // Generate the JWT Token (Valid for 10 hours)
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, department: user.department },
            process.env.JWT_SECRET,
            { expiresIn: '10h' }
        );

        res.json({ 
            success: true, 
            token: token, 
            user: { username: user.username, role: user.role, department: user.department } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error during login." });
    }
});

// ==========================================
// SECURE KPI ROUTES (Protected by Middleware)
// ==========================================

// Get all KPIs (Only sends data allowed for that user's department, unless Admin)
app.get('/api/kpis', authenticateToken, async (req, res) => {
    try {
        let result;
        if (req.user.role === 'admin') {
            // Admins see everything
            result = await pool.query('SELECT * FROM kpis ORDER BY created_at DESC');
        } else {
            // Department Heads only see their own department's data
            result = await pool.query('SELECT * FROM kpis WHERE department = \$1 ORDER BY created_at DESC', [req.user.department]);
        }
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Insert a new KPI
app.post('/api/kpis', authenticateToken, async (req, res) => {
    // Basic RBAC: Prevent 'staff' from adding global metrics
    if (req.user.role === 'staff') {
        return res.status(403).json({ success: false, message: "Staff are not authorized to write metrics." });
    }

    const { name, perspective, department, targetValue, actualValue, month } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO kpis (name, perspective, department, target_value, actual_value, month) VALUES (\$1, \$2, \$3, \$4, \$5, \$6) RETURNING *',
            [name, perspective, department, targetValue, actualValue, month]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete a KPI (Admin Only)
app.delete('/api/kpis/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Only System Administrators can delete records." });
    }
    try {
        await pool.query('DELETE FROM kpis WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: "Record deleted." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`[Ultron Secure Backend] running on port ${PORT}`);
});