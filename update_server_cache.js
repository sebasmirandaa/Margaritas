const fs = require('fs');
const path = require('path');
let srv = fs.readFileSync('server.js', 'utf8');

srv = srv.replace(
    /app\.use\(express\.static\(path\.join\(__dirname, 'public'\)\)\);/,
    `app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, reqPath) => {
        if (reqPath.endsWith('.js') || reqPath.endsWith('.html') || reqPath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));`
);

fs.writeFileSync('server.js', srv, 'utf8');
console.log('server.js updated cache headers');
