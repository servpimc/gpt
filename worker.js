import { appelerCloudflareAI } from './agents/cloudflare.js';
import { appelerGroq } from './agents/groq.js';
import { appelerGemini } from './agents/gemini.js';
import { enregistrerMessage, obtenirHistoriqueChat } from "./assets/history.js";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers });

    if (request.method !== "POST") return new Response(JSON.stringify({ error: "Ce Worker n'attend que des requêtes POST." }), { status: 405, headers });

    let userMessage, userEmail, chatId, textResult, model;
    let systemPrompt = "Tu es un assistant IA expert en développement Web (HTML, CSS, JavaScript et Cloudflare Workers). CONSIGNES STRICTES : 1. Modifie UNIQUEMENT ce que l'utilisateur te demande explicitement de modifier. 2. NE REÉCRIS PAS le code existant s'il n'y a pas de besoin et NE SUPPRIME AUCUNE fonctionnalité déjà présente. 3. Ne fais pas de sur-ingénierie : apporte la solution la plus simple, ciblée et exacte. 4. Réponds toujours en français de manière directe et concise. Réponds toujours avec une courte phrase d'introduction. 5. Lorsque tu génères un bloc de code, utilise TOUJOURS des blocs de code multilignes Markdown précédés et suivis de trois backticks (ex: \\\`\\\`\\\`javascript ... \\\`\\\`\\\`). Indique TOUJOURS le nom du langage (javascript, css, html, etc.) juste après les trois backticks d'ouverture. Ne génère JAMAIS de code sur une seule ligne avec un seul backtick.";

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

      const historique = await obtenirHistoriqueChat(userEmail, chatId, 6, env);
      if (historique.length > 0) {
        systemPrompt += " " + historique.map(m => `${m.role}: ${m.content}`).join(" ");
      }

    } catch (e) {
      return new Response(JSON.stringify({ response: "Erreur : Format JSON invalide." }), { status: 400, headers });
    }

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
    }else if(model=="gemini"){
      try {
        textResult = await appelerGemini(userMessage, systemPrompt, env);
      } catch (erreurGemini) {
        console.error("gemini 2.5flash à échoué:", erreurGemini);
        textResult = `Désolé, le service Gemini est indisponible pour le moment. ${erreurGemini.message}`;
      }
    }else {
      textResult = await appelerGroq(userMessage, systemPrompt, env);
    }

    // 3. Enregistrer la réponse de l'IA dans D1
    await enregistrerMessage(userEmail, chatId, "assistant", textResult, env);

    return new Response(JSON.stringify({ response: textResult }), { headers });
  }
};