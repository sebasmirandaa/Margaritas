/* ============================================================
   Margarita · Florería — lógica de la tienda
   Temas estacionales, catálogo, carrito y asistente de pedidos
   conectado al bot de WhatsApp (POST /api/checkout).
   ============================================================ */

(function () {
  'use strict';

  // ---------- Config ----------
  var TIENDA_WA = '595971140350';
  var API_BASE = (location.protocol === 'file:') ? 'http://localhost:8080' : '';
  var LS_CART = 'margarita_cart';
  var LS_SEASON = 'margarita_season';

  // ---------- Iconos (SVG inline) ----------
  var ICON_PATHS = {
    flower: ['M12 7.5V9', 'M7.5 12H9', 'M16.5 12H15', 'M12 16.5V15', 'M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5'],
    bag: ['M6 7h12l1 14H5L6 7Z', 'M9 10V6a3 3 0 0 1 6 0v4'],
    sun: ['M12 2v2', 'M12 20v2', 'M4.93 4.93l1.41 1.41', 'M17.66 17.66l1.41 1.41', 'M2 12h2', 'M20 12h2', 'M6.34 17.66l-1.41 1.41', 'M19.07 4.93l-1.41 1.41'],
    leaf: ['M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z', 'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12'],
    snow: ['M12 3v18', 'M3 12h18', 'M5.6 5.6l12.8 12.8', 'M18.4 5.6 5.6 18.4'],
    gift: ['M20 12v9H4v-9', 'M2 8h20v4H2z', 'M12 8v13', 'M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5'],
    phone: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'],
    sparkles: ['M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z', 'M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z'],
    send: ['m22 2-7 20-4-9-9-4Z', 'M22 2 11 13'],
    truck: ['M14 16V6H2v10h12Z', 'M14 9h3.5l2.5 3.5V16h-6']
  };
  var ICON_EXTRA = {
    flower: '<circle cx="12" cy="12" r="2.6"></circle>',
    sun: '<circle cx="12" cy="12" r="4"></circle>',
    truck: '<circle cx="6.5" cy="18.5" r="1.7"></circle><circle cx="16.5" cy="18.5" r="1.7"></circle>'
  };

  function icon(name, size, color) {
    var paths = (ICON_PATHS[name] || []).map(function (d) { return '<path d="' + d + '"></path>'; }).join('');
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color +
      '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" ' +
      'style="flex:none;vertical-align:middle">' + paths + (ICON_EXTRA[name] || '') + '</svg>';
  }

  // ---------- Temas de temporada ----------
  var SEASONS = {
    primavera: {
      key: 'primavera', name: 'Primavera', icon: 'flower', months: 'sep – nov', ink: '#4a2a38',
      heroLine1: 'Llegó la', heroLine2: 'Primavera', heroTag: 'Rosas amarillas', heroPrice: '150.000 Gs',
      heroImg: 'assets/f-amarillas.png', promoScript: 'Tendencia amarilla', featTitle: 'Especial Flores Amarillas',
      promoTitle: 'Ramo primaveral + bombones', promoSub: 'Dedicatoria', promoProduct: 0,
      flowers: ["Rosa", "Tulipán", "Peonía", "Fresia", "Hortensia", "Margarita", "Jazmín", "Azalea", "Iris", "Lirio", "Petunia", "Caléndula", "Girasol", "Gerbera", "Narciso"], feat: [0, 1, 2, 3]
    },
    verano: {
      key: 'verano', name: 'Verano', icon: 'sun', months: 'dic – feb', ink: '#123a4a',
      heroLine1: 'Colección de', heroLine2: 'Verano', heroTag: 'Girasoles y margaritas', heroPrice: '110.000 Gs',
      heroImg: 'assets/gen_3.jpg', promoScript: 'Promo de verano', featTitle: 'Favoritos del verano',
      promoTitle: 'Arreglo de verano + florero', promoSub: 'Dedicatoria', promoProduct: 15,
      flowers: ["Girasol", "Rosa", "Hibisco", "Hortensia", "Zinnia", "Dalia", "Lavanda", "Buganvilla", "Cosmos", "Lirio", "Celosia", "Jazmín", "Portulaca", "Geranio", "Gazania"], feat: [15, 16, 17, 18]
    },
    otono: {
      key: 'otono', name: 'Otoño', icon: 'leaf', months: 'mar – may', ink: '#4a3220',
      heroLine1: 'Colores de', heroLine2: 'Otoño', heroTag: 'Ramo silvestre pastel', heroPrice: '95.000 Gs',
      heroImg: 'assets/gen_5.jpg', promoScript: 'Promo de otoño', featTitle: 'Favoritos del otoño',
      promoTitle: 'Ramo cálido + vela aromática', promoSub: 'Dedicatoria', promoProduct: 30,
      flowers: ["Crisantemo", "Rosa", "Dalia", "Aster", "Caléndula", "Pensamiento", "Begonia", "Cosmos", "Hortensia", "Salvia", "Alstroemeria", "Camelia", "Clavel", "Margarita", "Verbena"], feat: [30, 31, 32, 33]
    },
    invierno: {
      key: 'invierno', name: 'Invierno', icon: 'snow', months: 'jun – ago', ink: '#22344a',
      heroLine1: 'Abrigá el', heroLine2: 'Invierno', heroTag: 'Caja premium negra', heroPrice: '200.000 Gs',
      heroImg: 'assets/gen_2.jpg', promoScript: 'Promo de invierno', featTitle: 'Favoritos del invierno',
      promoTitle: 'Ramo grande + peluche', promoSub: 'Dedicatoria', promoProduct: 45,
      flowers: ["Rosa", "Camelia", "Ciclamen", "Pensamiento", "Prímula", "Begonia", "Caléndula", "Jazmín de invierno", "Azalea", "Narciso", "Tulipán", "Violeta", "Mahonia", "Helleboro", "Alhelí"], feat: [45, 46, 47, 48]
    }
  };
  var SEASON_ORDER = ['primavera', 'verano', 'otono', 'invierno'];

  // ---------- Catálogo ----------
  var PRODUCTS = [
    { id: 0, title: 'Rosa de Primavera', price: 100000, img: 'assets/gen_1.jpg', tag: 'Primavera', desc: 'Hermosa flor de Rosa seleccionada para la temporada de Primavera.' },
    { id: 1, title: 'Tulipán de Primavera', price: 100000, img: 'assets/gen_2.jpg', tag: 'Primavera', desc: 'Hermosa flor de Tulipán seleccionada para la temporada de Primavera.' },
    { id: 2, title: 'Peonía de Primavera', price: 100000, img: 'assets/gen_3.jpg', tag: 'Primavera', desc: 'Hermosa flor de Peonía seleccionada para la temporada de Primavera.' },
    { id: 3, title: 'Fresia de Primavera', price: 100000, img: 'assets/gen_4.jpg', tag: 'Primavera', desc: 'Hermosa flor de Fresia seleccionada para la temporada de Primavera.' },
    { id: 4, title: 'Hortensia de Primavera', price: 100000, img: 'assets/gen_5.jpg', tag: 'Primavera', desc: 'Hermosa flor de Hortensia seleccionada para la temporada de Primavera.' },
    { id: 5, title: 'Margarita de Primavera', price: 100000, img: 'assets/gen_6.jpg', tag: 'Primavera', desc: 'Hermosa flor de Margarita seleccionada para la temporada de Primavera.' },
    { id: 6, title: 'Jazmín de Primavera', price: 100000, img: 'assets/f-rojas.png', tag: 'Primavera', desc: 'Hermosa flor de Jazmín seleccionada para la temporada de Primavera.' },
    { id: 7, title: 'Azalea de Primavera', price: 100000, img: 'assets/f-amarillas.png', tag: 'Primavera', desc: 'Hermosa flor de Azalea seleccionada para la temporada de Primavera.' },
    { id: 8, title: 'Iris de Primavera', price: 100000, img: 'assets/f-girasol.png', tag: 'Primavera', desc: 'Hermosa flor de Iris seleccionada para la temporada de Primavera.' },
    { id: 9, title: 'Lirio de Primavera', price: 100000, img: 'assets/gen_1.jpg', tag: 'Primavera', desc: 'Hermosa flor de Lirio seleccionada para la temporada de Primavera.' },
    { id: 10, title: 'Petunia de Primavera', price: 100000, img: 'assets/gen_2.jpg', tag: 'Primavera', desc: 'Hermosa flor de Petunia seleccionada para la temporada de Primavera.' },
    { id: 11, title: 'Caléndula de Primavera', price: 100000, img: 'assets/gen_3.jpg', tag: 'Primavera', desc: 'Hermosa flor de Caléndula seleccionada para la temporada de Primavera.' },
    { id: 12, title: 'Girasol de Primavera', price: 100000, img: 'assets/gen_4.jpg', tag: 'Primavera', desc: 'Hermosa flor de Girasol seleccionada para la temporada de Primavera.' },
    { id: 13, title: 'Gerbera de Primavera', price: 100000, img: 'assets/gen_5.jpg', tag: 'Primavera', desc: 'Hermosa flor de Gerbera seleccionada para la temporada de Primavera.' },
    { id: 14, title: 'Narciso de Primavera', price: 100000, img: 'assets/gen_6.jpg', tag: 'Primavera', desc: 'Hermosa flor de Narciso seleccionada para la temporada de Primavera.' },
    { id: 15, title: 'Girasol de Verano', price: 100000, img: 'assets/f-rojas.png', tag: 'Verano', desc: 'Hermosa flor de Girasol seleccionada para la temporada de Verano.' },
    { id: 16, title: 'Rosa de Verano', price: 100000, img: 'assets/f-amarillas.png', tag: 'Verano', desc: 'Hermosa flor de Rosa seleccionada para la temporada de Verano.' },
    { id: 17, title: 'Hibisco de Verano', price: 100000, img: 'assets/f-girasol.png', tag: 'Verano', desc: 'Hermosa flor de Hibisco seleccionada para la temporada de Verano.' },
    { id: 18, title: 'Hortensia de Verano', price: 100000, img: 'assets/gen_1.jpg', tag: 'Verano', desc: 'Hermosa flor de Hortensia seleccionada para la temporada de Verano.' },
    { id: 19, title: 'Zinnia de Verano', price: 100000, img: 'assets/gen_2.jpg', tag: 'Verano', desc: 'Hermosa flor de Zinnia seleccionada para la temporada de Verano.' },
    { id: 20, title: 'Dalia de Verano', price: 100000, img: 'assets/gen_3.jpg', tag: 'Verano', desc: 'Hermosa flor de Dalia seleccionada para la temporada de Verano.' },
    { id: 21, title: 'Lavanda de Verano', price: 100000, img: 'assets/gen_4.jpg', tag: 'Verano', desc: 'Hermosa flor de Lavanda seleccionada para la temporada de Verano.' },
    { id: 22, title: 'Buganvilla de Verano', price: 100000, img: 'assets/gen_5.jpg', tag: 'Verano', desc: 'Hermosa flor de Buganvilla seleccionada para la temporada de Verano.' },
    { id: 23, title: 'Cosmos de Verano', price: 100000, img: 'assets/gen_6.jpg', tag: 'Verano', desc: 'Hermosa flor de Cosmos seleccionada para la temporada de Verano.' },
    { id: 24, title: 'Lirio de Verano', price: 100000, img: 'assets/f-rojas.png', tag: 'Verano', desc: 'Hermosa flor de Lirio seleccionada para la temporada de Verano.' },
    { id: 25, title: 'Celosia de Verano', price: 100000, img: 'assets/f-amarillas.png', tag: 'Verano', desc: 'Hermosa flor de Celosia seleccionada para la temporada de Verano.' },
    { id: 26, title: 'Jazmín de Verano', price: 100000, img: 'assets/f-girasol.png', tag: 'Verano', desc: 'Hermosa flor de Jazmín seleccionada para la temporada de Verano.' },
    { id: 27, title: 'Portulaca de Verano', price: 100000, img: 'assets/gen_1.jpg', tag: 'Verano', desc: 'Hermosa flor de Portulaca seleccionada para la temporada de Verano.' },
    { id: 28, title: 'Geranio de Verano', price: 100000, img: 'assets/gen_2.jpg', tag: 'Verano', desc: 'Hermosa flor de Geranio seleccionada para la temporada de Verano.' },
    { id: 29, title: 'Gazania de Verano', price: 100000, img: 'assets/gen_3.jpg', tag: 'Verano', desc: 'Hermosa flor de Gazania seleccionada para la temporada de Verano.' },
    { id: 30, title: 'Crisantemo de Otoño', price: 100000, img: 'assets/gen_4.jpg', tag: 'Otoño', desc: 'Hermosa flor de Crisantemo seleccionada para la temporada de Otoño.' },
    { id: 31, title: 'Rosa de Otoño', price: 100000, img: 'assets/gen_5.jpg', tag: 'Otoño', desc: 'Hermosa flor de Rosa seleccionada para la temporada de Otoño.' },
    { id: 32, title: 'Dalia de Otoño', price: 100000, img: 'assets/gen_6.jpg', tag: 'Otoño', desc: 'Hermosa flor de Dalia seleccionada para la temporada de Otoño.' },
    { id: 33, title: 'Aster de Otoño', price: 100000, img: 'assets/f-rojas.png', tag: 'Otoño', desc: 'Hermosa flor de Aster seleccionada para la temporada de Otoño.' },
    { id: 34, title: 'Caléndula de Otoño', price: 100000, img: 'assets/f-amarillas.png', tag: 'Otoño', desc: 'Hermosa flor de Caléndula seleccionada para la temporada de Otoño.' },
    { id: 35, title: 'Pensamiento de Otoño', price: 100000, img: 'assets/f-girasol.png', tag: 'Otoño', desc: 'Hermosa flor de Pensamiento seleccionada para la temporada de Otoño.' },
    { id: 36, title: 'Begonia de Otoño', price: 100000, img: 'assets/gen_1.jpg', tag: 'Otoño', desc: 'Hermosa flor de Begonia seleccionada para la temporada de Otoño.' },
    { id: 37, title: 'Cosmos de Otoño', price: 100000, img: 'assets/gen_2.jpg', tag: 'Otoño', desc: 'Hermosa flor de Cosmos seleccionada para la temporada de Otoño.' },
    { id: 38, title: 'Hortensia de Otoño', price: 100000, img: 'assets/gen_3.jpg', tag: 'Otoño', desc: 'Hermosa flor de Hortensia seleccionada para la temporada de Otoño.' },
    { id: 39, title: 'Salvia de Otoño', price: 100000, img: 'assets/gen_4.jpg', tag: 'Otoño', desc: 'Hermosa flor de Salvia seleccionada para la temporada de Otoño.' },
    { id: 40, title: 'Alstroemeria de Otoño', price: 100000, img: 'assets/gen_5.jpg', tag: 'Otoño', desc: 'Hermosa flor de Alstroemeria seleccionada para la temporada de Otoño.' },
    { id: 41, title: 'Camelia de Otoño', price: 100000, img: 'assets/gen_6.jpg', tag: 'Otoño', desc: 'Hermosa flor de Camelia seleccionada para la temporada de Otoño.' },
    { id: 42, title: 'Clavel de Otoño', price: 100000, img: 'assets/f-rojas.png', tag: 'Otoño', desc: 'Hermosa flor de Clavel seleccionada para la temporada de Otoño.' },
    { id: 43, title: 'Margarita de Otoño', price: 100000, img: 'assets/f-amarillas.png', tag: 'Otoño', desc: 'Hermosa flor de Margarita seleccionada para la temporada de Otoño.' },
    { id: 44, title: 'Verbena de Otoño', price: 100000, img: 'assets/f-girasol.png', tag: 'Otoño', desc: 'Hermosa flor de Verbena seleccionada para la temporada de Otoño.' },
    { id: 45, title: 'Rosa de Invierno', price: 100000, img: 'assets/gen_1.jpg', tag: 'Invierno', desc: 'Hermosa flor de Rosa seleccionada para la temporada de Invierno.' },
    { id: 46, title: 'Camelia de Invierno', price: 100000, img: 'assets/gen_2.jpg', tag: 'Invierno', desc: 'Hermosa flor de Camelia seleccionada para la temporada de Invierno.' },
    { id: 47, title: 'Ciclamen de Invierno', price: 100000, img: 'assets/gen_3.jpg', tag: 'Invierno', desc: 'Hermosa flor de Ciclamen seleccionada para la temporada de Invierno.' },
    { id: 48, title: 'Pensamiento de Invierno', price: 100000, img: 'assets/gen_4.jpg', tag: 'Invierno', desc: 'Hermosa flor de Pensamiento seleccionada para la temporada de Invierno.' },
    { id: 49, title: 'Prímula de Invierno', price: 100000, img: 'assets/gen_5.jpg', tag: 'Invierno', desc: 'Hermosa flor de Prímula seleccionada para la temporada de Invierno.' },
    { id: 50, title: 'Begonia de Invierno', price: 100000, img: 'assets/gen_6.jpg', tag: 'Invierno', desc: 'Hermosa flor de Begonia seleccionada para la temporada de Invierno.' },
    { id: 51, title: 'Caléndula de Invierno', price: 100000, img: 'assets/f-rojas.png', tag: 'Invierno', desc: 'Hermosa flor de Caléndula seleccionada para la temporada de Invierno.' },
    { id: 52, title: 'Jazmín de invierno', price: 100000, img: 'assets/f-amarillas.png', tag: 'Invierno', desc: 'Hermosa flor de Jazmín de invierno seleccionada para la temporada de Invierno.' },
    { id: 53, title: 'Azalea de Invierno', price: 100000, img: 'assets/f-girasol.png', tag: 'Invierno', desc: 'Hermosa flor de Azalea seleccionada para la temporada de Invierno.' },
    { id: 54, title: 'Narciso de Invierno', price: 100000, img: 'assets/gen_1.jpg', tag: 'Invierno', desc: 'Hermosa flor de Narciso seleccionada para la temporada de Invierno.' },
    { id: 55, title: 'Tulipán de Invierno', price: 100000, img: 'assets/gen_2.jpg', tag: 'Invierno', desc: 'Hermosa flor de Tulipán seleccionada para la temporada de Invierno.' },
    { id: 56, title: 'Violeta de Invierno', price: 100000, img: 'assets/gen_3.jpg', tag: 'Invierno', desc: 'Hermosa flor de Violeta seleccionada para la temporada de Invierno.' },
    { id: 57, title: 'Mahonia de Invierno', price: 100000, img: 'assets/gen_4.jpg', tag: 'Invierno', desc: 'Hermosa flor de Mahonia seleccionada para la temporada de Invierno.' },
    { id: 58, title: 'Helleboro de Invierno', price: 100000, img: 'assets/gen_5.jpg', tag: 'Invierno', desc: 'Hermosa flor de Helleboro seleccionada para la temporada de Invierno.' },
    { id: 59, title: 'Alhelí de Invierno', price: 100000, img: 'assets/gen_6.jpg', tag: 'Invierno', desc: 'Hermosa flor de Alhelí seleccionada para la temporada de Invierno.' }
  ];

  var FILTERS = [
    { key: 'todo', label: 'Todo' },
    { key: 'Primavera', label: 'Primavera' },
    { key: 'Verano', label: 'Verano' },
    { key: 'Otoño', label: 'Otoño' },
    { key: 'Invierno', label: 'Invierno' }
  ];

  // ---------- Estado ----------
  var state = {
    season: null,        // null = automático según la fecha
    filter: 'todo',
    cart: [],            // [{ id, qty }]
    detailId: null,
    sheetOpen: false,
    cartOpen: false,
    assistantOpen: false,
    chat: [],
    sending: false,
    orderData: {}       // datos del pedido que el asistente va juntando entre mensajes
  };

  // ---------- Utilidades ----------
  var $ = function (id) { return document.getElementById(id); };

  function fmt(n) { return Math.round(n).toLocaleString('es-PY').replace(/,/g, '.') + ' Gs'; }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function autoSeason() {
    var m = new Date().getMonth() + 1;               // hemisferio sur (Paraguay)
    if (m >= 9 && m <= 11) return 'primavera';
    if (m === 12 || m <= 2) return 'verano';
    if (m >= 3 && m <= 5) return 'otono';
    return 'invierno';
  }

  function currentSeasonKey() { return state.season || autoSeason(); }
  function theme() { return SEASONS[currentSeasonKey()] || SEASONS.invierno; }

  function product(id) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
    return null;
  }

  function cartLines() {
    return state.cart.map(function (c) {
      var p = product(c.id);
      return p ? { id: p.id, title: p.title, img: p.img, price: p.price, qty: c.qty, subtotal: p.price * c.qty } : null;
    }).filter(Boolean);
  }

  function cartTotal() { return cartLines().reduce(function (a, l) { return a + l.subtotal; }, 0); }
  function cartCount() { return state.cart.reduce(function (a, c) { return a + c.qty; }, 0); }

  function orderSummaryText() {
    var lines = cartLines();
    if (!lines.length) return 'información sobre sus ramos';
    return lines.map(function (l) { return l.title + ' x' + l.qty + ' (' + fmt(l.subtotal) + ')'; }).join(', ');
  }

  function waLink(text) {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    var txt = encodeURIComponent(text);
    if (isMobile) {
      return 'whatsapp://send?phone=' + TIENDA_WA + '&text=' + txt;
    }
    return 'https://api.whatsapp.com/send/?phone=' + TIENDA_WA + '&text=' + txt;
  }

  function cartWaLink() {
    return waLink('Hola! Quiero pedir: ' + orderSummaryText() + '. Total: ' + fmt(cartTotal()));
  }

  // ---------- Persistencia ----------
  function save() {
    try {
      localStorage.setItem(LS_CART, JSON.stringify(state.cart));
      if (state.season) localStorage.setItem(LS_SEASON, state.season);
      else localStorage.removeItem(LS_SEASON);
    } catch (e) { /* modo privado: seguimos sin persistir */ }
  }

  function load() {
    try {
      var c = JSON.parse(localStorage.getItem(LS_CART) || '[]');
      if (Array.isArray(c)) {
        state.cart = c.filter(function (x) { return x && product(x.id) && x.qty > 0; })
          .map(function (x) { return { id: x.id, qty: Math.min(99, x.qty | 0) }; });
      }
      var s = localStorage.getItem(LS_SEASON);
      if (s && SEASONS[s]) state.season = s;
    } catch (e) { /* ignoramos storage corrupto */ }
  }

  // ---------- Toast ----------
  var toastTimer = null;
  function toast(msg) {
    var el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2800);
  }

  // ============================================================
  //  RENDER
  // ============================================================

  function renderTheme() {
    var th = theme();
    document.documentElement.setAttribute('data-season', th.key);

    $('season-chip-label').textContent = th.name;
    $('season-chip-icon').innerHTML = icon(th.icon, 15, 'currentColor');

    $('hero-script').textContent = th.heroLine1;
    $('hero-title').textContent = th.heroLine2;
    $('hero-tag').textContent = th.heroTag;
    $('hero-price').textContent = th.heroPrice;
    $('hero-img').style.backgroundImage = "url('" + th.heroImg + "')";
    $('hero-img').setAttribute('role', 'img');
    $('hero-img').setAttribute('aria-label', th.heroTag);

    if ($('promo-script')) {
      $('promo-script').textContent = th.promoScript;
      if ($('promo-title')) $('promo-title').textContent = th.promoTitle || '';
      if ($('promo-sub')) $('promo-sub').textContent = th.promoSub || '';
      if ($('promo-card')) $('promo-card').setAttribute('data-open', th.promoProduct !== undefined ? th.promoProduct : '');
    }
    if ($('feat-title')) $('feat-title').textContent = th.featTitle;

    $('flowers-chips').innerHTML = th.flowers.map(function (f) {
      var p = PRODUCTS.find(function(prod) { return prod.title === f + ' de ' + th.name; });
      var props = p ? ' data-open="' + p.id + '" tabindex="0" role="button" aria-label="Ver ' + esc(p.title) + '"' : '';
      return '<span class="chip"' + props + '>' + esc(f) + '</span>';
    }).join('');

    document.title = 'Margarita Florería · ' + th.name + ' en Asunción';
  }

  function cardHTML(p, compact) {
    return '<article class="p-card' + (compact ? ' compact' : '') + '" data-open="' + p.id + '" tabindex="0" role="button" ' +
      'aria-label="Ver ' + esc(p.title) + '">' +
      '<div class="p-media">' +
        '<div class="p-img" style="background-image:url(\'' + p.img + '\')"></div>' +
        (compact ? '<span class="p-tag">' + esc(p.tag) + '</span>' : '') +
      '</div>' +
      '<div class="p-body">' +
        '<h3 class="p-title">' + esc(p.title) + '</h3>' +
        '<div class="p-foot">' +
          '<span class="p-price">' + fmt(p.price) + '</span>' +
          '<button class="p-add" data-add="' + p.id + '" aria-label="Agregar ' + esc(p.title) + ' al carrito">+</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function renderFeatured() {
    var th = theme();
    $('grid-featured').innerHTML = th.feat.map(function (i) {
      var p = product(i);
      return p ? cardHTML(p, false) : '';
    }).join('');
  }

  function renderFilters() {
    $('filters').innerHTML = FILTERS.map(function (f) {
      return '<button class="filter-pill" data-filter="' + f.key + '" aria-pressed="' +
        (state.filter === f.key) + '">' + f.label + '</button>';
    }).join('');
  }

  function renderCatalog() {
    var list = PRODUCTS.filter(function (p) { return state.filter === 'todo' || p.tag === state.filter; });
    $('grid-catalog').innerHTML = list.length
      ? list.map(function (p) { return cardHTML(p, true); }).join('')
      : '<p class="empty-state">No hay ramos en esta categoría todavía.</p>';
  }

  function renderCartButton() {
    var n = cartCount();
    var badge = $('cart-count');
    badge.textContent = n;
    badge.hidden = n === 0;
  }

  function renderCart() {
    renderCartButton();
    var host = $('cart-panel');
    if (!state.cartOpen) { host.innerHTML = ''; return; }

    var lines = cartLines();
    var body = lines.length
      ? lines.map(function (l) {
          return '<div class="cart-row">' +
            '<div class="cart-thumb" style="background-image:url(\'' + l.img + '\')"></div>' +
            '<div class="cart-info">' +
              '<div class="cart-name">' + esc(l.title) + '</div>' +
              '<div class="cart-price">' + fmt(l.subtotal) + '</div>' +
            '</div>' +
            '<div class="qty">' +
              '<button class="dec" data-qty="' + l.id + '" data-delta="-1" aria-label="Quitar uno de ' + esc(l.title) + '">−</button>' +
              '<span class="n">' + l.qty + '</span>' +
              '<button class="inc" data-qty="' + l.id + '" data-delta="1" aria-label="Agregar uno de ' + esc(l.title) + '">+</button>' +
            '</div>' +
          '</div>';
        }).join('')
      : '<div class="cart-empty"><div class="ico">' + icon('flower', 44, '#c9bcae') + '</div>' +
        '<div>Tu carrito está vacío</div></div>';

    var foot = lines.length
      ? '<div class="drawer-foot">' +
          '<div class="delivery-row"><span>Delivery</span><span>Gratis lunes y martes</span></div>' +
          '<div class="total-row"><span class="l">Total</span><span class="v">' + fmt(cartTotal()) + '</span></div>' +
          '<a class="btn-wa" href="' + esc(cartWaLink()) + '" target="_blank" rel="noopener">Pedir por WhatsApp</a>' +
          '<button class="btn-assistant" id="open-assistant-cart">' + icon('sparkles', 17, '#fff') + ' Pedir con el Asistente</button>' +
        '</div>'
      : '';

    host.innerHTML =
      '<div class="scrim" data-close="cart"></div>' +
      '<aside class="drawer" role="dialog" aria-modal="true" aria-label="Tu pedido">' +
        '<div class="drawer-head">' +
          '<h2>Tu pedido</h2>' +
          '<button class="icon-btn" data-close="cart" aria-label="Cerrar carrito">✕</button>' +
        '</div>' +
        '<div class="drawer-body">' + body + '</div>' +
        foot +
      '</aside>';
  }

  function renderSeasonSheet() {
    var host = $('season-sheet');
    // El header sticky crea su propio contexto de apilado: sin esta clase el
    // panel queda por debajo del botón flotante del asistente.
    document.body.classList.toggle('season-open', state.sheetOpen);
    if (!state.sheetOpen) { host.innerHTML = ''; $('season-chip').setAttribute('aria-expanded', 'false'); return; }
    $('season-chip').setAttribute('aria-expanded', 'true');

    var isAuto = state.season === null;
    var autoName = SEASONS[autoSeason()].name;
    var cards = SEASON_ORDER.map(function (k) {
      var s = SEASONS[k];
      var active = !isAuto && state.season === k;
      return '<button class="season-card" data-key="' + k + '" data-set-season="' + k + '" aria-pressed="' + active + '">' +
        '<span class="ico">' + icon(s.icon, 20, s.ink) + '</span>' +
        '<span class="nm">' + s.name + '</span><br>' +
        '<span class="mo">' + s.months + '</span>' +
      '</button>';
    }).join('');

    host.innerHTML =
      '<button type="button" class="scrim season-scrim" data-close="season" aria-label="Cerrar"></button>' +
      '<div class="season-sheet" role="dialog" aria-label="Tema de temporada">' +
        '<span class="season-grabber" aria-hidden="true"></span>' +
        '<h3>Tema de temporada</h3>' +
        '<p class="season-note">' + (isAuto
          ? 'Modo automático: la web eligió ' + autoName + ' según la fecha de hoy.'
          : 'Elegiste el tema manualmente.') + '</p>' +
        '<div class="season-grid">' + cards + '</div>' +
        '<button class="season-auto' + (isAuto ? ' is-auto' : '') + '" data-set-season="auto">' +
          'Automático según la fecha (' + autoName + ')</button>' +
      '</div>';
  }

  function renderDetail() {
    var host = $('detail-panel');
    if (state.detailId === null) { host.innerHTML = ''; return; }
    var p = product(state.detailId);
    if (!p) { host.innerHTML = ''; return; }

    var wa = waLink('Hola! Me interesa el ramo "' + p.title + '" (' + fmt(p.price) + ')');

    host.innerHTML =
      '<div class="scrim" data-close="detail"></div>' +
      '<div class="detail" role="dialog" aria-modal="true" aria-label="' + esc(p.title) + '">' +
        '<div class="detail-img" style="background-image:url(\'' + p.img + '\')"></div>' +
        '<div class="detail-body">' +
          '<span class="detail-tag">' + esc(p.tag) + '</span>' +
          '<h2 class="detail-title">' + esc(p.title) + '</h2>' +
          '<div class="detail-price">' + fmt(p.price) + '</div>' +
          '<p class="detail-desc">' + esc(p.desc) + '</p>' +
          '<div class="detail-chips">' +
            '<span class="chip">Flores frescas</span>' +
            '<span class="chip">Dedicatoria incluida</span>' +
          '</div>' +
          '<div class="detail-actions">' +
            '<a class="detail-wa" href="' + esc(wa) + '" target="_blank" rel="noopener" aria-label="Consultar por WhatsApp">' +
              icon('phone', 20, '#fff') + '</a>' +
            '<button class="detail-add" data-add-go="' + p.id + '">Agregar al carrito · ' + fmt(p.price) + '</button>' +
          '</div>' +
        '</div>' +
        '<button class="icon-btn detail-close" data-close="detail" aria-label="Cerrar">✕</button>' +
      '</div>';
  }

  // ---------- Asistente ----------
  function renderAssistant() {
    var host = $('assistant-panel');
    var fab = $('assistant-fab');

    if (!state.assistantOpen) {
      host.innerHTML = '';
      fab.hidden = false;
      return;
    }
    fab.hidden = true;

    var msgs = state.chat.map(function (m) {
      return '<div class="msg ' + m.who + '">' + (m.html ? m.text : esc(m.text)) + '</div>';
    }).join('');

    var typing = state.sending
      ? '<div class="typing" aria-live="polite" aria-label="El asistente está escribiendo"><span></span><span></span><span></span></div>'
      : '';

    var n = cartCount();
    var resumen = n
      ? n + (n === 1 ? ' producto' : ' productos') + ' · Total ' + fmt(cartTotal())
      : 'Carrito vacío: agregá un ramo del catálogo para enviar el pedido.';

    host.innerHTML =
      '<div class="assistant" role="dialog" aria-modal="false" aria-label="Asistente de pedidos">' +
        '<div class="assistant-head">' +
          '<div class="assistant-avatar">' + icon('flower', 19, '#fff') + '</div>' +
          '<div>' +
            '<div class="assistant-name">Asistente de pedidos</div>' +
            '<div class="assistant-sub">Escribí tu pedido en forma natural</div>' +
          '</div>' +
          '<button class="icon-btn" data-close="assistant" aria-label="Cerrar asistente">✕</button>' +
        '</div>' +
        '<div class="assistant-body" id="assistant-body">' + msgs + typing + '</div>' +
        '<div class="assistant-cart">🛍️ ' + esc(resumen) + '</div>' +
        '<form class="assistant-foot" id="assistant-form">' +
          '<label class="sr-only" for="assistant-input">Tu mensaje</label>' +
          '<input id="assistant-input" autocomplete="off" placeholder="Ej: Soy Carlos, envíale a Ana al 0991..."' +
            (state.sending ? ' disabled' : '') + '>' +
          '<button class="assistant-send" type="submit" aria-label="Enviar"' + (state.sending ? ' disabled' : '') + '>' +
            icon('send', 18, '#fff') + '</button>' +
        '</form>' +
      '</div>';

    var body = $('assistant-body');
    body.scrollTop = body.scrollHeight;

    var input = $('assistant-input');
    if (input && !state.sending) input.focus();
  }

  function renderAll() {
    renderTheme();
    renderFeatured();
    renderFilters();
    renderCatalog();
    renderCart();
    renderSeasonSheet();
    renderDetail();
    renderAssistant();
  }

  // ============================================================
  //  ACCIONES
  // ============================================================

  function addToCart(id, silent) {
    var p = product(id);
    if (!p) return;
    var line = null;
    for (var i = 0; i < state.cart.length; i++) if (state.cart[i].id === id) line = state.cart[i];
    if (line) line.qty += 1; else state.cart.push({ id: id, qty: 1 });
    save();
    renderCart();
    renderAssistant();
    if (!silent) toast('¡' + p.title + ' agregado al carrito!');
  }

  function changeQty(id, delta) {
    state.cart = state.cart.map(function (c) {
      return c.id === id ? { id: c.id, qty: c.qty + delta } : c;
    }).filter(function (c) { return c.qty > 0; });
    save();
    renderCart();
    renderAssistant();
  }

  function openCart() { state.cartOpen = true; state.sheetOpen = false; renderCart(); renderSeasonSheet(); }
  function closeCart() { state.cartOpen = false; renderCart(); }

  function openAssistant() {
    state.assistantOpen = true;
    state.cartOpen = false;
    if (!state.chat.length) {
      state.chat.push({
        who: 'bot',
        text: '¡Hola! Qué excelente elección de flores. 🌸\n\nPara procesar tu pedido escribime de forma natural:\n\n👤 Tu nombre\n🫂 Quién recibe\n📱 Teléfono\n😍 Dedicatoria\n⏰ Horario de entrega'
      });
    }
    renderCart();
    renderAssistant();
  }

  function closeAssistant() { state.assistantOpen = false; renderAssistant(); }

  function pushMsg(who, text, isHtml) {
    state.chat.push({ who: who, text: text, html: !!isHtml });
    renderAssistant();
  }

  function scrollToId(id) {
    var el = $(id);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
  }

  // ---------- Envío del pedido al bot ----------
  function sendOrder(message) {
    var lines = cartLines();

    if (!lines.length) {
      pushMsg('bot', 'Todavía no tenés productos en el carrito. Agregá un ramo del catálogo y volvé acá para que envíe tu pedido a la tienda. 🌷');
      return;
    }

    state.sending = true;
    renderAssistant();

    var payload = {
      message: message,
      cart: lines.map(function (l) {
        return { id: l.id, title: l.title, qty: l.qty, price: l.price, subtotal: l.subtotal };
      }),
      total: cartTotal(),
      temporada: SEASONS[currentSeasonKey()].name,
      datos: state.orderData
    };

    fetch(API_BASE + '/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        state.sending = false;

        if (!res.ok || !res.data.success) {
          pushMsg('bot', 'No pude procesar el pedido automáticamente' +
            (res.data && res.data.error ? ' (' + res.data.error + ')' : '') +
            '. Enviálo directo por WhatsApp:\n' + waFallbackHtml(message), true);
          return;
        }

        var d = res.data.data || {};
        state.orderData = d;

        // El servidor todavía necesita datos: se los pedimos en vez de mandar un pedido incompleto
        if (res.data.pendiente) {
          pushMsg('bot', pedirFaltantes(d, res.data.faltantesTexto || []), true);
          return;
        }

        var resumen =
          '¡Perfecto! Registré tus datos.\n\n' +
          '<strong>Resumen del pedido</strong>\n' +
          '👤 De: ' + esc(d.remitente || '-') + '\n' +
          '🫂 Para: ' + esc(d.destinatario || '-') + '\n' +
          '📱 Tel: ' + esc(d.telefono || '-') + '\n' +
          '😍 Dedicatoria: ' + esc(d.dedicatoria || '-') + '\n' +
          '⏰ Horario: ' + esc(d.horario || '-') + '\n\n' +
          lines.map(function (l) { return '• ' + esc(l.title) + ' x' + l.qty + ' — ' + fmt(l.subtotal); }).join('\n') +
          '\n<strong>Total: ' + fmt(cartTotal()) + '</strong>\n\n';

        if (res.data.whatsappSent) {
          pushMsg('bot', resumen + '¡Ya recibimos tu pedido! En breve un asesor se comunicará contigo por WhatsApp para pedirte la ubicación, el método de pago y ultimar los detalles. ¡Gracias por elegir Margarita! ✿', true);
          state.cart = [];
          state.orderData = {};
          save();
          renderCart();
        } else {
          pushMsg('bot', resumen + '⚠️ El bot de WhatsApp de la tienda está desconectado en este momento, así que el pedido no salió automáticamente. Mandálo vos con un toque:\n' + waFallbackHtml(message), true);
        }
        renderAssistant();
      })
      .catch(function (err) {
        console.error('Error enviando el pedido:', err);
        state.sending = false;
        pushMsg('bot', 'No pude conectarme con el servidor de la tienda. Enviá tu pedido por WhatsApp:\n' + waFallbackHtml(message), true);
      });
  }

  /** Arma el pedido de datos faltantes mostrando primero lo que ya se entendió. */
  function pedirFaltantes(datos, faltantesTexto) {
    var CAMPOS = [
      { k: 'remitente', ico: '👤', label: 'De' },
      { k: 'destinatario', ico: '🫂', label: 'Para' },
      { k: 'telefono', ico: '📱', label: 'Tel' },
      { k: 'dedicatoria', ico: '😍', label: 'Dedicatoria' },
      { k: 'horario', ico: '⏰', label: 'Horario' }
    ];

    var tengo = CAMPOS.filter(function (c) { return datos[c.k]; })
      .map(function (c) { return c.ico + ' ' + c.label + ': ' + esc(datos[c.k]); });

    var pide;
    if (faltantesTexto.length === 1) {
      pide = 'Me falta ' + esc(faltantesTexto[0]) + '. ¿Me lo pasás?';
    } else {
      var ultimo = faltantesTexto[faltantesTexto.length - 1];
      var previos = faltantesTexto.slice(0, -1).join(', ');
      pide = 'Me faltan ' + esc(previos) + ' y ' + esc(ultimo) + '. ¿Me los pasás?';
    }

    return (tengo.length
      ? 'Anoté esto:\n' + tengo.join('\n') + '\n\n'
      : 'Perdón, no logré sacar los datos de ese mensaje.\n\n') + pide;
  }

  function waFallbackHtml(message) {
    var texto = 'Hola! Quiero pedir: ' + orderSummaryText() + '. Total: ' + fmt(cartTotal()) +
      (message ? '\nDatos: ' + message : '');
    return '<a href="' + esc(waLink(texto)) + '" target="_blank" rel="noopener"><strong>Abrir WhatsApp con el pedido cargado →</strong></a>';
  }

  // ============================================================
  //  EVENTOS
  // ============================================================

  function bind() {
    // Navegación
    document.querySelectorAll('[data-scroll]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-scroll');
        if (target === 'footer') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        else scrollToId(target);
      });
    });

    // Chip de temporada
    $('season-chip').addEventListener('click', function () {
      state.sheetOpen = !state.sheetOpen;
      renderSeasonSheet();
    });

    // Carrito
    $('cart-btn').addEventListener('click', openCart);

    // Asistente flotante
    $('assistant-fab').addEventListener('click', openAssistant);

    // Delegación global de clicks
    document.addEventListener('click', function (e) {
      var t = e.target;

      var seasonBtn = t.closest('[data-set-season]');
      if (seasonBtn) {
        var key = seasonBtn.getAttribute('data-set-season');
        state.season = (key === 'auto') ? null : key;
        state.sheetOpen = false;
        save();
        renderAll();
        toast(key === 'auto' ? 'Tema automático activado' : 'Tema ' + SEASONS[key].name + ' activado');
        return;
      }

      var closeBtn = t.closest('[data-close]');
      if (closeBtn) {
        var what = closeBtn.getAttribute('data-close');
        if (what === 'cart') closeCart();
        if (what === 'detail') { state.detailId = null; renderDetail(); }
        if (what === 'assistant') closeAssistant();
        if (what === 'season') { state.sheetOpen = false; renderSeasonSheet(); }
        return;
      }

      var addBtn = t.closest('[data-add]');
      if (addBtn) {
        e.stopPropagation();
        addToCart(parseInt(addBtn.getAttribute('data-add'), 10));
        return;
      }

      var addGo = t.closest('[data-add-go]');
      if (addGo) {
        addToCart(parseInt(addGo.getAttribute('data-add-go'), 10), true);
        state.detailId = null;
        renderDetail();
        openCart();
        return;
      }

      var qtyBtn = t.closest('[data-qty]');
      if (qtyBtn) {
        changeQty(parseInt(qtyBtn.getAttribute('data-qty'), 10), parseInt(qtyBtn.getAttribute('data-delta'), 10));
        return;
      }

      var filterBtn = t.closest('[data-filter]');
      if (filterBtn) {
        state.filter = filterBtn.getAttribute('data-filter');
        renderFilters();
        renderCatalog();
        return;
      }

      var openCard = t.closest('[data-open]');
      if (openCard) {
        state.detailId = parseInt(openCard.getAttribute('data-open'), 10);
        renderDetail();
        return;
      }

      if (t.closest('#open-assistant-cart')) { openAssistant(); return; }

      // Click fuera del panel de temporada
      if (state.sheetOpen && !t.closest('.season-wrap')) {
        state.sheetOpen = false;
        renderSeasonSheet();
      }
    });

    // Abrir detalle con teclado desde las tarjetas
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (state.detailId !== null) { state.detailId = null; renderDetail(); return; }
        if (state.assistantOpen) { closeAssistant(); return; }
        if (state.cartOpen) { closeCart(); return; }
        if (state.sheetOpen) { state.sheetOpen = false; renderSeasonSheet(); }
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        var card = e.target.closest && e.target.closest('.p-card');
        if (card && e.target === card) {
          e.preventDefault();
          state.detailId = parseInt(card.getAttribute('data-open'), 10);
          renderDetail();
        }
      }
    });

    // Envío del asistente
    document.addEventListener('submit', function (e) {
      if (e.target.id !== 'assistant-form') return;
      e.preventDefault();
      if (state.sending) return;
      var input = $('assistant-input');
      var txt = input ? input.value.trim() : '';
      if (!txt) return;
      pushMsg('user', txt);
      sendOrder(txt);
    });

    // Auto-scroll al abrir el teclado en móviles
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () {
        if (state.assistantOpen) {
          var body = $('assistant-body');
          if (body) body.scrollTop = body.scrollHeight;
        }
      });
    }
  }

  // ---------- Arranque ----------
  document.addEventListener('DOMContentLoaded', function () {
    load();
    bind();
    renderAll();
  });
})();
