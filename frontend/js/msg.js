function newChat() {
    sessionStorage.removeItem("current_chat_id");
    if(document.getElementById("name").style.display == 'none') toggleUserChat();
    document.getElementById("chat-container").innerHTML ='<div id="msg-agent-0" class="message agent">Bienvenue ! Que puis-je faire pour vous ?</div>';
    document.getElementById("title-chat").innerText="Nouvelle discution";
    document.getElementById('sidebar').classList.toggle('open');
    afficheHistorique();
}

function getOrCreateChatId() {
    let chatId = sessionStorage.getItem("current_chat_id");
    if (!chatId) {
        chatId = "chat_" + crypto.randomUUID();
        sessionStorage.setItem("current_chat_id", chatId);
    }
    return chatId;
}

async function sendIa() {
    const input = getInput();
    const files = Array.from(input.fileInput.files).slice(0, 3);
    const rawText = input.text.value.trim();
    let fichier = `\n --- Fichiers joint --- \n`; 

    if (!rawText && files.length === 0) return;

    let contenuFichiers = rawText;
    for (const file of files) {
        const fileContent = await file.text();
        contenuFichiers += `\n\n--- Fichier (${file.name}) ---\n${fileContent}`;
        fichier = fichier+`- ${file.name}\n`;
    }

    const messageText = obfusque(contenuFichiers);

    input.text.value = '';
    input.fileInput.value = '';
    if(file.length===0)fichier="";
    appendMessage(rawText+fichier, 'user');
    closeDrawer();

    const loadingId = appendMessage("Je réfléchis...", 'agent');
    const payload = {
        message: messageText,
        chatId: getOrCreateChatId(),
        model: input.currentModel.value || 'llama'
    };

    try {
        const response = await fetchWithAuth(WORKER_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        const loadingElement = document.getElementById(loadingId);
        
        if (response.ok && data.response) {
            loadingElement.innerHTML = marked.parse(data.response);
        } else {
            loadingElement.innerText = data.response || data.error || "Erreur transmise par le serveur.";
        }
    } catch (error) {
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.innerText = error.message || "Erreur de connexion avec l'agent.";
        }
    }

    const container = document.getElementById('chat-container');
    container.scrollTop = container.scrollHeight;
}

function obfusque(texte) {
    return texte
    .replace(/(sk-|gsk_|AIzaSy|xai-)[a-zA-Z0-9_-]{15,}/g, '[CLE_API_MASQUEE]')
    .replace(/(password|mdp|secret|token)\s*[:=]\s*(?:"[^"]*"|'[^']*'|\S+)/gi, '$1: [SECRET_MASQUE]')
    .replace(/(PASS|PASSWORD|SECRET|KEY|TOKEN)=\S+/gi, '$1=[SECRET_MASQUE]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_MASQUE]');
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
        messageDiv.innerHTML = marked.parse(cleanMarkdown(text));
    }

    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    return messageDiv.id;
}

function closeDrawer() {
    const input= getInput();
    if (input.fileInput) input.fileInput.value = '';
    if (input.fileList) input.fileList.innerHTML = '';
    if (input.fileDrawer) { input.fileDrawer.classList.remove('drawer-open'); input.fileDrawer.classList.add('drawer-hidden'); }
    if (input.chatContainer) input.chatContainer.classList.remove('drawer-active');
}

document.addEventListener('DOMContentLoaded', () => {
  const input = getInput();
  let files = [];

  const update = () => {
    const dt = new DataTransfer();
    files.forEach(f => dt.items.add(f));
    input.fileInput.files = dt.files;

    input.fileList.innerHTML = files.map((f,i) => `
      <li>📄 ${f.name}
          <span class="remove-file" data-i="${i}"> ✕</span>
      </li>`).join('');

    if (!files.length) return closeDrawer();
    input.fileDrawer.classList.replace('drawer-hidden','drawer-open');
    input.chatContainer.classList.add('drawer-active');
    input.chatContainer.scrollTop = input.chatContainer.scrollHeight;
  };

  input.fileInput.addEventListener('change', () => {
    files = [...files, ...input.fileInput.files].slice(0,3);
    update();
  });

  input.fileList.addEventListener('click', e => {
    if (e.target.matches('.remove-file')) {
      files.splice(+e.target.dataset.i, 1);
      update();
      input.fileInput.dispatchEvent(new Event('change'));
    }
  });
});
