# Registre des congés — Version partagée

Cette application permet à **2 personnes** de consulter et remplir un même registre des congés, via un serveur sécurisé avec authentification.

## Fonctionnalités

- Authentification par identifiant/mot de passe pour 2 utilisateurs
- Données partagées en temps réel (les modifications d'un utilisateur sont visibles par l'autre)
- Cache local hors-ligne (consulte les dernières données même sans connexion)
- Application installable sur mobile et ordinateur (PWA)
- Export CSV et sauvegarde JSON

## Déploiement rapide (gratuit) sur Render.com

1. **Créez un compte** sur https://render.com

2. **Créez un nouveau service Web** :
   - Connectez votre compte GitHub
   - Poussez ce dossier dans un dépôt GitHub
   - Sur Render : **New Web Service** → Connectez votre dépôt
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : Free

3. **Variables d'environnement** (dans Render → Environment) :
   ```
   NODE_ENV=production
   SESSION_SECRET=<générez une chaîne aléatoire>
   USER1_USERNAME=admin
   USER1_PASSWORD=<mot de passe pour l'utilisateur 1>
   USER2_USERNAME=user
   USER2_PASSWORD=<mot de passe pour l'utilisateur 2>
   ```

4. **Déployez** → Render vous donne une adresse `https://votre-app.onrender.com`

## Utilisateurs par défaut (à modifier impérativement)

| Identifiant | Mot de passe (défaut) |
|-------------|----------------------|
| `admin`     | `admin123`           |
| `user`      | `user123`            |

> ⚠️ **Important** : Changez les mots de passe via les variables d'environnement avant le déploiement.

## Structure du projet

```
conges-app-server/
├── server.js              # Serveur Express (API + authentification)
├── package.json           # Dépendances (express, express-session, dotenv)
├── render.yaml            # Configuration Render
├── .env.example           # Exemple de configuration locale
├── public/
│   ├── index.html         # Application modifiée (API partagée + cache local)
│   ├── login.html         # Page de connexion
│   ├── sw.js              # Service worker (hors-ligne)
│   ├── manifest.webmanifest
│   └── *.png              # Icônes
└── data/
    └── data.json          # Fichier de données partagées (créé automatiquement)
```

## Développement local

```bash
# 1. Copier et configurer
cp .env.example .env
nano .env   # Modifier les mots de passe et la clé secrète

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur
npm start
# → http://localhost:3000
```

## Utilisation

1. Ouvrir l'URL du serveur dans un navigateur
2. S'authentifier avec l'identifiant et le mot de passe
3. L'application fonctionne comme l'originale, mais les données sont partagées
4. Pour installer l'application (PWA) : cliquer sur l'icône d'installation dans la barre d'adresse
