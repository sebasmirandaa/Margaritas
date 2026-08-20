const fs = require('fs');
let js = fs.readFileSync('public/margarita.js', 'utf8');

const regex = /  function renderFeatured\(\) \{\s*var th = theme\(\);\s*var prods = PRODUCTS\.filter\(function\(p\) \{ return p\.tag === th\.name; \}\)\.slice\(0, 4\);\s*\$\('grid-featured'\)\.innerHTML = prods\.map\(function \(p\) \{\s*return cardHTML\(p, false\);\s*\}\)\.join\(''\);\s*\}/;

js = js.replace(regex, '');
js = js.replace(/    renderFeatured\(\);\n/, '');

fs.writeFileSync('public/margarita.js', js, 'utf8');
console.log('Removed renderFeatured');
