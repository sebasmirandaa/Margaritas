const fs = require('fs');
let css = fs.readFileSync('public/margarita.css', 'utf8');

css = css.replace(
    /@media \(max-width: 780px\) \{\s*\.site-header/g,
    `@media (max-width: 780px) {\n    .hero-delivery { font-size: 16px; }\n  .site-header`
);

css = css.replace(
    /@media \(max-width: 420px\) \{\s*\.cart-btn/g,
    `@media (max-width: 420px) {\n    .hero-delivery { font-size: 14.5px; }\n  .cart-btn`
);

fs.writeFileSync('public/margarita.css', css, 'utf8');
