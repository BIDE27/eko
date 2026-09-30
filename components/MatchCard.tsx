import React, { useState } from 'react';
import type { Match, Player } from '../types';
import Card from './Card';
import Modal from './Modal';
import { TrophyIcon, QuestionMarkCircleIcon, BellIcon, ShareIcon, HeartIcon, InfoIcon, TrashIcon, CloseIcon } from './icons';
import { useFavorites } from '../context/FavoritesContext';
import PlayerProfile from './PlayerProfile';
import { currentUser } from './data';
import PlayerBadges from './PlayerBadges';

interface MatchCardProps {
  match: Match;
  isHighlighted?: boolean;
  onSummaryClick?: (match: Match) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, isHighlighted = false, onSummaryClick }) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isAlarmActive, setIsAlarmActive] = useState(false);

  const { toggleFavorite, isFavorited } = useFavorites();
  const favoriteId = `match-${match.id}`;
  const isCurrentlyFavorited = isFavorited(favoriteId);

  const isSentByUser = match.status === 'challenge' && match.player1.name === currentUser.name;
  const isReceivedByUser = match.status === 'challenge' && match.player2.name === currentUser.name;

  const cardBorderColor = isReceivedByUser ? 'border-indigo-500' : '';


  const handleFavorite = () => {
    toggleFavorite({ id: favoriteId, type: 'match', data: match });
  };

  const handleOpenPlayerProfile = (player: Player) => {
    if (player.name === 'Adversaire') return; // Do not open profile for placeholder
    setSelectedPlayer(player);
    setIsProfileModalOpen(true);
  };

  const handleShare = async () => {
    const opponentName = match.player2.name === 'Adversaire' ? 'un adversaire' : match.player2.name;
    const shareData = {
      title: `Match eko.: ${match.subject}`,
      text: `${match.player1.name} affronte ${opponentName} en ${match.subject} sur eko. L'enjeu est de ${match.wager.toLocaleString('fr-FR')} F CFA !`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Erreur de partage :', error);
      }
    } else {
      alert("La fonction de partage n'est pas prise en charge sur ce navigateur.");
    }
  };

  const handleCardClick = () => {
    if (match.status === 'finished' && onSummaryClick) {
      onSummaryClick(match);
    }
  };


  const PlayerAvatar: React.FC<{ player: typeof match.player1; isWinner: boolean }> = ({ player, isWinner }) => {
    const isOpponentSearching = !player.avatar;
  
    const containerClasses = `relative rounded-full p-1 ${
      isWinner
        ? 'bg-gradient-to-tr from-green-400 to-emerald-600'
        : isOpponentSearching
        ? 'border-2 border-dashed border-gray-400 dark:border-gray-500 animate-spin-slow'
        : 'bg-[var(--color-bg-secondary)]'
    }`;
  
    return (
      <div className="flex flex-col items-center text-center w-24">
        <div className={containerClasses}>
          {player.avatar ? (
            <img src={player.avatar} alt={player.name} className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-800" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-transparent flex items-center justify-center">
              <QuestionMarkCircleIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>
        <p className="font-semibold text-sm mt-2 truncate w-full text-[var(--color-text-primary)]">{player.name}</p>
        <PlayerBadges player={player as Player} />
        {isWinner && (
          <div className="flex items-center text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1">
            <TrophyIcon className="w-3 h-3 mr-1 text-green-600" />
            Gagnant
          </div>
        )}
      </div>
    );
  };

  const renderActionArea = () => {
    const dateDisplay = (match.time !== 'Défi ouvert' && match.status === 'challenge') ?
      <p className="text-center text-xs text-gray-500 mt-2">{match.time}</p> : null;
      
    switch (match.status) {
      case 'live':
        return (
          <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm animate-pulse">
            Voir le match
          </button>
        );
      case 'challenge':
        if (isReceivedByUser) {
          return (
            <div>
              <div className="flex items-center space-x-2">
                  <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                      Jouer
                  </button>
                  <button
                      className="flex-shrink-0 bg-transparent hover:bg-red-500/10 border border-red-500 text-red-500 p-2 rounded-lg transition-colors"
                      aria-label="Refuser le défi"
                  >
                      <CloseIcon className="w-5 h-5" />
                  </button>
              </div>
              {dateDisplay}
            </div>
          );
        } else if (isSentByUser) {
          return (
            <div>
              <div className="flex items-center space-x-2">
                  <button className="flex-1 bg-transparent hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                      Modifier
                  </button>
                  <button
                      className="flex-shrink-0 bg-transparent hover:bg-red-500/10 border border-red-500 text-red-500 p-2 rounded-lg transition-colors"
                      aria-label="Supprimer le défi"
                  >
                      <TrashIcon className="w-5 h-5" />
                  </button>
              </div>
              {dateDisplay}
            </div>
          );
        }
        // Fallback for challenges not involving the user (e.g., on 'Tous' tab)
        return (
          <div>
            <button className="w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-lg text-sm cursor-not-allowed" disabled>
              Défi en attente
            </button>
            {dateDisplay}
          </div>
        );
      case 'upcoming':
        return (
            <p className="text-center text-sm font-semibold text-[var(--color-accent-text)] py-2">{match.time}</p>
        );
      case 'finished':
         return (
          <p className="text-center text-sm text-[var(--color-text-secondary)] py-2">{match.time} · <span className="font-semibold text-[var(--color-accent-text)]">Voir le résumé</span></p>
        );
      default:
        return null;
    }
  };
  
  const cardClassName = `w-full text-left rounded-lg ${
    match.status === 'finished' && onSummaryClick
      ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] focus:ring-[var(--color-accent)]'
      : ''
  }`;

  const Wrapper = match.status === 'finished' && onSummaryClick ? 'button' : 'div';
  
  return (
    <>
      <Wrapper onClick={handleCardClick} className={cardClassName}>
        <Card
          className={isHighlighted ? 'ring-2 ring-offset-2 ring-offset-[var(--color-bg-primary)] ring-[var(--color-accent)] transition-all duration-500' : ''}
          borderColor={cardBorderColor}
        >
          <div className="flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className="pr-2">
                    <p className="font-semibold text-md text-[var(--color-text-primary)] leading-tight">{match.subject} - {match.wager.toLocaleString('fr-FR')} F CFA</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center">
                      <span>{match.level}</span>
                      {isReceivedByUser && <span className="ml-2 font-semibold text-indigo-500 dark:text-indigo-400">· Défi reçu</span>}
                      {isSentByUser && <span className="ml-2 font-semibold text-gray-500 dark:text-gray-400">· Défi envoyé</span>}
                      {match.status === 'live' && (
                        <span className="ml-2 flex items-center font-semibold text-green-500 dark:text-green-400">
                          <span className="relative flex h-2 w-2 mr-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          En direct
                        </span>
                      )}
                    </p>
                </div>
                <div className="flex items-center space-x-0.5 text-[var(--color-text-secondary)] flex-shrink-0">
                    <button onClick={() => setIsDetailsModalOpen(true)} className="p-1.5 rounded-full hover:bg-[var(--color-bg-secondary)]" aria-label="Détails du match">
                        <InfoIcon className="w-5 h-5" />
                    </button>
                    {(match.status === 'challenge' || match.status === 'upcoming') && (
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
                        className={`p-1.5 rounded-full transition-colors ${isCurrentlyFavorited ? 'text-red-500 bg-red-100 dark:bg-red-900/30' : 'hover:bg-[var(--color-bg-secondary)]'}`}
                        aria-label="Ajouter aux favoris"
                    >
                        <HeartIcon className="w-5 h-5" fill={isCurrentlyFavorited ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-1.5 rounded-full hover:bg-[var(--color-bg-secondary)]"
                        aria-label="Partager le match"
                    >
                        <ShareIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex justify-around items-start w-full">
              <button
                onClick={() => handleOpenPlayerProfile(match.player1)}
                className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-card-bg)] focus:ring-[var(--color-accent)] rounded-full transition-shadow"
                aria-label={`Voir le profil de ${match.player1.name}`}
              >
                <PlayerAvatar player={match.player1} isWinner={match.winner === 'player1'} />
              </button>
              <span className="text-2xl font-bold text-gray-400 dark:text-gray-500 pt-6">VS</span>
              <button
                onClick={() => handleOpenPlayerProfile(match.player2 as Player)}
                disabled={match.player2.name === 'Adversaire'}
                className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-card-bg)] focus:ring-[var(--color-accent)] rounded-full disabled:cursor-default disabled:focus:ring-0 transition-shadow"
                aria-label={`Voir le profil de ${match.player2.name}`}
              >
                <PlayerAvatar player={match.player2} isWinner={match.winner === 'player2'} />
              </button>
            </div>
            
            <div className="mt-4 w-full">
              {match.status === 'finished' && match.winner && (
                <div className="text-center mb-2">
                  <p className="font-bold text-indigo-700 dark:text-indigo-400">
                    {match[match.winner].name} remporte {match.wager.toLocaleString('fr-FR')} F CFA !
                  </p>
                </div>
              )}
              {renderActionArea()}
            </div>
          </div>
        </Card>
      </Wrapper>
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Détails du Match"
      >
        <div className="flex justify-around items-center w-full mb-4">
            <div className="text-center">
                <img src={match.player1.avatar} alt={match.player1.name} className="w-16 h-16 rounded-full mx-auto" />
                <p className="font-bold mt-2 text-[var(--color-text-primary)]">{match.player1.name}</p>
            </div>
            <span className="text-2xl font-bold text-gray-400">VS</span>
            <div className="text-center">
                 {match.player2.avatar ? 
                      <img src={match.player2.avatar} alt={match.player2.name} className="w-16 h-16 rounded-full mx-auto" />
                      :
                      <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mx-auto border-2 border-white">
                          <QuestionMarkCircleIcon className="w-10 h-10 text-gray-500" />
                      </div>
                  }
                <p className="font-bold mt-2 text-[var(--color-text-primary)]">{match.player2.name}</p>
            </div>
        </div>
        <p><strong>Sujet :</strong> {match.subject}</p>
        <p><strong>Niveau :</strong> {match.level || 'Non spécifié'}</p>
        <p><strong>Enjeu :</strong> {match.wager.toLocaleString('fr-FR')} F CFA</p>
        
        <h4 className="font-semibold text-lg mt-4 mb-2 text-[var(--color-text-primary)]">Règles et Conditions</h4>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Le match se déroule en 10 questions chronométrées.</li>
          <li>Le joueur avec le plus de bonnes réponses gagne. En cas d'égalité, le joueur le plus rapide gagne.</li>
          <li>L'enjeu est transféré au gagnant immédiatement après la fin du match.</li>
          <li>Toute déconnexion est considérée comme un forfait.</li>
          <li>Le fair-play est obligatoire.</li>
        </ul>
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

export default MatchCard;
