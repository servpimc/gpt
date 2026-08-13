export async function enregistrerMessage(userEmail, chatId, role, content, env) {
  await env.DB.prepare(
    "INSERT INTO history (user_email, chat_id, role, content) VALUES (?, ?, ?, ?)"
  ).bind(userEmail, chatId, role, content).run();
}

export async function obtenirHistoriqueChat(userEmail, chatId, limit = 6, env) {
  const { results } = await env.DB.prepare(
    "SELECT role, content FROM history WHERE user_email = ? AND chat_id = ? ORDER BY id DESC LIMIT ?"
  ).bind(userEmail, chatId, limit).all();

  return results.reverse();
}

export async function listerConversations(userEmail, env) {
  const { results } = await env.DB.prepare(`
    SELECT chat_id, MIN(created_at) as date_creation, SUBSTR((SELECT content FROM history h2 WHERE h2.chat_id = history.chat_id AND h2.role = 'user' ORDER BY id ASC LIMIT 1),1, 30) as titre
    FROM history 
    WHERE user_email = ? 
    GROUP BY chat_id 
    ORDER BY date_creation DESC
  `).bind(userEmail).all();

  return results;
}