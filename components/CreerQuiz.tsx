import React, { useState } from 'react';
import type { GeneratedQuiz } from '../types';
import { generateCustomQuiz } from '../services/geminiService';
import GeneratedQuizView from './GeneratedQuizView';
import Card from './Card';
import { SparklesIcon, CheckCircleIcon } from './icons';

// Data for filters, similar to FilterBar
const matieres = ['Toutes les matières', 'Mathématiques', 'Physique-Chimie', 'Biologie', 'Français', 'Anglais', 'Histoire-Géographie', 'Économie', 'Philosophie', 'Culture Générale'];
const niveaux: { [key: string]: string } = {
    'tous': 'Tous les niveaux',
    'primaire': 'Primaire',
    'secondaire': 'Secondaire',
    'lycee': 'Lycée',
    'universitaire': 'Universitaire'
};
const classes: { [key: string]: string[] } = {
    primaire: ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'],
    secondaire: ['6ème', '5ème', '4ème', '3ème'],
    lycee: ['Seconde', 'Première', 'Terminale'],
    universitaire: ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat']
};

const suggestionMap: { [key: string]: string[] } = {
    'Culture Générale': ["Capitales du monde", "Inventions célèbres", "Mythologie grecque", "Merveilles du monde"],
    'Mathématiques': ["Théorème de Pythagore", "Calcul mental rapide", "Les fractions", "Géométrie de base"],
    'Physique-Chimie': ["Les états de la matière", "Le tableau périodique", "Lois de Newton", "L'atome et sa structure"],
    'Biologie': ["Le corps humain", "La photosynthèse", "Les dinosaures", "L'ADN et les gènes"],
    'Français': ["Figures de style", "Conjugaison au subjonctif", "Auteurs du 19ème siècle", "Orthographe difficile"],
    'Anglais': ["Faux-amis courants", "Verbes irréguliers", "Culture britannique", "Expressions idiomatiques"],
    'Histoire-Géographie': ["La Révolution française", "Les pharaons d'Égypte", "Volcans et séismes", "Fleuves du monde"],
    'Économie': ["Micro vs Macroéconomie", "L'inflation expliquée", "Grands économistes", "Crises financières"],
    'Philosophie': ["Socrate et la maïeutique", "Le mythe de la caverne", "Les stoïciens", "L'existentialisme"]
};


