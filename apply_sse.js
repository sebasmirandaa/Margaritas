const fs = require('fs');

// 1. Update server.js
let serverJs = fs.readFileSync('server.js', 'utf8');
if (!serverJs.includes('const sseClients = new Set();')) {
    serverJs = serverJs.replace(
        /app\.get\('\/admin', \(req, res\) => \{\s*res\.redirect\('\/admin\.html'\);\s*\}\);/,
        `app.get('/admin', (req, res) => {\n    res.redirect('/admin.html');\n});\n\nconst sseClients = new Set();\napp.get('/api/updates', (req, res) => {\n    res.setHeader('Content-Type', 'text/event-stream');\n    res.setHeader('Cache-Control', 'no-cache');\n    res.setHeader('Connection', 'keep-alive');\n    res.flushHeaders();\n    sseClients.add(res);\n    req.on('close', () => { sseClients.delete(res); });\n});\n\nfunction notifyUpdate() {\n    for (let client of sseClients) {\n        client.write('data: update\\n\\n');\n    }\n}`
    );
}

serverJs = serverJs.replace(
    /fs\.writeFileSync\(margaritaPath, newJs, 'utf8'\);\s*res\.json\(\{ success: true \}\);/,
    `fs.writeFileSync(margaritaPath, newJs, 'utf8');\n        notifyUpdate();\n        res.json({ success: true });`
);

fs.writeFileSync('server.js', serverJs, 'utf8');

// 2. Update margarita.js
let margaritaJs = fs.readFileSync('public/margarita.js', 'utf8');
if (!margaritaJs.includes('EventSource')) {
    margaritaJs += `\n\nif (window.EventSource) {\n  const evtSource = new EventSource('/api/updates');\n  evtSource.onmessage = function(event) {\n    if (event.data === 'update') {\n      window.location.reload(true);\n    }\n  };\n}\n`;
    fs.writeFileSync('public/margarita.js', margaritaJs, 'utf8');
}
