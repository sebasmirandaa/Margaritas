const express = require('express');
const cors = require('cors');
const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcodeTerminal = require('qrcode-terminal');
const qrcodeLib = require('qrcode');
const { GoogleGenAI } = require('@google/genai');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = 'margaritas-admin-secret-key-123';
let currentQRBase64 = null;
let botStatus = 'disconnected';
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Servir HTML estático

// Redirigir /admin a admin.html
app.get('/admin', (req, res) => {
    res.redirect('/admin.html');
});

// === CONFIGURACIÓN DE GEMINI ===
// Inicializamos el cliente de Gemini con la API Key provista
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let ai;
try {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
} catch (e) {
    console.error("Error inicializando Gemini. Verifica la API KEY.", e);
}

// === ENDPOINT DE CHECKOUT ===
app.post('/api/checkout', async (req, res) => {
    try {
        const { message, cart } = req.body;
        
        if (!ai) throw new Error("Gemini no está configurado correctamente.");

        // Prompt para Gemini
        const prompt = `
        Actúa como un asistente de ventas de una florería. 
        Un cliente acaba de escribir este mensaje para su orden: "${message}".
        Extrae la siguiente información y devuélvela ÚNICAMENTE en formato JSON válido, sin texto adicional (ni markdown):
        {
            "remitente": "Quien envía (string)",
            "destinatario": "Quien recibe (string)",
            "telefono": "Número de teléfono (string)",
            "dedicatoria": "Mensaje de dedicatoria (string)",
            "horario": "Horario de entrega (string)"
        }
        Si falta algún dato, pon null.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        let extractedData;
        try {
            extractedData = JSON.parse(response.text);
        } catch (e) {
            console.error("Error parseando JSON de Gemini:", response.text);
            return res.status(500).json({ error: "No pude procesar tu mensaje." });
        }

        // Si tenemos todo, enviamos el mensaje al microservicio de WhatsApp en puerto 8081
        const numeroVentas = "595994404080@s.whatsapp.net"; 
        const ordenTexto = `🔔 *NUEVA ORDEN RECIBIDA* 🔔\n\n` +
                           `👤 *Remitente:* ${extractedData.remitente || 'No especificado'}\n` +
                           `🫂 *Destinatario:* ${extractedData.destinatario || 'No especificado'}\n` +
                           `📱 *Teléfono:* ${extractedData.telefono || 'No especificado'}\n` +
                           `😍 *Dedicatoria:* ${extractedData.dedicatoria || 'No especificado'}\n` +
                           `⏰ *Horario:* ${extractedData.horario || 'No especificado'}\n\n` +
                           `🛍️ *Carrito:* ${cart.length} items`;
                           
        try {
            const botRes = await fetch('http://localhost:8081/api/bot/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: numeroVentas, text: ordenTexto })
            });
            if (botRes.ok) {
                console.log("Mensaje de orden enviado al bot correctamente.");
            } else {
                console.error("El bot respondió con error:", await botRes.text());
            }
        } catch (botError) {
            console.error("No se pudo contactar al bot (¿está corriendo en el puerto 8081?):", botError.message);
        }

        res.json({ success: true, data: extractedData, message: "¡Orden enviada exitosamente!" });
        
    } catch (error) {
        console.error("Error en checkout:", error);
        res.status(500).json({ error: error.message });
    }
});

// === RUTAS DE AUTENTICACIÓN ===
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    try {
        const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
        const user = stmt.get(username, password);
        if (user) {
            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ success: true, token, role: user.role });
        } else {
            res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/admin/status', async (req, res) => {
    const auth = req.headers.authorization;
    if(!auth || !auth.startsWith('Bearer ')) return res.status(401).json({error: 'No autorizado'});
    
    try {
        jwt.verify(auth.split(' ')[1], JWT_SECRET);
        
        // Solicitar estado al bot en puerto 8081
        try {
            const botRes = await fetch('http://localhost:8081/api/bot/status');
            const botData = await botRes.json();
            res.json(botData);
        } catch (botError) {
            res.json({ status: 'disconnected', error: 'Servicio bot no disponible' });
        }
        
    } catch(e) {
        res.status(401).json({error: 'Token inválido'});
    }
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
});
