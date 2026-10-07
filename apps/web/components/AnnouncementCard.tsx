import React from 'react';
import Card from './Card';
import { TrophyIcon } from './icons';
import type { Announcement } from '../types';

interface AnnouncementCardProps {
  announcement: Announcement;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement }) => {
  return (
    <Card>
      <div className="flex items-center">
        <img src={announcement.winner.avatar} alt={announcement.winner.name} className="w-12 h-12 rounded-full mr-4 object-cover" />
        <div>
          <p className="text-[var(--color-text-primary)]">
            <span className="font-bold">{announcement.winner.name}</span> a remporté le {announcement.eventName} et gagne <span className="font-bold text-green-600 dark:text-green-400">{announcement.prize.toLocaleString('fr-FR')} F CFA !</span> <TrophyIcon className="inline-block w-5 h-5 text-yellow-500" />
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">{announcement.time}</p>
        </div>
      </div>
    </Card>
  );
};

export default AnnouncementCard;