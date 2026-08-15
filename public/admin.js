/**
 * Panel de administración: sesión, navegación entre secciones y estado del bot.
 *
 * Para agregar una sección nueva no hace falta tocar este archivo: basta con
 * sumar el botón .nav-item y la <section> correspondiente en admin.html.
 * Lo que sí conviene reusar desde otros módulos:
 *   window.aviso(texto, 'ok' | 'error')  → notificación abajo a la derecha
 *   window.getAdminToken()               → token JWT para los endpoints /api/admin/*
 */
let token = localStorage.getItem('admin_token');
let pollInterval = null;

const $ = (sel) => document.querySelector(sel);

// --- Avisos ---
window.aviso = function (texto, tipo) {
    const cont = $('#avisos');
    if (!cont) return;
    const el = document.createElement('div');
    el.className = 'aviso' + (tipo ? ' ' + tipo : '');
    el.textContent = texto;
    cont.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(20px)';
        setTimeout(() => el.remove(), 300);
    }, 3600);
};

/** Cualquier módulo del panel necesita el token para pegarle a los endpoints protegidos. */
window.getAdminToken = () => token;

// --- Login ---
async function iniciarSesion() {
    const btn = $('#login-btn');
    const err = $('#login-err');
    const user = $('#username').value.trim();
    const pass = $('#password').value;

    err.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Ingresando…';

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await res.json();
        if (data.success && data.role === 'admin') {
            token = data.token;
            localStorage.setItem('admin_token', token);
            mostrarPanel();
        } else {
            err.textContent = 'Credenciales inválidas.';
        }
    } catch (e) {
        err.textContent = 'No se pudo conectar con el servidor.';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Iniciar sesión';
    }
}

$('#login-btn').onclick = iniciarSesion;
['#username', '#password'].forEach((sel) => {
    $(sel).addEventListener('keydown', (e) => { if (e.key === 'Enter') iniciarSesion(); });
});

// --- Panel ---
function mostrarPanel() {
      $('#pantalla-login').style.display = 'none';
      $('#app').classList.add('activo');
      arrancarPolling();
      cargarProductos();
  }

document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.onclick = () => {
        document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('activo'));
        document.querySelectorAll('.seccion').forEach((s) => s.classList.remove('activa'));
        btn.classList.add('activo');
        $('#seccion-' + btn.dataset.seccion).classList.add('activa');
    };
});

// --- Estado del bot ---
function arrancarPolling() {
    consultarEstado();
          cargarProductos();
    clearInterval(pollInterval);
    pollInterval = setInterval(consultarEstado, 3000);
}

async function consultarEstado() {
    try {
        const res = await fetch('/api/admin/status', { headers: { Authorization: `Bearer ${token}` } });
        // 401 token inválido o vencido, 403 usuario sin rol de admin: en los dos casos
        // no tiene sentido seguir en el panel.
        if (res.status === 401 || res.status === 403) return cerrarSesion();

        const data = await res.json();
        const estado = $('#bot-status');
        const qrWrapper = $('#qr-wrapper');
        const qrImg = $('#qr-img');
        const btnDesc = $('#disconnect-btn');

        if (data.status === 'connected') {
            estado.textContent = 'Conectado a WhatsApp';
            estado.className = 'estado conectado';
            qrWrapper.style.display = 'none';
            btnDesc.style.display = 'inline-flex';
        } else if ((data.status === 'qr_ready' || data.status === 'waiting') && data.qrUrl) {
            estado.textContent = 'Esperando escaneo del QR';
            estado.className = 'estado esperando';
            qrWrapper.style.display = 'block';
            qrImg.src = data.qrUrl;
            btnDesc.style.display = 'none';
        } else {
            estado.textContent = 'Desconectado · iniciando…';
            estado.className = 'estado';
            qrWrapper.style.display = 'none';
            btnDesc.style.display = 'none';
        }
    } catch (e) {
        console.error('Error consultando el estado del bot', e);
    }
}

