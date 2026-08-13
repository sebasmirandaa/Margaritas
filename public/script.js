// Base de datos de productos
const productos = {
    favoritos: [
        { id: 1, title: 'Diseño Floral Especial', img: 'assets/gen_1.jpg', price: 120, desc: 'Un arreglo floral elegante y sofisticado perfecto para regalar momentos inolvidables.' },
        { id: 2, title: 'Arreglo de Temporada', img: 'assets/gen_2.jpg', price: 95, desc: 'Las mejores flores frescas de la temporada, seleccionadas a mano.' },
        { id: 3, title: 'Margaritas y Rosas', img: 'assets/gen_3.jpg', price: 85, desc: 'Una combinación clásica que nunca falla. Hermoso y delicado.' },
        { id: 4, title: 'Caja Premium', img: 'assets/gen_4.jpg', price: 150, desc: 'Presentación de lujo en nuestra icónica caja negra mate.' }
    ],
    ocasiones: [
        { id: 5, title: 'Aniversario Especial', img: 'assets/gen_5.jpg', price: 200, desc: 'Para celebrar el amor verdadero con las rosas más hermosas.' },
        { id: 6, title: 'Cumpleaños Feliz', img: 'assets/gen_6.jpg', price: 110, desc: 'Alegra el día de esa persona especial con colores vibrantes.' },
        { id: 7, title: 'Recuperación Rápida', img: 'assets/gen_1.jpg', price: 75, desc: 'El detalle perfecto para desear pronta mejoría y dar ánimos.' },
        { id: 8, title: 'Día de la Madre', img: 'assets/gen_2.jpg', price: 180, desc: 'Un tributo floral a la persona más importante de tu vida.' }
    ],
    colecciones: [
        { id: 9, title: 'Colección Orquídeas', img: 'assets/gen_3.jpg', price: 250, desc: 'La elegancia suprema en una presentación minimalista.' },
        { id: 10, title: 'Colección Silvestre', img: 'assets/gen_4.jpg', price: 90, desc: 'Un toque de naturaleza salvaje y texturas variadas.' },
        { id: 11, title: 'Rosas Eternas', img: 'assets/gen_5.jpg', price: 300, desc: 'Rosas preservadas que mantienen su belleza intacta por años.' }
    ]
};

// State
let cartItems = [];
let favItems = [];

// DOM Elements
const getEl = (id) => document.getElementById(id);

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    renderizarProductos();
    initIntersectionObserver();
    initModalsAndDrawers();
    initFilters();
    
    // Smooth scrolling for hash links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href.startsWith('http')) return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

// --- Product Rendering ---
function renderizarProductos() {
    Object.keys(productos).forEach(seccion => {
        const grid = getEl(`grid-${seccion}`);
        if (!grid) return;
        
        productos[seccion].forEach(producto => {
            const isFav = favItems.some(f => f.id === producto.id);
            const card = document.createElement('article');
            card.className = 'product-card reveal'; 
            
            // Heart button
            const favHtml = `<button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav(event, ${producto.id})"><i class="fa-solid fa-heart"></i></button>`;
            
            card.innerHTML = `
                <div class="product-img-wrapper" onclick="openQuickView(${producto.id})">
                    ${favHtml}
                    <img src="${producto.img}" alt="${producto.title}" class="product-img" loading="lazy">
                    <button class="add-to-cart-btn" onclick="addToCart(event, ${producto.id})">Agregar al Carrito</button>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${producto.title}</h3>
                </div>
            `;
            
            grid.appendChild(card);
        });
    });
}

// Helper to find product by id
function getProductById(id) {
    for (const seccion in productos) {
        const found = productos[seccion].find(p => p.id === id);
        if (found) return found;
    }
    return null;
}

