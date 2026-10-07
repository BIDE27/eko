import React from 'react';
import type { Player, Badge } from '../types';
import { badges as allBadges } from './data';
import { MedalIcon, StarIcon, TrophyIcon } from './icons';

interface PlayerProfileProps {
  player: Player;
}

const BadgeIcon: React.FC<{ icon: Badge['icon'], className?: string }> = ({ icon, className }) => {
    switch (icon) {
        case 'medal':
            return <MedalIcon className={className} />;
        case 'star':
            return <StarIcon className={className} />;
        case 'trophy':
            return <TrophyIcon className={className} />;
    }
}

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="text-center bg-[var(--color-bg-secondary)] p-3 rounded-lg">
        <p className="text-xl font-bold text-[var(--color-accent)]">{value}</p>
        <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">{label}</p>
    </div>
);

const PlayerProfile: React.FC<PlayerProfileProps> = ({ player }) => {
  const playerBadges = allBadges.filter(badge => player.badges?.includes(badge.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <img
          src={player.avatar}
          alt={player.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
        />
        <h1 className="text-2xl font-bold mt-4 text-[var(--color-text-primary)]">{player.name}</h1>
        {player.bio && <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-sm">{player.bio}</p>}
      </div>

      {player.stats && (
        <div>
            <h2 className="text-lg font-semibold text-center text-[var(--color-text-primary)] mb-3">Statistiques</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatItem label="Classement" value={`#${player.stats.rank}`} />
                <StatItem label="Gains Totaux" value={`${player.stats.totalWinnings.toLocaleString('fr-FR')} F`} />
                <StatItem label="Matchs Joués" value={player.stats.matchesPlayed} />
                <StatItem label="Taux de Victoire" value={`${player.stats.winRate}%`} />
            </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-center text-[var(--color-text-primary)] mb-3">Badges</h2>
        {playerBadges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {playerBadges.map(badge => (
              <div key={badge.id} className="bg-[var(--color-bg-secondary)] p-4 rounded-lg flex flex-col items-center text-center">
                <div className="p-2 bg-[var(--color-accent-light-bg)] rounded-full mb-2">
                    <BadgeIcon icon={badge.icon} className="w-6 h-6 text-[var(--color-accent-text)]" />
                </div>
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">{badge.name}</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">{badge.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-[var(--color-text-secondary)] text-sm bg-[var(--color-bg-secondary)] p-4 rounded-lg">Ce joueur n'a pas encore de badges.</p>
        )}
      </div>
    </div>
  );
};

export default PlayerProfile;