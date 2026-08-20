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
    await updateProduct(26, { title: 'Ramo Mixto Rosa y Fucsia', price: 80000, tag: 'Otoño', img: 'assets/margaritas_mixtas.jpg' });
    await updateProduct(27, { title: 'Ramo de Tulipanes Rosados', price: 150000, tag: 'Invierno', img: 'assets/tulipanes.jpg' });
}

run().catch(console.error);
