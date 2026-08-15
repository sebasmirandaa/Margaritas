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
