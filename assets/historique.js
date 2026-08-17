async function afficheHistorique(userEmail) {
  try {
    const response = await fetch(`${WORKER_URL}/conversations?userEmail=${encodeURIComponent(userEmail)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération: ${response.status}`);
    }

    const conversations = await response.json();
    if (Array.isArray(conversations)) {
        const htmlContent = conversations.map(c => `
            <li class="channel-item" data-chat-id="${c.chat_id}">
                <a id="${c.chat_id}" onclick="loadChat('${userEmail}', '${c.chat_id}')">${c.titre+"..." || "Nouvelle conversation"}</a>
            </li>
        `).join('');
        document.getElementById("container-chanel").innerHTML = htmlContent;
    }
    console.log("Conversations de l'utilisateur :", conversations); 
  } catch (erreur) {
    console.error("Erreur Frontend :", erreur);
  }
}


async function loadChat(userEmail, chatId) {
  try {
    const response = await fetch(`${WORKER_URL}/historique?userEmail=${encodeURIComponent(userEmail)}&chatId=${encodeURIComponent(chatId)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) throw new Error(`Erreur: ${response.status}`);

    const messages = await response.json();
    
    const chatContainer = document.getElementById("title-chat");
    chatContainer.innerText = document.getElementById(chatId).innerText;

    if (Array.isArray(messages)) {
      messages.forEach(msg => {
        appendMessage(msg.content, msg.role);
      });
    }

    sessionStorage.setItem("current_chat_id", chatId);

  } catch (erreur) {
    console.error("Erreur chargement historique :", erreur);
  }
}

async function renameConversation(title, chatId, userEmail) {
  try {
    const response = await fetch(`${WORKER_URL}/renameConv?title=${encodeURIComponent(title)}&chatId=${encodeURIComponent(chatId)}&userEmail=${encodeURIComponent(userEmail)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) throw new Error(`Erreur: ${response.status}`);
    
    document.getElementById("title-chat").innerText=title;

    afficheHistorique(userEmail);

  } catch (erreur) {
    console.error("Erreur chargement historique :", erreur);
  }
}

function rename(etat){
    let btn=document.getElementById('name');
    let titre=document.getElementById('title-chat');

    if(etat=="edit"){
        btn.value="rename";
        titre.innerHTML=`<input type='text' id='title' value='${titre.innerText}' onkeypress="if(event.key === 'Enter') rename('${btn.value}')">`;
    }
    if(etat=="rename"){
      titre.innerText = document.getElementById('title').value;
      btn.value="edit"
      renameConversation(titre.innerText, sessionStorage.getItem('current_chat_id'), userEmail);
    }
}


window.loadChat = loadChat;