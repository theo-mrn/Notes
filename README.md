# 🚀 Billing Platform - Plateforme de Gestion de Projets et Productivité

Une plateforme complète de gestion de projets avec des fonctionnalités de productivité avancées, incluant un système de gamification, un éditeur de texte riche, des tableaux Kanban, et bien plus encore.

## ✨ Fonctionnalités Principales

### 🏢 Gestion des Organisations
- **Multi-organisation** : Créez et gérez plusieurs organisations
- **Système d'invitations** : Invitez des membres par email avec gestion des rôles
- **Rôles et permissions** : OWNER, ADMIN, MEMBER, VIEWER
- **Gestion des utilisateurs** : Affectation et gestion des membres

### 📊 Gestion de Projets
- **Projets modulaires** : Créez des projets avec des modules personnalisables
- **Modules activables** : Billing, Analytics, CRM, etc.
- **Organisation par dossiers** : Structure hiérarchique pour vos contenus
- **Tableaux de bord** : Visualisation de l'avancement des projets

### 📋 Tableaux Kanban
- **Tableaux personnalisables** : Créez des tableaux Kanban pour vos projets
- **Statuts et groupes** : Organisez vos tâches avec des statuts et groupes personnalisés
- **Tâches récurrentes** : Support des tâches quotidiennes, hebdomadaires, mensuelles
- **Priorisation** : Niveaux de priorité (LOW, MEDIUM, HIGH)
- **Suivi du temps** : Enregistrement de la durée réelle des tâches
- **Assignation** : Affectez des tâches aux membres de l'équipe

### 🎮 Gamification
- **Système XP** : Gagnez de l'expérience en complétant des tâches
- **Niveaux** : Progression par niveaux pour motiver les utilisateurs
- **Suivi des accomplissements** : Historique des complétions de tâches

### ⏱️ Pomodoro Timer
- **Sessions de travail** : Timer Pomodoro intégré
- **Suivi des sessions** : Historique de vos sessions de travail et pauses
- **Statistiques** : Analysez votre productivité

### 🎯 Flashcards & Apprentissage
- **Decks personnalisés** : Créez des decks de flashcards par projet
- **Répétition espacée** : Algorithme intelligent pour optimiser l'apprentissage
- **Suivi de progression** : Suivez vos progrès d'apprentissage

### 📝 Éditeur de Texte Riche (Tiptap)
- **Éditeur avancé** : Éditeur WYSIWYG complet avec Tiptap
- **Formatage riche** : Gras, italique, souligné, couleurs, surlignage
- **Listes et tableaux** : Support des listes à puces, numérotées et cases à cocher
- **Images et liens** : Intégration d'images et de liens
- **Indice/exposant** : Support pour les notations scientifiques
- **Typographie** : Typographie intelligente
- **Organisation** : Dossiers et sous-dossiers pour vos documents

### 🎨 Excalidraw Integration
- **Tableaux blancs** : Créez des schémas et diagrammes
- **Organisation** : Rangez vos boards dans des dossiers
- **Collaboration** : Partagez vos dessins avec votre équipe

### 💰 Gestion Financière
- **Suivi des revenus** : Enregistrez vos sources de revenus
- **Abonnements** : Gérez vos abonnements (mensuel, trimestriel, semestriel, annuel)
- **Catégorisation** : Organisez vos finances par catégorie
- **Dates de renouvellement** : Ne manquez plus aucun renouvellement

## 🛠️ Technologies Utilisées

### Frontend
- **Next.js 15** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utility-first
- **Radix UI** - Composants accessibles et personnalisables
- **Framer Motion** - Animations fluides
- **Tiptap** - Éditeur de texte riche
- **Excalidraw** - Tableaux blancs et diagrammes
- **Recharts** - Graphiques et visualisations

### Backend
- **Next.js API Routes** - API serverless
- **NextAuth.js** - Authentification
- **Prisma** - ORM pour PostgreSQL
- **PostgreSQL** - Base de données relationnelle

### Gestion d'État
- **Zustand** - State management léger
- **React Context** - Gestion de contexte (Organizations, Music)

### Utilitaires
- **@dnd-kit** - Drag and drop
- **date-fns** - Manipulation de dates
- **bcryptjs** - Hashage de mots de passe
- **jsPDF & @react-pdf/renderer** - Génération de PDF
- **Resend** - Envoi d'emails

## 📦 Installation

