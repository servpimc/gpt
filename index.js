export default {
  async fetch(request, env) {
    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mon Agent Llama 4</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #131314; color: #e3e3e3; margin: 0; display: flex; flex-direction: column; height: 100vh; }
            #chat-container { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px; }
            .message { padding: 12px 16px; border-radius: 12px; max-width: 75%; word-wrap: break-word; line-height: 1.5; }
            .user { background: #2b2a2a; align-self: flex-end; color: #fff; }
            .agent { background: #1e1f20; align-self: flex-start; border: 1px solid #444746; }
            #input-container { padding: 20px; background: #131314; display: flex; gap: 10px; }
            input { flex: 1; padding: 16px; border-radius: 24px; border: 1px solid #444746; background: #1e1f20; color: #fff; font-size: 16px; outline: none; }
            button { background: #f38020; color: #000; border: none; padding: 0 24px; border-radius: 24px; font-weight: bold; cursor: pointer; font-size: 16px; }
            button:hover { background: #e06d10; }
        </style>
    </head>
    <body>

        <div id="chat-container">
            <div class="message agent">Bonjour ! Je suis ton agent Llama 4. Pose-moi une question !</div>
        </div>

        <div id="input-container">
            <input type="text" id="user-input" placeholder="Écris ton message ici..." onkeypress="if(event.key === 'Enter') sendMessage()">
            <button onclick="sendMessage()">Envoyer</button>
        </div>

        <script>
            // L'URL fixe qui pointe en AJAX vers ton premier Worker de calcul
            const WORKER_URL = "https://damp-salad-6faa.servpimc.workers.dev/"; 

            async function sendMessage() {
                const input = document.getElementById('user-input');
                const messageText = input.value.trim();
                if (!messageText) return;

                appendMessage(messageText, 'user');
                input.value = '';

                const loadingId = appendMessage("L'agent réfléchit...", 'agent');

                try {
                    const response = await fetch(WORKER_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: messageText })
                    });
                    
                    const data = await response.json();
                    
                    // On injecte la réponse nettoyée reçue du backend gpt
                    document.getElementById(loadingId).innerText = data.response;
                } catch (error) {
                    document.getElementById(loadingId).innerText = "Erreur de connexion avec l'agent.";
                }
            }

            function appendMessage(text, sender) {
                const container = document.getElementById('chat-container');
                const messageDiv = document.createElement('div');
                
                // Ajout du paramètre "sender" (user ou agent) dans l'ID pour éviter les doublons instantanés !
                const id = 'msg-' + sender + '-' + Date.now(); 
                
                messageDiv.id = id;
                messageDiv.className = 'message ' + sender;
                messageDiv.innerText = text;
                container.appendChild(messageDiv);
                container.scrollTop = container.scrollHeight;
                return id;
            }
        </script>
    </body>
    </html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=UTF-8" }
    });
  }
};
