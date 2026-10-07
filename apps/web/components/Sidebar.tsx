import React from 'react';
import { Page, User } from '../types';
import { useTheme } from '../context/ThemeContext';
import { CloseIcon, HeartIcon, MoonIcon, SunIcon, SettingsIcon, LogoutIcon, BookOpenIcon } from './icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: Page) => void;
  user: User;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center p-3 text-left rounded-lg text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors">
        {icon}
        <span className="ml-4 font-medium">{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, user }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside 
      className={`fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-[var(--color-card-bg)] shadow-2xl z-[80] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sidebar-title"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[var(--color-border)]">
          <h2 id="sidebar-title" className="font-bold text-lg text-[var(--color-text-primary)]">Menu</h2>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]" aria-label="Fermer le menu">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Section */}
        <button onClick={() => { onNavigate(Page.Profile); onClose(); }} className="w-full text-left p-4 flex items-center space-x-3 hover:bg-[var(--color-bg-secondary)] transition-colors flex-shrink-0">
           <img src={user.avatar} alt="Avatar de l'utilisateur" className="w-12 h-12 rounded-full object-cover"/>
           <div>
             <p className="font-bold text-[var(--color-text-primary)]">{user.name}</p>
             <p className="text-sm text-[var(--color-accent-text)]">Voir le profil</p>
           </div>
        </button>

        {/* Scrollable Nav Area */}
        <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
           <NavItem icon={<BookOpenIcon className="w-6 h-6 text-[var(--color-text-secondary)]" />} label="Mes Objectifs" onClick={() => { onNavigate(Page.Objectifs); onClose(); }} />
           <NavItem icon={<HeartIcon className="w-6 h-6 text-[var(--color-text-secondary)]" />} label="Favoris" onClick={() => { onNavigate(Page.Favoris); onClose(); }} />

            <div className="pt-2">
                <div className="border-t border-[var(--color-border)] my-1"></div>
            </div>
            
            <NavItem icon={<SettingsIcon className="w-6 h-6 text-[var(--color-text-secondary)]" />} label="Paramètres" onClick={() => { onNavigate(Page.Parametres); onClose(); }} />
            
            <button onClick={toggleTheme} className="w-full flex items-center justify-between p-3 text-left rounded-lg text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors">
                <div className="flex items-center">
                    {theme === 'light' ? <MoonIcon className="w-6 h-6 text-[var(--color-text-secondary)]" /> : <SunIcon className="w-6 h-6 text-[var(--color-text-secondary)]" />}
                    <span className="ml-4 font-medium">Thème</span>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                    {theme === 'dark' ? 'Sombre' : 'Clair'}
                </span>
            </button>
        </nav>
        
        {/* Fixed bottom footer */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-card-bg)] flex-shrink-0">
            <button className="w-full flex items-center p-3 text-left rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors">
                <LogoutIcon className="w-6 h-6"/>
                <span className="ml-4 font-medium">Déconnexion</span>
            </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
