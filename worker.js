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
        historiqueTexte = body.historique || ""; // On récupère l'historique envoyé par le front-end
      } catch (e) {
        return new Response(JSON.stringify({ response: "Erreur : Format JSON invalide." }), { status: 400, headers });
      }

      // Construction du message système avec l'historique s'il existe
      let systemPrompt = "Tu es un agent IA de poche ultra-intelligent. Tu réponds toujours en français de la manière la plus précise et concise possible.";
      
      if (historiqueTexte.trim() !== "") {
        systemPrompt += " " + historiqueTexte;
      }

      try {
        const aiResponse = await env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", {
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

      } catch (error) {
        return new Response(JSON.stringify({ response: "Erreur IA : " + error.message }), { headers });
      }
    }

    return new Response(JSON.stringify({ error: "Ce Worker n'attend que des requêtes POST." }), { status: 405, headers });
  }
};
