import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SearchIcon, ArrowRightIcon } from './icons';
import { useDebounce } from '../hooks/useDebounce';
import { getEnglishDefinition, getWordList, generateSpeechFromText, getAlphabeticalWordBatch } from '../services/geminiService';
import type { ApiResponse } from '../types';
import ExplanationRenderer from './ExplanationRenderer';
import { CalendarIcon, ClockIcon, BookOpenIcon, SparklesIcon } from './icons';


// --- ICONS ---

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const SpeakerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
);

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);


// --- AUDIO DECODING HELPERS ---
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


// --- SUB-COMPONENTS FOR UI STATES ---

const WordDetailsComponent: React.FC<{ 
    data: ApiResponse[], 
    onPlayAudio: (word: string) => void,
    onPlayExampleAudio: (text: string) => void,
    isAudioLoading: boolean,
    audioTarget: string | null
}> = ({ data, onPlayAudio, onPlayExampleAudio, isAudioLoading, audioTarget }) => {
    const firstEntry = data[0];
    if (!firstEntry) return null;

    const showIllustration = firstEntry.renderHints && firstEntry.renderHints.type !== 'None';
    
    // Helper function to render text with bold markdown
    const renderWithBold = (text: string) => {
        if (!text) return null;
        return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-semibold not-italic text-[var(--color-text-primary)]">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
         <div className="mt-2">
            <div className="flex items-center gap-4 sm:gap-6 mb-6 flex-wrap border-b border-[var(--color-border)] pb-6">
                {/* French side */}
                <div>
                    <h2 className="text-4xl sm:text-5xl font-bold text-[var(--color-text-primary)] capitalize">{firstEntry.word}</h2>
                    <div className="flex items-center gap-x-2 mt-1">
                        {firstEntry.phonetic && <p className="text-lg text-[var(--color-text-secondary)] font-mono">{firstEntry.phonetic}</p>}
                        <button
                            onClick={() => onPlayAudio(firstEntry.word)}
                            disabled={isAudioLoading}
                            className="p-1 text-[var(--color-text-secondary)] rounded-full hover:bg-[var(--color-bg-secondary)] disabled:text-gray-400"
                            aria-label="Écouter la prononciation du mot français"
                        >
                            {isAudioLoading && audioTarget === firstEntry.word ? <SpinnerIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <ArrowRightIcon className="w-8 h-8 text-blue-300 dark:text-blue-800 flex-shrink-0" />

                {/* English side */}
                {firstEntry.translation && (
                    <div>
                        <h2 className="text-4xl sm:text-5xl font-bold text-blue-600 dark:text-blue-400 capitalize">{firstEntry.translation}</h2>
                        <div className="flex items-center gap-x-2 mt-1">
                             <button
                                onClick={() => onPlayExampleAudio(firstEntry.translation!)}
                                disabled={isAudioLoading}
                                className="p-1 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:text-gray-400"
                                aria-label="Écouter la prononciation de la traduction"
                            >
                                {isAudioLoading && audioTarget === firstEntry.translation ? <SpinnerIcon className="w-6 h-6" /> : <SpeakerIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showIllustration && firstEntry.renderHints && (
                <div className="my-6">
                    <h3 className="text-md font-semibold text-[var(--color-text-secondary)] mb-2">Illustration</h3>
                    <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]">
                         <ExplanationRenderer renderHints={firstEntry.renderHints} />
                    </div>
                </div>
            )}

            {firstEntry.meanings.map((meaning, index) => (
                <div key={index} className="mt-6">
                    <div className="flex items-center mb-4">
                        <h3 className="font-bold italic text-lg text-[var(--color-text-primary)] capitalize">{meaning.partOfSpeech}</h3>
                        <hr className="flex-grow ml-4 border-t border-dashed border-[var(--color-border)]" />
                    </div>
                     <h4 className="text-md font-semibold text-[var(--color-text-secondary)] mb-3">Définitions</h4>
                    <div className="space-y-6">
                        {meaning.definitions.map((def, defIndex) => (
                            <div key={defIndex} className="pl-4 border-l-2 border-[var(--color-accent)]">
                                <p className="text-[var(--color-text-primary)]">{def.definition}</p>
                                
                                {def.examples && def.examples.length > 0 && (
                                    <div className="mt-4 space-y-3">
                                        {def.examples.map((ex, exIndex) => (
                                             <div key={exIndex} className="bg-[var(--color-bg-secondary)] p-3 rounded-lg border border-[var(--color-border)]">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm text-[var(--color-text-primary)] italic flex-1">
                                                        «&nbsp;{renderWithBold(ex.en)}&nbsp;»
                                                    </p>
                                                    <button 
                                                        onClick={() => onPlayExampleAudio(ex.en.replace(/\*\*/g, ''))}
                                                        disabled={isAudioLoading}
                                                        className="p-1 text-[var(--color-text-secondary)] rounded-full hover:bg-[var(--color-card-bg)] disabled:text-gray-400 disabled:cursor-wait flex-shrink-0"
                                                        aria-label="Écouter la phrase d'exemple en anglais"
                                                    >
                                                        {isAudioLoading && audioTarget === ex.en.replace(/\*\*/g, '') ? (
                                                            <SpinnerIcon className="w-4 h-4" />
                                                        ) : (
                                                            <SpeakerIcon className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                                <p className="mt-1 pl-1 text-sm text-[var(--color-text-secondary)]">
                                                   <span className="font-sans text-blue-500 mr-1">→</span> {renderWithBold(ex.fr)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {meaning.synonyms && meaning.synonyms.length > 0 && (
                         <div className="mt-6">
                            <h4 className="text-md font-semibold text-[var(--color-text-secondary)]">Synonymes</h4>
                            <div className="text-sm text-[var(--color-text-primary)] flex flex-wrap gap-2 mt-2">
                                {meaning.synonyms.map(s => <span key={s} className="bg-[var(--color-bg-secondary)] px-2.5 py-1 rounded-md border border-[var(--color-border)]">{s}</span>)}
                            </div>
                        </div>
                    )}
                    {meaning.antonyms && meaning.antonyms.length > 0 && (
                         <div className="mt-6">
                            <h4 className="text-md font-semibold text-[var(--color-text-secondary)]">Antonymes</h4>
                            <div className="text-sm text-[var(--color-text-primary)] flex flex-wrap gap-2 mt-2">
                                 {meaning.antonyms.map(a => <span key={a} className="bg-[var(--color-bg-secondary)] px-2.5 py-1 rounded-md border border-[var(--color-border)]">{a}</span>)}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const InitialPlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-secondary)]">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m4 13l4-4-4-4M19 17v-2a4 4 0 00-4-4H9m7 14l-4-4 4-4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Dictionnaire Français-Anglais</h2>
        <p className="max-w-xs mt-1">Recherchez un mot français pour obtenir sa définition en anglais.</p>
    </div>
);

const LoadingSpinner = ({ fullPanel = false }: { fullPanel?: boolean }) => {
    const spinner = <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2 border-[var(--color-accent)]"></div>;
    if (fullPanel) {
        return (
            <div className="flex justify-center items-center h-full">
                {spinner}
            </div>
        );
    }
    return spinner;
};

const PanelErrorMessage: React.FC<{ message: string; fullPanel?: boolean }> = ({ message, fullPanel = false }) => {
    const content = (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg text-center">
            <p className="font-bold">Erreur</p>
            <p className="mt-1 text-sm">{message}</p>
        </div>
    );

    if (fullPanel) {
         return (
            <div className="flex flex-col items-center justify-center h-full p-4">
                {content}
            </div>
        );
    }
    return <div className="p-4">{content}</div>;
};

const ActionButton: React.FC<{ icon: React.FC<{className?: string}>; label: string; onClick: () => void; isActive: boolean; }> = ({ icon: Icon, label, onClick, isActive }) => (
    <button 
        onClick={onClick} 
        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors space-y-1 w-full ${isActive ? 'bg-[var(--color-accent-light-bg)]' : 'hover:bg-[var(--color-bg-secondary)]'}`}
    >
        <Icon className="w-6 h-6 text-[var(--color-accent)]" />
        <span className={`text-xs font-medium ${isActive ? 'text-[var(--color-accent-text)] font-bold' : 'text-[var(--color-text-secondary)]'}`}>{label}</span>
    </button>
);


// --- MAIN COMPONENT ---

const DictionnaireFrEn: React.FC = () => {
    // State Management
    const [searchTerm, setSearchTerm] = useState('');
    const [commonWords, setCommonWords] = useState<string[]>([]);
    const [activeList, setActiveList] = useState<{ title: string; words: string[] } | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [wordDetails, setWordDetails] = useState<ApiResponse[] | null>(null);
    const [cache, setCache] = useState<Map<string, ApiResponse[]>>(new Map());

    // UI Feedback State
    const [isListLoading, setListLoading] = useState(false);
    const [isDetailsLoading, setDetailsLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [view, setView] = useState<'search' | 'history' | 'index'>('search');
    
    // Index specific state for infinite scroll
    const [indexWords, setIndexWords] = useState<string[]>([]);
    const [isFetchingIndex, setIsFetchingIndex] = useState(false);
    const [hasMoreIndexWords, setHasMoreIndexWords] = useState(true);
    const indexLoaderRef = useRef<HTMLDivElement | null>(null);


    // Audio State
    const [isAudioLoading, setAudioLoading] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [activeAudioSource, setActiveAudioSource] = useState<AudioBufferSourceNode | null>(null);
    const [audioTarget, setAudioTarget] = useState<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 400);

    // Effect for history persistence
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('dictionaryHistoryFrEn');
            if (savedHistory) setHistory(JSON.parse(savedHistory));
        } catch (e) { console.error("Could not load history", e); }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('dictionaryHistoryFrEn', JSON.stringify(history));
        } catch (e) { console.error("Could not save history", e); }
    }, [history]);

    // Effect for managing the AudioContext lifecycle
    useEffect(() => {
        if (typeof window !== 'undefined') {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        return () => {
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Effect for fetching lists for search view
    useEffect(() => {
        const fetchSearchList = async (query: string) => {
            setListLoading(true);
            setListError(null);
            try {
                const wordsFromAI = await getWordList(query);
                // Ensure the searched word is at the top and the list is unique
                const results = [query, ...wordsFromAI];
                const uniqueResults = Array.from(new Set(results));
                setActiveList({ title: 'Résultats', words: uniqueResults });
            } catch (error) {
                setListError("La recherche de mots a échoué.");
                setActiveList(null);
            } finally {
                setListLoading(false);
            }
        };

        if (debouncedSearchTerm) {
            setView('search');
            fetchSearchList(debouncedSearchTerm.trim().toLowerCase());
        } else {
             if (view === 'search') setActiveList(null);
        }
    }, [debouncedSearchTerm, view]);

    // Fetch common words for word of the day/random word features
    useEffect(() => {
        const fetchCommonWords = async () => {
            try {
                const words = await getWordList('common');
                setCommonWords(words);
            } catch (error) {
                console.error("Impossible de charger les mots courants :", error);
            }
        };
        fetchCommonWords();
    }, []);


    // Handler for selecting a word
    const handleSelectWord = useCallback(async (word: string) => {
        setDetailsLoading(true);
        setDetailsError(null);
        setWordDetails(null);
        setSelectedWord(word);
        
        setHistory(prev => Array.from(new Set([word, ...prev])).slice(0, 50)); // Add to history

        if (cache.has(word.toLowerCase())) {
            setWordDetails(cache.get(word.toLowerCase())!);
            setDetailsLoading(false);
            return;
        }

        try {
            const data = await getEnglishDefinition(word);
            if (!data || data.length === 0 || !data[0]?.word) {
                throw new Error(`Aucune définition n'a été trouvée pour "${word}".`);
            }
            setWordDetails(data);
            setCache(prevCache => new Map(prevCache).set(word.toLowerCase(), data));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
            setDetailsError(errorMessage);
        } finally {
            setDetailsLoading(false);
        }
    }, [cache]);

    const handleGoBack = () => {
        setSelectedWord(null);
        setDetailsError(null);
        setWordDetails(null);
        if (activeAudioSource) {
            activeAudioSource.stop();
            setActiveAudioSource(null);
        }
    };

    const playAudio = async (text: string, lang: 'fr' | 'en') => {
        if (activeAudioSource) {
            activeAudioSource.onended = null;
            activeAudioSource.stop();
        }
        setAudioLoading(true);
        setAudioError(null);
        setAudioTarget(text);
        
        try {
            const base64Audio = await generateSpeechFromText(text, lang);
            const audioContext = audioContextRef.current;
            if (!audioContext || audioContext.state === 'closed') {
                throw new Error("AudioContext indisponible.");
            }
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            const buffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start();

            source.onended = () => {
                setActiveAudioSource(currentSource => {
                    if (currentSource === source) {
                        setAudioTarget(null);
                        return null;
                    }
                    return currentSource;
                });
            };
            setActiveAudioSource(source);
        } catch (error) {
            console.error("Erreur de synthèse vocale:", error);
            setAudioError("La lecture a échoué.");
            setAudioTarget(null);
        } finally {
            setAudioLoading(false);
        }
    };

    const handlePlayMainWordAudio = (word: string) => playAudio(word, 'fr');
    const handlePlayExampleAudio = (text: string) => playAudio(text, 'en');

    // --- Infinite Scroll Logic for Index ---
    const fetchMoreIndexWords = useCallback(async () => {
        if (isFetchingIndex || !hasMoreIndexWords) return;

        setIsFetchingIndex(true);
        setListError(null);
        const lastWord = indexWords.length > 0 ? indexWords[indexWords.length - 1] : undefined;

        try {
            const newWords = await getAlphabeticalWordBatch(lastWord);
            if (newWords.length > 0) {
                setIndexWords(prev => {
                    const combined = [...prev, ...newWords];
                    // Remove duplicates just in case API overlaps
                    return Array.from(new Set(combined));
                });
            } else {
                setHasMoreIndexWords(false);
            }
        } catch (error) {
            setListError("Impossible de charger plus de mots.");
        } finally {
            setIsFetchingIndex(false);
        }
    }, [isFetchingIndex, hasMoreIndexWords, indexWords]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchMoreIndexWords();
                }
            }, { threshold: 1.0 }
        );
        const loader = indexLoaderRef.current;
        if (loader) observer.observe(loader);
        return () => { if (loader) observer.unobserve(loader) };
    }, [fetchMoreIndexWords]);


    // --- ACTION HANDLERS ---
    const handleWordOfTheDay = () => {
        if(commonWords.length === 0) return;
        const dayIndex = new Date().getDate() % commonWords.length;
        handleSelectWord(commonWords[dayIndex]);
    };
    const handleRandomWord = () => {
        if(commonWords.length === 0) return;
        const randomIndex = Math.floor(Math.random() * commonWords.length);
        handleSelectWord(commonWords[randomIndex]);
    };
    const handleShowHistory = () => {
        if (view === 'history') {
            setView('search');
            setActiveList(null);
        } else {
            setView('history');
            setActiveList({ title: 'Historique', words: history });
        }
    };
    const handleShowIndex = () => {
        if (view === 'index') {
            setView('search');
            setActiveList(null);
        } else {
            setView('index');
            setActiveList({ title: 'Index des mots', words: indexWords });
            if (indexWords.length === 0 && hasMoreIndexWords && !isFetchingIndex) {
                fetchMoreIndexWords();
            }
        }
    };
    

    // --- RENDER LOGIC ---
    const renderListView = () => {
        if (view === 'search') {
            if (isListLoading) {
                return <div className="flex justify-center items-center h-full p-4"><SpinnerIcon className="w-8 h-8"/></div>;
            }
            if (listError) return <PanelErrorMessage message={listError} />;
            if (activeList) {
                if (activeList.words.length === 0) {
                    return <div className="text-center text-sm text-[var(--color-text-secondary)] p-4">Aucun résultat.</div>;
                }
                return (
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] p-3 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">{activeList.title}</h3>
                        <ul className="divide-y divide-[var(--color-border)]">
                            {activeList.words.map(word => (
                                <li key={word}>
                                    <button onClick={() => handleSelectWord(word)} className="w-full text-left p-3 transition-colors text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]">
                                        {word}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            }
            return null; // Default empty state for search view
        }

        if (view === 'history') {
            if (!history || history.length === 0) {
                return <div className="text-center text-sm text-[var(--color-text-secondary)] p-4">L'historique est vide.</div>;
            }
            return (
                 <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] p-3 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">Historique</h3>
                    <ul className="divide-y divide-[var(--color-border)]">
                        {history.map(word => (
                            <li key={word}>
                                <button onClick={() => handleSelectWord(word)} className="w-full text-left p-3 transition-colors text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]">
                                    {word}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }

        if (view === 'index') {
            return (
                <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] p-3 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">Index des mots</h3>
                    {indexWords.length > 0 && (
                        <ul className="divide-y divide-[var(--color-border)]">
                            {indexWords.map(word => (
                                <li key={word}>
                                    <button onClick={() => handleSelectWord(word)} className="w-full text-left p-3 transition-colors text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]">
                                        {word}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div ref={indexLoaderRef} className="h-20 flex justify-center items-center">
                        {isFetchingIndex && <SpinnerIcon className="w-8 h-8"/>}
                        {!hasMoreIndexWords && indexWords.length > 0 && <p className="text-xs text-[var(--color-text-secondary)]">Fin de la liste.</p>}
                        {listError && <p className="text-xs text-red-500">{listError}</p>}
                    </div>
                </div>
            );
        }
        
        return null;
    };


    return (
        <div className="md:flex md:flex-row h-full relative overflow-hidden bg-[var(--color-card-bg)]">
            <div className={`
                absolute inset-0 md:relative md:inset-auto
                w-full md:w-1/3 md:max-w-xs flex-shrink-0 flex flex-col 
                border-r border-[var(--color-border)]
                transition-transform duration-300 ease-in-out
                bg-[var(--color-card-bg)]
                md:translate-x-0 ${selectedWord ? '-translate-x-full' : 'translate-x-0'}
            `}>
                <div className="p-4 border-b border-[var(--color-border)]">
                    <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Dictionnaire Fr-En</h1>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] pointer-events-none" />
                        <input
                            type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Rechercher un mot..."
                            className="w-full bg-[var(--color-bg-secondary)] border border-transparent rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-[var(--color-text-primary)]"
                            aria-label="Rechercher un mot dans le dictionnaire"
                        />
                    </div>
                </div>
                
                 <div className="p-2 grid grid-cols-4 gap-1 text-center border-b border-[var(--color-border)]">
                    <ActionButton icon={CalendarIcon} label="Mot du jour" onClick={handleWordOfTheDay} isActive={false} />
                    <ActionButton icon={ClockIcon} label="Historique" onClick={handleShowHistory} isActive={view === 'history'} />
                    <ActionButton icon={BookOpenIcon} label="Index" onClick={handleShowIndex} isActive={view === 'index'} />
                    <ActionButton icon={SparklesIcon} label="Aléatoire" onClick={handleRandomWord} isActive={false} />
                </div>

                <div className="flex-grow overflow-y-auto">
                    {renderListView()}
                </div>
            </div>

            {/* Right Panel: Details */}
            <div className={`
                absolute inset-0 md:relative md:inset-auto
                w-full md:flex-1
                flex flex-col
                bg-[var(--color-bg-primary)]
                transition-transform duration-300 ease-in-out
                md:translate-x-0 ${selectedWord ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {selectedWord && <button onClick={handleGoBack} className="md:hidden mb-4 flex items-center text-sm font-semibold text-[var(--color-accent-text)]" aria-label="Retour à la liste de mots">
                        <ArrowLeftIcon className="w-5 h-5 mr-2" />
                        Retour
                    </button>}
                    
                    {(() => {
                        if (isDetailsLoading) return <LoadingSpinner fullPanel />;
                        if (detailsError) return <PanelErrorMessage message={detailsError} fullPanel />;
                        if (wordDetails) return <WordDetailsComponent 
                                                    data={wordDetails} 
                                                    onPlayAudio={handlePlayMainWordAudio}
                                                    onPlayExampleAudio={handlePlayExampleAudio}
                                                    isAudioLoading={isAudioLoading} 
                                                    audioTarget={audioTarget} 
                                                />;
                        if (!selectedWord) return <InitialPlaceholder />;
                        return null;
                    })()}
                </div>
            </div>
        </div>
    );
};

export default DictionnaireFrEn;