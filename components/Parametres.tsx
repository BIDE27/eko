import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { useTheme } from '../context/ThemeContext';
import Card from './Card';
import ToggleSwitch from './ToggleSwitch';
import { SunIcon, MoonIcon, CheckCircleIcon } from './icons';

interface ParametresProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
}

const Parametres: React.FC<ParametresProps> = ({ user, setUser }) => {
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');

  // Notification states with default values
  const [notifChallenges, setNotifChallenges] = useState(true);
  const [notifContests, setNotifContests] = useState(true);
  const [notifFumi, setNotifFumi] = useState(false);
  const [notifMarketing, setNotifMarketing] = useState(false);

  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Load notification settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('ekoNotificationSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        // Use nullish coalescing to fall back to default if a key is missing
        setNotifChallenges(settings.challenges ?? true);
        setNotifContests(settings.contests ?? true);
        setNotifFumi(settings.fumi ?? false);
        setNotifMarketing(settings.marketing ?? false);
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    }
  }, []);

  // Save notification settings to localStorage whenever they change
  useEffect(() => {
    try {
      const settings = {
        challenges: notifChallenges,
        contests: notifContests,
        fumi: notifFumi,
        marketing: notifMarketing,
      };
      localStorage.setItem('ekoNotificationSettings', JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    }
  }, [notifChallenges, notifContests, notifFumi, notifMarketing]);


  useEffect(() => {
    // Check if form is dirty
    const dirty = name !== user.name || bio !== (user.bio || '');
    setIsDirty(dirty);
  }, [name, bio, user.name, user.bio]);
  
  const handleSaveChanges = () => {
    setUser(prevUser => ({
      ...prevUser,
      name,
      bio,
    }));
    setIsDirty(false);
    setShowConfirmation(true);
    setTimeout(() => {
      setShowConfirmation(false);
    }, 2000);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Paramètres</h1>

      {/* Profile Section */}
      <Card>
        <h2 className="text-lg font-bold mb-4">Profil</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              id="username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Parlez-nous un peu de vous..."
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
        </div>
      </Card>

      {/* Notifications Section */}
      <Card>
        <h2 className="text-lg font-bold mb-2">Notifications</h2>
        <div className="divide-y divide-[var(--color-border)]">
          <ToggleSwitch
            label="Nouveaux défis"
            description="Recevoir une alerte quand un joueur vous défie."
            enabled={notifChallenges}
            setEnabled={setNotifChallenges}
          />
          <ToggleSwitch
            label="Rappels de concours"
            description="Être notifié avant le début d'un concours."
            enabled={notifContests}
            setEnabled={setNotifContests}
          />
           <ToggleSwitch
            label="Messages de Fumi"
            description="Recevoir des conseils d'étude de Fumi."
            enabled={notifFumi}
            setEnabled={setNotifFumi}
          />
           <ToggleSwitch
            label="Offres spéciales"
            description="Recevoir des promotions et des actualités."
            enabled={notifMarketing}
            setEnabled={setNotifMarketing}
          />
        </div>
      </Card>
      
      {/* Appearance Section */}
      <Card>
        <h2 className="text-lg font-bold mb-4">Apparence</h2>
        <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="font-semibold text-[var(--color-text-primary)]">Thème</p>
          <div className="flex items-center space-x-2 p-1 bg-[var(--color-border)] rounded-full">
            <button
              onClick={() => theme === 'dark' && toggleTheme()}
              className={`p-1.5 rounded-full ${theme === 'light' ? 'bg-[var(--color-card-bg)] shadow' : ''}`}
              aria-label="Passer au thème clair"
            >
              <SunIcon className={`w-5 h-5 ${theme === 'light' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}`} />
            </button>
            <button
              onClick={() => theme === 'light' && toggleTheme()}
              className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-[var(--color-card-bg)] shadow' : ''}`}
              aria-label="Passer au thème sombre"
            >
              <MoonIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}`} />
            </button>
          </div>
        </div>
      </Card>
      
      {/* Save Button */}
      {(isDirty || showConfirmation) && (
        <div className="fixed bottom-24 right-4 z-20">
            {showConfirmation ? (
                 <div className="flex items-center bg-green-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Enregistré !
                </div>
            ) : (
                <button
                    onClick={handleSaveChanges}
                    className="bg-[var(--color-accent)] text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-[var(--color-accent-hover)] transition-colors"
                >
                    Enregistrer les modifications
                </button>
            )}
        </div>
      )}

    </div>
  );
};

export default Parametres;