const fs = require('fs');
let js = fs.readFileSync('public/margarita.js', 'utf8');

// 1. Redistribute products
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

// 2. Default state.filter to null
js = js.replace(/filter:\s*'todo'/, 'filter: null');

// 3. Update load() to initialize the filter to the season name
js = js.replace(/if \(s && SEASONS\[s\]\) state\.season = s;\s*\}\s*catch/, 
`if (s && SEASONS[s]) state.season = s;
      if (!state.filter) state.filter = SEASONS[state.season || autoSeason()].name;
    } catch`);

// 4. Update the season sheet click handler to ALSO update state.filter
js = js.replace(/onclick="state\.season=''\s*\+\s*k\s*\+\s*'';\s*state\.sheetOpen=false;\s*renderAll\(\);"/, 
`onclick="state.season='" + k + "'; state.filter=SEASONS['" + k + "'].name; state.sheetOpen=false; renderAll();"`);

fs.writeFileSync('public/margarita.js', js, 'utf8');
console.log('margarita.js updated with perfect syncing logic');
