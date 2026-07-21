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

      try {
        const aiResponse = await env.AI.run("a@cf/meta/llama-4-scout-17b-16e-instruct", {
          max_tokens: 4096,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ]
        });

        let textResult = "";
        if (aiResponse && aiResponse.response) {
          textResult = aiResponse.response;
        } else if (aiResponse && aiResponse.result) {
          textResult = aiResponse.result;
        } else {
          textResult = typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse);
        }

        return new Response(JSON.stringify({ response: textResult }), { headers });

      } catch (erreurCloudflare) {
      console.log("Cloudflare a échoué/bloqué, bascule sur Groq...", erreurCloudflare);

      try {
        reponseTexte = await appelerGroq(prompt, env);

      } catch (erreurGroq) {
        console.log("Groq a également échoué:", erreurGroq);
        reponseTexte = "Désolé, les services d'IA sont indisponibles pour le moment.";
      }
    }
    }

    return new Response(JSON.stringify({ error: "Ce Worker n'attend que des requêtes POST." }), { status: 405, headers });
  
    async function appelerGroq(prompt, env) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer   ${env.grok_api}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur Groq: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

    
  }
};
