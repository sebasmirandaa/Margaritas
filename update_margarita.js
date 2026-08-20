const fs = require('fs');

let js = fs.readFileSync('public/margarita.js', 'utf8');

js = js.replace(
    /'<span class="p-price">' \+ fmt\(p\.price\) \+ '<\/span>' \+/,
    `'<span class="p-price">' + (p.oldPrice ? '<span style="text-decoration:line-through; color:var(--txt-light); font-size:0.8rem; margin-right:5px;">' + fmt(p.oldPrice) + '</span>' : '') + fmt(p.price) + '</span>' +`
);

js = js.replace(
    /'<div class="detail-price">' \+ fmt\(p\.price\) \+ '<\/div>' \+/,
    `'<div class="detail-price">' + (p.oldPrice ? '<span style="text-decoration:line-through; color:var(--txt-light); font-size:1rem; margin-right:8px;">' + fmt(p.oldPrice) + '</span>' : '') + fmt(p.price) + '</div>' +`
);

fs.writeFileSync('public/margarita.js', js, 'utf8');
console.log('margarita.js updated successfully for discounts');
