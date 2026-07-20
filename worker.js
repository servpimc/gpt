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
      try {
        const body = await request.json();
        userMessage = body.message || "Dis bonjour";
      } catch (e) {
        return new Response(JSON.stringify({ response: "Erreur : Format JSON invalide." }), { status: 400, headers });
      }

      try {
        const aiResponse = await env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", {
          max_tokens: 4096,
          messages: [
            { role: "system", content: "Tu es un agent IA de poche ultra-intelligent. Tu réponds toujours en français de la maniere la plus précise et concis possible." },
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