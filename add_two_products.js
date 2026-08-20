const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'margaritas-admin-secret-key-123';
const token = jwt.sign({ username: 'mcp-agent', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

const products = [
    { title: 'Ramo de Rosas Rojas en Papel Negro', price: 130000, tag: 'Invierno', img: 'assets/rosas_rojas_negras.png', desc: 'Elegante ramo de rosas rojas envuelto en papel negro mate, ideal para el invierno.' },
    { title: 'Ramo de Girasoles y Rosas Amarillas', price: 140000, tag: 'Verano', img: 'assets/girasoles_rosas.png', desc: 'Brillante combinación de girasoles y rosas amarillas para iluminar tus días de verano.' }
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
