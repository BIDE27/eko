import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import Accueil from './components/Accueil';
import QuizIndividuel from './components/QuizIndividuel';
import Concours from './components/Concours';
import Tournois from './components/Tournois';
import Matchs from './components/Matchs';
import Notifications from './components/Notifications';
import Profile from './components/Profile';
import FumiAssistant from './components/FumiAssistant';
import Favoris from './components/Favoris';
import Parametres from './components/Parametres';
import Objectifs from './components/Objectifs';
import Search from './components/Search';
import CreerQuiz from './components/CreerQuiz';
import Calculator from './components/Calculator';
import TableMultiplication from './components/TableMultiplication';
import DictionnaireFrancais from './components/DictionnaireFrancais';
import DictionnaireFrEn from './components/DictionnaireFrEn';
import ConjugaisonFr from './components/ConjugaisonFr';
import LivreDictees from './components/LivreDictees';
import TableauInteractif from './components/TableauInteractif';
import FormulesMaths from './components/FormulesMaths';
import Competitions from './components/Competitions';
import Outils from './components/Outils';
import { Page, User, Notification } from './types';
import { notifications as initialNotifications, currentUser } from './components/data';
import { useDebounce } from './hooks/useDebounce';
import { translateText } from './services/geminiService';

const PlaceholderPage: React.FC<{ pageName: string }> = ({ pageName }) => (
    <div className="p-8 text-center text-[var(--color-text-secondary)] h-[calc(100vh-200px)] flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold mb-2 text-[var(--color-text-primary)]">{pageName}</h2>
        <p>Cette fonctionnalité est en cours de développement.</p>
        <p>Revenez bientôt !</p>
    </div>
);

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.Accueil);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<User>(currentUser);
  const [pageContext, setPageContext] = useState<any>(null);
  const [boardTheme, setBoardTheme] = useState<'black' | 'white'>('black');
  
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem('ekoNotifications');
      return saved ? JSON.parse(saved) : initialNotifications;
    } catch (error) {
      console.error("Failed to load notifications from localStorage:", error);
      return initialNotifications;
    }
  });

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);
  
  useEffect(() => {
    try {
      localStorage.setItem('ekoNotifications', JSON.stringify(notifications));
    } catch (error) {
      console.error("Failed to save notifications to localStorage:", error);
    }
  }, [notifications]);

  const handleNavigate = (page: Page, context: any = null) => {
    setActivePage(page);
    setPageContext(context);
    setIsSidebarOpen(false);
    setIsSearchOpen(false);
  };
  
  const handleMarkAsRead = (notificationId: number) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const renderPage = () => {
    switch (activePage) {
      case Page.Accueil:
        return <Accueil />;
      case Page.Quiz:
        return <QuizIndividuel onNavigate={handleNavigate} />;
      case Page.CreerQuiz:
        return <CreerQuiz />;
      case Page.Compétitions:
        return <Competitions />;
      case Page.Outils:
        return <Outils onNavigate={handleNavigate} />;
      case Page.Notifications:
        return <Notifications notifications={notifications} onNavigate={handleNavigate} onMarkAsRead={handleMarkAsRead} />;
      case Page.Profile:
        return <Profile user={user} setUser={setUser} />;
      case Page.Fumi:
        return <div className={`h-[calc(100vh-${showBottomNav ? '136px' : '68px'})]`}><FumiAssistant /></div>;
      case Page.Favoris:
        return <Favoris />;
      case Page.Parametres:
        return <Parametres user={user} setUser={setUser} />;
      case Page.Objectifs:
        return <Objectifs />;
      
      // New Tool Pages
      case Page.Calculatrice:
        return <div className={`h-[calc(100vh-${showBottomNav ? '136px' : '68px'})]`}><Calculator /></div>;
      case Page.DictionnaireFrancais:
        return <DictionnaireFrancais />;
      case Page.DictionnaireFrEn:
        return <div className={`h-[calc(100vh-${showBottomNav ? '136px' : '68px'})]`}><DictionnaireFrEn /></div>;
      case Page.DictionnaireFrFon:
        return <PlaceholderPage pageName={Page.DictionnaireFrFon} />;
      case Page.ConjugaisonFr:
        return <ConjugaisonFr />;
      case Page.ConjugaisonEn:
        return <PlaceholderPage pageName={Page.ConjugaisonEn} />;
      case Page.FormulesMaths:
        return <FormulesMaths />;
      case Page.FormulesPhysique:
        return <PlaceholderPage pageName={Page.FormulesPhysique} />;
      case Page.TableMultiplication:
        return <TableMultiplication />;
      case Page.LivreDictees:
        return <LivreDictees />;
      case Page.TableauInteractif:
        return <TableauInteractif boardTheme={boardTheme} />;

      default:
        return <Accueil />;
    }
  };

  const pagesWithoutBottomNav = [
    Page.TableauInteractif,
    Page.Calculatrice,
    Page.DictionnaireFrEn,
    Page.DictionnaireFrFon,
    Page.ConjugaisonFr,
    Page.ConjugaisonEn,
    Page.FormulesMaths,
    Page.TableMultiplication,
    Page.LivreDictees,
    Page.Fumi,
    Page.CreerQuiz
  ];

  const showBottomNav = !pagesWithoutBottomNav.includes(activePage);

  return (
    <div className={`bg-[var(--color-bg-primary)] min-h-screen font-sans text-[var(--color-text-primary)] ${isSidebarOpen || isSearchOpen ? 'overflow-hidden h-screen' : ''}`}>
      <Header 
        activePage={activePage} 
        onNavigate={handleNavigate} 
        onMenuClick={() => setIsSidebarOpen(true)}
        onSearchClick={() => setIsSearchOpen(true)}
        unreadCount={unreadCount} 
        boardTheme={boardTheme}
        onBoardThemeChange={setBoardTheme}
      />
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={handleNavigate}
        user={user}
      />

      <Search isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[70] transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      <main className={`relative ${showBottomNav ? 'pb-24' : 'pb-0'}`}>
        {renderPage()}
      </main>
      
      {showBottomNav && <BottomNav activePage={activePage} onNavigate={handleNavigate} />}
    </div>
  );
};

export default App;