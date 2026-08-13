export async function appelerOpen(userMessage, systemPrompt, env) {
  if (!env.openrouter_api) {
    throw new Error("La variable 'openrouter_api' n'est pas définie dans Cloudflare.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.openrouter_api}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur OpenRouter (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (data.choices && data.choices[0]?.message?.content) {
    return "<img class='logo-model' src='./assets/img/llama3.png'>" + data.choices[0].message.content;
  }

  throw new Error("Réponse vide de la part d'OpenRouter.");
}