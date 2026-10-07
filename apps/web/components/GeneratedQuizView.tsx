import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { QuizQuestion } from '../types';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from './icons';

interface GeneratedQuizViewProps {
  questions: QuizQuestion[];
  onClose: () => void;
  timerDuration?: number; // Optional timer in seconds
}

const GeneratedQuizView: React.FC<GeneratedQuizViewProps> = ({ questions, onClose, timerDuration }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerDuration || 0);
  
  const timerIdRef = useRef<number | null>(null);
  const isAnswered = selectedAnswer !== null;
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = useCallback((option: string) => {
    if (isAnswered) return;
    if (timerIdRef.current) clearTimeout(timerIdRef.current);
    setSelectedAnswer(option);
    if (option === currentQuestion.answer) {
      setScore(prev => prev + 1);
    }
  }, [isAnswered, currentQuestion.answer]);
  
  useEffect(() => {
    if (isFinished || !timerDuration || isAnswered) {
        if (timerIdRef.current) clearTimeout(timerIdRef.current);
        return;
    }
    
    setTimeLeft(timerDuration);
    
    const countdown = (secondsLeft: number) => {
        if (secondsLeft < 0) { // Check for < 0 to ensure the last second (0) is displayed
            handleAnswerSelect(''); // Timeout
        } else {
            setTimeLeft(secondsLeft);
            timerIdRef.current = window.setTimeout(() => countdown(secondsLeft - 1), 1000);
        }
    };
    
    countdown(timerDuration);

    return () => {
        if (timerIdRef.current) clearTimeout(timerIdRef.current);
    };
  }, [currentQuestionIndex, isFinished, isAnswered, timerDuration, handleAnswerSelect]);

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center text-center">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Quiz Terminé !</h3>
        <p className="text-lg text-[var(--color-text-secondary)] mt-2">Votre score :</p>
        <p className="text-5xl font-bold my-4 text-[var(--color-accent)]">
          {score} / {questions.length}
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          ({((score / questions.length) * 100).toFixed(0)}%)
        </p>
        <button
          onClick={onClose}
          className="w-full bg-[var(--color-accent)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
          Question {currentQuestionIndex + 1} sur {questions.length}
        </p>
         {timerDuration ? (
          <div className="flex items-center text-sm font-semibold text-[var(--color-text-secondary)]">
            <ClockIcon className="w-4 h-4 mr-1.5" />
            <span>{timeLeft}s</span>
          </div>
        ) : (
             <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Score: {score}
            </p>
        )}
      </div>

      <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-2.5 mb-2">
        <div 
            className="bg-[var(--color-accent)] h-2.5 rounded-full" 
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>
      
      {timerDuration && (
        <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-1.5 mb-4">
            <div 
                className="bg-yellow-400 h-1.5 rounded-full" 
                style={{ width: `${(timeLeft / timerDuration) * 100}%`, transition: timeLeft === timerDuration ? 'none' : 'width 1s linear' }}
            ></div>
        </div>
      )}


      <p className="text-lg font-semibold my-4 text-[var(--color-text-primary)] min-h-[56px]">{currentQuestion.question}</p>

      <div className="mt-4 space-y-3">
        {currentQuestion.options?.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = currentQuestion.answer === option;

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
            buttonClasses += ' text-left bg-[var(--color-bg-secondary)] border-transparent hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light-bg)] text-[var(--color-text-primary)]';
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={isAnswered}
              className={buttonClasses}
            >
              {isAnswered && (
                isCorrect ? <CheckCircleIcon className="w-6 h-6 mr-3 flex-shrink-0" /> :
                isSelected ? <XCircleIcon className="w-6 h-6 mr-3 flex-shrink-0" /> :
                <div className="w-6 h-6 mr-3 flex-shrink-0" />
              )}
              <span className="flex-1 text-left">{option}</span>
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <button
          onClick={handleNext}
          className="mt-6 w-full bg-[var(--color-accent)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          {currentQuestionIndex < questions.length - 1 ? 'Question suivante' : 'Terminer le quiz'}
        </button>
      )}
    </div>
  );
};

export default GeneratedQuizView;