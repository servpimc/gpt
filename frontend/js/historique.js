async function afficheHistorique() {
  try {
    const response = await fetchWithAuth(`${WORKER_URL}/historique`, {
      method: "GET"
    });

    const conversations = await response.json();
    if (Array.isArray(conversations)) {
      const htmlContent = conversations.map(c => `
        <li class="channel-item" data-chat-id="${c.chat_id}">
          <a id="${c.chat_id}" onclick="loadChat('${c.chat_id}')">${c.titre || "Nouvelle conversation"}</a>
          <button onclick="deleteConversation('${c.chat_id}')"> x </button>
        </li>
      `).join('');
      document.getElementById("container-chanel").innerHTML = htmlContent;
    }
  } catch (erreur) {
    console.error("Erreur historique :", erreur);
  }
}

async function loadChat(chatId) {
  try {
    const response = await fetchWithAuth(`${WORKER_URL}/historique?load=true&chatId=${encodeURIComponent(chatId)}`, {
      method: "GET"
    });

    const messages = await response.json();

    sessionStorage.setItem("current_chat_id", chatId);
    document.getElementById("chat-container").innerHTML = '';
    
    const targetLink = document.getElementById(chatId);
    if (targetLink) {
      document.getElementById('title-chat').innerText = targetLink.innerText;
    }

    if (Array.isArray(messages)) {
      messages.forEach(msg => {
        appendMessage(msg.content, msg.role);
      });
    }
  } catch (erreur) {
    console.error("Erreur chargement chat :", erreur);
  }
}

async function renameConversation(title, chatId) {
  try {
    await fetchWithAuth(`${WORKER_URL}/renameConv?title=${encodeURIComponent(title)}&chatId=${encodeURIComponent(chatId)}`, {
      method: "PUT"
    });
    
    document.getElementById("title-chat").innerText = title;
    afficheHistorique();
  } catch (erreur) {
    console.error("Erreur renommage :", erreur);
  }
}

function rename(etat){
    let btn = document.getElementById('name');
    let titre = document.getElementById('title-chat');

    if (etat === "edit") {
        btn.value = "rename";
        titre.innerHTML = `<input type='text' id='title' value='${titre.innerText}' onkeypress="if(event.key === 'Enter') rename('${btn.value}')">`;
    }
    if (etat === "rename") {
        const inputElem = document.getElementById('title');
        const newTitle = inputElem ? inputElem.value : titre.innerText;
        titre.innerText = newTitle;
        btn.value = "edit";
        renameConversation(newTitle, sessionStorage.getItem('current_chat_id'));
    }
}

async function deleteConversation(chatId) {
  try {
    await fetchWithAuth(`${WORKER_URL}/deleteConv?chatId=${encodeURIComponent(chatId)}`, {
      method: "DELETE"
    });

    if (sessionStorage.getItem("current_chat_id") === chatId) {
      newChat();
    } else {
      afficheHistorique();
    }
  } catch (erreur) {
    console.error("Erreur suppression :", erreur);
  }
}