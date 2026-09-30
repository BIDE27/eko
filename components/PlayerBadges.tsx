import React from 'react';
import type { Player, Badge } from '../types';
import { badges as allBadgesData } from './data';
import { MedalIcon, StarIcon, TrophyIcon } from './icons';

const BadgeIcon: React.FC<{ icon: Badge['icon'], className?: string }> = ({ icon, className }) => {
    switch (icon) {
        case 'medal':
            return <MedalIcon className={className} />;
        case 'star':
            return <StarIcon className={className} />;
        case 'trophy':
            return <TrophyIcon className={className} />;
    }
};

interface PlayerBadgesProps {
  player: Player;
  limit?: number;
  justify?: 'start' | 'center' | 'end';
}

const PlayerBadges: React.FC<PlayerBadgesProps> = ({ player, limit = 4, justify = 'center' }) => {
  if (!player.badges || player.badges.length === 0) {
    return null;
  }

  const playerBadges = allBadgesData
    .filter(badge => player.badges?.includes(badge.id))
    .slice(0, limit);

  if (playerBadges.length === 0) {
      return null;
  }
  
  const justifyClass = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end'
  }[justify];


  return (
    <div className={`flex items-center space-x-1 mt-1 ${justifyClass}`}>
      {playerBadges.map(badge => (
        <div key={badge.id} title={`${badge.name}: ${badge.description}`}>
          <BadgeIcon icon={badge.icon} className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
      ))}
    </div>
  );
};

export default PlayerBadges;
