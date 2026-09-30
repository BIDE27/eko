import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { getVerbConjugation, getVerbSuggestions, generateSpeechFromText, getSentenceExplanation, getVerbGroupExplanation } from '../services/geminiService';
import type { VerbConjugations, Moods, TenseConjugations, NonPersonTenses, ConjugationPart } from '../types';
import Card from './Card';
import Modal from './Modal';
import { SearchIcon, ConjugationIcon, ClockIcon, SparklesIcon } from './icons';

// --- ICONS (local definitions for audio controls) ---

const SpeakerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
);

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 6h12v12H6z" />
  </svg>
);

const LoopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 4v5h-5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 9a9 9 0 0115.65-4.01M20 15a9 9 0 01-15.65 4.01" />
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

interface AudioState {
    loadingTarget: string | null;
    playingTarget: string | null;
    loop: boolean;
    error: string | null;
}

interface AudioProps {
    onPlay: (text: string, targetId: string) => void;
    onStop: () => void;
    onToggleLoop: () => void;
    audioState: AudioState;
}

const StyledExplanation: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n').filter(line => line.trim() !== '');

  const renderInlineStyles = (text: string) => {
    // Regex to capture: **bolded**, "quoted", -ending, or a word ending in 'ant'
    const parts = text.split(/(\*\*.*?\*\*|"[^"]+"|-[a-zA-Z-]+|\b[a-zA-Z]+ant\b)/g);

    return parts.map((part, i) => {
        if (!part) return null;
        
        // Handle **bolded** text (like in fin**iss**ons)
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-red-500 dark:text-red-400">{part.slice(2, -2)}</strong>;
        }

        // Handle "quoted", -ending, or a word ending in 'ant'
        if (part.startsWith('"') || part.startsWith('-') || (part.endsWith('ant') && part.length > 3)) {
             return (
                <code key={i} className="font-mono bg-[var(--color-accent-light-bg)] text-[var(--color-accent-text)] px-2 py-1 rounded-md mx-1 font-bold text-sm border border-indigo-200 dark:border-indigo-700">
                    {part.replace(/"/g, '')}
                </code>
            );
        }

        return part;
    });
  };

  const renderLine = (line: string, index: number) => {
    // Main Headers like "LE DEUXIÈME GROUPE DE VERBES"
    if (line.match(/^LE\s[A-ZÈÊ]+/)) {
      return (
        <h3 key={index} className="text-lg sm:text-xl font-extrabold text-[var(--color-accent)] tracking-wide uppercase mt-4 sm:mt-6 mb-2 sm:mb-3">
          {line}
        </h3>
      );
    }

    // Sub-headers like "Règle de l'infinitif :"
    const subheaderMatch = line.match(/^(Règle de l'infinitif|Condition clé|Exemples)\s*:\s*(.*)/);
    if (subheaderMatch) {
        const [, title, restOfLine] = subheaderMatch;
        return (
            <div key={index} className="mt-4">
                <h4 className="font-bold text-md text-[var(--color-text-primary)] mb-2">{title}</h4>
                {restOfLine && <p>{renderInlineStyles(restOfLine)}</p>}
            </div>
        );
    }

    // Example lines starting with '*'
    if (line.startsWith('* ')) {
        return (
            <div key={index} className="flex items-start pl-1 sm:pl-2 my-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 sm:mr-3 mt-0.5 text-blue-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <p className="flex-grow text-gray-600 dark:text-gray-400">
                    {renderInlineStyles(line.substring(2))}
                </p>
            </div>
        );
    }

    // Regular paragraph
    return <p key={index} className="my-2">{renderInlineStyles(line)}</p>;
  };

  return (
    <div className="text-sm text-[var(--color-text-secondary)] space-y-1 leading-relaxed">
      {lines.map(renderLine)}
    </div>
  );
};

const ConjugaisonFr: React.FC = () => {
    // State for user input, loading, error, and results
    const [verb, setVerb] = useState('');
    const [conjugations, setConjugations] = useState<VerbConjugations | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorSuggestions, setErrorSuggestions] = useState<string[]>([]);
    const [initialSearch, setInitialSearch] = useState(false);

    // State for history and view management
    const [history, setHistory] = useState<string[]>([]);
    const [view, setView] = useState<'search' | 'history'>('search');

    // State for sentence explanation modal
    const [explanationModal, setExplanationModal] = useState<{
        isOpen: boolean;
        isLoading: boolean;
        content: { explanation: string; examples: string[] } | null;
        error: string | null;
        title: string;
    }>({
        isOpen: false,
        isLoading: false,
        content: null,
        error: null,
        title: ''
    });

    // State for verb group explanation modal
    const [groupExplanationModal, setGroupExplanationModal] = useState<{
        isOpen: boolean;
        isLoading: boolean;
        content: string | null;
        error: string | null;
    }>({
        isOpen: false,
        isLoading: false,
        content: null,
        error: null
    });
    
    // Audio related state and refs
    const [audioState, setAudioState] = useState<AudioState>({ loadingTarget: null, playingTarget: null, loop: false, error: null });
    const audioContextRef = useRef<AudioContext | null>(null);
    const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioCache = useRef<Map<string, AudioBuffer>>(new Map());

    // Effect for AudioContext lifecycle management
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        return () => {
            if (activeAudioSourceRef.current) activeAudioSourceRef.current.stop();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, []);
    
    // Effect for history persistence
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('conjugationHistory');
            if (savedHistory) setHistory(JSON.parse(savedHistory));
        } catch (e) { console.error("Could not load conjugation history", e); }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('conjugationHistory', JSON.stringify(history));
        } catch (e) { console.error("Could not save conjugation history", e); }
    }, [history]);

    const infinitiveVerb = useMemo(() => {
        if (!conjugations?.Infinitif?.Présent) return null;

        const infinitivePart = conjugations.Infinitif.Présent;
        if (typeof infinitivePart === 'object' && infinitivePart !== null && 'stem' in infinitivePart) {
            return (infinitivePart as ConjugationPart).stem + (infinitivePart as ConjugationPart).ending;
        }
        return null;
    }, [conjugations]);
    
    // Effect to update history on successful search
    useEffect(() => {
        if (infinitiveVerb && !isLoading) {
            setHistory(prev => {
                const newHistory = [infinitiveVerb, ...prev.filter(v => v.toLowerCase() !== infinitiveVerb.toLowerCase())];
                return newHistory.slice(0, 50); // Limit history size
            });
        }
    }, [infinitiveVerb, isLoading]);

    const handleStopAudio = useCallback(() => {
        if (activeAudioSourceRef.current) {
            activeAudioSourceRef.current.onended = null;
            activeAudioSourceRef.current.stop();
            activeAudioSourceRef.current = null;
        }
        setAudioState(s => ({ ...s, playingTarget: null }));
    }, []);

    const handlePlayAudio = useCallback(async (text: string, targetId: string) => {
        if (activeAudioSourceRef.current) {
            activeAudioSourceRef.current.onended = null;
            activeAudioSourceRef.current.stop();
        }

        if (audioState.playingTarget === targetId) {
            handleStopAudio();
            return;
        }

        setAudioState(s => ({ ...s, loadingTarget: targetId, playingTarget: null, error: null }));

        try {
            let buffer = audioCache.current.get(text);
            if (!buffer) {
                const base64Audio = await generateSpeechFromText(text);
                const audioContext = audioContextRef.current;
                if (!audioContext) throw new Error("AudioContext not ready");
                buffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                audioCache.current.set(text, buffer);
            }
            
            const audioContext = audioContextRef.current;
            if (audioContext!.state === 'suspended') await audioContext!.resume();

            const source = audioContext!.createBufferSource();
            source.buffer = buffer;
            source.loop = audioState.loop;
            source.connect(audioContext!.destination);
            source.start();

            activeAudioSourceRef.current = source;
            setAudioState(s => ({ ...s, loadingTarget: null, playingTarget: targetId }));

            source.onended = () => {
                if (activeAudioSourceRef.current === source && !source.loop) {
                     setAudioState(s => s.playingTarget === targetId ? { ...s, playingTarget: null } : s);
                }
            };
        } catch (err) {
            setAudioState(s => ({ ...s, loadingTarget: null, error: "La lecture a échoué." }));
        }
    }, [audioState, handleStopAudio]);

    const handleToggleLoop = useCallback(() => {
        setAudioState(s => {
            const newLoopState = !s.loop;
            if (activeAudioSourceRef.current) {
                activeAudioSourceRef.current.loop = newLoopState;
            }
            return { ...s, loop: newLoopState };
        });
    }, []);
    
    const handleSearch = async (verbToSearch: string) => {
        setView('search');
        const trimmedVerb = verbToSearch.trim();
        setErrorSuggestions([]); 
        handleStopAudio();
        audioCache.current.clear();

        if (trimmedVerb.length === 0) {
            setConjugations(null);
            setError(null);
            setInitialSearch(false);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setInitialSearch(true);

        try {
            const result = await getVerbConjugation(trimmedVerb);
            setConjugations(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue.";
            setError(errorMessage);
            const suggestions = await getVerbSuggestions(trimmedVerb);
            setErrorSuggestions(suggestions);
            setConjugations(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExplainSentence = async (sentence: string) => {
        setExplanationModal({
            isOpen: true,
            isLoading: true,
            content: null,
            error: null,
            title: `Analyse de la phrase...`
        });

        try {
            const result = await getSentenceExplanation(sentence);
            setExplanationModal(prev => ({
                ...prev,
                isLoading: false,
                content: result,
                title: `Explication de "${sentence}"`
            }));
        } catch (err) {
            setExplanationModal(prev => ({
                ...prev,
                isLoading: false,
                error: "Fumi n'a pas pu analyser cette phrase. Veuillez réessayer."
            }));
        }
    };

    const handleExplainVerbGroup = async () => {
        if (!conjugations?.group) return;

        setGroupExplanationModal({ isOpen: true, isLoading: true, content: null, error: null });

        try {
            const explanation = await getVerbGroupExplanation(conjugations.group);
            setGroupExplanationModal(prev => ({ ...prev, isLoading: false, content: explanation }));
        } catch (err) {
            console.error("Failed to get verb group explanation:", err);
            setGroupExplanationModal(prev => ({ ...prev, isLoading: false, error: "Désolé, une explication n'a pas pu être chargée pour le moment." }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(verb);
    };
    
    const handleHistoryItemClick = (historyVerb: string) => {
        setVerb(historyVerb);
        handleSearch(historyVerb);
    };

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Art de conjuguer (Français)</h1>

            <form onSubmit={handleSubmit}>
                <div className="flex items-center space-x-2">
                    <div className="relative flex-grow">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] pointer-events-none" />
                        <input
                            type="search"
                            value={verb}
                            onChange={(e) => setVerb(e.target.value)}
                            placeholder="Entrez un verbe (ex: manger, suis, allés)"
                            className="w-full bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-[var(--color-text-primary)]"
                            aria-label="Rechercher un verbe"
                            autoCapitalize="none"
                            autoCorrect="off"
                        />
                    </div>
                     <button type="submit" className="flex-shrink-0 bg-[var(--color-accent)] text-white font-bold py-3 px-5 rounded-full hover:bg-[var(--color-accent-hover)] transition-colors disabled:bg-gray-400" disabled={isLoading || verb.trim().length === 0}>
                        Chercher
                    </button>
                    <button type="button" onClick={() => setView(v => v === 'history' ? 'search' : 'history')} className={`flex-shrink-0 p-3 rounded-full border transition-colors ${view === 'history' ? 'bg-[var(--color-accent-light-bg)] text-[var(--color-accent-text)] border-transparent' : 'bg-[var(--color-card-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]'}`} aria-label="Voir l'historique">
                        <ClockIcon className="w-6 h-6" />
                    </button>
                </div>
            </form>
            
            {view === 'history' ? (
                <Card>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Historique des recherches</h2>
                    {history.length > 0 ? (
                        <ul className="divide-y divide-[var(--color-border)]">
                            {history.map((item, index) => (
                                <li key={`${item}-${index}`}>
                                    <button onClick={() => handleHistoryItemClick(item)} className="w-full text-left p-3 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors rounded-lg">
                                        {item}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-[var(--color-text-secondary)] py-8">L'historique des recherches est vide.</p>
                    )}
                </Card>
            ) : (
                <>
                    {infinitiveVerb && conjugations && !isLoading && !error && (
                        <Card className="mb-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-4xl font-bold text-[var(--color-text-primary)] capitalize">
                                            {infinitiveVerb}
                                        </h2>
                                        <AudioButton
                                            targetId={`audio-infinitive`}
                                            audioState={audioState}
                                            onClick={() => handlePlayAudio(infinitiveVerb, `audio-infinitive`)}
                                            title={`Écouter ${infinitiveVerb}`}
                                            className="w-6 h-6"
                                        />
                                    </div>
                                    {conjugations.group && (
                                        <button
                                            onClick={handleExplainVerbGroup}
                                            className="mt-2 inline-block bg-[var(--color-accent-light-bg)] text-[var(--color-accent-text)] text-xs font-semibold px-2.5 py-1 rounded-full hover:ring-2 hover:ring-offset-2 hover:ring-[var(--color-accent)] hover:ring-offset-[var(--color-card-bg)] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-card-bg)]"
                                            title="Cliquez pour en savoir plus sur les groupes de verbes"
                                        >
                                            {conjugations.group}
                                        </button>
                                    )}
                                </div>
                                {conjugations.definition && (
                                    <p className="text-md text-[var(--color-text-secondary)] sm:text-right max-w-md pt-1">
                                        {conjugations.definition}
                                    </p>
                                )}
                            </div>
                        </Card>
                    )}

                    {isLoading && (
                        <div className="flex justify-center items-center pt-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2 border-[var(--color-accent)]"></div>
                        </div>
                    )}

                    {error && (
                        <div className="text-center mt-8 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <h3 className="text-lg font-semibold text-red-600 dark:text-red-300">Erreur</h3>
                            <p className="text-red-600 dark:text-red-300">{error}</p>
                            {errorSuggestions.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800/50">
                                    <h4 className="text-sm font-semibold text-red-700 dark:text-red-200 mb-2">Suggestions :</h4>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {errorSuggestions.map(suggestion => (
                                            <button
                                                key={suggestion}
                                                onClick={() => handleHistoryItemClick(suggestion)}
                                                className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-900/60 transition-colors"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!isLoading && !error && conjugations && <ResultsDisplay conjugations={conjugations} onPlay={handlePlayAudio} onStop={handleStopAudio} onToggleLoop={handleToggleLoop} audioState={audioState} onExplainSentence={handleExplainSentence} />}

                    {!isLoading && !conjugations && !error && !initialSearch && (
                        <div className="text-center text-[var(--color-text-secondary)] mt-8 p-6 bg-[var(--color-bg-secondary)] rounded-lg flex flex-col items-center">
                            <ConjugationIcon className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
                            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Conjuguez n'importe quel verbe</h2>
                            <p className="max-w-xs mt-1">Entrez un verbe français, même conjugué, pour voir sa table de conjugaison complète.</p>
                        </div>
                    )}
                </>
            )}

            <Modal
                isOpen={explanationModal.isOpen}
                onClose={() => setExplanationModal(prev => ({ ...prev, isOpen: false }))}
                title={explanationModal.title}
            >
                {explanationModal.isLoading && (
                    <div className="flex justify-center items-center py-8">
                        <SpinnerIcon className="w-8 h-8 text-[var(--color-accent)]" />
                    </div>
                )}
                {explanationModal.error && (
                    <p className="text-red-500">{explanationModal.error}</p>
                )}
                {explanationModal.content && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Explication</h3>
                            <p className="text-sm text-[var(--color-text-secondary)]">{explanationModal.content.explanation}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Autres exemples</h3>
                            <ul className="space-y-2 list-disc list-inside">
                                {explanationModal.content.examples.map((ex, i) => (
                                    <li key={i} className="text-sm text-[var(--color-text-secondary)] italic">« {ex} »</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </Modal>
            
             <Modal
                isOpen={groupExplanationModal.isOpen}
                onClose={() => setGroupExplanationModal({ isOpen: false, isLoading: false, content: null, error: null })}
                title="Comment identifier les groupes de verbes ?"
            >
                {groupExplanationModal.isLoading && (
                    <div className="flex justify-center items-center py-8">
                        <SpinnerIcon className="w-8 h-8 text-[var(--color-accent)]" />
                    </div>
                )}
                {groupExplanationModal.error && (
                    <p className="text-red-500">{groupExplanationModal.error}</p>
                )}
                {groupExplanationModal.content && (
                    <StyledExplanation content={groupExplanationModal.content} />
                )}
            </Modal>
        </div>
    );
};

const AudioButton: React.FC<{
    targetId: string;
    audioState: AudioState;
    onClick: () => void;
    className?: string;
    title?: string;
}> = ({ targetId, audioState, onClick, className = 'w-5 h-5', title }) => {
    const isLoading = audioState.loadingTarget === targetId;
    const isPlaying = audioState.playingTarget === targetId;

    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={`p-1 rounded-full transition-colors ${isPlaying ? 'bg-red-100 text-red-500' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'} disabled:cursor-wait`}
            title={title}
        >
            {isLoading ? <SpinnerIcon className={className} /> : isPlaying ? <StopIcon className={className} /> : <SpeakerIcon className={className} />}
        </button>
    );
};

interface ResultsDisplayProps extends AudioProps {
    conjugations: VerbConjugations;
    onExplainSentence: (sentence: string) => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ conjugations, onExplainSentence, ...audioProps }) => {
    const getFullConjugationText = useCallback(() => {
        let fullText = "";
    
        const formatConjugationPart = (part: string | ConjugationPart | undefined) => {
             if (typeof part === 'object' && part) return (part as ConjugationPart).stem + (part as ConjugationPart).ending;
             return part || '';
        }

        if (conjugations.Infinitif) {
            fullText += `Infinitif. Présent: ${formatConjugationPart(conjugations.Infinitif.Présent)}. Passé: ${formatConjugationPart(conjugations.Infinitif.Passé)}. `;
        }
        if (conjugations.Participe) {
            fullText += `Participe. Présent: ${formatConjugationPart(conjugations.Participe.Présent)}. Passé: ${formatConjugationPart(conjugations.Participe.Passé)}. `;
        }
    
        const moods = ['Indicatif', 'Subjonctif', 'Conditionnel', 'Impératif'];
        moods.forEach(mood => {
            const moodData = conjugations[mood as keyof VerbConjugations] as Moods | undefined;
            if (moodData) {
                fullText += `${mood}. `;
                const isSubjunctive = mood === 'Subjonctif';
                const isImperative = mood === 'Impératif';
                
                for (const [tense, tenseConj] of Object.entries(moodData)) {
                    fullText += `${tense}. `;
                    const persons = isImperative ? ['tu', 'nous', 'vous'] : ['je', 'tu', 'il/elle/on', 'nous', 'vous', 'ils/elles'];
                    for (const person of persons) {
                        const conj = tenseConj[person as keyof TenseConjugations];
                        if (conj !== '-') {
                            if (typeof conj === 'object' && conj) {
                                let displayPerson: string = person;
                                const verbCombined = (conj as ConjugationPart).stem + (conj as ConjugationPart).ending;
                                
                                if (person === 'je' && ['a', 'e', 'i', 'o', 'u', 'h', 'y'].includes(verbCombined.charAt(0).toLowerCase())) {
                                    displayPerson = "j'";
                                }
    
                                const prefix = isSubjunctive ? (person.startsWith('i') ? "qu'" : 'que ') : '';
                                const fullConjugationText = `${isImperative ? '' : `${prefix}${displayPerson} `}${verbCombined}`;
                                fullText += `${fullConjugationText}. `;
                            }
                        }
                    }
                }
            }
        });
    
        return fullText;
    }, [conjugations]);

    const moodKeys = useMemo(() => 
        Object.keys(conjugations).filter(key => 
            !['Infinitif', 'Participe', 'error', 'group', 'definition'].includes(key) && conjugations[key as keyof VerbConjugations]
        ), [conjugations]);

    const [activeMood, setActiveMood] = useState<string | null>(null);

    useEffect(() => {
        if (moodKeys.length > 0 && (!activeMood || !moodKeys.includes(activeMood))) {
            setActiveMood(moodKeys.includes('Indicatif') ? 'Indicatif' : moodKeys[0]);
        }
    }, [moodKeys, activeMood]);
    
    const activeMoodData = activeMood ? conjugations[activeMood as keyof VerbConjugations] as Moods | undefined : undefined;


    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center gap-2">
                 <AudioButton targetId="all" audioState={audioProps.audioState} onClick={() => audioProps.onPlay(getFullConjugationText(), 'all')} className="w-6 h-6" title="Lire toute la conjugaison" />
                 <button onClick={audioProps.onToggleLoop} className={`p-1.5 rounded-full ${audioProps.audioState.loop ? 'text-indigo-500 bg-indigo-100' : 'text-gray-400 hover:bg-gray-100'}`} title="Activer/Désactiver la boucle">
                     <LoopIcon className="w-5 h-5" />
                 </button>
            </div>
            {audioProps.audioState.error && <p className="text-red-500 text-sm text-center">{audioProps.audioState.error}</p>}
            
            <NonPersonTenseCard title="Infinitif" tenses={conjugations.Infinitif} onExplainSentence={onExplainSentence} {...audioProps} />
            <NonPersonTenseCard title="Participe" tenses={conjugations.Participe} onExplainSentence={onExplainSentence} {...audioProps} />
            
            {moodKeys.length > 0 && (
                <Card>
                    <div className="border-b border-[var(--color-border)]">
                        <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Modes de conjugaison">
                            {moodKeys.map(mood => (
                                <button
                                    key={mood}
                                    onClick={() => setActiveMood(mood)}
                                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
                                        activeMood === mood
                                            ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                                            : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                >
                                    {mood}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="pt-6">
                        {activeMood && activeMoodData && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {Object.entries(activeMoodData).map(([tense, tenseConjugations]) => {
                                    const simpleTenseNames = ['Présent', 'Imparfait', 'Passé simple', 'Futur simple'];
                                    const isSimple = simpleTenseNames.includes(tense);
                                    // On mobile (single column grid), simple tenses get order-1, compound get order-2.
                                    // This groups all simple tenses first.
                                    // On desktop (md:), we reset the order to get the default layout which pairs simple and compound tenses.
                                    const orderClass = isSimple ? 'order-1' : 'order-2';
                                    return (
                                        <TenseTable 
                                            key={tense} 
                                            tense={tense} 
                                            conjugations={tenseConjugations} 
                                            mood={activeMood}
                                            onExplainSentence={onExplainSentence} 
                                            {...audioProps} 
                                            className={`${orderClass} md:order-none`}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

interface TenseTableProps extends AudioProps {
    tense: string;
    conjugations: TenseConjugations;
    mood: string;
    className?: string;
    onExplainSentence: (sentence: string) => void;
}

const TenseTable: React.FC<TenseTableProps> = ({ tense, conjugations, mood, onPlay, audioState, className, onExplainSentence }) => {
    const persons: (keyof TenseConjugations)[] = ['je', 'tu', 'il/elle/on', 'nous', 'vous', 'ils/elles'];
    const isSubjunctive = mood.toLowerCase() === 'subjonctif';
    const isImperative = mood.toLowerCase() === 'impératif';
    
    const imperativePersons: (keyof TenseConjugations)[] = ['tu', 'nous', 'vous'];
    const personsToShow = isImperative ? imperativePersons : persons;

    const getTenseText = () => {
        let text = `${tense}. `;
        personsToShow.forEach(person => {
            const conjugation = conjugations[person];
            
            if (typeof conjugation === 'object' && conjugation) {
                let displayPerson: string = person;
                const verbCombined = (conjugation as ConjugationPart).stem + (conjugation as ConjugationPart).ending;
                
                if (person === 'je' && ['a', 'e', 'i', 'o', 'u', 'h', 'y'].includes(verbCombined.charAt(0).toLowerCase())) {
                    displayPerson = "j'";
                }
                
                const prefix = isSubjunctive ? (person.startsWith('i') ? "qu'" : 'que ') : '';
                
                const fullConjugationText = `${isImperative ? '' : `${prefix}${displayPerson} `}${verbCombined}`;
                text += `${fullConjugationText}. `;
            }
        });
        return text;
    };

    const tenseTargetId = `tense-${mood}-${tense}`.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className={className}>
            <div className="flex items-center gap-2 mb-2">
                <h3 className="text-md font-semibold text-[var(--color-accent-text)]">{tense}</h3>
                <AudioButton targetId={tenseTargetId} audioState={audioState} onClick={() => onPlay(getTenseText(), tenseTargetId)} title={`Lire le temps : ${tense}`} />
            </div>
            <div className="divide-y divide-dashed divide-gray-200 dark:divide-gray-700 text-base">
                {personsToShow.map(person => {
                    const conjugation = conjugations[person];
                    
                    if (conjugation === '-') return null;

                    let displayPerson: string = person;
                    let prefix = isSubjunctive ? (person.startsWith('i') ? "qu'" : 'que ') : '';
                    let fullConjugationText = '';

                    if (typeof conjugation === 'object' && conjugation) {
                        const verbCombined = (conjugation as ConjugationPart).stem + (conjugation as ConjugationPart).ending;
                        if (person === 'je' && ['a', 'e', 'i', 'o', 'u', 'h', 'y'].includes(verbCombined.charAt(0).toLowerCase())) {
                            displayPerson = "j'";
                        }
                        fullConjugationText = `${isImperative ? '' : `${prefix}${displayPerson} `}${verbCombined}`;
                    }

                    const personTargetId = `person-${mood}-${tense}-${person}`.toLowerCase().replace(/\s+/g, '-');

                    return (
                        <div key={person} className="group py-2">
                            <div className="flex items-center">
                                <span className="w-28 flex-shrink-0 text-[var(--color-text-secondary)] font-medium pr-2 text-right">
                                    {!isImperative ? `${prefix}${displayPerson}` : ''}
                                </span>
                                <span className="font-sans text-lg text-[var(--color-text-primary)]">
                                    {typeof conjugation === 'object' && conjugation ? (
                                        <>
                                            <strong className="font-semibold">{(conjugation as ConjugationPart).stem}</strong>
                                            <strong className="font-semibold text-indigo-600 dark:text-indigo-400">{(conjugation as ConjugationPart).ending}</strong>
                                        </>
                                    ) : (
                                        <span className="text-gray-400 dark:text-gray-600">{conjugation as string}</span>
                                    )}
                                </span>
                                 <div className="pl-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <AudioButton targetId={personTargetId} audioState={audioState} onClick={() => onPlay(fullConjugationText, personTargetId)} title={`Lire : ${fullConjugationText}`} />
                                </div>
                            </div>
                            {typeof conjugation === 'object' && conjugation && (conjugation as ConjugationPart).example && (
                                <div className="pl-28 mt-1 group relative">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic pr-8">
                                        {(conjugation as ConjugationPart).example}
                                    </p>
                                    <button
                                        onClick={() => onExplainSentence((conjugation as ConjugationPart).example!)}
                                        className="absolute top-1/2 right-0 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label="Expliquer avec Fumi"
                                    >
                                        <SparklesIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface NonPersonTenseCardProps extends AudioProps {
    title: string;
    tenses?: NonPersonTenses;
    onExplainSentence: (sentence: string) => void;
}

const NonPersonTenseCard: React.FC<NonPersonTenseCardProps> = ({ title, tenses, onPlay, audioState, onExplainSentence }) => {
    if (!tenses) return null;
    return (
        <Card>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">{title}</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {Object.entries(tenses).map(([tense, value]) => {
                    let fullText = '';
                    let exampleText = '';
                    if (typeof value === 'object' && value) {
                        const v = value as ConjugationPart;
                        fullText = v.stem + v.ending;
                        exampleText = v.example || '';
                    } else if (typeof value === 'string') {
                        fullText = value;
                    }
                    const targetId = `tense-${title}-${tense}`.toLowerCase().replace(/\s+/g, '-');
                    return (
                        <div key={tense}>
                             <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-1">{tense}</h3>
                                <AudioButton targetId={targetId} audioState={audioState} onClick={() => onPlay(fullText, targetId)} title={`Lire le temps : ${tense}`}/>
                            </div>
                            <p className="font-sans text-lg text-[var(--color-text-primary)]">
                                <strong className="font-semibold text-indigo-600 dark:text-indigo-400">
                                    {fullText}
                                </strong>
                            </p>
                            {exampleText && (
                                <div className="group relative mt-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic pr-8">
                                        {exampleText}
                                    </p>
                                    <button
                                        onClick={() => onExplainSentence(exampleText)}
                                        className="absolute top-1/2 right-0 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label="Expliquer avec Fumi"
                                    >
                                        <SparklesIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};


export default ConjugaisonFr;