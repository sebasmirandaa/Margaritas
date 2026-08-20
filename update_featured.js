const fs = require('fs');

let js = fs.readFileSync('public/margarita.js', 'utf8');

// Fix renderFeatured
js = js.replace(
    /function renderFeatured\(\) \{\s*var th = theme\(\);\s*\$\('grid-featured'\)\.innerHTML = th\.feat\.map\(function \(i\) \{\s*var p = product\(i\);\s*return p \? cardHTML\(p, false\) : '';\s*\}\)\.join\(''\);\s*\}/g,
    `function renderFeatured() {
    var th = theme();
    var prods = PRODUCTS.filter(function(p) { return p.tag === th.name; }).slice(0, 4);
    $('grid-featured').innerHTML = prods.map(function (p) {
      return cardHTML(p, false);
    }).join('');
  }`
);

// Fix promoProduct
js = js.replace(
    /if \(\$\('promo-card'\)\) \$\('promo-card'\)\.setAttribute\('data-open', th\.promoProduct !== undefined \? th\.promoProduct : ''\);/g,
    `if ($('promo-card')) {
          var firstProd = PRODUCTS.find(function(p) { return p.tag === th.name; });
          $('promo-card').setAttribute('data-open', firstProd ? firstProd.id : '');
        }`
);

fs.writeFileSync('public/margarita.js', js, 'utf8');
console.log('margarita.js fixed featured and promo products');
