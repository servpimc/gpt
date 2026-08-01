export async function appelerCloudflareAI(userMessage, systemPrompt, env) {
    const model = "@cf/meta/llama-4-scout-17b-16e-instruct"; 
    const aiResponse = await env.AI.run(model, {
          max_tokens: 4096,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ]
        });
        
        return "<img src='./assets/img/llama4.png'>"+ aiResponse.response || aiResponse.result;
}