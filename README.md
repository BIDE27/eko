# eko. — Plateforme Éducative Intelligente & Compétitions

> Application d'apprentissage gamifiée combinant quiz interactifs, compétitions en direct, boîte à outils pédagogique et tuteur IA multimodal (**Fumi**).

---

## 🏛️ Architecture Monorepo

Le projet est structuré en **Monorepo** moderne pour mutualiser la logique métier entre les plateformes Web et Mobile :

```
eko/
├── apps/
│   ├── web/                    # Application Web Next.js 15 (App Router, Tailwind CSS, SSR)
│   │   ├── app/                # Routes Next.js (/ et API /api/gemini)
│   │   └── components/         # Composants UI Web & interactifs
│   │
│   └── mobile/                 # Application Mobile React Native (Expo SDK 52 + Expo Router)
│       └── app/                # Écrans mobiles (Tabs: Accueil, Quiz, Fumi IA, Outils, Profil)
│
├── packages/
│   └── core/                   # Logique métier & types partagés (@eko/core)
│       ├── src/types/          # Modèles TypeScript stricts
│       ├── src/data/           # Jeux de données, badges, catégories
│       └── src/services/       # Clients IA Gemini et connecteurs
│
├── backend/                    # Serveur Express & Firebase Admin SDK (@eko/backend)
├── pnpm-workspace.yaml         # Configuration des espaces de travail
└── package.json                # Scripts globaux du monorepo
```

---

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** >= 20.x
- **pnpm** >= 10.x (ou npm)

### Installation des dépendances

```bash
pnpm install
```

### Lancement en développement

#### Application Web (Next.js)
```bash
pnpm dev:web
```
L'application web sera disponible sur `http://localhost:3000`.

#### Application Mobile (React Native / Expo)
```bash
pnpm dev:mobile
```
Scannez le QR code avec l'application **Expo Go** (Android/iOS) ou lancez sur émulateur.

---

## 🔑 Variables d'Environnement

Créez un fichier `.env.local` dans `apps/web/` :

```env
GEMINI_API_KEY=votre_cle_api_google_genai
```

---

## 🛠️ Scripts Disponibles

- `pnpm build:core` : Compile et vérifie les types du package partagé `@eko/core`.
- `pnpm build:web` : Génère le build de production optimisé Next.js.
- `pnpm dev:web` : Lance le serveur de développement Next.js.
- `pnpm dev:mobile` : Démarre le serveur Expo pour l'application mobile.
