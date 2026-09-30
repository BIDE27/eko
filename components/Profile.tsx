import React, { useState } from 'react';
import type { Badge, User } from '../types';
import { MedalIcon, StarIcon, TrophyIcon, SparklesIcon } from './icons';
import { generateImageFromPrompt } from '../services/geminiService';

const BadgeIcon: React.FC<{ icon: Badge['icon'], className?: string }> = ({ icon, className }) => {
    switch (icon) {
        case 'medal':
            return <MedalIcon className={className} />;
        case 'star':
            return <StarIcon className={className} />;
        case 'trophy':
            return <TrophyIcon className={className} />;
    }
}

interface ProfileProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
}

const Profile: React.FC<ProfileProps> = ({ user, setUser }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateAvatar = async () => {
    if (!prompt.trim()) {
      setError("Veuillez entrer une description pour votre avatar.");
      return;
    }
    setIsGenerating(true);
    setError('');
    try {
      const imageUrl = await generateImageFromPrompt(prompt);
      setUser(currentUser => ({...currentUser, avatar: imageUrl}));
    } catch (err) {
      console.error(err);
      setError("La génération de l'avatar a échoué. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="p-4 space-y-8">
      <div className="flex flex-col items-center">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-[var(--color-card-bg)] shadow-lg"
        />
        <h1 className="text-2xl font-bold mt-4 text-[var(--color-text-primary)]">{user.name}</h1>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Générateur d'Avatar IA</h2>
        <div className="bg-[var(--color-card-bg)] p-4 rounded-lg shadow-md">
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">Décrivez l'avatar de vos rêves et laissez notre IA le créer pour vous.</p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Un renard sage de style manga, lisant un livre ancien, avec des lunettes rondes."
            className="w-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-[var(--color-text-primary)] text-sm"
            rows={3}
            disabled={isGenerating}
            aria-label="Description de l'avatar"
          />
          {error && <p className="text-red-500 text-xs mt-2" role="alert">{error}</p>}
          <button
            onClick={handleGenerateAvatar}
            disabled={isGenerating}
            className="mt-3 w-full flex items-center justify-center bg-[var(--color-accent)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--color-accent-hover)] disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Génération en cours...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                Générer l'avatar
              </>
            )}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Badges</h2>
        {user.badges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {user.badges.map(badge => (
              <div key={badge.id} className="bg-[var(--color-card-bg)] p-4 rounded-lg shadow-md flex flex-col items-center text-center">
                <div className="p-3 bg-[var(--color-accent-light-bg)] rounded-full mb-2">
                    <BadgeIcon icon={badge.icon} className="w-8 h-8 text-[var(--color-accent-text)]" />
                </div>
                <h3 className="font-bold text-[var(--color-text-primary)]">{badge.name}</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">{badge.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-[var(--color-text-secondary)]">Aucun badge pour le moment.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;