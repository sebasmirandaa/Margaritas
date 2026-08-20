const fs = require('fs');

let js = fs.readFileSync('public/margarita.js', 'utf8');

js = js.replace(
    /font-size:0\.8rem; margin-right:5px;/,
    `font-size:0.95rem; margin-right:6px; opacity:0.8;`
);

js = js.replace(
    /font-size:1rem; margin-right:8px;/,
    `font-size:1.25rem; margin-right:12px; opacity:0.8;`
);

fs.writeFileSync('public/margarita.js', js, 'utf8');
console.log('margarita.js sizes updated');
