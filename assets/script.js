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

async function sendMessage() {
    const input = document.getElementById('user-input');
    const messageText = input.value.trim();
    if (!messageText) return;

    appendMessage(messageText, 'user');
    input.value = '';

    const loadingId = appendMessage("Je réfléchis...", 'agent');
    
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: messageText,
                userEmail: userEmail || "utilisateur_inconnu@gmail.com",
                chatId: getOrCreateChatId()
            })
        });
        
        const data = await response.json();
        
        const formattedHtml = marked.parse(data.response);
        document.getElementById(loadingId).innerHTML = formattedHtml;

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

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

function handleCredentialResponse(response) {
    const payload = parseJwt(response.credential);
    userEmail = payload.email;
    console.log("Utilisateur connecté :", userEmail);

    document.getElementById("msg-agent-0").innerText = "Bienvenue ! Que puis-je faire pour vous ?";
    document.getElementById("auth-bar").style.display = "none";
    document.getElementById("overlay").style.display = "none";
    document.getElementById("user-input").disabled = false;
    document.querySelectorAll('button')[0].disabled = false;
}

window.onload = function () {
    google.accounts.id.initialize({
        client_id: "912599571029-n8top69090f7vvnf661pmamb41i6j977.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });
    
    google.accounts.id.renderButton(
        document.getElementById("google-btn"),
        { theme: "filled_blue", size: "medium" }
    );
}

function nouveauChat() {
    sessionStorage.removeItem("current_chat_id");
    document.getElementById("chat-container").innerHTML = "";
}