const fs = require('fs'); let content = fs.readFileSync('public/margarita.js', 'utf8'); const newProducts =     {
      id: 31,
      title: "Ramo de Ranúnculos y Fresias",
      price: 135000,
      img: "assets/primavera_ranunculos.png",
      tag: "Primavera",
      desc: "Delicado arreglo primaveral con ranúnculos rosados y fresias blancas, perfecto para celebrar la primavera."
    },
    {
      id: 32,
      title: "Ramo de Tulipanes y Jacintos",
      price: 155000,
      img: "assets/primavera_tulipanes_jacintos.png",
      tag: "Primavera",
      desc: "Colorido ramo primaveral que combina tulipanes vibrantes y fragantes jacintos lilas."
    },
    {
      id: 33,
      title: "Ramo de Peonías y Ranúnculos",
      price: 175000,
      img: "assets/primavera_peonias.png",
      tag: "Primavera",
      desc: "Voluptuoso y elegante ramo en tonos rosados y durazno, con peonías y ranúnculos frescos."
    },\n; content = content.replace('  ];\n\n  var FILTERS', newProducts + '  ];\n\n  var FILTERS'); fs.writeFileSync('public/margarita.js', content);