// --- Scroll Reveal Animation ---
function initIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// --- Modals and Drawers Setup ---
function initModalsAndDrawers() {
    const cartOverlay = getEl('cart-overlay');
    if(cartOverlay) cartOverlay.onclick = closeModals;

    // Close buttons
    const closeClasses = ['.close-cart', '.close-modal', '.close-login'];
    closeClasses.forEach(cls => {
        document.querySelectorAll(cls).forEach(btn => {
            btn.onclick = closeModals;
        });
    });

    // Search Close specifically (no overlay)
    const closeSearch = getEl('close-search-btn');
    if(closeSearch) {
        closeSearch.onclick = () => getEl('search-modal').classList.remove('open');
    }

    // Open Search
    const openSearch = getEl('open-search');
    if(openSearch) {
        openSearch.onclick = (e) => {
            e.preventDefault();
            getEl('search-modal').classList.add('open');
            setTimeout(() => getEl('search-input').focus(), 400);
        };
    }

    // Open Login
    const openLogin = getEl('open-login');
    if(openLogin) {
        openLogin.onclick = (e) => {
            e.preventDefault();
            if (localStorage.getItem('customer_token')) {
                // Si ya está logueado como cliente, permitirle cerrar sesión (opcionalmente)
                if (confirm('¿Deseas cerrar sesión?')) {
                    localStorage.removeItem('customer_token');
                    showToast('Sesión cerrada correctamente');
                    openLogin.innerHTML = '<i class="fa-regular fa-user"></i>';
                }
            } else {
                getEl('login-modal').classList.add('open');
                getEl('cart-overlay').classList.add('active');
            }
        };
    }

    // Open Cart
    const openCartBtn = getEl('open-cart');
    if(openCartBtn) {
        openCartBtn.onclick = (e) => {
            e.preventDefault();
            openCart();
        };
    }

    // Open Favs
    const openFavsBtn = getEl('open-favs');
    if(openFavsBtn) {
        openFavsBtn.onclick = (e) => {
            e.preventDefault();
            getEl('fav-sidebar').classList.add('open');
            getEl('cart-overlay').classList.add('active');
        };
    }

    // Mobile Menu
    const mobileMenuBtn = getEl('mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.onclick = (e) => {
            e.preventDefault();
            mainNav.classList.add('active');
            getEl('cart-overlay').classList.add('active');
        };
    }

    updateCartUI(); 
    updateFavUI();
}

function openQuickView(productId) {
    const producto = getProductById(productId);
    if(!producto) return;

    const quickViewModal = getEl('quick-view-modal');
    const cartOverlay = getEl('cart-overlay');
    if(!quickViewModal || !cartOverlay) return;

    getEl('modal-img').src = producto.img;
    getEl('modal-title').textContent = producto.title;
    getEl('modal-price').textContent = `$${producto.price.toFixed(2)}`;
    getEl('modal-desc').textContent = producto.desc;
    
    const addBtn = getEl('modal-add-btn');
    addBtn.onclick = (e) => {
        addToCart(e, producto.id);
        closeModals();
    };
    
    quickViewModal.classList.add('open');
    cartOverlay.classList.add('active');
}

function closeModals() {
    ['cart-sidebar', 'fav-sidebar', 'quick-view-modal', 'login-modal'].forEach(id => {
        const el = getEl(id);
        if(el) el.classList.remove('open');
    });
    
    const mainNav = document.querySelector('.main-nav');
    if(mainNav) mainNav.classList.remove('active');
    
    const cartOverlay = getEl('cart-overlay');
    if(cartOverlay) cartOverlay.classList.remove('active');
}

// --- Cart Logic ---
function addToCart(event, productId) {
    if(event) event.stopPropagation(); 
    
    const product = getProductById(productId);
    if(!product) return;
    
    cartItems.push(product);
    updateCartUI();
    
    showToast(`¡${product.title} agregado al carrito!`);
    openCart();
}

window.addToCart = addToCart;
window.removeFromCart = function(index) {
    cartItems.splice(index, 1);
    updateCartUI();
};

