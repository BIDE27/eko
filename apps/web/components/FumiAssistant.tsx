import React, { useState, useRef, useEffect } from 'react';
import { createFumiChat, sendFumiMessage } from '../services/geminiService';
import type { ChatMessage, ChatSession, ScheduledSession, GeneratedQuiz } from '../types';
import type { Chat, Part } from '@google/genai';
import { SendIcon, FumiAvatarIcon, PlusIcon, ChatBubbleLeftIcon, MenuIcon, PaperclipIcon, CloseIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon, XCircleIcon, CalendarIcon, SparklesIcon, QuizIcon, BookOpenIcon } from './icons';
import FumiMessageRenderer from './FumiMessageRenderer';
import Modal from './Modal';
import GeneratedQuizView from './GeneratedQuizView';
import { useTodos } from '../context/TodoContext';

const quickActions = [
  { text: "Débuter une session d'étude", icon: CalendarIcon },
  { text: "Résoudre un problème rapide", icon: SparklesIcon },
  { text: "Créer une épreuve de quiz", icon: QuizIcon },
  { text: "Préparer un examen", icon: BookOpenIcon },
];


const FumiAssistant: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeGeminiChat, setActiveGeminiChat] = useState<Chat | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; dataUrl: string; mimeType: string } | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [showContextMenuFor, setShowContextMenuFor] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chatToDeleteId, setChatToDeleteId] = useState<string | null>(null);

  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);

  const { addTask } = useTodos();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);


  // Load chat and scheduled sessions from localStorage on initial mount
  useEffect(() => {
    try {
      const savedChatSessions = localStorage.getItem('fumiChatSessions');
      if (savedChatSessions) {
        const loadedSessions: ChatSession[] = JSON.parse(savedChatSessions);
        if (loadedSessions.length > 0) {
          setChatSessions(loadedSessions);
          setActiveChatId(loadedSessions[0].id);
        } else {
           handleNewChat(); // Create a new chat if no sessions are found
        }
      } else {
        handleNewChat();
      }

      const savedScheduledSessions = localStorage.getItem('fumiScheduledSessions');
      if (savedScheduledSessions) {
        setScheduledSessions(JSON.parse(savedScheduledSessions));
      }

    } catch (error) {
      console.error("Failed to load or parse sessions from localStorage:", error);
      handleNewChat();
    }
  }, []);

  // Save chat sessions to localStorage whenever they change
  useEffect(() => {
    if (chatSessions.length > 0) {
      try {
        localStorage.setItem('fumiChatSessions', JSON.stringify(chatSessions));
      } catch (error) {
         console.error("Failed to save chat sessions to localStorage:", error);
      }
    } else {
      // Clear localStorage if all chats are deleted
      localStorage.removeItem('fumiChatSessions');
    }
  }, [chatSessions]);
  
  // Save scheduled sessions to localStorage whenever they change
  useEffect(() => {
    try {
        localStorage.setItem('fumiScheduledSessions', JSON.stringify(scheduledSessions));
    } catch(error) {
        console.error("Failed to save scheduled sessions to localStorage:", error);
    }
  }, [scheduledSessions]);

  // Re-create Gemini Chat instance when active chat changes
  useEffect(() => {
    if (!activeChatId) {
      setActiveGeminiChat(null);
      return;
    }
    const session = chatSessions.find(s => s.id === activeChatId);
    if (session) {
      const chatInstance = createFumiChat(session.history);
      setActiveGeminiChat(chatInstance);
    }
  }, [activeChatId, chatSessions]);


  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Nouvelle discussion',
      history: [],
      messages: [
        { sender: 'fumi', text: "Bonjour ! Je m'appelle Fumi. Comment puis-je vous aider à réviser aujourd'hui ? Vous pouvez aussi me demander de programmer une session d'étude !", id: 'initial-' + Date.now() }
      ]
    };
    setChatSessions(prev => [newSession, ...prev]);
    setActiveChatId(newSession.id);
    setIsHistoryOpen(false); // Close history on mobile when starting a new chat
  };
  
  const activeChat = chatSessions.find(s => s.id === activeChatId);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);
  
    // Effect to handle clicks outside the context menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenuFor(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [contextMenuRef]);


  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setIsHistoryOpen(false); // Close history panel on mobile after selection
  };
  
    const handleConfirmDelete = () => {
        if (!chatToDeleteId) return;

        const remainingSessions = chatSessions.filter(s => s.id !== chatToDeleteId);
        setChatSessions(remainingSessions);

        if (activeChatId === chatToDeleteId) {
            if (remainingSessions.length > 0) {
                setActiveChatId(remainingSessions[0].id);
            } else {
                handleNewChat();
            }
        }
        
        setIsDeleteModalOpen(false);
        setChatToDeleteId(null);
    };


    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE_MB = 10;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            alert(`Le fichier est trop volumineux. La taille maximale est de ${MAX_SIZE_MB} Mo.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setAttachedFile({
                name: file.name,
                dataUrl: event.target?.result as string,
                mimeType: file.type
            });
        };
        reader.onerror = (error) => {
            console.error("Erreur de lecture du fichier:", error);
            alert("Une erreur est survenue lors de la lecture du fichier.");
        };
        reader.readAsDataURL(file);

        // Reset file input value to allow selecting the same file again
        e.target.value = '';
    };

    const handleRemoveFile = () => {
        setAttachedFile(null);
    };

    const handleImageClick = (imageUrl: string) => {
        setModalImageUrl(imageUrl);
    };

    const closeModal = () => {
        setModalImageUrl(null);
    };

    const executeSend = async (text: string, file: typeof attachedFile | null) => {
      if (!activeChatId || !activeGeminiChat) return;

      setIsLoading(true);

      const userMessage: ChatMessage = {
        sender: 'user',
        text: text,
        id: Date.now().toString(),
        attachment: file || undefined
      };

      const isFirstUserMessage = activeChat ? activeChat.messages.filter(m => m.sender === 'user').length === 0 : false;
      const newTitle = isFirstUserMessage && activeChat && text.trim() ? text.substring(0, 35) + (text.length > 35 ? '...' : '') : activeChat?.title;

      setChatSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === activeChatId
            ? { ...session, title: newTitle!, messages: [...session.messages, userMessage] }
            : session
        )
      );
      
      const parts: (string | Part)[] = [];
      let promptForGemini = text;
      
      if (file) {
          const base64Data = file.dataUrl.split(',')[1];
          parts.push({
              inlineData: {
                  mimeType: file.mimeType,
                  data: base64Data
              }
          });

          const instruction = "Analyse le fichier (image ou PDF) ci-joint. Retranscris son contenu de manière propre et structurée. Reproduis les textes et recrée les schémas en utilisant les outils de rendu disponibles (`renderHints`).";
          promptForGemini = text.trim() 
              ? `${instruction}\n\nContexte de l'utilisateur : "${text}"`
              : instruction;
      }
      
      parts.push(promptForGemini);

      try {
          const response = await sendFumiMessage(activeGeminiChat, parts);
          const fumiResponseText = response.text;

          let fumiMessage: ChatMessage;
          let parsedContent;

          try {
              parsedContent = JSON.parse(fumiResponseText);
          } catch (error) {
              // Not JSON, treat as a simple text response
          }

          if (parsedContent && parsedContent.quiz && Array.isArray(parsedContent.quiz.questions)) {
              setGeneratedQuiz(parsedContent.quiz);
              fumiMessage = {
                  sender: 'fumi',
                  text: "Absolument ! Voici un quiz que j'ai préparé pour vous. Bonne chance !",
                  id: Date.now().toString() + 'fumi-quiz-intro',
              };
          } else if (parsedContent && parsedContent.action === 'schedule') {
              const newScheduledSession: ScheduledSession = {
                  id: Date.now().toString(),
                  ...parsedContent.details,
              };
              setScheduledSessions(prev => [...prev, newScheduledSession]);

              fumiMessage = {
                  sender: 'fumi',
                  text: parsedContent.confirmation_message,
                  id: Date.now().toString() + 'fumi',
              };
          } else if (parsedContent && parsedContent.action === 'add_todo' && Array.isArray(parsedContent.tasks)) {
              parsedContent.tasks.forEach((taskText: string) => {
                  if(typeof taskText === 'string') {
                      addTask(taskText);
                  }
              });
              fumiMessage = {
                  sender: 'fumi',
                  text: parsedContent.confirmation_message || "Tâches ajoutées à vos objectifs.",
                  id: Date.now().toString() + 'fumi',
              };
          } else {
              fumiMessage = {
                  sender: 'fumi',
                  text: fumiResponseText,
                  id: Date.now().toString() + 'fumi',
              };
          }

          const updatedHistory = await activeGeminiChat.getHistory();

          setChatSessions(prevSessions =>
              prevSessions.map(session =>
                  session.id === activeChatId
                      ? { ...session, messages: [...session.messages, fumiMessage], history: updatedHistory }
                      : session
              )
          );
      } catch (error) {
        const errorResponse: ChatMessage = { sender: 'fumi', text: "Désolé, une erreur est survenue. Veuillez réessayer.", id: 'error' + Date.now() };
        setChatSessions(prevSessions =>
          prevSessions.map(session =>
            session.id === activeChatId
              ? { ...session, messages: [...session.messages, errorResponse] }
              : session
          )
        );
      } finally {
        setIsLoading(false);
      }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const hasInput = userInput.trim() || attachedFile;
        if (!hasInput || isLoading) return;

        const currentInput = userInput;
        const currentFile = attachedFile;
        
        setUserInput('');
        setAttachedFile(null);

        await executeSend(currentInput, currentFile);
    };

    const handleQuickAction = async (text: string) => {
        if (isLoading) return;
        if (isHistoryOpen) setIsHistoryOpen(false);
        await executeSend(text, null);
    };

  const HistoryPanel = () => {
    const [renameValue, setRenameValue] = useState('');

    const handleStartRename = (session: ChatSession) => {
        setEditingChatId(session.id);
        setRenameValue(session.title);
        setShowContextMenuFor(null);
    };
    
    const handleRenameSubmit = (sessionId: string) => {
        if (renameValue.trim()) {
            setChatSessions(prev => prev.map(s => s.id === sessionId ? {...s, title: renameValue.trim()} : s));
        }
        setEditingChatId(null);
    };

    const handleOpenDeleteModal = (sessionId: string) => {
        setChatToDeleteId(sessionId);
        setIsDeleteModalOpen(true);
        setShowContextMenuFor(null);
    };


    return (
        <div className="bg-[var(--color-bg-secondary)] flex flex-col p-2 border-r border-[var(--color-border)] w-72 h-full">
          <button
            onClick={handleNewChat}
            className="flex items-center justify-center w-full p-2 mb-4 text-sm font-semibold rounded-lg border border-[var(--color-accent)] text-[var(--color-accent-text)] hover:bg-[var(--color-accent-light-bg)] transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Nouvelle discussion
          </button>
          <div className="flex-grow overflow-y-auto">
            <h2 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider px-2 mb-2">Historique</h2>
            <nav className="space-y-1">
              {chatSessions.map(session => (
                <div
                  key={session.id}
                  className={`group w-full flex items-center p-2 rounded-lg transition-colors ${
                    activeChatId === session.id
                      ? 'bg-[var(--color-accent-light-bg)] text-[var(--color-accent-text)]'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-card-bg)]'
                  }`}
                >
                  <ChatBubbleLeftIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                   {editingChatId === session.id ? (
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => handleRenameSubmit(session.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRenameSubmit(session.id); } }}
                            autoFocus
                            className="w-full bg-transparent outline-none focus:ring-1 focus:ring-[var(--color-accent)] rounded-sm -m-1 p-1 text-sm font-semibold"
                        />
                   ) : (
                    <button onClick={() => handleSelectChat(session.id)} className="flex-1 text-left truncate text-sm font-semibold">
                      {session.title}
                    </button>
                   )}
                  
                  <div className="relative">
                    <button 
                        onClick={() => setShowContextMenuFor(session.id === showContextMenuFor ? null : session.id)}
                        className={`p-1 rounded-full ${activeChatId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} hover:bg-black/10 dark:hover:bg-white/10`}
                        aria-label="Options"
                        >
                        <EllipsisVerticalIcon className="w-4 h-4" />
                    </button>

                    {showContextMenuFor === session.id && (
                        <div ref={contextMenuRef} className="absolute z-20 right-0 top-full mt-1 w-40 bg-[var(--color-card-bg)] rounded-lg shadow-lg border border-[var(--color-border)] text-sm">
                            <button onClick={() => handleStartRename(session)} className="w-full text-left flex items-center px-3 py-2 hover:bg-[var(--color-bg-secondary)] rounded-t-lg">
                                <PencilIcon className="w-4 h-4 mr-2 text-[var(--color-text-secondary)]" />
                                Renommer
                            </button>
                            <button onClick={() => handleOpenDeleteModal(session.id)} className="w-full text-left flex items-center px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-b-lg">
                                <TrashIcon className="w-4 h-4 mr-2" />
                                Supprimer
                            </button>
                        </div>
                    )}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-card-bg)] md:bg-transparent">
      <div className="flex items-center p-2 border-b border-[var(--color-border)] flex-shrink-0">
        <button onClick={() => setIsHistoryOpen(true)} className="p-2 md:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]" aria-label="Ouvrir l'historique">
            <MenuIcon className="w-6 h-6"/>
        </button>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] truncate flex-1 ml-2 md:ml-0 text-center md:text-left">{activeChat?.title || 'Fumi'}</h2>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile History Overlay */}
        <div className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:hidden ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <HistoryPanel />
        </div>
        {isHistoryOpen && <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setIsHistoryOpen(false)}></div>}

        {/* Desktop History Panel */}
        <div className="hidden md:flex flex-shrink-0">
            <HistoryPanel />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeChat ? (
            <div className="flex flex-col h-full p-4">
              <div className="flex-grow overflow-y-auto mb-4 space-y-4 pr-2">
                {activeChat.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'user' ? (
                        <div className="rounded-2xl p-3 max-w-lg bg-indigo-500 text-white rounded-br-none flex flex-col">
                            {msg.attachment?.mimeType.startsWith('image/') && (
                                <img
                                    src={msg.attachment.dataUrl}
                                    alt={msg.attachment.name}
                                    className="max-w-xs max-h-48 rounded-lg mb-2 cursor-pointer object-cover"
                                    onClick={() => handleImageClick(msg.attachment.dataUrl)}
                                    aria-hidden="true"
                                />
                            )}
                            {msg.attachment && !msg.attachment.mimeType.startsWith('image/') && (
                                <div className="bg-indigo-400 p-2 rounded-lg mb-2 flex items-center">
                                    <PaperclipIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                                    <span className="text-sm truncate">{msg.attachment.name}</span>
                                </div>
                            )}
                            {msg.text && (
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            )}
                        </div>
                    ) : (
                        <FumiMessageRenderer content={msg.text} />
                    )}
                  </div>
                ))}
                 {activeChat && activeChat.messages.length <= 1 && (
                    <div className="my-4">
                        <h3 className="text-sm font-semibold text-center text-[var(--color-text-secondary)] mb-3">Comment puis-je vous aider ?</h3>
                        <div className="grid grid-cols-2 gap-2 text-left">
                            {quickActions.map(action => (
                                <button 
                                    key={action.text} 
                                    onClick={() => handleQuickAction(action.text)} 
                                    disabled={isLoading}
                                    className="flex items-center p-3 bg-[var(--color-bg-secondary)] rounded-lg hover:bg-[var(--color-border)] disabled:opacity-50 transition-colors"
                                >
                                    <action.icon className="w-5 h-5 mr-2 text-[var(--color-accent-text)] flex-shrink-0" />
                                    <span className="text-xs font-medium text-[var(--color-text-primary)]">{action.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {isLoading && (
                    <div className="flex items-end space-x-2 max-w-md">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-card-bg)] p-1 border border-[var(--color-border)]">
                            <FumiAvatarIcon className="w-full h-full" />
                        </div>
                        <div className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-2xl p-3 rounded-bl-none">
                            <div className="flex items-center space-x-2">
                                <span className="block w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="block w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="block w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
              </div>

                            <form onSubmit={handleSendMessage} className="mt-auto">
                                {attachedFile && (
                                    <div className="bg-[var(--color-bg-secondary)] p-2 rounded-lg mb-2 flex items-center justify-between text-sm border border-[var(--color-border)]">
                                        <div className="flex items-center truncate min-w-0">
                                            <PaperclipIcon className="w-4 h-4 mr-2 text-[var(--color-text-secondary)] flex-shrink-0" />
                                            <span className="truncate text-[var(--color-text-primary)] font-medium">{attachedFile.name}</span>
                                        </div>
                                        <button type="button" onClick={handleRemoveFile} aria-label="Retirer le fichier" className="p-1 rounded-full hover:bg-[var(--color-border)] flex-shrink-0 ml-2">
                                            <CloseIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLoading}
                                        className="p-3 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] disabled:text-gray-400 dark:disabled:text-gray-600 rounded-full hover:bg-[var(--color-bg-secondary)] transition-colors"
                                        aria-label="Joindre un fichier"
                                    >
                                        <PaperclipIcon className="w-5 h-5" />
                                    </button>
                                    <div className="relative flex-grow">
                                        <input
                                            type="text"
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            placeholder="Posez une question à Fumi..."
                                            className="w-full border border-[var(--color-border)] bg-[var(--color-card-bg)] rounded-full py-2.5 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-[var(--color-text-primary)]"
                                            disabled={isLoading}
                                        />
                                        {(userInput.trim() || attachedFile) && !isLoading && (
                                            <button
                                                type="button"
                                                onClick={() => { setUserInput(''); setAttachedFile(null); }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                                aria-label="Annuler la saisie"
                                            >
                                                <XCircleIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                    <button type="submit" disabled={isLoading || (!userInput.trim() && !attachedFile)} className="bg-indigo-600 text-white rounded-full p-3 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 transition-colors">
                                        <SendIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20">
                <FumiAvatarIcon />
              </div>
              <p className="mt-4 text-lg text-[var(--color-text-secondary)]">Sélectionnez ou créez une discussion</p>
            </div>
          )}
        </div>
      </div>
       {/* Generated Quiz Modal */}
        <Modal
            isOpen={!!generatedQuiz}
            onClose={() => setGeneratedQuiz(null)}
            title={generatedQuiz?.title || 'Quiz Personnalisé'}
        >
            {generatedQuiz && (
                <GeneratedQuizView
                    questions={generatedQuiz.questions}
                    onClose={() => setGeneratedQuiz(null)}
                />
            )}
        </Modal>

      {/* Image Preview Modal */}
      {modalImageUrl && (
          <div 
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" 
              onClick={closeModal}
              role="dialog"
              aria-modal="true"
              aria-label="Aperçu de l'image"
          >
              <div 
                  className="relative max-w-[90vw] max-h-[90vh]"
                  onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image itself
              >
                  <button 
                      onClick={closeModal} 
                      className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 text-black shadow-lg hover:scale-110 transition-transform"
                      aria-label="Fermer l'aperçu"
                  >
                      <CloseIcon className="w-6 h-6" />
                  </button>
                  <img src={modalImageUrl} alt="Aperçu de l'image" className="max-w-full max-h-full object-contain rounded-lg" />
              </div>
          </div>
      )}
        {/* Delete Confirmation Modal */}
        <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            title="Supprimer la discussion"
        >
            <p>Êtes-vous sûr de vouloir supprimer cette discussion ? Cette action est irréversible.</p>
            <div className="mt-6 flex justify-end space-x-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-semibold hover:bg-[var(--color-border)]">
                    Annuler
                </button>
                <button onClick={handleConfirmDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">
                    Supprimer
                </button>
            </div>
        </Modal>
    </div>
  );
};

export default FumiAssistant;