import React, { useState, useEffect } from 'react';
import QuizCard from './QuizCard';
import ContestCard from './ContestCard';
import MatchCard from './MatchCard';
import AnnouncementCard from './AnnouncementCard';
import { quizQuestions, contests, tournaments, matches, players } from './data';
import { CalendarIcon, QuizIcon } from './icons';
import type { ScheduledSession, FeedItem, Announcement, Contest, Match as MatchType, QuizQuestion as QuizQuestionType } from '../types';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import RevealQuizCard from './RevealQuizCard';

const formatSessionTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  const timeString = `à ${date.toLocaleTimeString('fr-FR', timeOptions)}`;

  if (sessionDate.getTime() === today.getTime()) {
    return `Aujourd'hui ${timeString}`;
  }
  if (sessionDate.getTime() === tomorrow.getTime()) {
    return `Demain ${timeString}`;
  }
  
  return `Le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${timeString}`;
};

const Accueil: React.FC = () => {
    const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
    const [fullFeed, setFullFeed] = useState<FeedItem[]>([]);
    const { visibleItems: visibleFeed, loaderRef, hasMore, isLoading } = useInfiniteScroll(fullFeed);

    const randomEvents = [
        { id: 'e1', title: 'Tournoi de Mathématiques', image: 'https://picsum.photos/seed/math/400/250', date: '15 Mars', category: 'Compétition' },
        { id: 'e2', title: 'Conférence sur l\'IA', image: 'https://picsum.photos/seed/ai/400/250', date: '20 Mars', category: 'Éducation' },
        { id: 'e3', title: 'Grand Quiz de Culture G', image: 'https://picsum.photos/seed/quiz/400/250', date: '22 Mars', category: 'Quiz' },
        { id: 'e4', title: 'Match Inter-Écoles', image: 'https://picsum.photos/seed/school/400/250', date: '25 Mars', category: 'Match' },
        { id: 'e5', title: 'Atelier de Programmation', image: 'https://picsum.photos/seed/code/400/250', date: '28 Mars', category: 'Atelier' },
    ];

    useEffect(() => {
        // Load scheduled sessions
        try {
            const savedSessions = localStorage.getItem('fumiScheduledSessions');
            if (savedSessions) {
                const loadedSessions: ScheduledSession[] = JSON.parse(savedSessions);
                const upcoming = loadedSessions
                    .filter(s => new Date(s.time) > new Date())
                    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
                setScheduledSessions(upcoming.slice(0, 5)); // Show up to 5
            }
        } catch (error) {
            console.error("Failed to load scheduled sessions:", error);
        }
        
        // --- Generate the dynamic feed ---
        const announcements: FeedItem[] = [
            ...contests.filter(c => c.status === 'finished'),
            ...tournaments.filter(t => t.status === 'finished')
        ].map((event, index) => {
            // Pick a random player as the winner for demonstration
            const winnerKey = Object.keys(players)[index % Object.keys(players).length];
            const winner = players[winnerKey];
            const announcementData: Announcement = {
                id: `a-${event.id}`,
                winner: winner,
                eventName: event.title,
                prize: event.estimatedWinnings?.first ?? event.prize,
                time: `il y a ${index + 1}j`
            };
            return {
                id: `announcement-${event.id}`,
                type: 'announcement',
                data: announcementData
            };
        });

        const quizItems: FeedItem[] = quizQuestions.map(q => ({ id: `quiz-${q.id}`, type: 'quiz', data: q }));
        const contestItems: FeedItem[] = contests.map(c => ({ id: `contest-${c.id}`, type: 'contest', data: c }));
        const tournamentItems: FeedItem[] = tournaments.map(t => ({ id: `tournament-${t.id}`, type: 'tournament', data: t }));
        const matchItems: FeedItem[] = matches.map(m => ({ id: `match-${m.id}`, type: 'match', data: m }));

        const combinedFeed = [...announcements, ...quizItems, ...contestItems, ...tournamentItems, ...matchItems];

        // Shuffle the feed for variety
        const shuffledFeed = combinedFeed.sort(() => 0.5 - Math.random());
        
        const trulyInfiniteFeed: FeedItem[] = [];
        // Repeat the content multiple times to simulate an infinite scroll
        for (let i = 0; i < 100; i++) { 
            const chunkWithNewIds = shuffledFeed.map(item => {
                // The original ID might be something like 'quiz-123'. 
                // We append the iteration index to make it unique across chunks.
                return {
                    ...item,
                    id: `${item.id}-${i}`
                };
            });
            trulyInfiniteFeed.push(...chunkWithNewIds);
        }
        
        setFullFeed(trulyInfiniteFeed);

    }, []);

    const renderFeedItem = (item: FeedItem) => {
        switch (item.type) {
            case 'quiz':
                const quizData = item.data as QuizQuestionType;
                return (quizData.options && quizData.options.length > 0)
                    ? <QuizCard key={item.id} quiz={quizData} />
                    : <RevealQuizCard key={item.id} quiz={quizData} />;
            case 'contest':
                return <ContestCard key={item.id} contest={item.data as Contest} />;
            case 'tournament':
                return <ContestCard key={item.id} contest={item.data as Contest} isTournament={true} />;
            case 'match':
                return <MatchCard key={item.id} match={item.data as MatchType} />;
            case 'announcement':
                return <AnnouncementCard key={item.id} announcement={item.data as Announcement} />;
            default:
                return null;
        }
    };


  return (
    <div className="p-4 space-y-6">
        {/* Horizontal Events Scroll */}
        <div className="-mx-4">
            <div className="px-4 mb-3 flex justify-between items-center">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Évènements à venir</h2>
                <button className="text-sm font-medium text-[var(--color-accent)]">Voir tout</button>
            </div>
            <div className="flex overflow-x-auto pb-4 px-4 space-x-4 scrollbar-hide snap-x">
                {randomEvents.map(event => (
                    <div key={event.id} className="flex-none w-64 bg-[var(--color-card-bg)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden snap-start">
                        <div className="relative h-32">
                            <img 
                                src={event.image} 
                                alt={event.title} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-wider">
                                {event.category}
                            </div>
                        </div>
                        <div className="p-3">
                            <h3 className="font-bold text-[var(--color-text-primary)] line-clamp-1">{event.title}</h3>
                            <div className="mt-1 flex items-center text-xs text-[var(--color-text-secondary)]">
                                <CalendarIcon className="w-3 h-3 mr-1" />
                                <span>{event.date}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Fil d'actualité</h1>
        
        {/* Scheduled Sessions */}
        {scheduledSessions.length > 0 && (
            <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-secondary)] mb-2">Sessions programmées</h2>
                <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-0">
                    <ul className="divide-y divide-[var(--color-border)]">
                        {scheduledSessions.map(session => (
                            <li key={session.id} className="p-4 flex items-center space-x-4">
                                <div className="p-2 bg-[var(--color-accent-light-bg)] rounded-full">
                                    {session.type === 'quiz_reminder' ? 
                                     <QuizIcon className="w-5 h-5 text-[var(--color-accent-text)]" /> : 
                                     <CalendarIcon className="w-5 h-5 text-[var(--color-accent-text)]" />}
                                </div>
                                <div>
                                    <p className="font-semibold text-[var(--color-text-primary)]">{session.title}</p>
                                    <p className="text-sm text-[var(--color-text-secondary)]">{formatSessionTime(session.time)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        )}

        {/* Dynamic Feed */}
        <div className="space-y-4">
            {visibleFeed.map((item, index) => (
                <div key={`feed-${item.id}-${index}`}>
                    {renderFeedItem(item)}
                </div>
            ))}
        </div>

        {/* Infinite Scroll Loader */}
        <div ref={loaderRef} className="h-20 flex justify-center items-center">
            {isLoading && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-[var(--color-accent)]"></div>
            )}
        </div>
    </div>
  );
};

export default Accueil;