
function newChat() {
    sessionStorage.removeItem("current_chat_id");
    document.getElementById("chat-container").innerHTML = '<h2 id="title-chat">Nouvelle discution</h2> <div id="msg-agent-0" class="message agent">Bienvenue ! Que puis-je faire pour vous ?</div>';
    afficheHistorique(userEmail);
}

function getOrCreateChatId() {
    let chatId = sessionStorage.getItem("current_chat_id");
    if (!chatId) {
        chatId = "chat_" + crypto.randomUUID();
        sessionStorage.setItem("current_chat_id", chatId);
    }
    return chatId;
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const messageText = input.value.trim();
    const modelSelect = document.getElementById('model-select');
    const selectedModel = modelSelect ? modelSelect.value : 'llama';
    if (!messageText) return;

    appendMessage(messageText, 'user');
    input.value = '';

    const loadingId = appendMessage("Je réfléchis...", 'agent');
    
    const payload = { 
        message: messageText,
        userEmail: userEmail || "invite@gmail.com",
        chatId: getOrCreateChatId(),
        model: selectedModel
    };

    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok && data.response) {
            const formattedHtml = marked.parse(data.response);
            document.getElementById(loadingId).innerHTML = formattedHtml;
        } else {
            document.getElementById(loadingId).innerText = data.response || data.error || "Erreur 400 transmise par le serveur.";
        }

    } catch (error) {
        document.getElementById(loadingId).innerText = "Erreur de connexion avec l'agent.";
    }

    const container = document.getElementById('chat-container');
    container.scrollTop = container.scrollHeight;
}

function appendMessage(text, sender) {
    const container = document.getElementById('chat-container');
    const messageDiv = document.createElement('div');
    const timestamp = Date.now();

    messageDiv.id = 'msg-' + sender + '-' + timestamp;
    messageDiv.className = 'message ' + sender;

    if (sender === 'user') {
        messageDiv.innerText = text;
    } else {
        messageDiv.innerHTML = marked.parse(text);
    }

    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    return messageDiv.id;
}

window.newChat = newChat;
window.sendMessage = sendMessage;
