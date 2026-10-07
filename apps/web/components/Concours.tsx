import React, { useState, useMemo } from 'react';
import type { Contest } from '../types';
import { contests } from './data';
import ContestCard from './ContestCard';
import FilterBar from './FilterBar';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

type ContestStatus = 'upcoming' | 'live' | 'finished';

const niveauMapping: { [key: string]: string } = {
    primaire: 'Primaire',
    secondaire: 'Secondaire',
    lycee: 'Lycée',
    universitaire: 'Universitaire',
};

const Concours: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContestStatus>('upcoming');
  const [selectedMatiere, setSelectedMatiere] = useState('Toutes les matières');
  const [selectedNiveau, setSelectedNiveau] = useState('tous');
  const [selectedClasse, setSelectedClasse] = useState('toutes');

  const allFilteredContests = useMemo(() => {
    return contests.filter(contest => {
      const statusMatch = contest.status === activeTab;
      const matiereMatch = selectedMatiere === 'Toutes les matières' || contest.subject === selectedMatiere;
      const niveauMatch = selectedNiveau === 'tous' || contest.level.includes(niveauMapping[selectedNiveau]);
      const classeMatch = selectedClasse === 'toutes' || contest.level.includes(selectedClasse);

      return statusMatch && matiereMatch && niveauMatch && classeMatch;
    });
  }, [activeTab, selectedMatiere, selectedNiveau, selectedClasse]);
  
  const { visibleItems: visibleContests, loaderRef, hasMore, isLoading } = useInfiniteScroll(allFilteredContests);


  const TabButton: React.FC<{ status: ContestStatus, label: string }> = ({ status, label }) => {
    const isActive = activeTab === status;
    return (
      <button
        onClick={() => setActiveTab(status)}
        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
          isActive ? 'bg-[var(--color-accent-light-bg)] text-[var(--color-accent-text)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">Concours</h1>
      
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

      <div className="flex space-x-2 border-b border-[var(--color-border)] mb-4">
        <TabButton status="upcoming" label="À venir" />
        <TabButton status="live" label="En cours" />
        <TabButton status="finished" label="Terminés" />
      </div>
      
      <div className="space-y-4">
        {visibleContests.length > 0 ? (
          visibleContests.map(contest => (
            <ContestCard key={contest.id} contest={contest} />
          ))
        ) : (
          !isLoading && <p className="text-center text-[var(--color-text-secondary)] mt-8">Aucun concours dans cette catégorie.</p>
        )}
      </div>

      <div ref={loaderRef} className="h-20 flex justify-center items-center">
        {isLoading && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-[var(--color-accent)]"></div>
        )}
        {!hasMore && visibleContests.length > 0 && (
          <p className="text-sm text-[var(--color-text-secondary)]">Vous avez atteint la fin de la liste.</p>
        )}
      </div>
    </div>
  );
};

export default Concours;