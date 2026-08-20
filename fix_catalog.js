const fs = require('fs');
let content = fs.readFileSync('public/margarita.js', 'utf8');

const map = {
  'gen_1.jpg': 'Rosa',
  'gen_2.jpg': 'Tulipán',
  'gen_3.jpg': 'Peonía',
  'gen_4.jpg': 'Fresia',
  'gen_5.jpg': 'Hortensia',
  'gen_6.jpg': 'Margarita',
  'f-rojas.png': 'Rosas Rojas',
  'f-amarillas.png': 'Flores Amarillas',
  'f-girasol.png': 'Girasoles'
};

const counts = {};

const regex = /\{ id: (\d+), title: '([^']+)', price: (\d+), img: 'assets\/([^']+)', tag: '([^']+)', desc: '([^']+)' \}/g;

content = content.replace(regex, (match, id, title, price, img, tag, desc) => {
  if (map[img]) {
    const baseName = map[img];
    
    // Create a unique name to avoid duplicate titles in the same season
    const key = baseName + '_' + tag;
    counts[key] = (counts[key] || 0) + 1;
    
    let suffix = ' de ' + tag;
    if (counts[key] > 1) {
       suffix = ' Clásica de ' + tag;
       if (baseName.endsWith('s')) suffix = ' Clásicos de ' + tag; // Girasoles Clásicos
       if (baseName === 'Rosa' || baseName === 'Margarita' || baseName === 'Peonía' || baseName === 'Fresia' || baseName === 'Hortensia') suffix = ' Clásica de ' + tag;
    }
    
    const newTitle = baseName + suffix;
    const newDesc = 'Hermoso arreglo de ' + baseName.toLowerCase() + ' seleccionado para la temporada de ' + tag + '.';
    
    return `{ id: ${id}, title: '${newTitle}', price: ${price}, img: 'assets/${img}', tag: '${tag}', desc: '${newDesc}' }`;
  }
  return match; // return unmodified if it's one of the real photos
});

fs.writeFileSync('public/margarita.js', content, 'utf8');
console.log('Catálogo actualizado correctamente.');
