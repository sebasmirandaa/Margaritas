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
    // Verano hero product (id: 2 uses gen_3.jpg)
    await updateProduct(2, { 
        title: 'Girasoles y margaritas', 
        price: 110000, 
        tag: 'Verano', 
        desc: 'Arreglo de girasoles y margaritas perfecto para la calidez del verano.' 
    });

    // Otoño hero product (id: 4 uses gen_5.jpg)
    await updateProduct(4, { 
        title: 'Ramo silvestre pastel', 
        price: 95000, 
        tag: 'Otoño', 
        desc: 'Un hermoso ramo silvestre en tonos pastel ideal para el otoño.' 
    });

    // Invierno hero product (id: 1 uses gen_2.jpg)
    await updateProduct(1, { 
        title: 'Caja premium negra', 
        price: 200000, 
        tag: 'Invierno', 
        desc: 'Caja premium negra con hermosas flores, especial para el invierno.' 
    });
}

run().catch(console.error);
