export async function saveChatIa(userEmail, chatId, role, content, env) {
  await env.DB.prepare(
    "INSERT INTO chat_ia (id_user, chat_id, role, content) VALUES ((select id from users where email=?),?,?,?)"
  ).bind(userEmail, chatId, role, content).run();
}

export async function saveChatUser(userEmail, content, env) {
  try {
    const result = await env.DB.prepare("INSERT INTO chat_users (id_user, content) VALUES ((SELECT id FROM users WHERE email = ?), ?)").bind(userEmail, content).run();
    return result;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'utilisateur :', error);
    throw error;
  }
}

export async function loadChat(userEmail, chatId, env, limit = null) {
  let query = "SELECT role, content FROM chat_ia WHERE id_user = (select id from users where email=?) AND chat_id = ? ORDER BY id DESC";
  if (limit) query += ` LIMIT ${parseInt(limit)}`;
  const { results } = await env.DB.prepare(query).bind(userEmail, chatId).all();
  return results.reverse();
}

export async function loadChatUser(env) {
  let query = "SELECT email, content FROM chat_users INNER JOIN users ON users.id = chat_users.id_user ORDER BY chat_users.id ASC;";
  const { results } = await env.DB.prepare(query).all();
  return results;
}

export async function listerConversations(userEmail, env) {
  const { results } = await env.DB.prepare(`
    SELECT chat_id, MIN(created_at) as date_creation, COALESCE(title, SUBSTR((SELECT content FROM chat_ia h2 WHERE h2.chat_id = chat_ia.chat_id AND h2.role = 'user' ORDER BY id ASC LIMIT 1),1, 30)||"...") as titre
    FROM chat_ia 
    WHERE id_user = (select id from users where email=?)
    GROUP BY chat_id 
    ORDER BY date_creation DESC
  `).bind(userEmail).all();

  return results;
}

export async function renameConversation(title, chatId, userEmail, env) {
  const { results } = await env.DB.prepare(`
    update chat_ia 
    set title = ?
    where chat_ia.chat_id = ? 
    AND id_user = (select id from users where email=?);
  `).bind(title, chatId, userEmail).all();

  return results;
}

export async function delConversation(userEmail, chatId, env) {
  const { results } = await env.DB.prepare(`
    delete from chat_ia 
    where chat_id = ? 
    and id_user = (select id from users where email=?);
  `).bind( chatId, userEmail).run();

  return results;
}