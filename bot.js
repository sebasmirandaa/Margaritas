require('dotenv').config();
const { makeWASocket, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const cors = require('cors');
const usePostgresAuthState = require('./pgAuthState');
const pool = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

let sock;
let botStatus = 'disconnected';
let currentQRBase64 = null;
let clearStateFn = null;

async function startBot() {
    const { state, saveCreds, clearState } = await usePostgresAuthState(pool);
    clearStateFn = clearState;
    
    sock = makeWASocket({
        printQRInTerminal: false,
        auth: state,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;
        
        if (qr) {
            botStatus = 'qr_ready';
            const qrcode = require('qrcode');
            currentQRBase64 = await qrcode.toDataURL(qr);
        }

        if (connection === 'close') {
            botStatus = 'disconnected';
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Bot desconectado. Reconectando:', shouldReconnect);
            
            if (!shouldReconnect) {
                console.log('Sesión cerrada o inválida. Borrando estado...');
                if (clearStateFn) await clearStateFn();
                const fs = require('fs');
                if (fs.existsSync('auth_info_baileys')) {
                    fs.rmSync('auth_info_baileys', { recursive: true, force: true });
                }
            }
            
            // Pausa breve para evitar bucles infinitos instantáneos
            setTimeout(startBot, 3000);
        } else if (connection === 'open') {
            botStatus = 'connected';
            currentQRBase64 = null;
            console.log('✅ Bot de WhatsApp conectado exitosamente');
        }
    });
}


// Endpoint para que server.js pida enviar mensajes
app.post('/api/bot/send', async (req, res) => {
    const { to, text } = req.body;
    if (botStatus !== 'connected' || !sock) {
        return res.status(503).json({ error: 'El bot no está conectado a WhatsApp.' });
    }
    
    try {
        await sock.sendMessage(to, { text });
        res.json({ success: true });
    } catch (error) {
        console.error("Error enviando mensaje de WhatsApp:", error);
        res.status(500).json({ error: error.message });
    }
});

const fs = require('fs');

// Endpoint para leer el estado y QR
app.get('/api/bot/status', (req, res) => {
    res.json({ status: botStatus, qrUrl: currentQRBase64 });
});

// Endpoint para desconectar el bot
app.post('/api/bot/disconnect', async (req, res) => {
    try {
        if (sock) {
            sock.ev.removeAllListeners('connection.update');
            sock.ev.removeAllListeners('creds.update');
            sock.logout();
            sock.end(new Error('Admin disconnected'));
            sock = null;
        }
        
        botStatus = 'disconnected';
        currentQRBase64 = null;
        
        // Borrar credenciales para forzar nuevo QR
        if (clearStateFn) {
            await clearStateFn();
        }
        if (fs.existsSync('auth_info_baileys')) {
            fs.rmSync('auth_info_baileys', { recursive: true, force: true });
        }
        
        console.log('Bot desconectado manualmente por admin. Reiniciando...');
        startBot();
        
        res.json({ success: true, message: 'Bot desconectado. Esperando nuevo QR.' });
    } catch (error) {
        console.error("Error al desconectar el bot:", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint raíz para evitar "Cannot GET /" en el navegador
app.get('/', (req, res) => {
    res.send(`<h1>Servicio de Bot de WhatsApp</h1>
              <p>Estado actual: <strong>${botStatus}</strong></p>
              <p>Este es un microservicio interno. La tienda web se encarga de usarlo.</p>`);
});

startBot();

const PORT = 8081;
app.listen(PORT, () => {
    console.log(`Bot de WhatsApp corriendo en http://localhost:${PORT}`);
});
