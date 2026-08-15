require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const jwt = require('jsonwebtoken');
const db = require('./database');
const JWT_SECRET = process.env.JWT_SECRET || 'margaritas-admin-secret-key-123';
const BOT_URL = process.env.BOT_URL || 'http://localhost:8081';
// Número de la tienda que recibe las órdenes por WhatsApp
const NUMERO_VENTAS = (process.env.NUMERO_VENTAS || '595971140350') + '@s.whatsapp.net';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Servir HTML estático

// Redirigir /admin a admin.html
app.get('/admin', (req, res) => {
    res.redirect('/admin.html');
});

// === CONFIGURACIÓN DE GEMINI ===
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let ai = null;
if (GEMINI_API_KEY) {
    try {
        ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    } catch (e) {
        console.error('Error inicializando Gemini. Verificá la API KEY.', e);
    }
} else {
    console.warn('⚠️  GEMINI_API_KEY no configurada: el asistente usará extracción básica de datos.');
}

const fmtGs = (n) => Math.round(Number(n) || 0).toLocaleString('es-PY').replace(/,/g, '.') + ' Gs';

const CAMPOS = ['remitente', 'destinatario', 'telefono', 'dedicatoria', 'horario'];
// Sin estos tres la florería no puede despachar el pedido
const CAMPOS_REQUERIDOS = ['remitente', 'destinatario', 'telefono'];

const ETIQUETAS = {
    remitente: 'tu nombre (quién envía)',
    destinatario: 'el nombre de quién recibe',
    telefono: 'un teléfono de contacto',
    dedicatoria: 'la dedicatoria',
    horario: 'el horario de entrega'
};

// Palabras que nunca son un nombre propio, para no capturar basura con las regex
const NO_ES_NOMBRE = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'que', 'de', 'del', 'con', 'sin', 'por',
    'hoy', 'mañana', 'manana', 'tarde', 'noche', 'las', 'hs', 'hora', 'horas',
    'favor', 'porfa', 'gracias', 'pedido', 'ramo', 'flores', 'entrega', 'delivery',
    'mi', 'su', 'tu', 'este', 'esta', 'ese', 'esa', 'ahi', 'ahí', 'ya', 'al', 'a'
]);

const NOMBRE = '[A-ZÁÉÍÓÚÑa-záéíóúñ]{2,}(?:\\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]{2,}){0,2}';

function limpiarNombre(valor) {
    if (!valor) return null;
    const limpio = String(valor).trim().replace(/[.,;:!¡?¿]+$/, '').trim();
    if (!limpio) return null;
    if (/\d/.test(limpio)) return null;
    const primera = limpio.split(/\s+/)[0].toLowerCase();
    if (NO_ES_NOMBRE.has(primera)) return null;
    return limpio;
}

function primeraCoincidencia(texto, patrones) {
    for (const p of patrones) {
        const m = texto.match(p);
        if (m && m[1]) {
            const v = limpiarNombre(m[1]);
            if (v) return v;
        }
    }
    return null;
}

/**
 * Extracción de respaldo cuando Gemini no está disponible o falla.
 * Cubre las formas más comunes de escribir un pedido en español rioplatense.
 */
