export async function appelerGemini(userMessage, systemPrompt, env) {
  if (!env.gemini_api) {
    throw new Error("La variable 'gemini_api' n'est pas définie dans Cloudflare.");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${env.gemini_api}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur Gemini (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
    return "<img class='logo-model' src='./assets/img/gemini.svg'>" + data.candidates[0].content.parts[0].text;
  }

  throw new Error("Réponse vide de la part de Gemini.");
}
