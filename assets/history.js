const HISTORY_API_URL = "https://agent-ia.servpimc.workers.dev/history";

async function loadChatHistory(email) {
    const container = document.getElementById("container-chanel");
    if (!container) return;

    try {
        const response = await fetch(`${HISTORY_API_URL}?userEmail=${encodeURIComponent(email)}`);
        if (!response.ok) throw new Error("Erreur lors du chargement de l'historique");
        
        const conversations = await response.json();
        renderHistoryList(conversations);
    } catch (error) {
        console.error("Erreur d'historique:", error);
    }
}

function renderHistoryList(conversations) {
    const container = document.getElementById("container-chanel");
    container.innerHTML = "";

    conversations.forEach(conv => {
        const li = document.createElement("li");
        li.className = "chat-item";
        
        const titleSpan = document.createElement("span");
        titleSpan.innerText = conv.title || "Nouvelle conversation";
        titleSpan.onclick = () => loadConv(conv.chatId);

        const editBtn = document.createElement("button");
        editBtn.innerText = "✏️";
        editBtn.className = "btn-edit-title";
        editBtn.onclick = (e) => {
            e.stopPropagation();
            renameConv(conv.chatId, conv.title);
        };

        li.appendChild(titleSpan);
        li.appendChild(editBtn);
        container.appendChild(li);
    });
}

async function saveConv(chatId, messageText, sender) {
    const email = userEmail || "invite@gmail.com";

    // Génération automatique du titre avec les 30 premiers caractères si nouveau chat
    const defaultTitle = messageText.length > 30 ? messageText.substring(0, 30) + "..." : messageText;

    const payload = {
        chatId: chatId,
        userEmail: email,
        title: defaultTitle,
        message: {
            sender: sender,
            text: messageText,
            timestamp: Date.now()
        }
    };

    try {
        await fetch(HISTORY_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        // Mettre à jour la liste dans la barre latérale
        loadChatHistory();
    } catch (error) {
        console.error("Erreur lors de la sauvegarde du message:", error);
    }
}

async function loadConv(chatId) {
    sessionStorage.setItem("current_chat_id", chatId);
    const chatContainer = document.getElementById("chat-container");
    chatContainer.innerHTML = "";

    try {
        const response = await fetch(`${HISTORY_API_URL}/messages?chatId=${encodeURIComponent(chatId)}`);
        const messages = await response.json();

        messages.forEach(msg => {
            if (msg.sender === "user") {
                appendMessage(msg.text, "user");
            } else {
                const formattedHtml = marked.parse(msg.text);
                appendMessage(formattedHtml, "agent");
            }
        });
    } catch (error) {
        console.error("Erreur lors du chargement de la conversation:", error);
    }
}

async function renameConv(chatId, oldTitle) {
    const newTitle = prompt("Entrez le nouveau titre de la conversation :", oldTitle);
    if (!newTitle || newTitle.trim() === "" || newTitle === oldTitle) return;

    try {
        await fetch(`${HISTORY_API_URL}/rename`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId, title: newTitle.trim() })
        });
        
        loadChatHistory();
    } catch (error) {
        console.error("Erreur lors du changement de titre:", error);
    }
}