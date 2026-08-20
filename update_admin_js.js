const fs = require('fs');

let js = fs.readFileSync('public/admin.js', 'utf8');

const productJS = `
  // ================= PRODUCTOS =================
  let productosCache = [];

  async function cargarProductos() {
      try {
          const res = await fetch('/api/admin/products', { headers: { Authorization: \`Bearer \${token}\` } });
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
      grid.innerHTML = productosCache.map(p => \`
          <div class="tarjeta" style="padding:15px; display:flex; flex-direction:column;">
              <img src="\${p.img}" style="width:100%; height:180px; object-fit:cover; border-radius:8px; margin-bottom:15px; background:#f0f0f0;">
              <div style="flex:1">
                  <span style="font-size:0.8rem; background:#f0f0f0; padding:3px 8px; border-radius:4px; font-weight:600">\${p.tag}</span>
                  <h3 style="margin:10px 0 5px; font-size:1.05rem">\${p.title}</h3>
                  <p style="color:var(--txt-light); font-size:0.9rem; margin-bottom:15px;">Gs. \${p.price.toLocaleString('es-PY')}</p>
              </div>
              <div style="display:flex; gap:10px; border-top:1px solid #eee; padding-top:15px;">
                  <button class="btn btn--fantasma btn--ancho" onclick="editarProd(\${p.id})">Editar</button>
                  <button class="btn btn--peligro btn--ancho" onclick="borrarProd(\${p.id})">Borrar</button>
              </div>
          </div>
      \`).join('');
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
              headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
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
              headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
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
`;

js = js + '\n\n' + productJS;
js = js.replace(/function mostrarPanel\(\) \{[\s\S]*?\}/, 
`function mostrarPanel() {
      $('#pantalla-login').style.display = 'none';
      $('#app').classList.add('activo');
      arrancarPolling();
      cargarProductos();
  }`);

fs.writeFileSync('public/admin.js', js, 'utf8');
console.log('admin.js fully updated');
