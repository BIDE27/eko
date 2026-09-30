import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { dictations } from './dictationData';
import { Dictation, Page } from '../types';
import Card from './Card';
import { BookOpenIcon, PlayIcon, ChevronLeftIcon, SpeakerIcon, StopIcon, CheckCircleIcon, RefreshCwIcon, SparklesIcon } from './icons';
import { generateSpeechFromText } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

// Audio decoding helpers (copied from ConjugaisonFr for consistency)
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

const LivreDictees: React.FC = () => {
  const [selectedDictation, setSelectedDictation] = useState<Dictation | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [userText, setUserText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [phrases, setPhrases] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('Tous');

  const filters = ['Tous', 'CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale', 'Université'];

  const filteredDictations = useMemo(() => {
    if (activeFilter === 'Tous') return dictations;
    return dictations.filter(d => d.level.includes(activeFilter));
  }, [activeFilter]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCache = useRef<Map<string, AudioBuffer>>(new Map());
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return () => {
      stopAudio();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    };
  }, []);

  const stopAudio = useCallback(() => {
    if (activeAudioSourceRef.current) {
      activeAudioSourceRef.current.onended = null;
      activeAudioSourceRef.current.stop();
      activeAudioSourceRef.current = null;
    }
    setIsReading(false);
  }, []);

  const playAudio = useCallback(async (text: string) => {
    stopAudio();
    setIsReading(true);
    setAudioError(null);

    try {
      let buffer = audioCache.current.get(text);
      if (!buffer) {
        const base64Audio = await generateSpeechFromText(text, 'fr', true, true);
        const audioContext = audioContextRef.current;
        if (!audioContext) throw new Error("AudioContext not ready");
        buffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
        audioCache.current.set(text, buffer);
      }

      const audioContext = audioContextRef.current;
      if (audioContext!.state === 'suspended') await audioContext!.resume();

      const source = audioContext!.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext!.destination);
      source.start();

      activeAudioSourceRef.current = source;
      
      return new Promise<void>((resolve) => {
        source.onended = () => {
          activeAudioSourceRef.current = null;
          setIsReading(false);
          resolve();
        };
      });
    } catch (err) {
      console.error("Audio playback error:", err);
      setAudioError("La lecture a échoué.");
      setIsReading(false);
    }
  }, [stopAudio]);

  const handleStartDictation = (dictation: Dictation) => {
    setSelectedDictation(dictation);
    const splitPhrases = dictation.content.match(/[^.!?]+[.!?]+/g) || [dictation.content];
    setPhrases(splitPhrases.map(p => p.trim()));
    setCurrentPhraseIndex(0);
    setUserText('');
    setIsSessionActive(true);
    setIsFinished(false);
    setShowCorrection(false);
  };

  const readCurrentPhrase = async () => {
    if (currentPhraseIndex >= phrases.length || isReading) return;
    
    const phrase = phrases[currentPhraseIndex];
    await playAudio(phrase);
    
    if (isSessionActive && !isFinished) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await playAudio(phrase);
      
      // Auto advance after reading twice and waiting a bit
      const wordsCount = phrase.split(' ').length;
      const delayPerWord = 1200; // ms per word to allow typing
      const totalDelay = Math.max(3000, wordsCount * delayPerWord);
      
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        if (currentPhraseIndex < phrases.length - 1) {
          setCurrentPhraseIndex(prev => prev + 1);
        } else {
          setIsFinished(true);
        }
      }, totalDelay);
    }
  };

  useEffect(() => {
    if (isSessionActive && !isFinished && phrases.length > 0) {
      readCurrentPhrase();
    }
  }, [currentPhraseIndex, isSessionActive, isFinished]);

  const handleBack = () => {
    if (isSessionActive) {
      setIsSessionActive(false);
      stopAudio();
      if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    } else {
      setSelectedDictation(null);
    }
  };

  const getCorrection = () => {
    if (!selectedDictation) return null;
    const originalWords = selectedDictation.content.split(/\s+/);
    const userWords = userText.trim().split(/\s+/);
    
    let errorsCount = 0;
    const result = originalWords.map((word, i) => {
      const userWord = userWords[i] || "";
      const isCorrect = word.toLowerCase().replace(/[.,!?;]/g, '') === userWord.toLowerCase().replace(/[.,!?;]/g, '');
      if (!isCorrect) errorsCount++;
      
      return {
        word,
        userWord,
        isCorrect
      };
    });

    return { result, errorsCount };
  };

  useEffect(() => {
    if (showCorrection) {
      const { errorsCount } = getCorrection() || { errorsCount: 0 };
      if (errorsCount === 0) {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
      }
    }
  }, [showCorrection]);

  if (showCorrection && selectedDictation) {
    const { result, errorsCount } = getCorrection()!;
    return (
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <button onClick={() => setShowCorrection(false)} className="p-2 rounded-full hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Corrigé : {selectedDictation.title}</h2>
          <div className="w-10"></div>
        </div>

        <Card className="p-6 space-y-6">
          <div className={`flex items-center justify-between p-4 rounded-xl border ${
            errorsCount === 0 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
          }`}>
            <span className={`text-lg font-bold ${
              errorsCount === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {errorsCount === 0 ? 'Félicitations ! Aucune faute :' : 'Nombre de fautes :'}
            </span>
            <span className={`text-2xl font-black ${
              errorsCount === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {errorsCount}
            </span>
          </div>

          <div className="text-lg leading-relaxed text-[var(--color-text-primary)] space-x-1">
            {result.map((item, i) => (
              <span key={i} className="inline-block relative group">
                <span className={item.isCorrect ? "" : "text-red-600 dark:text-red-400 underline decoration-wavy decoration-red-500 underline-offset-4"}>
                  {item.word}
                </span>
                {!item.isCorrect && (
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Votre saisie : {item.userWord || "(vide)"}
                  </span>
                )}
                {" "}
              </span>
            ))}
          </div>

          <div className="pt-6">
            <button 
              onClick={handleBack}
              className="w-full bg-[var(--color-accent)] text-white font-bold py-4 rounded-2xl hover:bg-[var(--color-accent-hover)] transition-all shadow-lg"
            >
              Retour au catalogue
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (isSessionActive && selectedDictation) {
    return (
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="p-2 rounded-full hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] truncate px-4">{selectedDictation.title}</h2>
          <div className="w-10"></div>
        </div>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700">
            <motion.div 
              className="h-full bg-[var(--color-accent)]"
              initial={{ width: 0 }}
              animate={{ width: `${((currentPhraseIndex + 1) / phrases.length) * 100}%` }}
            />
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Phrase {currentPhraseIndex + 1} sur {phrases.length}
              </span>
              <div className="flex items-center space-x-2">
                {isReading && (
                  <span className="flex items-center text-xs font-bold text-[var(--color-accent-text)] animate-pulse">
                    <SpeakerIcon className="w-4 h-4 mr-1" /> Lecture en cours...
                  </span>
                )}
                <button 
                  onClick={() => {
                    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
                    readCurrentPhrase();
                  }}
                  disabled={isReading}
                  className={`p-2 rounded-full transition-all ${
                    isReading 
                      ? 'text-gray-300' 
                      : 'text-[var(--color-accent-text)] hover:bg-[var(--color-accent-light-bg)]'
                  }`}
                  title="Réécouter la phrase"
                >
                  <RefreshCwIcon className={`w-5 h-5 ${isReading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <textarea
              id="dictation-input"
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder="Saisissez la dictée ici..."
              className="w-full h-64 p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-lg leading-relaxed resize-none"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              autoFocus
            />

            <div className="flex justify-between items-center text-xs text-[var(--color-text-secondary)] italic">
              <p>Les phrases s'enchaînent automatiquement après la lecture.</p>
              {isFinished && (
                <button
                  onClick={() => setShowCorrection(true)}
                  className="bg-green-600 text-white font-bold py-3 px-8 rounded-full hover:bg-green-700 transition-all shadow-lg"
                >
                  VOIR LE CORRIGÉ
                </button>
              )}
            </div>
          </div>
        </Card>

        <AnimatePresence>
          {isFinished && !showCorrection && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircleIcon className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-green-800 dark:text-green-200">Dictée terminée !</h2>
              <button 
                onClick={() => setShowCorrection(true)}
                className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <SparklesIcon className="w-5 h-5" />
                <span>VOIR LE CORRIGÉ</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (selectedDictation) {
    return (
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <button onClick={handleBack} className="flex items-center text-[var(--color-accent-text)] font-semibold hover:underline">
          <ChevronLeftIcon className="w-5 h-5 mr-1" /> Retour
        </button>

        <Card className="overflow-hidden">
          {selectedDictation.illustration && (
            <img 
              src={selectedDictation.illustration} 
              alt={selectedDictation.title} 
              className="w-full h-64 object-cover"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">{selectedDictation.title}</h2>
              <p className="text-[var(--color-accent-text)] font-medium">{selectedDictation.level}</p>
            </div>

            <div className="relative">
              <div className="text-lg leading-relaxed text-[var(--color-text-secondary)] blur-md select-none">
                {selectedDictation.content}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/80 dark:bg-black/80 px-6 py-3 rounded-full shadow-lg border border-[var(--color-border)]">
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">Texte masqué pendant la dictée</p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => handleStartDictation(selectedDictation)}
                className="w-full bg-[var(--color-accent)] text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-3 hover:bg-[var(--color-accent-hover)] transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <PlayIcon className="w-6 h-6 fill-current" />
                <span className="text-lg">Démarrer la dictée</span>
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Livre de Dictées</h1>
        <p className="text-[var(--color-text-secondary)]">Améliorez votre orthographe avec nos centaines de dictées lues par IA.</p>
      </div>

      {/* Horizontal Filter Bar */}
      <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              activeFilter === filter
                ? 'bg-[var(--color-accent)] text-white shadow-md'
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDictations.length > 0 ? (
          filteredDictations.map(dictation => (
            <motion.div
              key={dictation.id}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="h-full"
            >
              <Card 
                className="h-full cursor-pointer hover:shadow-xl transition-all border-transparent hover:border-[var(--color-accent)] group"
                onClick={() => setSelectedDictation(dictation)}
              >
                <div className="p-5 space-y-4">
                  <div className="w-14 h-14 bg-[var(--color-accent-light-bg)] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpenIcon className="w-7 h-7 text-[var(--color-accent-text)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[var(--color-text-primary)] line-clamp-2 group-hover:text-[var(--color-accent-text)] transition-colors">{dictation.title}</h3>
                    <div className="flex items-center mt-2 space-x-3">
                      <span className="text-xs font-semibold px-2 py-1 bg-[var(--color-bg-secondary)] rounded text-[var(--color-text-secondary)]">
                        {dictation.level}
                      </span>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {dictation.content.split(' ').length} mots
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center">
            <p className="text-[var(--color-text-secondary)]">Aucune dictée trouvée pour ce niveau.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LivreDictees;
