require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE,
                password VARCHAR(255),
                role VARCHAR(50) DEFAULT 'customer'
            )
        `);

        // Insert admin si no existe
        const res = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
        if (res.rows.length === 0) {
            await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', ['admin', 'admin', 'admin']);
        }
    } catch (e) {
        console.error("Error inicializando la base de datos:", e);
    }
}

initDB();

module.exports = pool;
