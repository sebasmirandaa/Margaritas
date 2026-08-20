const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'margaritas-admin-secret-key-123';
const token = jwt.sign({ username: 'mcp-agent', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

const products = [
    { title: 'Ramo de Rosas Rosadas', price: 100000, tag: 'Primavera', img: 'assets/rosas_rosadas.png' },
    { title: 'Ramo Clásico de Rosas Rojas', price: 120000, tag: 'Primavera', img: 'assets/rosas_rojas.png' },
    { title: 'Ramo Mixto Rosa y Fucsia', price: 80000, tag: 'Otoño', img: 'assets/margaritas_mixtas.png' },
    { title: 'Ramo de Tulipanes Rosados', price: 150000, tag: 'Invierno', img: 'assets/tulipanes.png' },
    { title: 'Ramo de Lirios Rosados', price: 140000, tag: 'Verano', img: 'assets/lirios.png' }
];

async function addProducts() {
    for (const product of products) {
        const res = await fetch('http://localhost:8080/api/admin/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ action: 'create', product })
        });
        const data = await res.json();
        console.log(`Added ${product.title}: ${data.success}`);
    }
}

addProducts().catch(console.error);
