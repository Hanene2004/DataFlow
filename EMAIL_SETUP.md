# Configuration de l'envoi d'emails - MultiHub

## 📧 Configuration SMTP

Pour activer l'envoi réel d'emails, suivez ces étapes :

### 1. Créer le fichier `.env`

Copiez `.env.example` vers `.env` dans le dossier `backend/` :
```bash
cp backend/.env.example backend/.env
```

### 2. Configurer Gmail (Recommandé)

#### a. Activer l'authentification à 2 facteurs
1. Allez sur https://myaccount.google.com/security
2. Activez "Validation en deux étapes"

#### b. Générer un mot de passe d'application
1. Allez sur https://myaccount.google.com/apppasswords
2. Sélectionnez "Autre (nom personnalisé)"
3. Nommez-le "MultiHub"
4. Copiez le mot de passe généré (16 caractères)

#### c. Modifier le fichier `.env`
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # Le mot de passe d'application
EMAIL_FROM=votre-email@gmail.com
EMAIL_FROM_NAME=MultiHub Analytics
```

### 3. Autres fournisseurs SMTP

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=votre-api-key-sendgrid
```

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=votre-email@outlook.com
SMTP_PASSWORD=votre-mot-de-passe
```

### 4. Tester l'envoi

1. Redémarrez le backend :
```bash
python backend/main.py
```

2. Dans l'interface, allez sur Reports → Share Report
3. Entrez un email et envoyez
4. Vérifiez la boîte de réception

## 🔒 Sécurité

- ⚠️ **Ne commitez JAMAIS le fichier `.env`** (il est dans `.gitignore`)
- ✅ Utilisez des mots de passe d'application, pas votre mot de passe principal
- ✅ Limitez les permissions de l'application

## 📝 Template d'email

L'email envoyé contient :
- Header avec gradient MultiHub
- Nom du dataset
- Message personnalisé (optionnel)
- Liste des analyses incluses
- Footer avec branding

## ❓ Dépannage

**Erreur "SMTP credentials not configured"**
→ Vérifiez que `.env` existe et contient SMTP_USER et SMTP_PASSWORD

**Erreur "Authentication failed"**
→ Vérifiez que vous utilisez un mot de passe d'application (Gmail)

**Email non reçu**
→ Vérifiez les spams, attendez quelques minutes

**Mode simulation**
→ Si SMTP n'est pas configuré, l'app fonctionne en mode simulation (logs seulement)
