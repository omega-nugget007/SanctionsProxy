const express = require('express');
const fetch   = require('node-fetch');
const cors    = require('cors');

const app = express();
app.use(cors({ origin: '*' }));

const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
const UNIVERSE_ID    = '10036418650';
const DATASTORE_NAME = 'StaffSanctions_v1';

// ── Route 1 : résoudre pseudo Roblox → UserID ─────────────────────────────────
// Appelée par le navigateur pour éviter le CORS de l'API Roblox
app.get('/api/resolve', async (req, res) => {
    const username = (req.query.username || '').trim();
    if (!username) return res.status(400).json({ error: 'username manquant' });

    try {
        const response = await fetch('https://users.roblox.com/v1/usernames/users', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ usernames: [username], excludeBannedUsers: false })
        });
        const data = await response.json();
        const user = data?.data?.[0];
        if (!user) return res.status(404).json({ error: 'Pseudo introuvable' });
        return res.json({ id: String(user.id), name: user.name });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ── Route 2 : récupérer les sanctions DCP depuis le DataStore ─────────────────
app.get('/api/sanctions', async (req, res) => {
    const userId = (req.query.userId || '').replace(/[^0-9]/g, '');
    if (!userId) return res.status(400).json({ error: 'userId manquant' });

    const key = `user_${userId}`;
    const url = `https://apis.roblox.com/datastores/v1/universes/${UNIVERSE_ID}/standard-datastores/datastore/entries/entry`
              + `?datastoreName=${encodeURIComponent(DATASTORE_NAME)}&entryKey=${encodeURIComponent(key)}`;

    try {
        const response = await fetch(url, {
            headers: { 'x-api-key': ROBLOX_API_KEY }
        });

        if (response.status === 404) return res.json({ name: '', sanctions: [] });
        if (!response.ok) {
            const errBody = await response.text();
            console.error(`Roblox API error ${response.status}:`, errBody);
            return res.status(502).json({ error: 'Erreur Roblox API', code: response.status, detail: errBody });
        }

        const data = await response.json();
        return res.json({ name: data.name || '', sanctions: data.sanctions || [] });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.send('DCP Sanctions Proxy — OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
