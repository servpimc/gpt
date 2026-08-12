import { GoogleGenAI } from '@google/genai';

export async function appelerGemini(userMessage, systemPrompt, env) {
  if (!env.gemini_api) {
    throw new Error("La variable 'gemini_api' n'est pas définie dans Cloudflare.");
  }

  const client = new GoogleGenAI({ apiKey: env.gemini_api });

  const interaction = await client.interactions.create({
    model: 'gemini-2.5-flash-lite',
    input: userMessage,
    systemInstruction: systemPrompt
  });

  let responseText = "";

  for (const step of interaction.steps) {
    if (step.type === 'model_output' && step.content?.[0]?.text) {
      responseText += step.content[0].text;
    }
  }

  if (responseText) {
    return "<img class='logo-model' src='./assets/img/gemini.svg'>" + responseText;
  }

  throw new Error("Réponse vide de la part de Gemini.");
}