function updateCartUI() {
    const cartBadge = getEl('cart-badge');
    const cartItemsContainer = getEl('cart-items-container');
    const cartTotalPrice = getEl('cart-total-price');
    
    if(cartBadge) cartBadge.textContent = cartItems.length;
    
    if(!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = '';
    
    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<div class="cart-empty-msg">Tu carrito está vacío</div>';
        if(cartTotalPrice) cartTotalPrice.textContent = '$0.00';
        return;
    }
    
    let total = 0;
    cartItems.forEach((item, index) => {
        total += item.price;
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <img src="${item.img}" class="cart-item-img">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                <button class="remove-item" onclick="removeFromCart(${index})">Eliminar</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemEl);
    });
    
    if(cartTotalPrice) cartTotalPrice.textContent = `$${total.toFixed(2)}`;
}

function openCart() {
    const cartSidebar = getEl('cart-sidebar');
    const cartOverlay = getEl('cart-overlay');
    if(cartSidebar) cartSidebar.classList.add('open');
    if(cartOverlay) cartOverlay.classList.add('active');
}

// --- Favorites Logic ---
window.toggleFav = function(event, productId) {
    event.stopPropagation();
    
    const product = getProductById(productId);
    if(!product) return;
    
    const index = favItems.findIndex(f => f.id === productId);
    if (index === -1) {
        favItems.push(product);
        event.currentTarget.classList.add('active');
        showToast(`Agregado a tus favoritos ❤️`);
    } else {
        favItems.splice(index, 1);
        event.currentTarget.classList.remove('active');
    }
    
    updateFavUI();
};

window.removeFromFavs = function(index) {
    favItems.splice(index, 1);
    // Refresh product rendering to update heart icons
    Object.keys(productos).forEach(seccion => {
        const grid = getEl(`grid-${seccion}`);
        if(grid) {
            grid.innerHTML = '';
        }
    });
    renderizarProductos();
    updateFavUI();
};

