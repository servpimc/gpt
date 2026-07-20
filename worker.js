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

      let systemPrompt = "Tu es un développeur Full-Stack Senior expert en JavaScript, Python, HTML/CSS et Cloudflare Workers. Tu donnes des explications claires et écris toujours du code propre, optimisé, sécurisé et directement fonctionnel.";
      
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
