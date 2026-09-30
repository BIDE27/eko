import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { TodoProvider } from './context/TodoContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <FavoritesProvider>
        <TodoProvider>
          <App />
        </TodoProvider>
      </FavoritesProvider>
    </ThemeProvider>
  </React.StrictMode>
);