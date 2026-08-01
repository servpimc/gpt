export async function appelerCloudflareAI(userMessage, systemPrompt, env) {
    const aiResponse = await env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", {
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
          textResult = await appelerGroq(userMessage, systemPrompt, env);
        }
}