const CreerQuiz: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [numQuestions, setNumQuestions] = useState(10);
    const [difficulty, setDifficulty] = useState<'Facile' | 'Moyen' | 'Difficile'>('Moyen');
    const [timer, setTimer] = useState<number>(0);
    const [subject, setSubject] = useState('Culture Générale');
    const [level, setLevel] = useState('tous');
    const [studentClass, setStudentClass] = useState('toutes');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State management for post-generation flow
    const [quizReady, setQuizReady] = useState<GeneratedQuiz | null>(null);
    const [playingQuiz, setPlayingQuiz] = useState<GeneratedQuiz | null>(null);

    const resetForm = () => {
        setTopic('');
        setNumQuestions(10);
        setDifficulty('Moyen');
        setTimer(0);
        setSubject('Culture Générale');
        setLevel('tous');
        setStudentClass('toutes');
        setError(null);
        setQuizReady(null);
        setPlayingQuiz(null);
    };

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Veuillez entrer un sujet pour le quiz.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setQuizReady(null);

        try {
            const quizData = await generateCustomQuiz(topic, numQuestions, difficulty, subject, niveaux[level], studentClass);
            setQuizReady(quizData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePlayNow = () => {
        if (quizReady) {
            setPlayingQuiz(quizReady);
        }
    };

    if (playingQuiz) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">{playingQuiz.title}</h1>
                <Card className="border border-[var(--color-border)]">
                    <GeneratedQuizView
                        questions={playingQuiz.questions}
                        onClose={resetForm}
                        timerDuration={timer > 0 ? timer : undefined}
                    />
                </Card>
            </div>
        );
    }
    
    if (quizReady) {
        return (
            <div className="p-4 flex flex-col items-center justify-center text-center h-[calc(100vh-200px)]">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Quiz Généré !</h1>
                <p className="text-md text-[var(--color-text-secondary)] mt-2 mb-6">Votre quiz sur "{quizReady.title}" est prêt.</p>
                <div className="w-full max-w-sm space-y-3">
                    <button
                        onClick={handlePlayNow}
                        className="w-full bg-[var(--color-accent)] text-white font-bold py-3 px-4 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
                    >
                        Jouer maintenant
                    </button>
                    <button
                        onClick={resetForm}
                        className="w-full bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-bold py-3 px-4 rounded-lg hover:bg-[var(--color-border)] transition-colors"
                    >
                        Créer un autre quiz
                    </button>
                </div>
            </div>
        );
    }
    
    const difficultyOptions: Array<'Facile' | 'Moyen' | 'Difficile'> = ['Facile', 'Moyen', 'Difficile'];
    const timerOptions = [
        { label: 'Non', value: 0 }, { label: '15s', value: 15 }, { label: '30s', value: 30 },
        { label: '60s', value: 60 }, { label: '90s', value: 90 }, { label: '2min', value: 120 }
    ];
    
    const keyNiveau = level as keyof typeof classes;
    const availableClasses = classes[keyNiveau] || [];
    
    const currentSuggestions = suggestionMap[subject] || suggestionMap['Culture Générale'];

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Créer un Quiz Personnalisé</h1>

            <Card className="border border-[var(--color-border)]">
                <div className="space-y-6">
                    {/* Sujet du Quiz */}
                    <div>
                        <label htmlFor="topic" className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">
                            Sujet du Quiz
                        </label>
                        <input
                            type="text" id="topic" value={topic} onChange={(e) => setTopic(e.target.value)}
                            placeholder="Ex: L'histoire de la Rome antique"
                            className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                            disabled={isLoading} />
                    </div>
                    
                    {/* Suggestions */}
                    <div>
                        <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
                           Suggestions
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {currentSuggestions.map(suggestion => (
                                <button
                                    key={suggestion}
                                    onClick={() => setTopic(suggestion)}
                                    disabled={isLoading}
                                    className="flex items-center px-3 py-1.5 text-xs font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-full hover:bg-[var(--color-accent-light-bg)] hover:text-[var(--color-accent-text)] transition-colors disabled:opacity-50 border border-[var(--color-border)]"
                                >
                                    <SparklesIcon className="w-3 h-3 mr-1.5 flex-shrink-0" />
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Matière, Niveau, Classe */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="subject" className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Matière</label>
                            <select id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={isLoading} className="w-full appearance-none bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
                                {matieres.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="level" className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Niveau</label>
                            <select id="level" value={level} onChange={(e) => { setLevel(e.target.value); setStudentClass('toutes'); }} disabled={isLoading} className="w-full appearance-none bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
                                {Object.entries(niveaux).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                            </select>
                        </div>
                        {availableClasses.length > 0 && (
                            <div className="md:col-span-2">
                                <label htmlFor="studentClass" className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Classe / Année</label>
                                <select id="studentClass" value={studentClass} onChange={(e) => setStudentClass(e.target.value)} disabled={isLoading} className="w-full appearance-none bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
                                    <option value="toutes">Toutes les classes / années</option>
                                    {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Nombre de questions */}
                    <div>
                        <label htmlFor="numQuestions" className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
                            Nombre de questions <span className="font-bold text-[var(--color-accent)]">({numQuestions})</span>
                        </label>
                        <input type="range" id="numQuestions" min="5" max="20" value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} disabled={isLoading} />
                    </div>

                    {/* Difficulté */}
                    <div>
                        <h3 className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Difficulté</h3>
                        <div className="flex flex-wrap gap-2">
                            {difficultyOptions.map(level => (
                                <button key={level} onClick={() => setDifficulty(level)} disabled={isLoading}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${difficulty === level ? 'bg-[var(--color-accent)] text-white shadow-md' : 'bg-white dark:bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'}`}>
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Chronomètre */}
                    <div>
                        <h3 className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Chronomètre par question</h3>
                        <div className="flex flex-wrap gap-2">
                            {timerOptions.map(opt => (
                                <button key={opt.value} onClick={() => setTimer(opt.value)} disabled={isLoading}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${timer === opt.value ? 'bg-[var(--color-accent)] text-white shadow-md' : 'bg-white dark:bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm pt-2">{error}</p>}
                </div>
            </Card>

            <button onClick={handleGenerate} disabled={isLoading || !topic.trim()}
                className="w-full flex items-center justify-center bg-[var(--color-accent)] text-white font-bold py-3 px-4 rounded-lg hover:bg-[var(--color-accent-hover)] disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800">
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Génération en cours...
                    </>
                ) : (
                    <>
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Générer le Quiz
                    </>
                )}
            </button>
        </div>
    );
};

export default CreerQuiz;