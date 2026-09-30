import type { Chat, Content } from '@google/genai';

// FIX: Removed self-import of Page which caused a circular dependency.
export enum Page {
  Accueil = 'Accueil',
  Quiz = 'Quiz Individuel',
  Concours = 'Concours',
  Tournois = 'Tournois',
  Matchs = 'Matchs',
  Notifications = 'Notifications',
  Fumi = 'Fumi',
  Profile = 'Profile',
  Favoris = 'Favoris',
  Parametres = 'Paramètres',
  Objectifs = 'Objectifs',
  CreerQuiz = 'Créer un Quiz',
  Compétitions = 'Compétitions',
  Outils = 'Outils',
  // New tool pages
  Calculatrice = 'Calculatrice',
  DictionnaireFrancais = 'Dictionnaire Français',
  DictionnaireFrEn = 'Dictionnaire Français-Anglais',
  DictionnaireFrFon = 'Dictionnaire Français-Fon',
  ConjugaisonFr = 'Conjugaison Française',
  ConjugaisonEn = 'Conjugaison Anglaise',
  FormulesMaths = 'Formules de Maths',
  FormulesPhysique = 'Formules de Physique-Chimie',
  TableMultiplication = 'Table de Multiplication',
  LivreDictees = 'Livre de Dictées',
  TableauInteractif = 'Tableau Interactif',
}

export interface LeaderboardEntry {
  rank: number;
  player: Player;
  score: number;
}

export interface Contest {
  id: number;
  title: string;
  subject: string;
  level: string;
  prize: number;
  participants: string;
  entryFee: number;
  registrationEndDate: Date;
  status: 'upcoming' | 'live' | 'finished';
  type: 'gratuit' | 'payant';
  estimatedWinnings?: {
    first: number;
    second: number;
    third: number;
  };
  leaderboard?: LeaderboardEntry[];
}

export interface Player {
    name: string;
    avatar: string;
    bio?: string;
    stats?: {
        rank: number;
        totalWinnings: number;
        matchesPlayed: number;
        winRate: number; // as a percentage, e.g., 75
    };
    badges?: string[]; // Array of badge IDs
}

export interface PlayerPerformance {
    correctAnswers: number;
    totalQuestions: number;
    completionTime: number; // in seconds
}

export interface Match {
    id: number;
    subject: string;
    level: string;
    player1: Player;
    player2: Player | { name: 'Adversaire', avatar: '' };
    status: 'challenge' | 'upcoming' | 'live' | 'finished';
    winner?: 'player1' | 'player2';
    time: string;
    date: string;
    wager: number;
    performance?: {
        player1: PlayerPerformance;
        player2: PlayerPerformance;
    };
}

export interface QuizQuestion {
    id: number;
    category: string;
    question: string;
    options?: string[];
    answer: string;
    difficulty: 'Facile' | 'Moyen' | 'Difficile';
}

export interface Notification {
    id: number;
    type: 'challenge' | 'quiz' | 'contest' | 'win' | 'loss' | 'match';
    text: string;
    time: string;
    read: boolean;
    matchId?: number;
}

export interface ChatMessage {
  sender: 'user' | 'fumi';
  text: string;
  id: string;
  attachment?: {
    name: string;
    dataUrl: string;
    mimeType: string;
  };
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: 'star' | 'medal' | 'trophy';
}

export interface User {
    name: string;
    avatar: string;
    bio?: string;
    badges: Badge[];
}

// New types for structured explanation
export type RenderHintType = 'Polygon' | 'Triangle' | 'FunctionPlot' | 'Molecule2D' | 'MoleculeBohr' | 'Circuit' | 'BiologySVG' | 'RealisticImage' | 'None' | 'Diagram' | 'SimpleDisplay';

export interface RenderHints {
    type: RenderHintType | string;
    props: Record<string, any>;
}

export interface StructuredExplanation {
    question: string;
    answer: string;
    explanation: string;
    renderHints: RenderHints;
}

// New types for Fumi's structured responses
export interface ExplanationStep {
  title: string;
  explanation: string;
  result?: string;
  renderHints?: RenderHints;
}

export interface FumiStructuredResponse {
  steps: ExplanationStep[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  history: Content[];
}

export interface ScheduledSession {
  id: string;
  title: string;
  time: string; // ISO 8601 date string
  type: 'learning_session' | 'quiz_reminder';
}

// New types for the dynamic feed
export interface Announcement {
  id: string;
  winner: Player;
  eventName: string;
  prize: number;
  time: string;
}

export type FeedItemData = Contest | Match | QuizQuestion | Announcement;

export interface FeedItem {
  id: string;
  type: 'contest' | 'tournament' | 'match' | 'quiz' | 'announcement';
  data: FeedItemData;
}

export interface FavoriteItem {
  id: string; // Unique ID, e.g., 'quiz-1', 'contest-5'
  type: 'quiz' | 'contest' | 'tournament' | 'match';
  data: QuizQuestion | Contest | Match;
  favoritedAt: string; // ISO date string
}

// New type for AI-generated quizzes
export interface GeneratedQuiz {
  title: string;
  questions: QuizQuestion[];
}

// New type for To-Do list items
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

// New types for AI Dictionary
export interface Definition {
    definition: string;
    synonyms: string[];
    antonyms: string[];
    example?: string; // Kept for French Dictionary compatibility
    examples?: {      // Added for French-English Dictionary
        en: string;
        fr: string;
    }[];
}

export interface Meaning {
    partOfSpeech: string;
    definitions: Definition[];
    synonyms: string[];
    antonyms: string[];
}

export interface Phonetic {
    text: string;
    audio: string;
}

export interface ApiResponse {
    word: string;
    phonetic: string;
    phonetics: Phonetic[];
    meanings: Meaning[];
    renderHints?: RenderHints;
    translation?: string; // Add translation field for Fr-En dictionary
}

// Types for French Conjugation

export interface ConjugationPart {
  stem: string;
  ending: string;
  example?: string;
}

export interface TenseConjugations {
  je: string | ConjugationPart;
  tu: string | ConjugationPart;
  'il/elle/on': string | ConjugationPart;
  nous: string | ConjugationPart;
  vous: string | ConjugationPart;
  'ils/elles': string | ConjugationPart;
}

export interface NonPersonTenses {
  Présent?: string | ConjugationPart;
  Passé?: string | ConjugationPart;
}

export interface Moods {
  [tense: string]: TenseConjugations;
}

export interface VerbConjugations {
  group?: string;
  definition?: string;
  Infinitif?: NonPersonTenses;
  Participe?: NonPersonTenses;
  Indicatif?: Moods;
  Subjonctif?: Moods;
  Conditionnel?: Moods;
  Impératif?: Moods;
  error?: string;
}

export interface Dictation {
  id: string;
  title: string;
  content: string;
  level: string;
  author?: string;
  illustration?: string;
}

export interface DictationSession {
  dictation: Dictation;
  userText: string;
  startTime: number;
  endTime?: number;
}