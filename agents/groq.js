export async function appelerGroq(userMessage, systemPrompt, env) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.groq_api}`,
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