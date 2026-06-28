require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const DATA_DIR = path.join(os.tmpdir(), 'conges-data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// Creer le dossier data au demarrage
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Utilisateurs
const USERS = {};
USERS[process.env.USER1_USERNAME || 'admin']   = process.env.USER1_PASSWORD   || 'admin123';
USERS[process.env.USER2_USERNAME || 'user']    = process.env.USER2_PASSWORD   || 'user123';

// Middleware
app.use(express.json({ limit: '20mb' }));

// Session (MemoryStore pour Vercel)
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'changer-cette-cle-en-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production' || true,
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
  }
});
app.use(sessionMiddleware);

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '..', 'public')));

// Auth
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: 'Non authentifie' });
}

// API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Identifiants requis' });
  if (USERS[username] && USERS[username] === password) {
    req.session.user = username;
    return res.json({ success: true, user: username });
  }
  return res.status(401).json({ error: 'Identifiants incorrects' });
});

app.get('/api/session', requireAuth, (req, res) => {
  res.json({ authenticated: true, user: req.session.user });
});

app.get('/api/data', requireAuth, (_req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8').trim();
      return res.json(raw ? JSON.parse(raw) : null);
    }
    return res.json(null);
  } catch (e) {
    return res.status(500).json({ error: 'Erreur de lecture' });
  }
});

app.post('/api/data', requireAuth, (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: "Erreur d'ecriture" });
  }
});

// Dev : demarrer le serveur local
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur local: http://localhost:${PORT}`);
  });
}

// Export pour Vercel
module.exports = app;
