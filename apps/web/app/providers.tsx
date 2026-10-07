'use client';

import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { TodoProvider } from '../context/TodoContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <FavoritesProvider>
        <TodoProvider>
          {children}
        </TodoProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
}
