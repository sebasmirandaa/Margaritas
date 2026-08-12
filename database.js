const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'temp.db');
const db = new Database(dbPath);

// Crear tabla de usuarios con rol
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'customer'
  )
`);

// Insertar usuarios iniciales
const insert = db.prepare('INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)');
insert.run('admin', 'admin', 'admin');
insert.run('usuario1', 'usuario1', 'customer');

module.exports = db;
