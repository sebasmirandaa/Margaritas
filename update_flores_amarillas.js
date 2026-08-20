const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'margaritas-admin-secret-key-123';
const token = jwt.sign({ username: 'mcp-agent', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

async function updateProduct(id, updates) {
    const res = await fetch('http://localhost:8080/api/admin/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'update', product: { id, ...updates } })
    });
    const data = await res.json();
    console.log(`Updated ${id}: ${data.success}`);
}

async function run() {
    await updateProduct(7, { 
        title: 'Rosas Amarillas', 
        price: 150000, 
        tag: 'Primavera', 
        desc: 'Hermoso arreglo de rosas amarillas seleccionado para la temporada de Primavera.' 
    });
}

run().catch(console.error);
