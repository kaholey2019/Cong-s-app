const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// Utilisateurs
const USERS = {};
USERS[process.env.USER1_USERNAME || 'admin']   = process.env.USER1_PASSWORD   || 'admin123';
USERS[process.env.USER2_USERNAME || 'user']    = process.env.USER2_PASSWORD   || 'user123';

// Token GitHub + infos du depot
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'kaholey2019';
const GITHUB_REPO  = process.env.GITHUB_REPO  || 'Cong-s-app';
const DATA_PATH    = 'data/data.json';
const GITHUB_API   = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_PATH}`;

app.use(express.json({ limit: '20mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'changer-cette-cle',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, maxAge: 24*60*60*1000, httpOnly: true, sameSite: 'lax' }
}));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '..', 'public')));

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: 'Non authentifie' });
}

// --- Stockage via GitHub API ---
async function readData() {
  if (!GITHUB_TOKEN) return null;
  const res = await fetch(GITHUB_API, {
    headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'conges-app' }
  });
  if (!res.ok) return null;
  const json = await res.json();
  const content = Buffer.from(json.content, 'base64').toString('utf-8');
  return { data: JSON.parse(content), sha: json.sha };
}

async function writeData(data, sha) {
  if (!GITHUB_TOKEN) return false;
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const body = { message: 'Mise a jour donnees conges', content, sha };
  const res = await fetch(GITHUB_API, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'conges-app' },
    body: JSON.stringify(body)
  });
  return res.ok;
}

// --- API Routes ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Identifiants requis' });
  if (USERS[username] && USERS[username] === password) {
    req.session.user = username;
    return res.json({ success: true, user: username });
  }
  return res.status(401).json({ error: 'Identifiants incorrects' });
});

app.post('/api/logout', requireAuth, (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/session', requireAuth, (req, res) => {
  res.json({ authenticated: true, user: req.session.user });
});

app.get('/api/data', requireAuth, async (_req, res) => {
  try {
    const result = await readData();
    return res.json(result ? result.data : null);
  } catch (e) {
    return res.status(500).json({ error: 'Erreur de lecture' });
  }
});

app.post('/api/data', requireAuth, async (req, res) => {
  try {
    const current = await readData();
    await writeData(req.body, current ? current.sha : null);
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: "Erreur d'ecriture" });
  }
});

app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  } else {
    res.redirect('/login.html');
  }
});

// Export for Vercel
module.exports = app;
