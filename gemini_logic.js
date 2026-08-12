
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
