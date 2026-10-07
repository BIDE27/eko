import React, { useState } from 'react';
import type { QuizQuestion, StructuredExplanation } from '../types';
import { getQuizExplanation } from '../services/geminiService';
import { SparklesIcon, HeartIcon, ShareIcon, CheckCircleIcon, XCircleIcon, ThumbUpIcon, ThumbDownIcon } from './icons';
import ExplanationRenderer from './ExplanationRenderer';
import { useFavorites } from '../context/FavoritesContext';

interface QuizCardProps {
  quiz: QuizQuestion;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [structuredExplanation, setStructuredExplanation] = useState<StructuredExplanation | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  
  const { toggleFavorite, isFavorited } = useFavorites();
  const favoriteId = `quiz-${quiz.id}`;
  const isCurrentlyFavorited = isFavorited(favoriteId);

  const isAnswered = selectedAnswer !== null;

  const handleAnswerSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
  };

  const handleExplainMore = async () => {
    setIsLoadingExplanation(true);
    setError('');
    setStructuredExplanation(null);
    setFeedback(null);
    try {
      const explanationData = await getQuizExplanation(quiz.question, quiz.answer);
      setStructuredExplanation(explanationData);
    } catch (err) {
      setError('Désolé, une erreur est survenue lors de la récupération de l\'explication.');
      console.error(err);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  const handleFavorite = () => {
    toggleFavorite({ id: favoriteId, type: 'quiz', data: quiz });
  };

  const handleShare = async () => {
    const shareData = {
      title: `Quiz eko.: ${quiz.category}`,
      text: `Pensez-vous pouvoir répondre à cette question ? "${quiz.question}"`,
      url: window.location.href, // This should ideally be a unique URL for the quiz
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Erreur de partage :', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      alert('La fonction de partage n\'est pas prise en charge sur ce navigateur.');
    }
  };

  return (
    <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4 mb-4 w-full">
      <div className="flex justify-between items-start">
        <p className="text-sm text-[var(--color-text-secondary)] pt-1 pr-2">Le saviez-vous ? ({quiz.category})</p>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={handleFavorite}
            className={`p-1.5 rounded-full transition-colors duration-200 ${
              isCurrentlyFavorited ? 'text-red-500 bg-red-100 dark:bg-red-900/30' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
            }`}
            aria-label={isCurrentlyFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <HeartIcon className="w-5 h-5" fill={isCurrentlyFavorited ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors duration-200"
            aria-label="Partager le quiz"
          >
            <ShareIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <p className="text-lg font-semibold my-2 text-[var(--color-text-primary)]">{quiz.question}</p>
      
      <div className="mt-4 space-y-3">
        {quiz.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = quiz.answer === option;

          let buttonClasses = 'w-full p-3 rounded-lg border transition-all duration-200 text-sm font-medium disabled:cursor-not-allowed flex items-center';

          if (isAnswered) {
            if (isCorrect) {
              buttonClasses += ' bg-green-500 border-green-600 text-white shadow-md';
            } else if (isSelected && !isCorrect) {
              buttonClasses += ' bg-red-500 border-red-600 text-white shadow-md';
            } else {
              buttonClasses += ' border-[var(--color-border)] text-[var(--color-text-secondary)] bg-transparent';
            }
          } else {
            buttonClasses += ' bg-[var(--color-bg-secondary)] border-transparent hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light-bg)] text-[var(--color-text-primary)]';
          }
          
          return (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={isAnswered}
              className={buttonClasses}
            >
              {isAnswered && (
                isCorrect ? (
                  <CheckCircleIcon className="w-6 h-6 mr-3 flex-shrink-0" />
                ) : isSelected ? (
                  <XCircleIcon className="w-6 h-6 mr-3 flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6 mr-3 flex-shrink-0" /> // Placeholder for alignment
                )
              )}
              <span className="flex-1 text-left">{option}</span>
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="mt-4">
          {!structuredExplanation && !isLoadingExplanation && (
            <button onClick={handleExplainMore} className="flex items-center text-sm text-[var(--color-accent-text)] hover:text-[var(--color-accent-hover)] font-medium">
              <SparklesIcon className="w-4 h-4 mr-1" />
              Expliquer plus
            </button>
          )}
          
          {isLoadingExplanation && <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Fumi réfléchit...</p>}
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          
          {structuredExplanation && (
             <div className="mt-4 space-y-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg">
                <div className="text-[var(--color-text-secondary)] space-y-2 prose prose-sm max-w-none dark:prose-invert">
                    {structuredExplanation.explanation}
                </div>
                <ExplanationRenderer renderHints={structuredExplanation.renderHints} />
                <div className="border-t border-[var(--color-border)] pt-3 mt-4 flex items-center justify-end space-x-2">
                    <span className="text-xs text-[var(--color-text-secondary)] mr-2">Cette explication est-elle utile ?</span>
                    <button
                        onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
                        className={`p-1.5 rounded-full transition-colors ${
                            feedback === 'like' 
                                ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' 
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card-bg)]'
                        }`}
                        aria-label="Utile"
                    >
                        <ThumbUpIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
                        className={`p-1.5 rounded-full transition-colors ${
                            feedback === 'dislike' 
                                ? 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' 
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card-bg)]'
                        }`}
                        aria-label="Pas utile"
                    >
                        <ThumbDownIcon className="w-5 h-5" />
                    </button>
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizCard;