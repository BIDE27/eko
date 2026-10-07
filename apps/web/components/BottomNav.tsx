import React from 'react';
import { Page } from '../types';
import { HomeIcon, QuizIcon, TournamentIcon, BoardIcon, SparklesIcon } from './icons';

interface BottomNavProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activePage, onNavigate }) => {
  const navItems = [
    { page: Page.Accueil, icon: HomeIcon, label: "Accueil" },
    { page: Page.Quiz, icon: QuizIcon, label: "Quiz" },
    { page: Page.TableauInteractif, icon: BoardIcon, label: "Tableau", isSpecial: true },
    { page: Page.Compétitions, icon: TournamentIcon, label: "Compétitions" },
    { page: Page.Outils, icon: SparklesIcon, label: "Outils" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-card-bg)] shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.5)] z-30 border-t border-[var(--color-border)]">
      <div className="flex justify-around items-end max-w-lg mx-auto px-2 pb-2">
        {navItems.map((item) => {
          const isActive = activePage === item.page;
          
          if (item.isSpecial) {
            return (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className="relative -top-4 flex flex-col items-center justify-center"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
                  isActive 
                    ? 'bg-[var(--color-accent)] text-white' 
                    : 'bg-gradient-to-tr from-[var(--color-accent)] to-indigo-400 text-white'
                }`}>
                  <item.icon className="h-8 w-8" />
                </div>
                <span className={`text-[10px] mt-1 font-bold ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`flex flex-col items-center justify-center w-full py-2 transition-all duration-200 ${
                isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              <item.icon className="h-6 w-6 mb-1" fill={isActive ? 'currentColor' : 'none'} />
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;