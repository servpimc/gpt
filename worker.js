export default {
  async fetch(request, env) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (request.method === "POST") {
      let userMessage = "";
      let historiqueTexte = "";

      try {
        const body = await request.json();
        userMessage = body.message || "Dis bonjour";
        historiqueTexte = body.historique || "";
      } catch (e) {
        return new Response(JSON.stringify({ response: "Erreur : Format JSON invalide." }), { status: 400, headers });
      }

      let systemPrompt = "Tu es un assistant IA expert en développement Web (HTML, CSS, JavaScript et Cloudflare Workers). CONSIGNES STRICTES : 1. Modifie UNIQUEMENT ce que l'utilisateur te demande explicitement de modifier. 2. NE REÉCRIS PAS le code existant s'il n'y a pas de besoin et NE SUPPRIME AUCUNE fonctionnalité déjà présente. 3. Ne fais pas de sur-ingénierie : apporte la solution la plus simple, ciblée et exacte. 4. Réponds toujours en français de manière directe et concise.";
      
      if (historiqueTexte.trim() !== "") {
        systemPrompt += " " + historiqueTexte;
      }

      let textResult = "";

      try {
        const aiResponse = await env.AI.run("a@cf/meta/llama-4-scout-17b-16e-instruct", {
          max_tokens: 4096,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ]
        });
        
        if (aiResponse && aiResponse.response) {
          textResult = "Llama 4 : "+ aiResponse.response;
        } else if (aiResponse && aiResponse.result) {
          textResult = aiResponse.result;
        } else {
          textResult = typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse);
        }

      } catch (erreurCloudflare) {
        console.log("Cloudflare a échoué/bloqué, bascule sur Groq...", erreurCloudflare);

        try {
          textResult = await appelerGroq(userMessage, systemPrompt, env);
        } catch (erreurGroq) {
          console.log("Groq a également échoué:", erreurGroq);
          textResult = "Désolé, les services d'IA sont indisponibles pour le moment.";
        }
      }

      return new Response(JSON.stringify({ response: textResult }), { headers });
    }

    return new Response(JSON.stringify({ error: "Ce Worker n'attend que des requêtes POST." }), { status: 405, headers });
  }
};

async function appelerGroq(userMessage, systemPrompt, env) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.grok_api}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur Groq (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return "Llama3.1-8b : "+data.choices[0].message.content;
}
