'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

import type { FavoriteItem, QuizQuestion, Contest, Match } from '../types';

type FavoriteableItemData = QuizQuestion | Contest | Match;
type FavoriteableItemType = 'quiz' | 'contest' | 'tournament' | 'match';

interface FavoritesContextType {
  favorites: FavoriteItem[];
  toggleFavorite: (item: {id: string, type: FavoriteableItemType, data: FavoriteableItemData}) => void;
  isFavorited: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('ekoFavorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error("Failed to load favorites from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ekoFavorites', JSON.stringify(favorites));
    } catch (error) {
      console.error("Failed to save favorites to localStorage:", error);
    }
  }, [favorites]);

  const toggleFavorite = useCallback((item: {id: string, type: FavoriteableItemType, data: FavoriteableItemData}) => {
    setFavorites(prevFavorites => {
      const existingIndex = prevFavorites.findIndex(fav => fav.id === item.id);
      if (existingIndex > -1) {
        // Remove from favorites
        return prevFavorites.filter(fav => fav.id !== item.id);
      } else {
        // Add to favorites
        const newItem: FavoriteItem = { ...item, favoritedAt: new Date().toISOString() };
        // Add to the top of the list
        return [newItem, ...prevFavorites];
      }
    });
  }, []);
  
  const isFavorited = useCallback((id: string) => {
    return favorites.some(fav => fav.id === id);
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorited }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};