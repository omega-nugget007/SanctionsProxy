const express = require('express');
const fetch   = require('node-fetch');
const cors    = require('cors');
 
const app = express();
 
// ⚠️ Remplace par l'URL de ton site (ex: "https://monsite.com")
// Ou laisse "*" pour tester
app.use(cors({ origin: '*' }));
 
const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY; // défini dans Render Dashboard
const UNIVERSE_ID    = '10036418650';
const DATASTORE_NAME = 'StaffSanctions_v1';
 
app.get('/api/sanctions', async (req, res) => {
    const userId = (req.query.userId || '').replace(/[^0-9]/g, '');
 
    if (!userId) {
        return res.status(400).json({ error: 'userId manquant' });
    }
 
    const key = `user_${userId}`;
    const url = `https://apis.roblox.com/datastores/v1/universes/${UNIVERSE_ID}/standard-datastores/datastore/entries/entry`
              + `?datastoreName=${encodeURIComponent(DATASTORE_NAME)}&entryKey=${encodeURIComponent(key)}`;
 
    try {
        const response = await fetch(url, {
            headers: { 'x-api-key': ROBLOX_API_KEY }
        });
 
        if (response.status === 404) {
            return res.json({ name: '', sanctions: [] });
        }
 
        if (!response.ok) {
            return res.status(502).json({ error: 'Erreur Roblox API', code: response.status });
        }
 
        const data = await response.json();
        return res.json({
            name:      data.name      || '',
            sanctions: data.sanctions || []
        });
 
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
});
 
// Health check pour Render
app.get('/', (req, res) => res.send('DCP Sanctions Proxy — OK'));
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
 
