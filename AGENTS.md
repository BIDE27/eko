<!-- BEGIN:nextjs-agent-rules -->
# Spécificités Next.js 15 (App Router)

Cette version utilise les conventions modernes de Next.js 15 (App Router, Server Actions, Route Handlers, composants Client avec `'use client'`, importations dynamiques pour le Canvas/Konva avec `ssr: false`). Consultez la documentation officielle avant toute écriture de code et respectez les avis de dépréciation.
<!-- END:nextjs-agent-rules -->

# Règle de Langue pour les Commits
Tous les messages de commit (`git commit`) pour ce projet doivent être rédigés en français (ex: `feat: synchronisation de l'outil calculatrice sur mobile et web`, `fix: correction du débordement tactile sur l'écran quiz`).

# Déploiement Continu & Synchronisation GitHub
À chaque fois qu'un travail est accompli ou qu'une étape est validée, veiller systématiquement à commiter et pousser (`git push origin main`) les modifications sur le dépôt GitHub ([https://github.com/BIDE27/eko.git](https://github.com/BIDE27/eko.git)) pour maintenir la synchronisation et permettre les déploiements continus.

---

# Règle d'Or : Parité et Synchronisation Automatique Web (Next.js) & Mobile (React Native)

**Toute modification, tout ajout d'écran, de composant, d'outil, de modale, d'icône ou d'amélioration logique DOIT ÊTRE SYSTÉMATIQUEMENT RÉPERCUTÉ EN PARITÉ SUR LES DEUX PLATEFORMES : L'APPLICATION WEB (`apps/web`) ET L'APPLICATION MOBILE (`apps/mobile`).**

### Directives d'implémentation de la Parité :
1. **Socle Partagé dans `@eko/core` (`packages/core/`)** :
   - Tout modèle de données, interface TypeScript, liste de constantes (catégories de quiz, badges, niveaux, dictées) ou fonction utilitaire doit être défini dans `packages/core`.
   - Ne jamais dupliquer les types ou les données mockées entre `apps/web` et `apps/mobile` : consommer systématiquement `@eko/core`.
2. **Double Implémentation Systématique** :
   - Dès qu'un nouvel outil (ex: Calculatrice, Conjugateur, Dictionnaire, Tableau blanc, Dictée) est créé ou enrichi sur le Web, créer ou mettre à jour l'écran et les composants équivalents correspondants sur l'application mobile React Native dans `apps/mobile/app/` — et réciproquement.
   - Les deux plateformes doivent partager la même ergonomie, les mêmes libellés, la même richesse fonctionnelle et les mêmes flux utilisateur.
3. **Adaptation Native vs Web** :
   - Sur le Web : exploiter Tailwind CSS, les composants interactifs React 19 et les Route Handlers Next.js (`/api/gemini`).
   - Sur Mobile : exploiter React Native (`View`, `Text`, `TouchableOpacity`, `StyleSheet` / NativeWind), Expo Router et les APIs natives (ex: `expo-av` pour l'audio des dictées, retour haptique, safe areas).

---

# Règle Absolue : Conception « Mobile-First » Systématique

Toute fonctionnalité, interface, modale, tableau, formulaire ou outil développé sur ce projet DOIT IMPÉRATIVEMENT être pensé, conçu et testé **en premier lieu pour le mobile** (écrans de 320px à 414px) avant d'être adapté pour tablette et desktop.

### Directives d'implémentation Mobile-First :
1. **Zéro Débordement Horizontal (Zero Horizontal Overflow)** :
   - Aucun texte, bouton, badge, formule mathématique ou champ de saisie ne doit dépasser ou être rogné par le bord de l'écran.
   - Sur tout conteneur flex horizontal (`flex`), assigner systématiquement `min-w-0` sur les enfants flexibles (`flex-1 min-w-0`) pour empêcher les textes longs ou badges de forcer un débordement.
   - Dispositions empilées par défaut sur mobile (`flex flex-col sm:flex-row`), notamment pour les formulaires, cartes de matchs et boutons d'action.
2. **Cibles Tactiles Conformes (Touch Targets >= 44px)** :
   - Tous les boutons, icônes interactives et cartes de sélection doivent respecter une zone tactile minimale de 44x44px (Apple HIG & Android Material).
   - Sur mobile, les boutons d'action principaux doivent occuper toute la largeur disponible (`w-full sm:w-auto`) pour être actionnables confortablement à une main.
3. **Optimisation de l'Espace Utile (Viewport Real Estate)** :
   - Espacements adaptatifs : paddings compacts sur smartphone (`p-3` à `p-4`) et plus aérés sur grand écran (`sm:p-6 md:p-8`).
   - Pour les tiroirs et modales, borner la hauteur à `height: min(92dvh, ...)` avec en-tête et pied fixes (`shrink-0`) et corps défilant (`flex-1 min-h-0 overflow-y-auto overscroll-contain`).

---

# Règle Fondamentale : Sécurité Maximale (Zero-Trust & Sanctuarisation des Clés)

La sécurité est une priorité non négociable, en particulier pour une application éducative intégrant des modèles d'IA et de la gamification :

### Directives d'implémentation Sécurité :
1. **Sanctuarisation de la Clé API Gemini** :
   - Ne JAMAIS exposer la clé `GEMINI_API_KEY` ou `API_KEY` dans le bundle client web ni dans le code mobile.
   - Les requêtes Gemini côté Web doivent transiter par le Route Handler Next.js [`/api/gemini`](file:///c:/Users/HP/.gemini/antigravity/scratch/eko/apps/web/app/api/gemini/route.ts).
   - L'application mobile doit également s'adresser à cette route API sécurisée (ou au serveur backend) plutôt que d'embarquer une clé d'API privée dans son binaire APK/IPA.
2. **Validation Stricte des Entrées (Input Sanitization)** :
   - Assainir systématiquement les prompts saisis par l'utilisateur (questions au tuteur Fumi, paramètres de génération de quiz) pour éviter les injections de prompt et les dépassements de contexte.
3. **Secrets Firebase & Base de Données** :
   - Conserver les clés de compte de service Firebase Admin (`FIREBASE_KEY`) strictement côté serveur dans `backend/`.
   - Utiliser des règles Firestore hermétiques pour isoler les données privées des utilisateurs et empêcher la falsification des scores et des soldes d'XP.

---

# Règle de Compatibilité Universelle : iOS (Apple), Android & Tous Navigateurs

Chaque composant ou style développé DOIT fonctionner sans faille sur **iOS (Safari / WebKit sur iPhone et iPad)**, **Android (Chrome, Samsung Internet)** et sur **tous les navigateurs desktop**.

### 1. Directives Strictes pour iOS & Safari (WebKit)
1. **Hauteurs d'écran (Viewport)** :
   - Toujours utiliser `100dvh` (Dynamic Viewport Height) pour tenir compte de la barre d'adresse rétractable d'iOS.
   - Respecter les zones d'évitement d'encoche : `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`.
2. **Empêcher le zoom automatique intempestif d'iOS** :
   - Tout champ `<input>`, `<textarea>` ou `<select>` DOIT impérativement posséder une taille de police minimale de `16px` (`text-base` ou `text-[16px]`). En dessous de 16px, Safari zoome automatiquement au focus, déformant l'interface.
3. **Gestion Audio & Synthèse Vocale (Dictées & Fumi)** :
   - Conformément aux politiques strictes d'Apple, aucune lecture audio ni `AudioContext` ne peut démarrer sans un geste direct de l'utilisateur (clic / tap tactile).
4. **Gestion des Dates (Crash JavaScript Safari)** :
   - Ne jamais faire `new Date("YYYY-MM-DD HH:mm:ss")`. Toujours utiliser le standard ISO (`YYYY-MM-DDTHH:mm:ssZ`).
5. **Fluidité Tactile** :
   - Ajouter `touch-action: manipulation` sur les boutons cliquables pour éliminer la latence tactile de 300ms sur iOS.
   - Activer `-webkit-overflow-scrolling: touch;` sur les conteneurs défilants.

### 2. Directives pour Android
1. **Gestion du Clavier Virtuel** :
   - Prendre en compte le redimensionnement du viewport lors de l'ouverture du clavier afin que les zones de saisie et boutons d'envoi restent visibles.
2. **Bouton Retour Matériel (Hardware Back Button)** :
   - Fermer les modales, tiroirs et menus ouverts lors de la pression sur le bouton retour avant de quitter l'écran.

---

# Spécificités Fonctionnelles & Modules d'eko.

Chaque module d'eko doit respecter des standards d'excellence pédagogique :

1. **Tuteur IA Fumi (`FumiAssistant`)** :
   - Incarne un tuteur bienveillant, clair et pédagogique.
   - Rendu structuré : supporter le markdown, le format LaTeX pour les formules mathématiques et les suggestions visuelles (figures géométriques, diagrammes).
2. **Moteur de Quiz & Compétitions (`QuizIndividuel`, `Competitions`)** :
   - Gestion stricte des minuteurs avec synchronisation sans dérive.
   - Feedback immédiat, animations douces de réussite et affichage d'explications détaillées étape par étape.
3. **Tableau Interactif (`TableauInteractif`)** :
   - Côté Web : géré via HTML5 Canvas (Konva / `react-konva`) avec import dynamique (`ssr: false`).
   - Côté Mobile : prévoir l'intégration d'un canevas tactile fluide (ex: `@shopify/react-native-skia` ou WebView dédiée).
4. **Outils Pédagogiques & Linguistiques** :
   - Calculatrice scientifique : prise en charge des opérations avancées et affichage propre de l'historique.
   - Livre de dictées : lecture audio claire avec réglage de vitesse et correction interactive.
   - Dictionnaires & Conjugaison : présentation claire des définitions, exemples et tableaux de temps verbaux.

---

# Checklist Systématique avant chaque Validation & Commit

Avant de finaliser une tâche et de créer le commit :
1. ✅ **Vérification `@eko/core`** : `pnpm build:core` (ou `pnpm --filter @eko/core typecheck`) s'exécute avec 0 erreur.
2. ✅ **Vérification `@eko/web`** : `pnpm build:web` compile sans avertissement bloquant ni erreur de type.
3. ✅ **Parité Validée** : Les modifications ou ajouts sont présents et synchronisés sur les deux applications (`apps/web` et `apps/mobile`).
4. ✅ **Mobile-First & Sécurité** : Pas de débordement horizontal, touch targets >= 44px, zéro clé privée exposée.
5. ✅ **Commit & Push** : Message de commit clair rédigé en français, poussé sur `origin main`.
