const express = require('express');
const app = express();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = 'kaholey2019';
const GITHUB_REPO  = 'Cong-s-app';
const DATA_PATH    = 'data/data.json';
const GITHUB_API   = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_PATH}`;

app.use(express.json({ limit: '20mb' }));

async function readData() {
  if (!GITHUB_TOKEN) return null;
  try {
    const res = await fetch(GITHUB_API, {
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'conges-app' }
    });
    if (!res.ok) return null;
    const json = await res.json();
    const content = Buffer.from(json.content, 'base64').toString('utf-8');
    return { data: JSON.parse(content), sha: json.sha };
  } catch { return null; }
}

async function writeData(data, sha) {
  if (!GITHUB_TOKEN) return false;
  try {
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const body = { message: 'Mise a jour donnees conges', content, sha };
    const res = await fetch(GITHUB_API, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'conges-app' },
      body: JSON.stringify(body)
    });
    return res.ok;
  } catch { return false; }
}

app.get('/api/data', async (_req, res) => {
  try {
    const result = await readData();
    return res.json(result ? result.data : null);
  } catch {
    return res.status(500).json({ error: 'Erreur de lecture' });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    const current = await readData();
    await writeData(req.body, current ? current.sha : null);
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Erreur d'ecriture" });
  }
});

module.exports = app;