function updateFavUI() {
    const favBadge = getEl('fav-badge');
    const favItemsContainer = getEl('fav-items-container');
    
    if(favBadge) favBadge.textContent = favItems.length;
    
    if(!favItemsContainer) return;
    
    favItemsContainer.innerHTML = '';
    
    if (favItems.length === 0) {
        favItemsContainer.innerHTML = '<div class="cart-empty-msg">No tienes favoritos aún</div>';
        return;
    }
    
    favItems.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <img src="${item.img}" class="cart-item-img">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                <button class="remove-item" onclick="removeFromFavs(${index})">Eliminar</button>
            </div>
        `;
        favItemsContainer.appendChild(itemEl);
    });
}


// --- Filtering in Catalog ---
function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const sections = document.querySelectorAll('.catalog-sections .catalog-section');
    if(!filterBtns.length) return;
    
    filterBtns.forEach(btn => {
        btn.onclick = () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            
            sections.forEach(section => {
                if (filter === 'all' || section.id === filter) {
                    section.style.display = 'block';
                    section.querySelectorAll('.reveal').forEach(el => {
                        el.classList.remove('active');
                        setTimeout(() => el.classList.add('active'), 50);
                    });
                } else {
                    section.style.display = 'none';
                }
            });
        };
    });
}

// --- Toast Notification ---
window.showToast = function(message) {
    let toast = getEl('cart-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'cart-toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};

// === GEMINI CHAT MODAL LOGIC ===
window.openGeminiModal = function() {
    if(cartItems.length === 0) {
        showToast("Tu carrito está vacío.");
        return;
    }
    closeModals(); // Clierra el carrito
    const modal = getEl('gemini-modal');
    const overlay = getEl('cart-overlay');
    if(modal && overlay) {
        modal.classList.add('open');
        overlay.classList.add('active');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const closeGeminiBtn = getEl('close-gemini-btn');
    if(closeGeminiBtn) {
        closeGeminiBtn.onclick = () => {
            getEl('gemini-modal').classList.remove('open');
            getEl('cart-overlay').classList.remove('active');
        };
    }

    const sendBtn = getEl('gemini-send-btn');
    const inputField = getEl('gemini-input');
    
    if(sendBtn && inputField) {
        sendBtn.onclick = async () => {
            const msg = inputField.value.trim();
            if(!msg) return;
            
            // Add user message to UI
            const chatBody = getEl('gemini-chat-body');
            const userBubble = document.createElement('div');
            userBubble.className = 'gemini-msg user';
            userBubble.textContent = msg;
            chatBody.appendChild(userBubble);
            
            inputField.value = '';
            inputField.disabled = true;
            sendBtn.disabled = true;
            
            // Scroll to bottom
            chatBody.scrollTop = chatBody.scrollHeight;
            
            // Show typing indicator
            const typing = getEl('gemini-typing');
            typing.classList.add('active');
            
            try {
                // Send to backend
                const response = await fetch('http://localhost:8080/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: msg, cart: cartItems })
                });
                
                const data = await response.json();
                
                typing.classList.remove('active');
                inputField.disabled = false;
                sendBtn.disabled = false;
                
                const botBubble = document.createElement('div');
                botBubble.className = 'gemini-msg bot';
                
                if(data.success) {
                    botBubble.innerHTML = `¡Perfecto! Hemos procesado tu orden. Acabamos de enviar todos los datos por WhatsApp a la tienda.<br><br>
                    <strong>Resumen:</strong><br>
                    👤 De: ${data.data.remitente || '-'}<br>
                    🫂 Para: ${data.data.destinatario || '-'}<br>
                    📱 Tel: ${data.data.telefono || '-'}<br>
                    ⏰ Horario: ${data.data.horario || '-'}<br><br>
                    ¡Gracias por elegir Margaritas!`;
                    cartItems = []; // Vaciar carrito
                    updateCartUI();
                } else {
                    botBubble.textContent = "Hubo un problema al procesar tu orden. Por favor, intenta de nuevo.";
                }
                
                chatBody.appendChild(botBubble);
                chatBody.scrollTop = chatBody.scrollHeight;
                
            } catch (err) {
                console.error(err);
                typing.classList.remove('active');
                inputField.disabled = false;
                sendBtn.disabled = false;
                
                const botBubble = document.createElement('div');
                botBubble.className = 'gemini-msg bot';
                botBubble.textContent = "Error de conexión con el servidor.";
                chatBody.appendChild(botBubble);
            }
        };
    }
});

// --- Login Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Check initial login state
    if (localStorage.getItem('customer_token')) {
        const openLogin = getEl('open-login');
        if(openLogin) openLogin.innerHTML = '<i class="fa-solid fa-user-check"></i>';
    }

    const loginBtn = getEl('submit-login-btn');
    if(loginBtn) {
        loginBtn.onclick = async () => {
            const user = getEl('login-username').value;
            const pass = getEl('login-password').value;
            const errorMsg = getEl('login-error-msg');
            
            errorMsg.style.display = 'none';

            if(!user || !pass) return;

            try {
                loginBtn.textContent = 'Verificando...';
                loginBtn.disabled = true;

                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: user, password: pass })
                });
                const data = await res.json();
                
                if(data.success) {
                    if (data.role === 'admin') {
                        // Admin login -> guardar token admin y redirigir
                        localStorage.setItem('admin_token', data.token);
                        window.location.href = '/admin.html';
                    } else {
                        // Customer login
                        localStorage.setItem('customer_token', data.token);
                        showToast('�Bienvenido de vuelta!');
                        closeModals();
                        const openLogin = getEl('open-login');
                        if(openLogin) openLogin.innerHTML = '<i class="fa-solid fa-user-check"></i>';
                    }
                } else {
                    errorMsg.style.display = 'block';
                }
            } catch(e) {
                console.error(e);
                errorMsg.style.display = 'block';
                errorMsg.textContent = 'Error de conexi�n';
            } finally {
                loginBtn.textContent = 'Ingresar';
                loginBtn.disabled = false;
            }
        };
    }
});
