import React, { useState, useMemo, useRef, useEffect } from 'react';
import Card from './Card';
import { TableIcon } from './icons';
import { generateSpeechFromText } from '../services/geminiService';

// --- ICONS ---

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

type AudioSegment = { buffer: AudioBuffer; type: 'intro' | 'table'; tableNum?: number };

// FIX: Define a union type for different kinds of text chunks to resolve type errors.
type TextChunk = { type: 'intro', prompt: string } | { type: 'table', tableNum: number, prompt: string };

const TableMultiplication: React.FC = () => {
    const [numberInput, setNumberInput] = useState<string>('');
    const [tableOf, setTableOf] = useState<number | null>(null);
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
    const [highlightedTableNumber, setHighlightedTableNumber] = useState<number | null>(null);
    
    // State for individual table audio
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [singleAudioBuffer, setSingleAudioBuffer] = useState<AudioBuffer | null>(null);
    const [isSingleAudioPlaying, setIsSingleAudioPlaying] = useState(false);
    const [isLoopingSingleAudio, setIsLoopingSingleAudio] = useState(false);
    const singleAudioContextRef = useRef<AudioContext | null>(null);
    const singleAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    // State for "All Tables" audio playback
    const [isGeneratingAllAudio, setIsGeneratingAllAudio] = useState(false);
    const [allAudioError, setAllAudioError] = useState<string | null>(null);
    const [allAudioSegments, setAllAudioSegments] = useState<AudioSegment[] | null>(null);
    const [isAllAudioPlaying, setIsAllAudioPlaying] = useState(false);
    const [isLoopingAllAudio, setIsLoopingAllAudio] = useState(false);
    const allAudioContextRef = useRef<AudioContext | null>(null);
    const currentAllAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const currentSegmentIndexRef = useRef(0);

    // Ref for animation frame to sync UI with audio
    const animationFrameRef = useRef<number | null>(null);
    const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Effect for managing AudioContext lifecycles
    useEffect(() => {
        // On mount, create contexts
        if (typeof window !== 'undefined') {
            singleAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            allAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        // On unmount, cleanup
        return () => {
            handleStopSingleAudio();
            handleStopAllAudio();
            if (singleAudioContextRef.current && singleAudioContextRef.current.state !== 'closed') {
                singleAudioContextRef.current.close();
            }
            if (allAudioContextRef.current && allAudioContextRef.current.state !== 'closed') {
                allAudioContextRef.current.close();
            }
        };
    }, []); // Empty dependency array ensures this runs only on mount and unmount.

    useEffect(() => {
        if (tableData) {
            rowRefs.current = rowRefs.current.slice(0, tableData.length);
        }
    }, [tableOf]);

    useEffect(() => {
        if (highlightedIndex !== null && isSingleAudioPlaying && rowRefs.current[highlightedIndex]) {
            rowRefs.current[highlightedIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [highlightedIndex, isSingleAudioPlaying]);


    const stopHighlightAnimation = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setHighlightedIndex(null);
    };

    const startSingleTableAnimation = (audioContext: AudioContext, audioSource: AudioBufferSourceNode, totalDuration: number) => {
        stopHighlightAnimation();
        const startTime = audioContext.currentTime;

        const parts: string[] = [];
        if (tableOf === null) return;

        parts.push(`Table de multiplication de ${tableOf}.`);
        for (let i = 0; i <= 12; i++) {
            parts.push(`${tableOf} fois ${i} égale ${tableOf * i}.`);
        }
        
        const timingMap: { startTime: number, endTime: number }[] = [];
        const totalChars = parts.reduce((sum, part) => sum + part.length, 0);
        if (totalChars > 0) {
            const durationPerChar = totalDuration / totalChars;
            let cumulativeTime = 0;
            for (const part of parts) {
                const partDuration = part.length * durationPerChar;
                timingMap.push({ startTime: cumulativeTime, endTime: cumulativeTime + partDuration });
                cumulativeTime += partDuration;
            }
        }

        const animate = () => {
            if (audioSource !== singleAudioSourceRef.current) return;
            const elapsedTime = audioContext.currentTime - startTime;
            const timeInCurrentLoop = elapsedTime % totalDuration;
            
            const currentPartIndex = timingMap.findIndex(timing => timeInCurrentLoop >= timing.startTime && timeInCurrentLoop < timing.endTime);

            if (currentPartIndex > 0) {
                const lineIndex = currentPartIndex - 1;
                setHighlightedIndex(lineIndex < 13 ? lineIndex : null);
            } else {
                setHighlightedIndex(null);
            }
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        animationFrameRef.current = requestAnimationFrame(animate);
    };

    const startRowHighlightAnimation = (duration: number, tableNum: number) => {
        if (!allAudioContextRef.current || !isAllAudioPlaying) return;
        
        const startTime = allAudioContextRef.current.currentTime;
        
        const rowParts: string[] = [];
        for (let i = 0; i <= 12; i++) {
            rowParts.push(`${tableNum} fois ${i} égale ${tableNum * i}.`);
        }

        const timingMap: { startTime: number, endTime: number }[] = [];
        const totalChars = rowParts.reduce((sum, part) => sum + part.length, 0);
        if (totalChars > 0) {
            // NOTE: The title "Table de X" is spoken in the audio buffer, so we need to account for its time.
            // We'll approximate its duration as a fraction of the total. A ratio of 1/14 is a good estimate.
            const titleDuration = duration / 14; 
            const rowsDuration = duration - titleDuration;
            const durationPerChar = rowsDuration / totalChars;
            let cumulativeTime = titleDuration; // Start after the title
            for (const part of rowParts) {
                const partDuration = part.length * durationPerChar;
                timingMap.push({ startTime: cumulativeTime, endTime: cumulativeTime + partDuration });
                cumulativeTime += partDuration;
            }
        }
        
        const animate = () => {
            if (!allAudioContextRef.current || !isAllAudioPlaying) return;
            
            const elapsedTime = allAudioContextRef.current.currentTime - startTime;
            if (elapsedTime > duration) {
                setHighlightedIndex(null);
                return;
            }

            const currentPartIndex = timingMap.findIndex(timing => elapsedTime >= timing.startTime && elapsedTime < timing.endTime);

            setHighlightedIndex(currentPartIndex !== -1 ? currentPartIndex : null);
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        animationFrameRef.current = requestAnimationFrame(animate);
    };


    const handleGenerate = () => {
        const num = parseInt(numberInput, 10);
        if (!isNaN(num) && num >= 0) {
            setTableOf(num);
        } else {
            setTableOf(null);
        }
    };

    const handleQuickSelect = (num: number) => {
        setNumberInput(String(num));
        setTableOf(num);
    };
    
    const tableData = useMemo(() => {
        if (tableOf === null) return [];
        return Array.from({ length: 13 }, (_, i) => ({
            multiplier: i,
            result: tableOf * i,
        }));
    }, [tableOf]);
    
    // --- AUDIO LOGIC ---

    const handleStopSingleAudio = () => {
        if (singleAudioSourceRef.current) {
            singleAudioSourceRef.current.onended = null;
            singleAudioSourceRef.current.stop();
            singleAudioSourceRef.current = null;
        }
        stopHighlightAnimation();
        setIsSingleAudioPlaying(false);
    };

    const playSingleAudioFromBuffer = async (buffer: AudioBuffer) => {
        handleStopAllAudio();
        const audioContext = singleAudioContextRef.current;
        if (!audioContext) return;
        if (audioContext.state === 'suspended') await audioContext.resume();

        handleStopSingleAudio();

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = isLoopingSingleAudio;
        source.connect(audioContext.destination);
        source.start();

        singleAudioSourceRef.current = source;
        setIsSingleAudioPlaying(true);
        startSingleTableAnimation(audioContext, source, buffer.duration);

        source.onended = () => {
            if (!source.loop && singleAudioSourceRef.current === source) {
                handleStopSingleAudio();
            }
        };
    };

    const handlePlaySingleAudio = async () => {
        if (tableOf === null) return;
        if (singleAudioBuffer) {
            playSingleAudioFromBuffer(singleAudioBuffer);
            return;
        }
        setIsGeneratingAudio(true); setAudioError(null);
        try {
            const prompt = `Table de multiplication de ${tableOf}. ` +
                Array.from({ length: 13 }, (_, i) => `${tableOf} fois ${i} égale ${tableOf * i}.`).join(' ');

            const base64Audio = await generateSpeechFromText(prompt);

            const audioContext = singleAudioContextRef.current;
            if (!audioContext) throw new Error("AudioContext non initialisé.");
            
            const buffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
            
            setSingleAudioBuffer(buffer);
            playSingleAudioFromBuffer(buffer);
        } catch (err) {
            setAudioError("Impossible de générer la lecture.");
            console.error(err);
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const handleToggleSingleLoop = () => {
        const newLoopState = !isLoopingSingleAudio;
        setIsLoopingSingleAudio(newLoopState);
        if (singleAudioSourceRef.current) singleAudioSourceRef.current.loop = newLoopState;
    };
    
    useEffect(() => { handleStopSingleAudio(); setSingleAudioBuffer(null); setAudioError(null); }, [tableOf]);


    const handleStopAllAudio = () => {
        if (currentAllAudioSourceRef.current) {
            currentAllAudioSourceRef.current.onended = null;
            currentAllAudioSourceRef.current.stop();
            currentAllAudioSourceRef.current = null;
        }
        stopHighlightAnimation();
        setHighlightedTableNumber(null);
        setIsAllAudioPlaying(false);
    };

    const playAllSegments = async (startIndex = 0) => {
        if (!allAudioSegments || startIndex >= allAudioSegments.length) {
            if (isLoopingAllAudio && allAudioSegments) {
                playAllSegments(0); // Loop
            } else {
                handleStopAllAudio();
            }
            return;
        }
        
        handleStopSingleAudio();
        const audioContext = allAudioContextRef.current;
        if (!audioContext) return;
        if (audioContext.state === 'suspended') await audioContext.resume();
        
        const segment = allAudioSegments[startIndex];
        const source = audioContext.createBufferSource();
        source.buffer = segment.buffer;
        source.connect(audioContext.destination);
        source.start();

        currentAllAudioSourceRef.current = source;
        currentSegmentIndexRef.current = startIndex;
        setIsAllAudioPlaying(true);

        // Update UI for the current segment
        if (segment.type === 'table' && segment.tableNum) {
            setTableOf(segment.tableNum);
            setHighlightedTableNumber(segment.tableNum);
            stopHighlightAnimation(); // Clear previous animation
            animationFrameRef.current = requestAnimationFrame(() => startRowHighlightAnimation(segment.buffer.duration, segment.tableNum!));
        } else {
            setHighlightedTableNumber(null);
            setHighlightedIndex(null);
        }

        source.onended = () => {
            if (currentAllAudioSourceRef.current === source) {
                playAllSegments(startIndex + 1);
            }
        };
    };

    const handlePlayAllTables = async () => {
        if (allAudioSegments) { playAllSegments(0); return; }

        setIsGeneratingAllAudio(true); setAllAudioError(null);
        try {
            const audioContext = allAudioContextRef.current;
            if (!audioContext) throw new Error("AudioContext non initialisé.");

            const textChunks: TextChunk[] = [{ type: 'intro', prompt: "Révision des tables de multiplication." }];
            for (let tableNum = 2; tableNum <= 12; tableNum++) {
                textChunks.push({
                    type: 'table',
                    tableNum,
                    prompt: `Table de ${tableNum}. ` + Array.from({ length: 13 }, (_, i) => `${tableNum} fois ${i} égale ${tableNum * i}.`).join(' ')
                });
            }

            // Generate audio sequentially for better reliability
            const segments: AudioSegment[] = [];
            for (const chunk of textChunks) {
                const base64Audio = await generateSpeechFromText(chunk.prompt);
                const buffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                
                if (chunk.type === 'table') {
                    segments.push({ buffer, type: chunk.type, tableNum: chunk.tableNum });
                } else {
                    segments.push({ buffer, type: chunk.type });
                }
            }

            setAllAudioSegments(segments);
            playAllSegments(0);
        } catch (err) {
            setAllAudioError("Impossible de générer la lecture. Veuillez réessayer.");
            console.error(err);
        } finally {
            setIsGeneratingAllAudio(false);
        }
    };

    const handleToggleAllLoop = () => {
        setIsLoopingAllAudio(prev => !prev);
    };


    const quickSelectNumbers = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Table de Multiplication</h1>

            <Card>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="number-input" className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">
                            Entrez un nombre
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="number" id="number-input" value={numberInput} onChange={(e) => setNumberInput(e.target.value)}
                                placeholder="Ex: 7"
                                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                                min="0"
                            />
                            <button onClick={handleGenerate} disabled={!numberInput.trim()}
                                className="px-4 py-3 bg-[var(--color-accent)] text-white font-bold rounded-lg hover:bg-[var(--color-accent-hover)] disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors flex-shrink-0">
                                Générer
                            </button>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">Sélection rapide</h4>
                        <div className="flex flex-wrap gap-2 items-center">
                            {quickSelectNumbers.map(num => {
                                const isBeingRead = isAllAudioPlaying && highlightedTableNumber === num;
                                const isSelected = tableOf === num;
                                
                                let buttonClasses = "px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ";

                                if (isBeingRead) {
                                    // Strongest highlight for the currently spoken table
                                    buttonClasses += 'bg-[var(--color-accent)] text-white shadow-lg ring-2 ring-offset-2 ring-[var(--color-accent)] ring-offset-[var(--color-card-bg)]';
                                } else if (isSelected && !isAllAudioPlaying) {
                                    // Normal highlight for a manually selected table
                                    buttonClasses += 'bg-[var(--color-accent)] text-white shadow-sm';
                                } else {
                                    // Default style
                                    buttonClasses += 'bg-[var(--color-card-bg)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]';
                                }

                                return (
                                <button key={num} onClick={() => handleQuickSelect(num)} className={buttonClasses}>
                                    {num}
                                </button>
                                );
                            })}
                            <div className={`flex items-center gap-1 border rounded-full p-0.5 transition-all duration-300 ${isAllAudioPlaying ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg shadow-indigo-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
                                {isGeneratingAllAudio ? (
                                    <span className="p-2 text-gray-400"><SpinnerIcon className="w-5 h-5"/></span>
                                ) : isAllAudioPlaying ? (
                                    <button onClick={handleStopAllAudio} className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900" title="Arrêter">
                                        <StopIcon className="w-5 h-5"/>
                                    </button>
                                ) : (
                                    <button onClick={handlePlayAllTables} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" title="Lire toutes les tables (2 à 12)">
                                        <SpeakerIcon className="w-5 h-5"/>
                                    </button>
                                )}
                                {(allAudioSegments || isAllAudioPlaying) && !isGeneratingAllAudio && (
                                    <button onClick={handleToggleAllLoop} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${isLoopingAllAudio ? 'text-indigo-500' : 'text-gray-500'}`} title={isLoopingAllAudio ? "Désactiver la boucle" : "Activer la boucle"}>
                                        <LoopIcon className="w-5 h-5"/>
                                    </button>
                                )}
                            </div>
                        </div>
                         {allAudioError && <p className="text-red-500 text-sm mt-2">{allAudioError}</p>}
                    </div>
                </div>
            </Card>

            {tableOf !== null ? (
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Table de {tableOf}</h2>
                         <div className={`flex items-center gap-1 border rounded-full p-0.5 transition-all duration-300 ${isSingleAudioPlaying ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-md shadow-indigo-500/10' : 'border-transparent'}`}>
                            {isGeneratingAudio ? (
                                <span className="p-2 text-gray-400"><SpinnerIcon className="w-5 h-5"/></span>
                            ) : isSingleAudioPlaying ? (
                                <button onClick={handleStopSingleAudio} className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900" title="Arrêter">
                                    <StopIcon className="w-5 h-5"/>
                                </button>
                            ) : (
                                <button onClick={handlePlaySingleAudio} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" title="Lire la table">
                                    <SpeakerIcon className="w-5 h-5"/>
                                </button>
                            )}
                            {(singleAudioBuffer || isSingleAudioPlaying) && !isGeneratingAudio && (
                                <button onClick={handleToggleSingleLoop} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${isLoopingSingleAudio ? 'text-indigo-500' : 'text-gray-500'}`} title={isLoopingSingleAudio ? "Désactiver la boucle" : "Activer la boucle"}>
                                    <LoopIcon className="w-5 h-5"/>
                                </button>
                            )}
                        </div>
                    </div>
                    {audioError && <p className="text-red-500 text-sm mb-4">{audioError}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {tableData.map((item, index) => (
                            <div 
                                key={item.multiplier}
                                ref={el => { if (rowRefs.current) rowRefs.current[index] = el; }}
                                className={`p-3 rounded-lg flex items-center justify-between transition-all duration-150 ease-in-out ${
                                    highlightedIndex === item.multiplier 
                                        ? 'bg-[var(--color-accent-light-bg)] ring-2 ring-inset ring-[var(--color-accent)]' 
                                        : 'bg-[var(--color-bg-secondary)]'
                                }`}>
                                <span className="font-mono text-lg text-[var(--color-text-primary)]">
                                    {tableOf}
                                    <span className="text-[var(--color-text-secondary)] mx-3">×</span>
                                    <span className="inline-block w-6 text-right">{item.multiplier}</span>
                                    <span className="text-[var(--color-text-secondary)] mx-3">=</span>
                                </span>
                                <span className="font-mono font-bold text-xl text-[var(--color-accent)] w-12 text-right">
                                    {item.result}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            ) : (
                <div className="text-center text-[var(--color-text-secondary)] mt-8 p-6 bg-[var(--color-bg-secondary)] rounded-lg flex flex-col items-center">
                    <TableIcon className="w-12 h-12 mb-4 text-gray-400" />
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Prêt à calculer</h2>
                    <p className="max-w-xs mt-1">Entrez un nombre ci-dessus pour afficher sa table de multiplication.</p>
                </div>
            )}
        </div>
    );
};

export default TableMultiplication;
