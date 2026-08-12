# Margarita Florería

Tienda online de la florería Margarita (Asunción, Paraguay) con **temas estacionales**, catálogo, carrito y un **asistente de pedidos** que manda las órdenes al WhatsApp del local.

---

## Arquitectura

Son dos procesos Node separados que hablan por HTTP:

```
navegador ──► server.js (:8080)  ──► bot.js (:8081) ──► WhatsApp del local
              web + API + Gemini      Baileys / QR
```

| Proceso | Puerto | Qué hace |
|---|---|---|
| `server.js` | 8080 | Sirve el sitio estático, expone `/api/checkout`, `/api/login` y `/api/admin/status`. Usa Gemini para extraer los datos del pedido. |
| `bot.js` | 8081 | Microservicio de WhatsApp con Baileys. Genera el QR de vinculación y envía los mensajes. |

Se separan a propósito: si el bot se cae o se desvincula, la web sigue funcionando y el asistente ofrece un link de `wa.me` como respaldo.

---

## Levantarlo local

Requisitos: **Node 22+** y npm.

**1. Dependencias**

```bash
npm install
```

**2. Variables de entorno**

Copiá `.env.example` a `.env` y completá los valores:

```bash
cp .env.example .env
```

| Variable | Obligatoria | Para qué |
|---|---|---|
| `GEMINI_API_KEY` | No | Extracción de datos del asistente. Sin ella corre un fallback por regex, más limitado pero funcional. |
| `PORT` | No | Puerto del server web. Default `8080`. |
| `BOT_URL` | No | URL del microservicio del bot. Default `http://localhost:8081`. |
| `NUMERO_VENTAS` | No | Número de WhatsApp que recibe las órdenes, sin `+` ni espacios. |
| `JWT_SECRET` | No | Firma de los tokens del panel admin. |

La key de Gemini se saca de [Google AI Studio](https://aistudio.google.com/apikey).

**3. Arrancar los dos procesos** (en dos terminales)

```bash
npm start
```

```bash
npm run bot
```

**4. Vincular WhatsApp**

Entrá a `http://localhost:8080/admin.html` con usuario `admin` y clave `admin`, y escaneá el QR con el WhatsApp del local. La sesión queda guardada en `auth_info_baileys/`, así que sólo hace falta una vez por máquina.

Listo: `http://localhost:8080`

> **Si el puerto 8080 está ocupado** (por ejemplo por Oracle XE, que toma `127.0.0.1:8080`), poné otro en el `.env`:
> ```
> PORT=3010
> ```
> Node arranca igual en 8080 aunque esté tomado, pero el navegador termina pegando contra el otro servicio. Si ves una página que no es la tienda, es esto.

---

## Cómo funciona el asistente de pedidos

1. El cliente arma el carrito y abre el asistente (botón flotante o desde el carrito).
2. Escribe el pedido en lenguaje natural: *"Soy Carlos, envíale a Ana al 0991 234 567, dedicatoria: feliz cumple, a las 18hs"*.
3. `POST /api/checkout` extrae `remitente`, `destinatario`, `telefono`, `dedicatoria` y `horario`.
4. **Si falta alguno de los tres obligatorios** (`remitente`, `destinatario`, `telefono`), el server responde `pendiente: true` con la lista de faltantes y el asistente los pide. Los datos ya entendidos se acumulan entre mensajes, así que el cliente puede responder de a poco.
5. Cuando está completo, el pedido sale al WhatsApp del local con el detalle del carrito y el total.
6. Si el bot no está vinculado, la respuesta trae `whatsappSent: false` y el asistente ofrece un link de `wa.me` con el pedido ya cargado.

### `POST /api/checkout`

```jsonc
// request
{
  "message": "soy Oscar, para Ana",
  "cart": [{ "id": 6, "title": "Ramo Silvestre Pastel", "qty": 1, "price": 95000, "subtotal": 95000 }],
  "total": 95000,
  "temporada": "Otoño",
  "datos": { "telefono": "0983645915" }   // lo que ya se sabía de mensajes anteriores
}

// response cuando falta algo
{ "success": true, "pendiente": true, "faltantes": ["destinatario"], "data": { ... } }

// response cuando salió
{ "success": true, "pendiente": false, "whatsappSent": true, "data": { ... }, "total": 95000 }
```

---

## Temas estacionales

El tema vive en el atributo `data-season` del `<html>` y se resuelve así:

- **Automático** según la fecha, con el calendario del hemisferio sur: primavera sep–nov, verano dic–feb, otoño mar–may, invierno jun–ago.
- **Manual** desde el selector del header. La elección queda en `localStorage` y pisa al automático.

Cada tema cambia paleta completa, hero (copy, precio, foto), chips de flores de temporada, título y selección de favoritos, y el banner de promo.

Para tocar un tema, editá el objeto `SEASONS` en [`margarita.js`](margarita.js) (contenido) y el bloque `html[data-season="..."]` en [`margarita.css`](margarita.css) (colores).

---

## Estructura

```
index.html        Tienda (one-page: hero, favoritos, catálogo, footer)
margarita.css     Estilos + tokens de color por temporada
margarita.js      Temas, catálogo, carrito, detalle y asistente
server.js         Server web + API + integración con Gemini
bot.js            Microservicio de WhatsApp (Baileys)
database.js       SQLite de usuarios (se crea solo en temp.db)
admin.html/.js    Panel para vincular el WhatsApp del bot
assets/           Fotos de producto y de hero
```

`catalogo.html`, `ocasiones.html`, `colecciones.html`, `styles.css`, `script.js` y `gemini_logic.js` son de la versión anterior del sitio. Ya no están linkeados desde el nav nuevo pero siguen accesibles por URL.

## Usuarios de prueba

Se crean solos en `temp.db` la primera vez que arranca el server:

| Usuario | Clave | Rol |
|---|---|---|
| `admin` | `admin` | admin |
| `usuario1` | `usuario1` | customer |

Son credenciales de desarrollo en texto plano. Antes de exponer esto a internet hay que hashear las contraseñas y cambiar el `JWT_SECRET`.
