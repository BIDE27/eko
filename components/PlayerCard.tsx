import React from 'react';
import type { Player } from '../types';
import Card from './Card';
import { UserIcon } from './icons';

interface PlayerCardProps {
  player: Player;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  return (
    <Card>
      <div className="flex items-center space-x-4">
        <img
          src={player.avatar}
          alt={player.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center text-sm text-[var(--color-text-secondary)] mb-1">
            <UserIcon className="w-4 h-4 mr-1.5" />
            <span>Profil Joueur</span>
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{player.name}</h3>
          {player.bio && <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">{player.bio}</p>}
        </div>
      </div>
    </Card>
  );
};

export default PlayerCard;