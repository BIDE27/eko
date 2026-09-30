import React, { useState, useMemo } from 'react';
import { tournaments } from './data';
import ContestCard from './ContestCard';
import FilterBar from './FilterBar';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

type TournamentStatus = 'upcoming' | 'live' | 'finished';

const niveauMapping: { [key: string]: string } = {
    primaire: 'Primaire',
    secondaire: 'Secondaire',
    lycee: 'Lycée',
    universitaire: 'Universitaire',
};

const Tournois: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TournamentStatus>('upcoming');
  const [selectedMatiere, setSelectedMatiere] = useState('Toutes les matières');
  const [selectedNiveau, setSelectedNiveau] = useState('tous');
  const [selectedClasse, setSelectedClasse] = useState('toutes');

  const allFilteredTournaments = useMemo(() => {
    return tournaments.filter(tournament => {
        const statusMatch = tournament.status === activeTab;
        // Tournaments can have multiple subjects, so we use .includes()
        const matiereMatch = selectedMatiere === 'Toutes les matières' || tournament.subject.includes(selectedMatiere);
        const niveauMatch = selectedNiveau === 'tous' || tournament.level.includes(niveauMapping[selectedNiveau]);
        const classeMatch = selectedClasse === 'toutes' || tournament.level.includes(selectedClasse);
        
        return statusMatch && matiereMatch && niveauMatch && classeMatch;
    });
  }, [activeTab, selectedMatiere, selectedNiveau, selectedClasse]);
  
  const { visibleItems: visibleTournaments, loaderRef, hasMore, isLoading } = useInfiniteScroll(allFilteredTournaments);

  const TabButton: React.FC<{ status: TournamentStatus, label: string }> = ({ status, label }) => {
    const isActive = activeTab === status;
    return (
      <button
        onClick={() => setActiveTab(status)}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
          isActive ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-[var(--color-text-secondary)] hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        {label}
      </button>
    );
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">Tournois</h1>
      
      <FilterBar 
        selectedMatiere={selectedMatiere}
        onMatiereChange={(e) => setSelectedMatiere(e.target.value)}
        selectedNiveau={selectedNiveau}
        onNiveauChange={(e) => {
            setSelectedNiveau(e.target.value);
            setSelectedClasse('toutes'); // Reset classe when niveau changes
        }}
        selectedClasse={selectedClasse}
        onClasseChange={(e) => setSelectedClasse(e.target.value)}
      />

      <div className="flex space-x-4 border-b border-[var(--color-border)] mb-4">
        <TabButton status="upcoming" label="À venir" />
        <TabButton status="live" label="En cours" />
        <TabButton status="finished" label="Terminés" />
      </div>

      <div className="space-y-4">
        {visibleTournaments.length > 0 ? (
          visibleTournaments.map(tournament => (
            <ContestCard key={tournament.id} contest={tournament} isTournament={true} />
          ))
        ) : (
           !isLoading && <p className="text-center text-[var(--color-text-secondary)] mt-8">Aucun tournoi dans cette catégorie.</p>
        )}
      </div>

      <div ref={loaderRef} className="h-20 flex justify-center items-center">
        {isLoading && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-[var(--color-accent)]"></div>
        )}
        {!hasMore && visibleTournaments.length > 0 && (
          <p className="text-sm text-[var(--color-text-secondary)]">Vous avez atteint la fin de la liste.</p>
        )}
      </div>
    </div>
  );
};

export default Tournois;