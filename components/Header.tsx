import React from 'react';
import { Page } from '../types';
import { BellIcon, FumiIcon, SearchIcon, ChevronLeftIcon, MenuIcon } from './icons';
import { useScrollDirection } from '../hooks/useScrollDirection';

interface HeaderProps {
    activePage: Page;
    onNavigate: (page: Page) => void;
    onMenuClick: () => void;
    onSearchClick: () => void;
    unreadCount: number;
    boardTheme?: 'black' | 'white';
    onBoardThemeChange?: (theme: 'black' | 'white') => void;
}

const Header: React.FC<HeaderProps> = ({ 
  activePage, 
  onNavigate, 
  onMenuClick, 
  onSearchClick, 
  unreadCount,
  boardTheme,
  onBoardThemeChange
}) => {
  const isFumiActive = activePage === Page.Fumi;
  const isNotificationsActive = activePage === Page.Notifications;
  const scrollDirection = useScrollDirection();
  const [isAtTop, setIsAtTop] = React.useState(true);

  const pagesWithoutBottomNav = [
    Page.TableauInteractif,
    Page.Calculatrice,
    Page.DictionnaireFrEn,
    Page.DictionnaireFrFon,
    Page.ConjugaisonFr,
    Page.ConjugaisonEn,
    Page.TableMultiplication,
    Page.LivreDictees,
    Page.FormulesMaths,
    Page.FormulesPhysique,
    Page.Fumi,
    Page.CreerQuiz
  ];

  const showBack = pagesWithoutBottomNav.includes(activePage);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.pageYOffset < 50); // Threshold to keep it visible at the very top
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Hide header when scrolling down, show when scrolling up
  // We only hide it if we are not at the top
  const isHidden = scrollDirection === 'down' && !isAtTop;
  
  return (
    <header className={`bg-[var(--color-card-bg)] sticky top-0 z-20 shadow-sm p-4 flex justify-between items-center transition-transform duration-300 ease-in-out ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="flex items-center">
        {showBack ? (
          <button 
            onClick={() => onNavigate(Page.Accueil)} 
            className="mr-3 p-1 rounded-full hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] transition-colors"
            aria-label="Retour"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
        ) : (
          <div className="mr-2">
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 60' className="h-8">
              <rect width='120' height='60' rx='30' fill='var(--color-accent)' />
              <text x='50%' y='50%' dominantBaseline='central' textAnchor='middle' fontFamily='sans-serif' fontSize='40' fontWeight='bold' fill='white' dy='.1em'>eko.</text>
            </svg>
          </div>
        )}
        {showBack && (
          <div className="flex items-center space-x-3">
            <span className="font-bold text-lg text-[var(--color-text-primary)] truncate max-w-[150px]">
              {activePage}
            </span>
            {activePage === Page.TableauInteractif && onBoardThemeChange && (
              <div className="flex items-center bg-[var(--color-bg-secondary)] rounded-full p-1 border border-[var(--color-border)]">
                <button
                  onClick={() => onBoardThemeChange('black')}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${boardTheme === 'black' ? 'bg-gray-800 text-white shadow-sm' : 'text-[var(--color-text-secondary)]'}`}
                >
                  Noir
                </button>
                <button
                  onClick={() => onBoardThemeChange('white')}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${boardTheme === 'white' ? 'bg-white text-gray-800 shadow-sm' : 'text-[var(--color-text-secondary)]'}`}
                >
                  Blanc
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={onSearchClick}
          className="relative transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
          aria-label="Rechercher"
        >
          <SearchIcon className="h-7 w-7" />
        </button>

        <button 
          onClick={() => onNavigate(Page.Fumi)} 
          className={`relative transition-colors ${isFumiActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'}`}
          aria-label="Discuter avec Fumi"
        >
          <FumiIcon className="h-7 w-7" fill={isFumiActive ? 'currentColor' : 'none'} />
        </button>

        <button 
          onClick={() => onNavigate(Page.Notifications)} 
          className={`relative transition-colors ${isNotificationsActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'}`}
          aria-label="Voir les notifications"
        >
          <BellIcon className="h-7 w-7" fill={isNotificationsActive ? 'currentColor' : 'none'} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold ring-2 ring-[var(--color-card-bg)]">
              {unreadCount}
            </span>
          )}
        </button>

        <button 
          onClick={onMenuClick} 
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
          aria-label="Ouvrir le menu"
        >
          <MenuIcon className="h-7 w-7" />
        </button>
      </div>
    </header>
  );
};

export default Header;