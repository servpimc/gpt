const WORKER_URL = "https://agent-ia.servpimc.workers.dev/"; 
let userEmail = null;

marked.setOptions({
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-'
});

function getOrCreateChatId() {
    let chatId = sessionStorage.getItem("current_chat_id");
    if (!chatId) {
        chatId = "chat_" + crypto.randomUUID();
        sessionStorage.setItem("current_chat_id", chatId);
    }
    return chatId;
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Erreur de décodage du token Google:", e);
        return null;
    }
}

function handleCredentialResponse(response) {
    const payload = parseJwt(response.credential);
    
    if (payload && payload.email) {
        userEmail = payload.email;
        console.log("Email récupéré avec succès :", userEmail);
        document.getElementById("msg-agent-0").innerText = "Bienvenue ! Que puis-je faire pour vous ?";
        document.getElementById('google').close();
        
    } else {
        console.warn("Impossible de récupérer l'email depuis le token.");
        document.getElementById("google_h2").innerText = "Une erreur est survenue";
    }

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
        messageDiv.innerHTML = text;
    }

    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    return messageDiv.id;
}

window.onload = function () {
    google.accounts.id.initialize({
        client_id: "912599571029-n8top69090f7vvnf661pmamb41i6j977.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });
    
    document.getElementById('google').showModal()
    google.accounts.id.renderButton(
        document.getElementById("google-btn"),
        { theme: "filled_blue", size: "medium" }
    );
}

function nouveauChat() {
    sessionStorage.removeItem("current_chat_id");
    document.getElementById("chat-container").innerHTML = "";
}