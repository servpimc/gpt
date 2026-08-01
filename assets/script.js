const WORKER_URL = "https://agent-ia.servpimc.workers.dev/"; 
let userTokenGoogle = null;

marked.setOptions({
    highlight: function(code, lang) {
        const language = highlight.js.getLanguage(lang) ? lang : 'plaintext';
        return highlight.js.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-'
});

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
                historique: coherence(),
                tokenGoogle: userTokenGoogle
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
    messageDiv.dataset.time = timestamp;
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

function coherence() {
    const MESSAGES = Array.from(document.querySelectorAll('.message')).sort((a, b) => {
        return b.dataset.time - a.dataset.time;
    });
    
    if (MESSAGES.length <= 2) return "";
    
    const texteMessages = MESSAGES.slice(2, 17).map(div => div.textContent).reverse().join(' | ');

    return "Voici nos précédents échanges dans l'ordre chronologique pour t'aider à avoir une cohérence : " + texteMessages;
}

function handleCredentialResponse(response) {
    userTokenGoogle = response.credential;
    console.log("Utilisateur connecté ! Token :", userTokenGoogle);

    document.getElementById("msg-agent-0").innerText= "Bienvenue ! Que puis-je faire pour vous?";
    document.getElementById("auth-bar").style.display="none";
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