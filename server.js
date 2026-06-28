require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// ─── Utilisateurs (2 personnes via variables d'environnement) ───
const USERS = {};
USERS[process.env.USER1_USERNAME || 'admin']   = process.env.USER1_PASSWORD   || 'admin123';
USERS[process.env.USER2_USERNAME || 'user']    = process.env.USER2_PASSWORD   || 'user123';

// ─── Middleware ───
app.use(express.json({ limit: '20mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'changer-cette-cle-en-production-conges-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,  // 24 h
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// ─── Vérification d'authentification ───
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Non authentifié' });
  return res.redirect('/login.html');
}

// ─── Interception de l'index (protégé) ───
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html') return requireAuth(req, res, next);
  next();
});

// ─── Fichiers statiques (login, sw, icônes sont publics) ───
app.use(express.static(path.join(__dirname, 'public')));

// ─── API : connexion ───
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Identifiants requis' });
  if (USERS[username] && USERS[username] === password) {
    req.session.user = username;
    return res.json({ success: true, user: username });
  }
  return res.status(401).json({ error: 'Identifiants incorrects' });
});

// ─── API : déconnexion ───
app.post('/api/logout', requireAuth, (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ─── API : état session ───
app.get('/api/session', requireAuth, (req, res) => {
  res.json({ authenticated: true, user: req.session.user });
});

// ─── API : lire les données partagées ───
app.get('/api/data', requireAuth, (_req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8').trim();
      return res.json(raw ? JSON.parse(raw) : null);
    }
    return res.json(null);
  } catch (e) {
    console.error('Erreur lecture data.json:', e.message);
    return res.status(500).json({ error: 'Erreur de lecture des données' });
  }
});

// ─── API : sauvegarder les données partagées ───
app.post('/api/data', requireAuth, (req, res) => {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
    return res.json({ success: true });
  } catch (e) {
    console.error('Erreur écriture data.json:', e.message);
    return res.status(500).json({ error: "Erreur d'écriture des données" });
  }
});

// ─── Démarrage ───
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Registre des congés — serveur démarré`);
  console.log(`   URL     → http://0.0.0.0:${PORT}`);
  console.log(`   Fichier → ${DATA_FILE}`);
  console.log(`   Users   → ${Object.keys(USERS).join(', ')}`);
});
