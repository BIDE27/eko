import React, { useState, useEffect, useMemo } from 'react';
import { quizQuestions } from './data';
import QuizCard from './QuizCard';
import { type QuizQuestion, Page } from '../types';
import FloatingActionButton from './FloatingActionButton';
import RevealQuizCard from './RevealQuizCard';
import { ChevronDownIcon } from './icons';

interface QuizIndividuelProps {
    onNavigate: (page: Page) => void;
}

type Difficulty = 'Tous' | 'Facile' | 'Moyen' | 'Difficile';
const difficulties: Difficulty[] = ['Tous', 'Facile', 'Moyen', 'Difficile'];

const QuizIndividuel: React.FC<QuizIndividuelProps> = ({ onNavigate }) => {
    const [shuffledQuizzes, setShuffledQuizzes] = useState<QuizQuestion[]>([]);
    const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>('Tous');
    const [activeSubjects, setActiveSubjects] = useState<string[]>([]); // Empty array means 'all'
    const [isSubjectsExpanded, setIsSubjectsExpanded] = useState(false);
    const [isDifficultyExpanded, setIsDifficultyExpanded] = useState(false);

    const { subjects, subjectCounts } = useMemo(() => {
        const counts: { [key: string]: number } = {};
        quizQuestions.forEach(q => {
            counts[q.category] = (counts[q.category] || 0) + 1;
        });
        const uniqueSubjects = Object.keys(counts).sort();
        return { subjects: uniqueSubjects, subjectCounts: counts };
    }, []);

    useEffect(() => {
        const shuffled = [...quizQuestions].sort(() => 0.5 - Math.random());
        setShuffledQuizzes(shuffled);
    }, []);
    
    const handleSubjectToggle = (subject: string) => {
        setActiveSubjects(prev => {
            if (prev.includes(subject)) {
                return prev.filter(s => s !== subject);
            } else {
                return [...prev, subject];
            }
        });
    };

    const filteredQuizzes = useMemo(() => {
        return shuffledQuizzes.filter(quiz => {
            const difficultyMatch = activeDifficulty === 'Tous' || quiz.difficulty === activeDifficulty;
            const subjectMatch = activeSubjects.length === 0 || activeSubjects.includes(quiz.category);
            return difficultyMatch && subjectMatch;
        });
    }, [shuffledQuizzes, activeDifficulty, activeSubjects]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Quiz Individuel</h1>
      </div>
      
      <div className="mb-6 space-y-4">
        <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Difficulté</h3>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setActiveDifficulty('Tous')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                        activeDifficulty === 'Tous' 
                        ? 'bg-[var(--color-accent)] text-white shadow-sm' 
                        : 'bg-[var(--color-card-bg)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'
                    }`}
                >
                    Tous
                </button>
                <button
                    onClick={() => setIsDifficultyExpanded(prev => !prev)}
                    className="px-3 py-2 rounded-full transition-colors flex items-center justify-center bg-[var(--color-card-bg)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
                    aria-label={isDifficultyExpanded ? "Cacher les difficultés" : "Afficher les difficultés"}
                >
                    <ChevronDownIcon className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform duration-300 ${isDifficultyExpanded ? 'rotate-180' : ''}`} />
                </button>
            </div>
             <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isDifficultyExpanded ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-wrap gap-2 p-4 bg-[var(--color-card-bg)] rounded-lg border border-[var(--color-border)] shadow-sm">
                    {difficulties.filter(d => d !== 'Tous').map(level => (
                        <button
                            key={level}
                            onClick={() => setActiveDifficulty(level as Difficulty)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                                activeDifficulty === level 
                                ? 'bg-[var(--color-accent)] text-white shadow-sm' 
                                : 'bg-[var(--color-card-bg)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'
                            }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        
        <div>
            <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Matière(s)</label>
            <div className="flex flex-wrap items-center gap-2">
                 <button
                    onClick={() => setActiveSubjects([])}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                        activeSubjects.length === 0
                        ? 'bg-[var(--color-accent)] text-white shadow-sm' 
                        : 'bg-[var(--color-card-bg)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'
                    }`}
                    >
                    Toutes les matières
                </button>
                <button
                    onClick={() => setIsSubjectsExpanded(prev => !prev)}
                    className="px-3 py-2 rounded-full transition-colors flex items-center justify-center bg-[var(--color-card-bg)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
                    aria-label={isSubjectsExpanded ? "Cacher les matières" : "Afficher plus de matières"}
                >
                    <ChevronDownIcon className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform duration-300 ${isSubjectsExpanded ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isSubjectsExpanded ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-wrap gap-2 p-4 bg-[var(--color-card-bg)] rounded-lg border border-[var(--color-border)] shadow-sm">
                    {subjects.map(subject => {
                        const isSelected = activeSubjects.includes(subject);
                        return (
                             <button
                                key={subject}
                                onClick={() => handleSubjectToggle(subject)}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors flex items-center ${
                                    isSelected
                                    ? 'bg-[var(--color-accent)] text-white shadow-sm' 
                                    : 'bg-[var(--color-card-bg)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'
                                }`}
                            >
                                {subject}
                                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'}`}>
                                    {subjectCounts[subject]}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-[var(--color-text-secondary)] mb-2">Apprenez avec Fumi</h2>
      <div className="space-y-4">
        {filteredQuizzes.length > 0 ? (
            filteredQuizzes.map((quiz, index) => (
              (quiz.options && quiz.options.length > 0)
                ? <QuizCard key={`quiz-${quiz.id}-${index}`} quiz={quiz} />
                : <RevealQuizCard key={`reveal-${quiz.id}-${index}`} quiz={quiz} />
            ))
        ) : (
          <p className="text-center text-[var(--color-text-secondary)] mt-8 p-4 bg-[var(--color-bg-secondary)] rounded-lg">
            Aucun quiz ne correspond à ces filtres.
          </p>
        )}
      </div>
      <FloatingActionButton label="Créer un quiz" onClick={() => onNavigate(Page.CreerQuiz)} />
    </div>
  );
};

export default QuizIndividuel;