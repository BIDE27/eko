import React, { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { quizQuestions, contests, tournaments, matches, players } from './data';
import QuizCard from './QuizCard';
import ContestCard from './ContestCard';
import MatchCard from './MatchCard';
import RevealQuizCard from './RevealQuizCard';
import PlayerCard from './PlayerCard'; // Import new component
import { SearchIcon } from './icons';
import type { QuizQuestion, Contest, Match as MatchType, Player } from '../types';

interface SearchProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResult = 
    | { type: 'quiz', data: QuizQuestion }
    | { type: 'contest', data: Contest }
    | { type: 'tournament', data: Contest }
    | { type: 'match', data: MatchType }
    | { type: 'player', data: Player };

type FilterType = 'all' | 'quiz' | 'contest' | 'match' | 'player';

const Search: React.FC<SearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setActiveFilter('all');
    }
  }, [isOpen]);

  useEffect(() => {
    if (debouncedQuery.length < 1) { // Search from 1 character
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const lowerCaseQuery = debouncedQuery.toLowerCase();
    
    const searchTimeout = setTimeout(() => {
      const foundQuizzes: SearchResult[] = quizQuestions
        .filter(q => {
          const query = lowerCaseQuery;
          // Check question, category, and answer for all quizzes
          const textMatch = q.question.toLowerCase().includes(query) ||
                            q.category.toLowerCase().includes(query) ||
                            q.answer.toLowerCase().includes(query);
          
          // Additionally, check options for multiple-choice quizzes
          const optionsMatch = q.options?.some(opt => opt.toLowerCase().includes(query)) || false;

          return textMatch || optionsMatch;
        })
        .map(data => ({ type: 'quiz', data }));

      const foundContests: SearchResult[] = contests
        .filter(c => 
          c.title.toLowerCase().includes(lowerCaseQuery) ||
          c.subject.toLowerCase().includes(lowerCaseQuery) ||
          c.prize.toString().includes(lowerCaseQuery) ||
          c.entryFee.toString().includes(lowerCaseQuery) ||
          (c.leaderboard && c.leaderboard.some(entry => entry.player.name.toLowerCase().includes(lowerCaseQuery)))
        )
        .map(data => ({ type: 'contest', data }));
        
      const foundTournaments: SearchResult[] = tournaments
        .filter(t => 
          t.title.toLowerCase().includes(lowerCaseQuery) ||
          t.subject.toLowerCase().includes(lowerCaseQuery) ||
          t.prize.toString().includes(lowerCaseQuery) ||
          t.entryFee.toString().includes(lowerCaseQuery) ||
          (t.leaderboard && t.leaderboard.some(entry => entry.player.name.toLowerCase().includes(lowerCaseQuery)))
        )
        .map(data => ({ type: 'tournament', data }));

      const foundMatches: SearchResult[] = matches
        .filter(m => 
          m.subject.toLowerCase().includes(lowerCaseQuery) ||
          m.wager.toString().includes(lowerCaseQuery) ||
          m.player1.name.toLowerCase().includes(lowerCaseQuery) ||
          (m.player2 && m.player2.name.toLowerCase().includes(lowerCaseQuery))
        )
        .map(data => ({ type: 'match', data }));

      const foundPlayers: SearchResult[] = Object.values(players)
        .filter(p =>
            p.name.toLowerCase().includes(lowerCaseQuery) ||
            (p.bio && p.bio.toLowerCase().includes(lowerCaseQuery))
        )
        .map(data => ({ type: 'player', data }));

      const allResults = [...foundQuizzes, ...foundContests, ...foundTournaments, ...foundMatches, ...foundPlayers];
      setResults(allResults);
      setActiveFilter('all'); // Reset to 'all' on new search
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(searchTimeout);
  }, [debouncedQuery]);

  const filteredResults = useMemo(() => {
    if (activeFilter === 'all') {
      return results;
    }
    if (activeFilter === 'contest') {
      return results.filter(r => r.type === 'contest' || r.type === 'tournament');
    }
    return results.filter(r => r.type === activeFilter);
  }, [results, activeFilter]);

  if (!isOpen) {
    return null;
  }
  
  const renderResult = (result: SearchResult) => {
    // FIX: Safely access 'id' or 'name' for the key and remove Math.random() for stable keys.
    // The Player type does not have an 'id', so we use its 'name'. Other types have a numeric 'id'.
    const key = `${result.type}-${'id' in result.data ? result.data.id : result.data.name}`;
    switch (result.type) {
      case 'quiz':
        const quizData = result.data as QuizQuestion;
        return (quizData.options && quizData.options.length > 0)
            ? <QuizCard key={key} quiz={quizData} />
            : <RevealQuizCard key={key} quiz={quizData} />;
      case 'contest':
        return <ContestCard key={key} contest={result.data as Contest} />;
      case 'tournament':
        return <ContestCard key={key} contest={result.data as Contest} isTournament />;
      case 'match':
        return <MatchCard key={key} match={result.data as MatchType} />;
      case 'player':
        return <PlayerCard key={key} player={result.data as Player} />;
      default:
        return null;
    }
  }

  const FilterButton: React.FC<{ filter: FilterType; label: string }> = ({ filter, label }) => {
    const isActive = activeFilter === filter;
    const count = useMemo(() => {
      if (filter === 'all') return results.length;
      if (filter === 'contest') return results.filter(r => r.type === 'contest' || r.type === 'tournament').length;
      return results.filter(r => r.type === filter).length;
    }, [results, filter]);

    if (count === 0 && filter !== 'all') return null;

    return (
      <button
        onClick={() => setActiveFilter(filter)}
        className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
            isActive ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)]'
        }`}
      >
        {label} <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${isActive ? 'bg-white/20' : 'bg-[var(--color-border)]'}`}>{count}</span>
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[90] bg-[var(--color-bg-primary)]"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center p-4 border-b border-[var(--color-border)] flex-shrink-0">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher quiz, concours, joueurs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[var(--color-bg-secondary)] border border-transparent rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-[var(--color-text-primary)]"
              autoFocus
            />
          </div>
          <button onClick={onClose} className="ml-4 text-sm font-semibold text-[var(--color-accent-text)] hover:underline flex-shrink-0">
            Annuler
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isSearching && (
            <div className="flex justify-center items-center pt-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-[var(--color-accent)]"></div>
            </div>
          )}
          {!isSearching && debouncedQuery.length > 0 && results.length === 0 && (
            <div className="text-center text-[var(--color-text-secondary)] pt-16">
              <h3 className="text-lg font-semibold">Aucun résultat</h3>
              <p className="text-sm">Essayez avec d'autres mots-clés.</p>
            </div>
          )}
          {!isSearching && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4">
                <FilterButton filter="all" label="Tout" />
                <FilterButton filter="quiz" label="Quiz" />
                <FilterButton filter="contest" label="Concours" />
                <FilterButton filter="match" label="Matchs" />
                <FilterButton filter="player" label="Joueurs" />
              </div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                {filteredResults.length} {filteredResults.length > 1 ? 'résultats affichés' : 'résultat affiché'}
              </p>
              {filteredResults.map(renderResult)}
            </div>
          )}
           {!isSearching && debouncedQuery.length === 0 && (
            <div className="text-center text-[var(--color-text-secondary)] pt-16">
              <SearchIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-semibold mt-4">Recherchez dans eko.</h3>
              <p className="text-sm">Trouvez des quiz, des concours, des matchs et plus encore.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;