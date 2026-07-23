const express = require('express');
const app = express();

const CF_TOKEN = process.env.CF_API_TOKEN; // Récupéré sécurisé depuis Render
const CF_ACCOUNT = process.env.CF_ACCOUNT_ID;

app.get('/api/neurons', async (req, res) => {
  // Votre logique d'appel API Cloudflare ici
  // ...
});

app.listen(PORT, () => {
  console.log(`Serveur lancé`);
});   
