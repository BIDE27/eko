import React, { useState, useMemo, useEffect } from 'react';
import { matches, currentUser } from './data';
import MatchCard from './MatchCard';
import FloatingActionButton from './FloatingActionButton';
import FilterBar from './FilterBar';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import type { Match as MatchType, Player, PlayerPerformance } from '../types';
import Modal from './Modal';
import { ClockIcon, CheckCircleIcon, TrophyIcon } from './icons';

type MatchTab = 'tous' | 'defis' | 'live' | 'finished';

const niveauMapping: { [key: string]: string } = {
    primaire: 'Primaire',
    secondaire: 'Secondaire',
    lycee: 'Lycée',
    universitaire: 'Supérieur', // Match data uses 'Supérieur'
};

interface MatchsProps {
  context?: { tab: MatchTab, matchId?: number };
}

const Matchs: React.FC<MatchsProps> = ({ context }) => {
  const [activeTab, setActiveTab] = useState<MatchTab>(context?.tab || 'tous');
  const [selectedMatiere, setSelectedMatiere] = useState('Toutes les matières');
  const [selectedNiveau, setSelectedNiveau] = useState('tous');
  const [selectedClasse, setSelectedClasse] = useState('toutes');
  const [highlightedMatchId, setHighlightedMatchId] = useState<number | null>(context?.matchId || null);
  const [summaryMatch, setSummaryMatch] = useState<MatchType | null>(null);

  useEffect(() => {
    // Handle incoming context from navigation
    if (context?.tab) {
      setActiveTab(context.tab);
    }
    if (context?.matchId) {
      setHighlightedMatchId(context.matchId);
    }
  }, [context]);
  
  // Clear highlight after a few seconds
  useEffect(() => {
    if (highlightedMatchId) {
      const timer = setTimeout(() => {
        setHighlightedMatchId(null);
      }, 3000); // Highlight for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [highlightedMatchId]);

  const handleOpenSummary = (match: MatchType) => {
    if (match.performance) {
      setSummaryMatch(match);
    }
  };

  const handleCloseSummary = () => {
    setSummaryMatch(null);
  };

  const allFilteredMatches = useMemo(() => {
    let filtered = matches.filter(match => {
      const matiereMatch = selectedMatiere === 'Toutes les matières' || match.subject === selectedMatiere;
      const niveauMatch = selectedNiveau === 'tous' || (match.level && match.level.includes(niveauMapping[selectedNiveau]));
      const classeMatch = selectedClasse === 'toutes' || (match.level && match.level.includes(selectedClasse));
      return matiereMatch && niveauMatch && classeMatch;
    });

    switch (activeTab) {
      case 'defis':
        filtered = filtered.filter(match => {
          const isUserInvolved = match.player1.name === currentUser.name || match.player2.name === currentUser.name;
          return isUserInvolved && match.status === 'challenge';
        });
        break;
      case 'live':
        filtered = filtered.filter(match => match.status === 'live');
        break;
      case 'finished':
        filtered = filtered.filter(match => {
            const isUserInvolved = match.player1.name === currentUser.name || match.player2.name === currentUser.name;
            return isUserInvolved && match.status === 'finished';
        });
        break;
    }

    // Sort the filtered list: live matches first, then all others by date descending
    return filtered.sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1;
        if (a.status !== 'live' && b.status === 'live') return 1;
        
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [activeTab, selectedMatiere, selectedNiveau, selectedClasse]);

  const { visibleItems: visibleMatches, loaderRef, hasMore, isLoading } = useInfiniteScroll(allFilteredMatches);

  const TabButton: React.FC<{ tab: MatchTab, label: string }> = ({ tab, label }) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
          isActive ? 'bg-[var(--color-accent-light-bg)] text-[var(--color-accent-text)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
        }`}
      >
        {label}
      </button>
    );
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Matchs</h1>
      </div>
      
      <FilterBar 
        selectedMatiere={selectedMatiere}
        onMatiereChange={(e) => setSelectedMatiere(e.target.value)}
        selectedNiveau={selectedNiveau}
        onNiveauChange={(e) => {
            setSelectedNiveau(e.target.value);
            setSelectedClasse('toutes');
        }}
        selectedClasse={selectedClasse}
        onClasseChange={(e) => setSelectedClasse(e.target.value)}
      />

      <div className="flex justify-start space-x-2 border-b border-[var(--color-border)] mb-4 overflow-x-auto pb-2">
        <TabButton tab="tous" label="Tous" />
        <TabButton tab="defis" label="Mes défis" />
        <TabButton tab="live" label="En cours" />
        <TabButton tab="finished" label="Historique" />
      </div>

      <div className="space-y-4">
        {visibleMatches.length > 0 ? (
          visibleMatches.map(match => (
            <MatchCard key={match.id} match={match} isHighlighted={match.id === highlightedMatchId} onSummaryClick={handleOpenSummary} />
          ))
        ) : (
          !isLoading && <p className="text-center text-[var(--color-text-secondary)] mt-8">Aucun match dans cette catégorie.</p>
        )}
      </div>
      
      <div ref={loaderRef} className="h-20 flex justify-center items-center">
        {isLoading && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-[var(--color-accent)]"></div>
        )}
        {!hasMore && visibleMatches.length > 0 && (
          <p className="text-sm text-[var(--color-text-secondary)]">Vous avez atteint la fin de la liste.</p>
        )}
      </div>

      <FloatingActionButton label="Créer un match" onClick={() => alert('Fonctionnalité de création de match à venir !')} />
      
      <MatchSummaryModal isOpen={!!summaryMatch} onClose={handleCloseSummary} match={summaryMatch} />
    </div>
  );
};

const PlayerPerformanceSummary: React.FC<{ player: Player; performance: PlayerPerformance; isWinner: boolean; }> = ({ player, performance, isWinner }) => {
    const scorePercentage = (performance.correctAnswers / performance.totalQuestions) * 100;
    return (
        <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-lg bg-[var(--color-bg-secondary)] relative border border-[var(--color-border)]">
            {isWinner && (
                <div className="absolute top-2 right-2 flex items-center text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold">
                    <TrophyIcon className="w-4 h-4 mr-1 text-yellow-500" />
                    Gagnant
                </div>
            )}
            <img src={player.avatar} alt={player.name} className="w-16 h-16 rounded-full object-cover shadow-md"/>
            <p className="font-bold text-lg text-[var(--color-text-primary)]">{player.name}</p>
            <div className="w-full space-y-3 pt-2">
                <div>
                    <div className="flex justify-between items-baseline mb-1 text-sm">
                        <span className="font-semibold">Score</span>
                        <span className="font-bold text-[var(--color-accent-text)]">{performance.correctAnswers} / {performance.totalQuestions}</span>
                    </div>
                    <div className="w-full bg-[var(--color-border)] rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${scorePercentage}%` }}></div>
                    </div>
                </div>
                <div className="flex items-center text-sm text-[var(--color-text-secondary)] pt-2">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    <span>Terminé en <span className="font-semibold text-[var(--color-text-primary)]">{performance.completionTime} secondes</span></span>
                </div>
            </div>
        </div>
    );
};


const MatchSummaryModal: React.FC<{ isOpen: boolean; onClose: () => void; match: MatchType | null }> = ({ isOpen, onClose, match }) => {
    if (!isOpen || !match || !match.performance) {
      return null;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Résumé du Match">
            <div className="space-y-4">
                 <p className="text-center text-sm">
                    Résultats du match de <span className="font-bold">{match.subject}</span>
                </p>
                <div className="grid grid-cols-1 gap-4">
                    <PlayerPerformanceSummary 
                        player={match.player1} 
                        performance={match.performance.player1} 
                        isWinner={match.winner === 'player1'}
                    />
                    <PlayerPerformanceSummary 
                        player={match.player2 as Player} 
                        performance={match.performance.player2} 
                        isWinner={match.winner === 'player2'}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default Matchs;