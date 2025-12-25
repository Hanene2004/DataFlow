🌐 Master Documentation : MultiHub Analytics (Full Stack)
Ce document est la référence ultime pour comprendre chaque aspect technique, mathématique et fonctionnel du projet MultiHub Analytics.

🏗️ 1. Architecture du Projet
Le projet est structuré comme une solution d'analyse de données de bout en bout.

📁 Structure des Répertoires
/src (Frontend)
pages/ : Les 10 vues principales (Dashboard, Analysis, Cleaning, etc.).
components/ : Plus de 40 composants réutilisables (Charts, Modals, Filters).
context/ : Gestion du State global (DataContext, NotificationContext).
utils/ : Algorithmes mathématiques (Corrélation, Régression, Export).
lib/ : Configurations externes (Supabase Client).
/backend (Calcul Scientifique)
main.py : Serveur FastAPI et routage.
processing.py : Moteur de parsing Pandas et statistiques descriptives.
ml.py : Modèles prédictifs Scikit-Learn.
email_utils.py : Gestion des envois de logs par mail (SMTP).
📦 2. Dépendances Techniques (Stack)
⚛️ Frontend (React/TypeScript)
Visualisation : recharts (graphiques légers), plotly.js (visualisation complexe), xlsx (parsing Excel client).
UI/UX : framer-motion (animations), lucide-react (icônes), react-hot-toast (alertes), @radix-ui/react-dialog (modales accessibles).
IA de Texte : @google/generative-ai (Gemini API pour les résumés).
Export : html2canvas & jspdf (moteur de génération de rapports PDF).
Database : @supabase/supabase-js (Logs & Partage).
🐍 Backend (Python)
Serveur : fastapi, uvicorn, python-multipart.
Data Science : pandas (manipulation), numpy (calculs), scikit-learn (modèles IA).
Système : python-dotenv (config), aiosmtplib (mail asynchrone pour les logs).
🧮 3. Algorithmes & Logique Mathématique
L'application ne se contente pas d'afficher des données, elle les "comprend" :

Détection de Type Automatique (detectColumnType) :

Analyse un échantillon de 500 lignes.
Si >80% des valeurs sont numériques -> Type Numeric.
Si >80% sont des dates -> Type Date.
Sinon -> Type Text.
Corrélation de Pearson (calculateCorrelation) :

Calcul du coefficient $r$ entre toutes les paires numériques.
Formule : $\text{cov}(X,Y) / (\sigma_X \sigma_Y)$.
Régression Multivariée Native (runMultivariateRegression) :

Utilise la Descente de Gradient (Gradient Descent) avec 100 itérations et un Learning Rate de 0.1.
Effectue une Normalisation Z-Score automatique pour éviter que les variables à grande échelle (ex: Salaire) n'écrasent les petites (ex: Âge).
Calcule le score R² et le MSE (Mean Squared Error).
Nettoyage Intelligent :

Fuzzy Matching pour la déduplication.
Imputation par la moyenne $\mu$ ou médiane $M$.
🛠️ 4. Micro-Détails & Fonctionnalités Avancées
🚀 Performance & UX
Single-Pass Stats : Les statistiques pour 50 colonnes sont calculées en une seule boucle sur le dataset pour une performance maximale.
Skeleton States : Chaque vue d'analyse possède un état "Squelette" qui simule le contenu pendant le chargement des calculs backend.
Early Warning System : Un script scanne le dataset à l'upload et affiche des badges "Low Quality" ou "Outliers Detected" immédiatement sur le dashboard.
🤖 Intelligence Artificielle
AI Insights : Un expert virtuel commente vos graphiques (ex: "Attention, la corrélation entre X et Y est anormalement haute, vérifiez s'il s'agit d'une redondance").
What-If Sandbox : Un outil de simulation dynamique. Vous pouvez faire glisser un curseur pour changer une valeur d'entrée et voir instantanément la prédiction de l'IA changer sur le graphique d'à côté.
🔗 Partage & Historique
UUID Sharing : Le partage génère un lien sécurisé type .../share/f47ac10b... qui rend le dashboard anonyme et non-modifiable pour les tiers.
Time Machine : Un module permettant de voir l'état du dataset à T-1 (avant une suppression massive de colonnes par exemple).
📋 5. Guide de Lancement (L'essentiel)
Étape 1 : Le Serveur (Python)
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python main.py
Étape 2 : L'Interface (React)
npm install
npm run dev
MultiHub Analytics est une fusion entre la rigueur statistique de Python et l'agilité interactive de React, offrant une interface de "Data Concierge" unique au monde.
