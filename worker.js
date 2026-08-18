import { appelerCloudflareAI } from './agents/cloudflare.js';
import { appelerGroq } from './agents/groq.js';
import { appelerOpen } from './agents/openrouter.js';
import { enregistrerMessage, loadChat, listerConversations, renameConversation } from "./backend/history.js";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers });

    const url = new URL(request.url);

    //  frontend historique
    if (request.method === "GET" && url.pathname === "/conversations") {
      const userEmail = url.searchParams.get("userEmail");
      if (!userEmail) {
        return new Response(JSON.stringify({ error: "Les paramètre sont invalides." }), { status: 400, headers });
      }

      try {
        const conversations = await listerConversations(userEmail, env);
        return new Response(JSON.stringify(conversations), { headers });
      } catch (erreur) {
        console.error("Erreur listerConversations:", erreur);
        return new Response(JSON.stringify({ error: "Impossible de récupérer les conversations." }), { status: 500, headers });
      }
    }
    if (request.method === "GET" && url.pathname === "/historique") {
      const userEmail = url.searchParams.get("userEmail");
      const chatId = url.searchParams.get("chatId");

      if (!userEmail || !chatId) {
        return new Response(JSON.stringify({ error: "Les paramètre sont invalides." }), { status: 400, headers });
      }

      try {
        const historique = await loadChat(userEmail, chatId, env);
        return new Response(JSON.stringify(historique), { headers });
      } catch (erreur) {
        console.error("Erreur loadChat:", erreur);
        return new Response(JSON.stringify({ error: "Impossible de récupérer l'historique." }), { status: 500, headers });
      }
    }
    if (request.method === "GET" && url.pathname === "/renameConv") {
      const userEmail = url.searchParams.get("userEmail");
      const chatId = url.searchParams.get("chatId");
      const title = url.searchParams.get("title");

      if (!userEmail || !chatId || !title) {
        return new Response(JSON.stringify({ error: "Les paramètre sont invalides." }), { status: 400, headers });
      }

      try {
        const name = await renameConversation(title, chatId, userEmail, env);
        return new Response(JSON.stringify(name), { headers });
      } catch (erreur) {
        console.error("Erreur renameConversation:", erreur);
        return new Response(JSON.stringify({ error: "Impossible de changer le titre." }), { status: 500, headers });
      }
    }

    if (request.method !== "POST") return new Response(JSON.stringify({ error: "Ce Worker n'attend que des requêtes POST." }), { status: 405, headers });

    let userMessage, userEmail, chatId, textResult, model;
    let systemPrompt = `Tu es un assistant IA expert en développement Web (HTML, CSS, JavaScript et Cloudflare Workers). CONSIGNES STRICTES : 
      1. Modifie UNIQUEMENT ce que l'utilisateur te demande explicitement de modifier. 
      2. NE REÉCRIS PAS le code existant s'il n'y a pas de besoin et NE SUPPRIME AUCUNE fonctionnalité déjà présente. 
      3. Ne fais pas de sur-ingénierie : apporte la solution la plus simple, ciblée et exacte. 
      4. Réponds toujours en français de manière directe et concise.
    `;

    try {
      const body = await request.json();
      userMessage = body.message;
      userEmail = body.userEmail;
      chatId = body.chatId;
      model = body.model;

      if (!userMessage || !userEmail || !chatId) {
        return new Response(JSON.stringify({ response: "Erreur : Paramètres manquants (message, userEmail, chatId)." }), { status: 400, headers });
      }

      await enregistrerMessage(userEmail, chatId, "user", userMessage, env);

      const historique = await loadChat(userEmail, chatId, 6, env);
      if (historique.length > 0) {
        systemPrompt += " " + historique.map(m => `${m.role}: ${m.content}`).join(" ");
      }

    } catch (e) {
      return new Response(JSON.stringify({ response: "Erreur : Format JSON invalide." }), { status: 400, headers });
    }

    //  appel agent
    if (model == "llama") {
      try {
        textResult = await appelerCloudflareAI(userMessage, systemPrompt, env);
      } catch (erreurCloudflare) {
        console.error("llama4 à échoué:", erreurCloudflare);
        try {
          textResult = await appelerGroq(userMessage, systemPrompt, env);
        } catch (erreurGroq) {
          console.error("Groq a également échoué:", erreurGroq);
          textResult = "Désolé, les services d'IA sont indisponibles pour le moment.";
        }
      }
    }else if(model=="open"){
      try {
        textResult = await appelerOpen(userMessage, systemPrompt, env);
      } catch (erreurOpen) {
        console.error("Openrouter à échoué:", erreurOpen);
        textResult = `Désolé, le service Openrouter est indisponible pour le moment. ${erreurOpen.message}`;
      }
    }else {
      textResult = await appelerGroq(userMessage, systemPrompt, env);
    }

    //  historique
    await enregistrerMessage(userEmail, chatId, "agent", textResult, env);

    return new Response(JSON.stringify({ response: textResult }), { headers });
  }
};