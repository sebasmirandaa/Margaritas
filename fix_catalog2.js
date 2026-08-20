const fs = require('fs');
let content = fs.readFileSync('public/margarita.js', 'utf8');

const map = {
  'gen_1.jpg': 'Peonías Rosadas',
  'gen_2.jpg': 'Rosas en Caja',
  'gen_3.jpg': 'Girasoles y Margaritas',
  'gen_4.jpg': 'Orquídea Blanca'
};

const counts = {};

const regex = /\{ id: (\d+), title: '([^']+)', price: (\d+), img: 'assets\/([^']+)', tag: '([^']+)', desc: '([^']+)' \}/g;

content = content.replace(regex, (match, id, title, price, img, tag, desc) => {
  if (map[img]) {
    const baseName = map[img];
    
    const key = baseName + '_' + tag;
    counts[key] = (counts[key] || 0) + 1;
    
    let suffix = ' de ' + tag;
    if (counts[key] > 1) {
       suffix = ' Especial de ' + tag;
    }
    
    const newTitle = baseName + suffix;
    const newDesc = 'Arreglo de ' + baseName.toLowerCase() + ' seleccionado para la temporada de ' + tag + '.';
    
    return `{ id: ${id}, title: '${newTitle}', price: ${price}, img: 'assets/${img}', tag: '${tag}', desc: '${newDesc}' }`;
  }
  return match;
});

fs.writeFileSync('public/margarita.js', content, 'utf8');
console.log('Nombres corregidos.');
