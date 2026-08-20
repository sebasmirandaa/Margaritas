const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const dom = new JSDOM(`
<!DOCTYPE html><html><body>
<div id="season-chip-label"></div><div id="season-chip-icon"></div>
<div id="hero-script"></div><div id="hero-title"></div><div id="hero-tag"></div><div id="hero-price"></div><div id="hero-img"></div>
<div id="promo-script"></div><div id="promo-title"></div><div id="promo-sub"></div><div id="promo-card"></div>
<div id="feat-title"></div><div id="flowers-chips"></div><div id="grid-featured"></div><div id="filters"></div>
<div id="catalog-grid"></div><div id="cart-badge"></div><div id="cart-total"></div>
<div id="assistant-body"></div><div id="cart-lines"></div>
<div id="season-sheet-grid"></div>
</body></html>
`, { runScripts: 'dangerously' });
const script = fs.readFileSync('public/margarita.js', 'utf8');
try {
  dom.window.eval(script);
  // Wait for DOMContentLoaded which is dispatched synchronously by JSDOM if added early, or we can just call it
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  console.log('Script executed successfully in DOM.');
} catch (e) {
  console.error('Error during execution: ' + e.message + '\n' + e.stack);
}