$('#disconnect-btn').onclick = async function () {
    if (!confirm('¿Desconectar el bot actual? Vas a tener que escanear un QR nuevo.')) return;
    const btn = this;
    btn.disabled = true;
    btn.textContent = 'Desconectando…';
    try {
        const res = await fetch('/api/admin/bot/disconnect', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            consultarEstado();
            window.aviso('Bot desconectado.', 'ok');
        } else {
            window.aviso('No se pudo desconectar.', 'error');
        }
    } catch (e) {
        window.aviso('Error de red al desconectar.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Desconectar y escanear nuevo QR';
    }
};

function cerrarSesion() {
    localStorage.removeItem('admin_token');
    token = null;
    clearInterval(pollInterval);
    $('#app').classList.remove('activo');
    $('#pantalla-login').style.display = 'grid';
    $('#username').value = '';
    $('#password').value = '';
}

$('#logout-btn').onclick = cerrarSesion;

if (token) mostrarPanel();



  // ================= PRODUCTOS =================
  let productosCache = [];

  async function cargarProductos() {
      try {
          const res = await fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) return window.aviso('Error cargando productos', 'error');
          const data = await res.json();
          productosCache = data.products;
          renderAdminProductos();
      } catch(e) {
          window.aviso('No se pudo conectar', 'error');
      }
  }

  function renderAdminProductos() {
      const grid = $('#grid-admin-productos');
      if (!grid) return;
      grid.innerHTML = productosCache.map(p => `
          <div class="tarjeta" style="padding:15px; display:flex; flex-direction:column;">
              <img src="${p.img}" style="width:100%; height:180px; object-fit:cover; border-radius:8px; margin-bottom:15px; background:#f0f0f0;">
              <div style="flex:1">
                  <span style="font-size:0.8rem; background:#f0f0f0; padding:3px 8px; border-radius:4px; font-weight:600">${p.tag}</span>
                  <h3 style="margin:10px 0 5px; font-size:1.05rem">${p.title}</h3>
                  <p style="color:var(--txt-light); font-size:0.9rem; margin-bottom:15px;">Gs. ${p.price.toLocaleString('es-PY')}</p>
              </div>
              <div style="display:flex; gap:10px; border-top:1px solid #eee; padding-top:15px;">
                  <button class="btn btn--fantasma btn--ancho" onclick="editarProd(${p.id})">Editar</button>
                  <button class="btn btn--peligro btn--ancho" onclick="borrarProd(${p.id})">Borrar</button>
              </div>
          </div>
      `).join('');
  }

  const btnNuevo = $('#btn-nuevo-prod');
  if (btnNuevo) btnNuevo.addEventListener('click', () => {
      $('#prod-id').value = '';
      $('#prod-title').value = '';
      $('#prod-price').value = '';
      $('#prod-desc').value = '';
      $('#prod-img').value = '';
      $('#prod-tag').value = 'Primavera';
      $('#form-prod-titulo').innerText = 'Agregar Nuevo Producto';
      $('#form-producto').style.display = 'block';
  });

  const btnCancel = $('#btn-cancelar-prod');
  if (btnCancel) btnCancel.addEventListener('click', () => {
      $('#form-producto').style.display = 'none';
  });

  window.editarProd = function(id) {
      const p = productosCache.find(x => x.id === id);
      if (!p) return;
      $('#prod-id').value = p.id;
      $('#prod-title').value = p.title || '';
      $('#prod-price').value = p.price || '';
      $('#prod-desc').value = p.desc || '';
      $('#prod-tag').value = p.tag || 'Primavera';
      $('#prod-img').value = '';
      $('#form-prod-titulo').innerText = 'Editar Producto (ID: ' + p.id + ')';
      $('#form-producto').style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.borrarProd = async function(id) {
      if (!confirm('¿Seguro que querés borrar este ramo?')) return;
      try {
          const res = await fetch('/api/admin/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ action: 'delete', product: { id } })
          });
          if (res.ok) {
              window.aviso('Producto eliminado', 'ok');
              cargarProductos();
          } else {
              window.aviso('Error al eliminar', 'error');
          }
      } catch(e) { window.aviso('Error de conexión', 'error'); }
  };

  const btnGuardar = $('#btn-guardar-prod');
  if (btnGuardar) btnGuardar.addEventListener('click', async () => {
      const idStr = $('#prod-id').value;
      const title = $('#prod-title').value.trim();
      const price = parseInt($('#prod-price').value, 10);
      const desc = $('#prod-desc').value.trim();
      const tag = $('#prod-tag').value;
      const fileInput = $('#prod-img');
      
      if (!title || !price) return window.aviso('Nombre y precio requeridos', 'error');

      const product = { title, price, desc, tag };
      if (idStr) product.id = parseInt(idStr, 10);

      // Leer imagen a base64
      let imageBase64 = null;
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
          const file = fileInput.files[0];
          imageBase64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.readAsDataURL(file);
          });
      }

      if (imageBase64) product.imageBase64 = imageBase64;

      try {
          const res = await fetch('/api/admin/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                  action: idStr ? 'update' : 'create',
                  product
              })
          });
          if (res.ok) {
              window.aviso(idStr ? 'Actualizado correctamente' : 'Producto creado', 'ok');
              $('#form-producto').style.display = 'none';
              cargarProductos();
          } else {
              window.aviso('Error al guardar', 'error');
          }
      } catch(e) { window.aviso('Error de conexión', 'error'); }
  });
