import React, { useState } from 'react';
import type { Contest, Player } from '../types';
import Card from './Card';
import Countdown from './Countdown';
import { TrophyIcon, UsersIcon, TicketIcon, BellIcon, ShareIcon, HeartIcon, InfoIcon } from './icons';
import Modal from './Modal';
import { useFavorites } from '../context/FavoritesContext';
import Leaderboard from './Leaderboard';
import PlayerProfile from './PlayerProfile';
import PlayerBadges from './PlayerBadges';

interface ContestCardProps {
  contest: Contest;
  isTournament?: boolean;
}

const ContestCard: React.FC<ContestCardProps> = ({ contest, isTournament = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [modalContent, setModalContent] = useState<'details' | 'leaderboard'>('details');
  const [isAlarmActive, setIsAlarmActive] = useState(false);

  const { toggleFavorite, isFavorited } = useFavorites();
  const favoriteId = `${isTournament ? 'tournament' : 'contest'}-${contest.id}`;
  const isCurrentlyFavorited = isFavorited(favoriteId);

  const handleFavorite = () => {
    toggleFavorite({ id: favoriteId, type: isTournament ? 'tournament' : 'contest', data: contest });
  };
  
  const handleOpenModal = (content: 'details' | 'leaderboard') => {
    setModalContent(content);
    setIsDetailsModalOpen(true);
  };

  const handleOpenPlayerProfile = (player: Player) => {
    setSelectedPlayer(player);
    setIsProfileModalOpen(true);
  };

  const getStatusInfo = () => {
    switch (contest.status) {
      case 'upcoming':
        return {
          buttonText: "S'inscrire",
          buttonAction: () => handleOpenModal('details'), // Could be a dedicated registration flow in the future
          buttonClass: `w-full text-white font-bold py-2 px-4 rounded-lg ${contest.type === 'gratuit' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-800'}`,
          borderColor: isTournament ? 'border-green-400' : 'border-indigo-400',
        };
      case 'live':
        return {
          buttonText: 'Voir en direct',
          buttonAction: () => handleOpenModal('leaderboard'),
          buttonClass: 'w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-2 px-4 rounded-lg animate-pulse',
          borderColor: 'border-yellow-400',
        };
      case 'finished':
        return {
          buttonText: 'Voir les résultats',
          buttonAction: () => handleOpenModal('leaderboard'),
          buttonClass: 'w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg',
          borderColor: 'border-gray-400',
        };
      default:
        return { buttonText: '', buttonAction: () => {}, buttonClass: '', borderColor: ''};
    }
  };
  
  const handleShare = async () => {
    const shareData = {
      title: `eko.: ${isTournament ? 'Tournoi' : 'Concours'} - ${contest.title}`,
      text: `Rejoignez le ${isTournament ? 'tournoi' : 'concours'} "${contest.title}" sur eko. ! Date limite d'inscription : ${formattedDate}.`,
      url: window.location.href, // This should ideally be a unique URL for the event
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Erreur de partage :', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      // FIX: The alert message was missing quotes, causing a syntax error. The message is now correctly formatted as a string.
      alert("La fonction de partage n'est pas prise en charge sur ce navigateur.");
    }
  };

  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(contest.registrationEndDate);


  const { buttonText, buttonClass, borderColor, buttonAction } = getStatusInfo();

  return (
    <>
      <Card borderColor={borderColor}>
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-start">
            <div className="pr-2">
              <h3 className={`font-bold text-lg ${isTournament ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {contest.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{contest.subject} - {contest.level}</p>
            </div>
            <div className="flex items-center space-x-0.5 text-[var(--color-text-secondary)] flex-shrink-0">
                <button onClick={() => handleOpenModal('details')} className="p-1.5 rounded-full hover:bg-[var(--color-bg-secondary)]" aria-label="Détails">
                    <InfoIcon className="w-5 h-5" />
                </button>
                {contest.status === 'upcoming' && (
                    <button
                    onClick={() => setIsAlarmActive(!isAlarmActive)}
                    className={`p-1.5 rounded-full transition-colors ${isAlarmActive ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-800/50 dark:text-indigo-300' : 'hover:bg-[var(--color-bg-secondary)]'}`}
                    aria-label="Activer la notification"
                    >
                    <BellIcon className="w-5 h-5" />
                    </button>
                )}
                <button
                    onClick={handleFavorite}
                    className={`p-1.5 rounded-full transition-colors ${isCurrentlyFavorited ? 'bg-red-100 text-red-500 dark:bg-red-900/30' : 'hover:bg-[var(--color-bg-secondary)]'}`}
                    aria-label="Ajouter aux favoris"
                >
                    <HeartIcon className="w-5 h-5" fill={isCurrentlyFavorited ? 'currentColor' : 'none'} />
                </button>
                <button
                    onClick={handleShare}
                    className="p-1.5 rounded-full hover:bg-[var(--color-bg-secondary)]"
                    aria-label="Partager"
                >
                    <ShareIcon className="w-5 h-5" />
                </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="flex flex-col items-center">
              <TrophyIcon className="w-5 h-5 mb-1 text-yellow-500" />
              <span className="font-semibold text-[var(--color-text-primary)]">+ de {contest.prize.toLocaleString('fr-FR')} F</span>
              <span className="text-xs text-[var(--color-text-secondary)]">CFA</span>
            </div>
            <div className="flex flex-col items-center">
              <UsersIcon className="w-5 h-5 mb-1 text-blue-500" />
              <span className="font-semibold text-[var(--color-text-primary)]">{contest.participants}</span>
              <span className="text-xs text-[var(--color-text-secondary)]">participants</span>
            </div>
            <div className="flex flex-col items-center">
              <TicketIcon className="w-5 h-5 mb-1 text-red-500" />
              <span className="font-semibold text-[var(--color-text-primary)]">{contest.entryFee.toLocaleString('fr-FR')} F</span>
              <span className="text-xs text-[var(--color-text-secondary)]">CFA</span>
            </div>
          </div>

          {contest.estimatedWinnings && (
            <div className="text-sm">
               <button onClick={() => setIsExpanded(!isExpanded)} className="text-[var(--color-text-secondary)] font-semibold">Gains estimés :</button>
               {isExpanded && (
                  <div className="mt-2 pl-4 space-y-1 text-[var(--color-text-secondary)]">
                      <div className="flex justify-between"><span >1er place</span> <span className="font-bold text-green-600 dark:text-green-400">~{contest.estimatedWinnings.first.toLocaleString('fr-FR')} F CFA</span></div>
                      <div className="flex justify-between"><span >2ème place</span> <span className="font-bold text-green-600 dark:text-green-400">~{contest.estimatedWinnings.second.toLocaleString('fr-FR')} F CFA</span></div>
                      <div className="flex justify-between"><span >3ème place</span> <span className="font-bold text-green-600 dark:text-green-400">~{contest.estimatedWinnings.third.toLocaleString('fr-FR')} F CFA</span></div>
                  </div>
               )}
            </div>
          )}

          {contest.status === 'upcoming' && (
             <div className="pt-2 border-t border-[var(--color-border)] mt-2">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <p className="text-xs font-medium text-[var(--color-text-secondary)]">Clôture des inscriptions :</p>
                    <Countdown targetDate={contest.registrationEndDate} />
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      Le {formattedDate}
                    </p>
                  </div>
                </div>
              </div>
          )}

          {contest.status === 'finished' && contest.leaderboard && contest.leaderboard.length > 0 && (
            <div className="pt-3 border-t border-[var(--color-border)] mt-2">
              <div className="flex items-center space-x-3">
                <img src={contest.leaderboard[0].player.avatar} alt={contest.leaderboard[0].player.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="text-xs text-yellow-500 font-bold flex items-center">
                    <TrophyIcon className="w-4 h-4 mr-1" /> GAGNANT
                  </p>
                  <p className="font-semibold text-sm text-[var(--color-text-primary)]">{contest.leaderboard[0].player.name}</p>
                  <PlayerBadges player={contest.leaderboard[0].player} justify="start" />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <div className="flex items-center space-x-2">
                <button onClick={buttonAction} className={buttonClass}>{buttonText}</button>
            </div>
             {contest.type === 'payant' && contest.level === 'Maternelle' && (
                 <p className="text-xs text-center text-gray-400 dark:text-gray-600 mt-2">Les jeux payants sont réservés aux majeurs et indisponibles au niveau Maternelle.</p>
             )}
          </div>
        </div>
      </Card>
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={contest.title}
      >
        {contest.leaderboard && (
          <div className="border-b border-[var(--color-border)] mb-4">
            <nav className="flex -mb-px space-x-6">
              <button
                onClick={() => setModalContent('leaderboard')}
                className={`py-2 px-1 border-b-2 text-sm font-semibold transition-colors ${modalContent === 'leaderboard' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
              >
                Classement
              </button>
              <button
                onClick={() => setModalContent('details')}
                className={`py-2 px-1 border-b-2 text-sm font-semibold transition-colors ${modalContent === 'details' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
              >
                Détails
              </button>
            </nav>
          </div>
        )}

        {modalContent === 'leaderboard' && contest.leaderboard ? (
          <Leaderboard entries={contest.leaderboard} onPlayerClick={handleOpenPlayerProfile} />
        ) : (
          <div>
            <h3 className="font-bold text-[var(--color-text-primary)]">{contest.title}</h3>
            <p><strong>Sujet :</strong> {contest.subject}</p>
            <p><strong>Niveau :</strong> {contest.level}</p>
            
            <h4 className="font-semibold text-lg mt-4 mb-2 text-[var(--color-text-primary)]">Règles et Conditions</h4>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>L'inscription est définitive et les frais d'entrée ne sont pas remboursables.</li>
              <li>Les participants doivent respecter les règles de conduite et de fair-play. Toute triche entraînera une disqualification immédiate.</li>
              <li>Le format du {isTournament ? 'tournoi' : 'concours'} est basé sur un quiz à choix multiples chronométré.</li>
              <li>Les gains sont distribués aux gagnants dans les 72 heures suivant la fin de l'événement.</li>
              <li>En cas d'égalité, des questions supplémentaires pourront être posées pour départager les participants.</li>
              <li>L'organisateur se réserve le droit d'annuler ou de modifier l'événement en cas de force majeure.</li>
            </ul>
          </div>
        )}
      </Modal>

      <Modal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          title={`Profil de ${selectedPlayer?.name || ''}`}
      >
          {selectedPlayer && <PlayerProfile player={selectedPlayer} />}
      </Modal>
    </>
  );
};

export default ContestCard;
