const fs = require('fs');
const path = require('path');
let srv = fs.readFileSync('server.js', 'utf8');

srv = srv.replace('app.use(express.json());', "app.use(express.json({ limit: '50mb' }));");

const endpoints = `
// CRUD PRODUCTOS (Lee y escribe margarita.js dinámicamente)
const margaritaPath = path.join(__dirname, 'public/margarita.js');

app.get('/api/admin/products', requiereAdmin, (req, res) => {
    try {
        const js = fs.readFileSync(margaritaPath, 'utf8');
        const match = js.match(/var PRODUCTS = (\\[[\\s\\S]*?\\]);/);
        if (!match) throw new Error('No se encontro PRODUCTS');
        const products = new Function('return ' + match[1])();
        res.json({ success: true, products });
    } catch(e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/admin/products', requiereAdmin, (req, res) => {
    try {
        const { action, product } = req.body;
        const js = fs.readFileSync(margaritaPath, 'utf8');
        const match = js.match(/var PRODUCTS = (\\[[\\s\\S]*?\\]);/);
        if (!match) throw new Error('No se encontro PRODUCTS');
        let products = new Function('return ' + match[1])();
        
        // Manejo de imagen en base64
        if (product.imageBase64) {
            const base64Data = product.imageBase64.replace(/^data:image\\/\\w+;base64,/, '');
            const extMatch = product.imageBase64.match(/^data:image\\/(\\w+);base64,/);
            const ext = extMatch ? extMatch[1] : 'jpg';
            const filename = 'assets/prod_' + Date.now() + '.' + ext;
            fs.writeFileSync(path.join(__dirname, 'public', filename), Buffer.from(base64Data, 'base64'));
            product.img = filename;
            delete product.imageBase64;
        }

        if (action === 'delete') {
            products = products.filter(p => p.id !== product.id);
        } else if (action === 'update') {
            const idx = products.findIndex(p => p.id === product.id);
            if (idx >= 0) products[idx] = { ...products[idx], ...product };
        } else if (action === 'create') {
            const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
            product.id = nextId;
            products.push(product);
        }

        const newJs = js.replace(/var PRODUCTS = \\[[\\s\\S]*?\\];/, 'var PRODUCTS = ' + JSON.stringify(products, null, 2).replace(/\\"([a-zA-Z0-9_]+)\\":/g, '$1:') + ';');
        fs.writeFileSync(margaritaPath, newJs, 'utf8');
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
`;

srv = srv.replace("app.get('/api/admin/status', requiereAdmin", endpoints + "\n\napp.get('/api/admin/status', requiereAdmin");

fs.writeFileSync('server.js', srv, 'utf8');
console.log('server.js updated with endpoints');
