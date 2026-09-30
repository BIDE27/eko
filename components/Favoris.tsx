import React from 'react';
import { useFavorites } from '../context/FavoritesContext';
import QuizCard from './QuizCard';
import ContestCard from './ContestCard';
import MatchCard from './MatchCard';
import { HeartIcon } from './icons';
import type { QuizQuestion, Contest, Match, FavoriteItem } from '../types';

const Favoris: React.FC = () => {
  const { favorites } = useFavorites();

  const renderFavoriteItem = (item: FavoriteItem) => {
    switch (item.type) {
      case 'quiz':
        return <QuizCard key={item.id} quiz={item.data as QuizQuestion} />;
      case 'contest':
        return <ContestCard key={item.id} contest={item.data as Contest} />;
      case 'tournament':
        return <ContestCard key={item.id} contest={item.data as Contest} isTournament={true} />;
      case 'match':
        return <MatchCard key={item.id} match={item.data as Match} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">Favoris</h1>
      {favorites.length > 0 ? (
        <div className="space-y-4">
          {favorites.map(renderFavoriteItem)}
        </div>
      ) : (
        <div className="text-center text-[var(--color-text-secondary)] mt-8 p-6 bg-[var(--color-bg-secondary)] rounded-lg flex flex-col items-center">
            <HeartIcon className="w-12 h-12 mb-4 text-gray-400" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Aucun favori pour le moment</h2>
            <p className="max-w-xs mt-1">Cliquez sur l'icône cœur sur un quiz, un concours ou un match pour l'ajouter ici.</p>
        </div>
      )}
    </div>
  );
};

export default Favoris;