const fs = require('fs');
let js = fs.readFileSync('public/admin.js', 'utf8');

// Insert formatter function
const formatter = `
  function formatearPrecioInput(e) {
      let val = e.target.value.replace(/\\D/g, '');
      if (val) {
          e.target.value = parseInt(val, 10).toLocaleString('es-PY');
      } else {
          e.target.value = '';
      }
  }
  $('#prod-price')?.addEventListener('input', formatearPrecioInput);
  $('#prod-old-price')?.addEventListener('input', formatearPrecioInput);
`;

js = js.replace(/window\.editarProd = function\(id\) \{/, formatter + '\n  window.editarProd = function(id) {');

// Update edits to use toLocaleString
js = js.replace(
    /\$\('#prod-old-price'\)\.value = p\.oldPrice \|\| '';/,
    `$('#prod-old-price').value = p.oldPrice ? p.oldPrice.toLocaleString('es-PY') : '';`
);
js = js.replace(
    /\$\('#prod-price'\)\.value = p\.price \|\| '';/,
    `$('#prod-price').value = p.price ? p.price.toLocaleString('es-PY') : '';`
);

// Update save logic
js = js.replace(
    /const oldPriceRaw = \$\('#prod-old-price'\)\.value;\s*const oldPrice = oldPriceRaw \? parseInt\(oldPriceRaw, 10\) : null;\s*const price = parseInt\(\$\('#prod-price'\)\.value, 10\);/,
    `const oldPriceRaw = $('#prod-old-price').value.replace(/\\D/g, '');
      const oldPrice = oldPriceRaw ? parseInt(oldPriceRaw, 10) : null;
      const price = parseInt($('#prod-price').value.replace(/\\D/g, ''), 10);`
);

fs.writeFileSync('public/admin.js', js, 'utf8');
console.log('admin.js updated');
