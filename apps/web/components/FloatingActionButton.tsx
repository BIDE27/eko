import React from 'react';
import { PlusIcon } from './icons';
import { useScrollDirection } from '../hooks/useScrollDirection';

interface FloatingActionButtonProps {
  onClick: () => void;
  label: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick, label }) => {
  const scrollDirection = useScrollDirection();

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`fixed bottom-24 right-6 z-10 flex items-center justify-center w-14 h-14 bg-[var(--color-accent)] text-white rounded-full shadow-lg hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 transition-transform duration-300 ease-in-out ${
        scrollDirection === 'down' ? 'transform translate-y-32' : 'transform translate-y-0'
      }`}
    >
      <PlusIcon className="w-7 h-7" />
    </button>
  );
};

export default FloatingActionButton;
