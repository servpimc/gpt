export async function appelerGemini(userMessage, systemPrompt, env) {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.gemini_api}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur Gemini (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return "<img class='logo-model' src='./assets/img/gemini.svg'>" + data.choices[0].message.content;
}