function extraerBasico(message) {
    const texto = String(message || '').trim();

    const telefono = (texto.match(/(\+?595[\s-]?\d[\d\s-]{7,}|0\d{3}[\s-]?\d{3}[\s-]?\d{3}|\b\d{9,}\b)/) || [null])[0];

    const remitente = primeraCoincidencia(texto, [
        new RegExp(`(?:^|[\\s,.])(?:soy|habla)\\s+(${NOMBRE})`, 'i'),
        new RegExp(`(?:mi nombre es|me llamo)\\s+(${NOMBRE})`, 'i'),
        new RegExp(`(?:de parte de|de:|remitente:?)\\s*(${NOMBRE})`, 'i'),
        new RegExp(`(?:^|[\\s,.])de\\s+(${NOMBRE})\\s+para\\b`, 'i')
    ]);

    const destinatario = primeraCoincidencia(texto, [
        new RegExp(`(?:destinatario:?|recibe:?|lo recibe)\\s*(${NOMBRE})`, 'i'),
        new RegExp(`(?:env[ií]a(?:le|selo|rle)?|mandar?(?:le|selo)?|entregar?(?:le)?|llevar?(?:le)?)\\s+(?:a|para)\\s+(${NOMBRE})`, 'i'),
        new RegExp(`(?:^|[\\s,.])para\\s+(?:mi\\s+|su\\s+|la\\s+|el\\s+)?(${NOMBRE})`, 'i'),
        new RegExp(`(?:^|[\\s,.])a\\s+(${NOMBRE})\\s+(?:al|en el|tel)\\b`, 'i')
    ]);

    const horarioMatch = texto.match(/(?:a\s+las?\s+)?(\d{1,2}(?::\d{2})?\s*(?:hs?|am|pm|de la (?:mañana|tarde|noche)))/i)
        || texto.match(/\b(mañana|manana|hoy|esta tarde|esta noche|por la (?:mañana|manana|tarde|noche))\b/i);

    const dedicatoria = (texto.match(/(?:dedicatoria|mensaje|tarjeta)\s*(?:que\s+diga)?\s*[:"“]\s*([\s\S]+?)(?=\n(?:👤|🫂|📱|⏰)|$)/i)
        || texto.match(/que\s+diga\s*[:"“]?\s*([\s\S]+?)(?=\n(?:👤|🫂|📱|⏰)|$)/i)
        || [null, null])[1];

    return {
        remitente,
        destinatario,
        telefono: telefono ? telefono.trim() : null,
        dedicatoria: dedicatoria ? dedicatoria.trim() : null,
        horario: horarioMatch ? horarioMatch[1].trim() : null,
        _fuente: 'basico'
    };
}

async function extraerConGemini(message, conocidos) {
    const yaTengo = CAMPOS.filter((c) => conocidos[c]).map((c) => `${c}: ${conocidos[c]}`);
    const faltan = CAMPOS.filter((c) => !conocidos[c]);

    const prompt = `
Sos el asistente de pedidos de una florería en Asunción, Paraguay.
Estás en medio de una conversación con un cliente y vas juntando los datos de la entrega.

${yaTengo.length ? `Datos que YA tenés confirmados:\n${yaTengo.join('\n')}` : 'Todavía no tenés ningún dato confirmado.'}
Datos que TE FALTAN: ${faltan.join(', ') || 'ninguno'}.

Último mensaje del cliente: "${message}"

Extraé del último mensaje lo que puedas. Si el cliente responde con un dato suelto (por ejemplo sólo un nombre),
asignalo al campo que falta y que tenga más sentido según el contexto de la conversación.
Devolvé ÚNICAMENTE JSON válido, sin markdown:
{
  "remitente": "quién envía o null",
  "destinatario": "quién recibe o null",
  "telefono": "teléfono de contacto o null",
  "dedicatoria": "el texto EXACTO y COMPLETO de la dedicatoria (incluyendo saltos de línea) o null",
  "horario": "horario de entrega o null"
}
Poné null en todo lo que el último mensaje no aporte. No inventes datos.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    const data = JSON.parse(response.text);
    data._fuente = 'gemini';
    return data;
}

/** Los datos nuevos pisan a los viejos sólo si traen algo. */
function combinarDatos(previos, nuevos) {
    const out = {};
    for (const c of CAMPOS) {
        const nuevo = nuevos && nuevos[c] ? String(nuevos[c]).trim() : '';
        const previo = previos && previos[c] ? String(previos[c]).trim() : '';
        out[c] = nuevo || previo || null;
    }
    return out;
}

// === ENDPOINT DE CHECKOUT ===
app.post('/api/checkout', async (req, res) => {
    try {
        const { message, cart, total, temporada, datos, forzar } = req.body || {};

        if (!message || !String(message).trim()) {
            return res.status(400).json({ success: false, error: 'Escribí los datos del pedido.' });
        }

        const items = Array.isArray(cart) ? cart : [];
        if (items.length === 0) {
            return res.status(400).json({ success: false, error: 'El carrito está vacío.' });
        }

        const conocidos = combinarDatos({}, datos || {});

        // 1. Extraer los datos nuevos del último mensaje y sumarlos a lo que ya sabíamos
        let nuevos;
        if (ai) {
            try {
                nuevos = await extraerConGemini(message, conocidos);
            } catch (e) {
                console.error('Gemini falló, uso extracción básica:', e.message);
                nuevos = extraerBasico(message);
            }
        } else {
            nuevos = extraerBasico(message);
        }

        const extractedData = combinarDatos(conocidos, nuevos);
        extractedData._fuente = nuevos._fuente || 'basico';

        // 2. Si falta algo imprescindible, no molestamos a la tienda: le preguntamos al cliente
        const faltantes = CAMPOS_REQUERIDOS.filter((c) => !extractedData[c]);
        if (faltantes.length > 0 && !forzar) {
            return res.json({
                success: true,
                pendiente: true,
                whatsappSent: false,
                data: extractedData,
                faltantes,
                faltantesTexto: faltantes.map((c) => ETIQUETAS[c])
            });
        }

        // 3. Armar el mensaje de la orden
        const totalCalculado = items.reduce(
            (a, i) => a + (Number(i.subtotal) || (Number(i.price) || 0) * (Number(i.qty) || 1)),
            0
        );
        const totalFinal = Number(total) || totalCalculado;

        const detalle = items
            .map((i) => `   • ${i.title || 'Producto'} x${i.qty || 1} — ${fmtGs(i.subtotal || (i.price || 0) * (i.qty || 1))}`)
            .join('\n');

        const ordenTexto =
            `🔔 *NUEVA ORDEN RECIBIDA* 🔔\n\n` +
            `👤 *Remitente:* ${extractedData.remitente || 'No especificado'}\n` +
            `🫂 *Destinatario:* ${extractedData.destinatario || 'No especificado'}\n` +
            `📱 *Teléfono:* ${extractedData.telefono || 'No especificado'}\n` +
            `😍 *Dedicatoria:* ${extractedData.dedicatoria || 'No especificado'}\n` +
            `⏰ *Horario:* ${extractedData.horario || 'No especificado'}\n\n` +
            `🛍️ *Pedido:*\n${detalle}\n` +
            `💰 *Total:* ${fmtGs(totalFinal)}\n` +
            (temporada ? `🌸 *Temporada:* ${temporada}\n` : '') +
            `\n💬 _Mensaje original:_ ${message}`;

        // 4. Enviar al microservicio del bot de WhatsApp (bot.js, puerto 8081)
        let whatsappSent = false;
        let botError = null;
        try {
            const botRes = await fetch(`${BOT_URL}/api/bot/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: NUMERO_VENTAS, text: ordenTexto })
            });
            if (botRes.ok) {
                whatsappSent = true;
                console.log('✅ Orden enviada al bot de WhatsApp.');
            } else {
                botError = await botRes.text();
                console.error('El bot respondió con error:', botError);
            }
        } catch (e) {
            botError = e.message;
            console.error(`No se pudo contactar al bot en ${BOT_URL} (¿está corriendo?):`, e.message);
        }

        res.json({
            success: true,
            pendiente: false,
            whatsappSent,
            botError,
            data: extractedData,
            total: totalFinal,
            message: whatsappSent ? '¡Orden enviada exitosamente!' : 'Orden procesada, pero el bot de WhatsApp no está disponible.'
        });
    } catch (error) {
        console.error('Error en checkout:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// === RUTAS DE AUTENTICACIÓN ===
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body || {};
    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        const user = result.rows[0];
        if (user) {
            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ success: true, token, role: user.role });
        } else {
            res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/admin/status', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });

    try {
        jwt.verify(auth.split(' ')[1], JWT_SECRET);

        // Solicitar estado al bot
        try {
            const botRes = await fetch(`${BOT_URL}/api/bot/status`);
            const botData = await botRes.json();
            res.json(botData);
        } catch (botError) {
            res.json({ status: 'disconnected', error: 'Servicio bot no disponible' });
        }
    } catch (e) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

app.post('/api/admin/bot/disconnect', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });

    try {
        jwt.verify(auth.split(' ')[1], JWT_SECRET);

        try {
            const botRes = await fetch(`${BOT_URL}/api/bot/disconnect`, { method: 'POST' });
            const botData = await botRes.json();
            res.json(botData);
        } catch (botError) {
            res.status(503).json({ error: 'Servicio bot no disponible' });
        }
    } catch (e) {
        res.status(401).json({ error: 'Token inválido' });
    }
});
// === AUTO-PING PARA RENDER ===
// Render apaga los servidores web gratuitos tras 15 minutos sin tráfico.
// Hacemos un autollamado cada 14 minutos para mantenerlo despierto.

const selfUrl = process.env.RENDER_EXTERNAL_URL;
if (selfUrl) {
    setInterval(() => {
        https.get(selfUrl).on('error', (err) => {
            console.error('Error auto-ping:', err.message);
        });
        console.log(`[Keep-Alive] Ping interno enviado a ${selfUrl}`);
    }, 14 * 60 * 1000); // 14 minutos
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
});

// === AUTO-INICIO DEL BOT ===
// Iniciar bot.js como proceso hijo para garantizar que siempre corra
// incluso si Render ejecuta "node server.js" en lugar de "npm start"
const { fork } = require('child_process');

function startBotProcess() {
    console.log('[Orquestador] Iniciando bot.js como proceso hijo...');
    const botProcess = fork(path.join(__dirname, 'bot.js'));

    botProcess.on('exit', (code) => {
        console.warn(`[Orquestador] El proceso del bot se cerró (código ${code}). Reiniciando en 5 segundos...`);
        setTimeout(startBotProcess, 5000);
    });
}
startBotProcess();
