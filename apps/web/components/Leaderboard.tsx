import React from 'react';
import type { LeaderboardEntry, Player } from '../types';
import { TrophyIcon } from './icons';
import { currentUser } from './data';
import PlayerBadges from './PlayerBadges';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onPlayerClick: (player: Player) => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries, onPlayerClick }) => {

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400'; // Gold
      case 2: return 'text-gray-400'; // Silver
      case 3: return 'text-orange-400'; // Bronze
      default: return 'text-[var(--color-text-secondary)]';
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[auto_1fr_auto] gap-4 text-xs font-bold text-[var(--color-text-secondary)] uppercase px-4 py-2">
        <span>#</span>
        <span className="text-left">Joueur</span>
        <span className="text-right">Score</span>
      </div>
      <ul className="divide-y divide-[var(--color-border)]">
        {entries.map((entry) => {
          const isCurrentUser = entry.player.name === currentUser.name;
          return (
            <li
              key={entry.rank}
              className={`transition-colors ${
                isCurrentUser ? 'bg-[var(--color-accent-light-bg)]' : 'hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              <button
                onClick={() => onPlayerClick(entry.player)}
                className="grid grid-cols-[auto_1fr_auto] gap-4 items-center w-full px-4 py-3 text-left"
                aria-label={`Voir le profil de ${entry.player.name}`}
              >
                <div className="flex items-center justify-center font-bold w-8">
                  {entry.rank <= 3 ? (
                    <TrophyIcon className={`w-6 h-6 ${getRankColor(entry.rank)}`} />
                  ) : (
                    <span className="text-sm">{entry.rank}</span>
                  )}
                </div>
                <div className="flex items-center min-w-0">
                  <img
                    src={entry.player.avatar}
                    alt={entry.player.name}
                    className="w-9 h-9 rounded-full object-cover mr-3 flex-shrink-0"
                  />
                  <div className="truncate">
                    <span className={`font-semibold truncate text-sm ${isCurrentUser ? 'text-[var(--color-accent-text)]' : 'text-[var(--color-text-primary)]'}`}>
                      {entry.player.name}
                      {isCurrentUser && ' (Vous)'}
                    </span>
                    <PlayerBadges player={entry.player} justify="start" />
                  </div>
                </div>
                <div className="text-right font-bold text-sm text-[var(--color-text-primary)]">
                  {entry.score.toLocaleString('fr-FR')}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Leaderboard;
