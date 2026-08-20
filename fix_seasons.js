const fs = require('fs');
let js = fs.readFileSync('public/margarita.js', 'utf8');

const productsMatch = js.match(/var PRODUCTS = \[\s*([\s\S]*?)\s*\];/);
let productsStr = productsMatch[1];
const itemRegex = /\{[^}]+\}/g;
let items = productsStr.match(itemRegex);

const seasons = ['Primavera', 'Verano', 'Otoño', 'Invierno'];
let newItems = [];
items.forEach((item, index) => {
    let season = seasons[Math.floor(index / 6)];
    
    // Update tag
    let updatedItem = item.replace(/tag:\s*'[^']+'/, "tag: '" + season + "'");
    
    // Update title to match season
    updatedItem = updatedItem.replace(/title:\s*'([^']+)'/, (match, title) => {
        let newTitle = title.replace(/ de (Primavera|Verano|Otoño|Invierno)/, '');
        newTitle = newTitle + ' de ' + season;
        return "title: '" + newTitle + "'";
    });
    
    newItems.push(updatedItem);
});

js = js.replace(/var PRODUCTS = \[\s*([\s\S]*?)\s*\];/, 'var PRODUCTS = [\n    ' + newItems.join(',\n    ') + '\n  ];');

// Remove 'todo' filter
js = js.replace(/\{\s*key:\s*'todo',\s*label:\s*'Todos'\s*\},\s*/, '');

// Sync the catalog with the chosen season automatically
js = js.replace(/function currentSeasonKey\(\) \{\s*return state\.season \|\| autoSeason\(\);\s*\}/, 
`function currentSeasonKey() { return state.season || autoSeason(); }
  function syncFilter() { 
      var currentName = SEASONS[currentSeasonKey()].name;
      if (!state.filter || state.filter === 'todo' || !FILTERS.find(function(f){return f.key===state.filter})) {
          state.filter = currentName; 
      }
  }`);

js = js.replace(/function renderCatalog\(\) \{/, 
`function renderCatalog() {
    syncFilter();`);

// When season sheet changes season, also update filter
js = js.replace(/state\.season = k;\s*state\.sheetOpen = false;\s*renderAll\(\);/g, 
`state.season = k; state.filter = SEASONS[k].name; state.sheetOpen = false; renderAll();`);

// Remove "todo" logic
js = js.replace(/state\.filter === 'todo' \|\| /g, '');

fs.writeFileSync('public/margarita.js', js, 'utf8');
console.log('margarita.js updated successfully');