### Prérequis
- Node.js 18+ 
- PostgreSQL
- npm ou pnpm

### Étapes d'installation

1. **Clonez le repository**
```bash
git clone <repository-url>
cd Billing_platform
```

2. **Installez les dépendances**
```bash
npm install
# ou
pnpm install
```

3. **Configurez les variables d'environnement**

Créez un fichier `.env` à la racine du projet :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/billing_platform"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-genere"

# Email (Resend)
RESEND_API_KEY="votre-cle-api-resend"

# Autres configurations
NODE_ENV="development"
```

4. **Configurez la base de données**
```bash
# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma migrate deploy

# (Optionnel) Seed la base de données
npx prisma db seed
```

5. **Lancez le serveur de développement**
```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🐳 Docker

Le projet inclut une configuration Docker pour un déploiement facile.

```bash
# Construire et lancer les conteneurs
docker-compose up -d

# Arrêter les conteneurs
docker-compose down
```

## 📧 Configuration des Emails

Le projet utilise React Email pour les templates d'emails.

### Développement des templates email

```bash
cd react-email-starter
npm install
npm run dev
```

Les templates sont disponibles dans `react-email-starter/emails/` :
- `vercel-invite-user.tsx` - Invitation d'utilisateur
- `stripe-welcome.tsx` - Email de bienvenue
- Et plus...

## 🗂️ Structure du Projet

```
Billing_platform/
├── src/
│   ├── app/                    # Pages et routes Next.js
│   │   ├── (auth)/            # Pages d'authentification
│   │   ├── api/               # API Routes
│   │   ├── actions/           # Server Actions
│   │   ├── projects/          # Pages de gestion de projets
│   │   ├── organization/      # Gestion des organisations
│   │   └── ...
│   ├── components/            # Composants React
│   │   ├── ui/               # Composants UI (shadcn/ui)
│   │   ├── tiptap-ui/        # Interface de l'éditeur Tiptap
│   │   ├── sections/         # Sections de la landing page
│   │   └── ...
│   ├── lib/                   # Utilitaires
│   │   ├── auth.ts           # Configuration NextAuth
│   │   ├── prisma.ts         # Client Prisma
│   │   └── utils.ts          # Fonctions utilitaires
│   ├── hooks/                 # Custom React Hooks
│   ├── contexts/              # React Contexts
│   ├── store/                 # Zustand stores
│   └── types/                 # Types TypeScript
├── prisma/
│   ├── schema.prisma         # Schéma de base de données
│   └── migrations/           # Migrations Prisma
├── public/                    # Fichiers statiques
└── react-email-starter/      # Templates d'emails
```

## 🔐 Authentification

Le projet utilise NextAuth.js avec support pour :
- **Credentials** : Authentification par email/mot de passe
- **OAuth** : Prêt pour Google, GitHub, etc.
- **Sessions** : Gestion sécurisée des sessions

## 📊 Base de Données

Le schéma Prisma inclut les modèles suivants :
- `User` - Utilisateurs avec système XP
- `Organization` - Organisations
- `Project` - Projets
- `KanbanBoard`, `KanbanTask` - Système Kanban
- `RichTextContent` - Documents
- `Flashcard`, `Deck` - Système d'apprentissage
- `Subscription`, `Income` - Gestion financière
- `PomodoroSession` - Suivi Pomodoro
- Et plus...

## 🚀 Déploiement

### Vercel (Recommandé)

1. Connectez votre repository à Vercel
2. Configurez les variables d'environnement
3. Déployez automatiquement


## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev          # Lance le serveur de développement

# Production
npm run build        # Compile l'application pour la production
npm run start        # Lance le serveur en production

# Base de données
npx prisma studio    # Interface graphique pour la base de données
npx prisma migrate dev    # Créer une nouvelle migration

# Linting
npm run lint         # Vérifie le code avec ESLint

# Email templates
npm run email        # Lance le serveur de développement des emails
```

## 📝 Conventions de Code

- **TypeScript** : Utilisez TypeScript pour tous les nouveaux fichiers
- **Composants** : Utilisez des composants fonctionnels avec hooks
- **Styling** : Utilisez Tailwind CSS et évitez le CSS personnalisé sauf nécessité
- **Server Components** : Privilégiez les Server Components de Next.js quand possible
- **API Routes** : Utilisez les Server Actions pour les mutations

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. Forkez le projet
2. Créez une branche pour votre feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request



