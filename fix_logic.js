const fs = require('fs');
let js = fs.readFileSync('public/margarita.js', 'utf8');

const appendLogic = `
  // Add listener for btn-ver-todo
  document.addEventListener('DOMContentLoaded', function() {
    var btn = $('btn-ver-todo');
    if (btn) {
      btn.addEventListener('click', function() {
        $('catalogo-completo').style.display = 'block';
        btn.style.display = 'none';
        renderCatalogoCompleto();
        setTimeout(function() {
          $('catalogo-completo').scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
    }
  });

  function renderCatalogoCompleto() {
    var html = '';
    SEASON_ORDER.forEach(function (sk) {
      var s = SEASONS[sk];
      var list = PRODUCTS.filter(function(p) { return p.tag === s.name; });
      if (list.length > 0) {
        html += '<h3 style="margin-top: 40px; margin-bottom: 20px; font-size: 1.5rem; text-align: left; border-bottom: 1px solid #ccc; padding-bottom: 10px;">' + s.name + '</h3>';
        html += '<div class="product-grid">' + list.map(function(p){ return cardHTML(p, true); }).join('') + '</div>';
      }
    });
    $('grid-catalogo-completo').innerHTML = html;
  }
`;

js = js.replace(/function bind\(\) \{/, appendLogic + '\n  function bind() {');

fs.writeFileSync('public/margarita.js', js, 'utf8');
console.log('margarita.js appended full catalog logic');
