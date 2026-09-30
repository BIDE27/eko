import React, { useState } from 'react';
import Concours from './Concours';
import Tournois from './Tournois';
import Matchs from './Matchs';
import { ContestIcon, TournamentIcon, MatchIcon } from './icons';
import { motion, AnimatePresence } from 'motion/react';

const Competitions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'concours' | 'tournois' | 'matchs'>('concours');

  const tabs = [
    { id: 'concours', label: 'Concours', icon: <ContestIcon className="w-4 h-4" /> },
    { id: 'tournois', label: 'Tournois', icon: <TournamentIcon className="w-4 h-4" /> },
    { id: 'matchs', label: 'Matchs', icon: <MatchIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] pb-24">
      <div className="sticky top-0 z-10 bg-[var(--color-card-bg)]/80 backdrop-blur-md border-b border-[var(--color-border)] px-4 pt-6 pb-2">
        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text-primary)] px-1">Compétitions</h2>
        <div className="flex space-x-1 p-1 bg-[var(--color-bg-secondary)] rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-[var(--color-card-bg)] text-[var(--color-accent)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'concours' && <Concours />}
            {activeTab === 'tournois' && <Tournois />}
            {activeTab === 'matchs' && <Matchs />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Competitions;
