let token = localStorage.getItem('admin_token');
let pollInterval;

document.getElementById('login-btn').onclick = async () => {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await res.json();
        if(data.success && data.role === 'admin') {
            token = data.token;
            localStorage.setItem('admin_token', token);
            showDashboard();
        } else {
            document.getElementById('login-err').style.display = 'block';
        }
    } catch(e) {
        alert("Error de conexión con el servidor");
    }
};

function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    startPolling();
}

function startPolling() {
    pollStatus();
    pollInterval = setInterval(pollStatus, 3000);
}

async function pollStatus() {
    try {
        const res = await fetch('/api/admin/status', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.status === 401 || res.status === 403) {
            logout();
            return;
        }
        
        const data = await res.json();
        const statusEl = document.getElementById('bot-status');
        const qrWrapper = document.getElementById('qr-wrapper');
        const qrImg = document.getElementById('qr-img');
        
        if (data.status === 'connected') {
            statusEl.textContent = '✅ Conectado a WhatsApp';
            statusEl.className = 'status connected';
            qrWrapper.style.display = 'none';
        } else if (data.status === 'waiting' && data.qrUrl) {
            statusEl.textContent = '⚠️ Esperando escaneo...';
            statusEl.className = 'status waiting';
            qrWrapper.style.display = 'block';
            qrImg.src = data.qrUrl;
        } else {
            statusEl.textContent = 'Desconectado / Iniciando...';
            statusEl.className = 'status';
            qrWrapper.style.display = 'none';
        }
    } catch(e) {
        console.error("Error polling", e);
    }
}

window.logout = function() {
    localStorage.removeItem('admin_token');
    token = null;
    clearInterval(pollInterval);
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
};

if (token) {
    showDashboard();
}
