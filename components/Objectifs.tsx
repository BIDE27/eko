import React, { useState, useMemo } from 'react';
import { useTodos } from '../context/TodoContext';
import { PlusIcon, TrashIcon, CheckCircleIcon } from './icons';

const Objectifs: React.FC = () => {
  const { todos, addTask, toggleTask, deleteTask } = useTodos();
  const [newTodoText, setNewTodoText] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    addTask(newTodoText);
    setNewTodoText('');
  };

  const completedCount = useMemo(() => todos.filter(t => t.completed).length, [todos]);
  const progressPercentage = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Mes Objectifs</h1>

      {/* Progress Bar */}
      <div className="bg-[var(--color-card-bg)] p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-md font-semibold text-[var(--color-text-primary)]">Progression</h2>
          <span className="text-sm font-bold text-[var(--color-accent)]">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-2.5">
          <div
            className="bg-[var(--color-accent)] h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Add Todo Form */}
      <div className="bg-[var(--color-card-bg)] p-4 rounded-lg shadow-md">
        <form onSubmit={handleAddTask} className="flex items-center space-x-2">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="Ajouter un nouvel objectif..."
            className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            aria-label="Nouvel objectif"
          />
          <button
            type="submit"
            disabled={!newTodoText.trim()}
            className="p-2 bg-[var(--color-accent)] text-white rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 hover:bg-[var(--color-accent-hover)] transition-colors flex-shrink-0"
            aria-label="Ajouter l'objectif"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        </form>
      </div>

      {/* Todo List */}
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md overflow-hidden">
        {todos.length > 0 ? (
          <ul className="divide-y divide-[var(--color-border)]">
            {todos.map(todo => (
              <li
                key={todo.id}
                className={`flex items-center justify-between p-4 group transition-colors ${
                  todo.completed ? 'bg-gray-50 dark:bg-black/20' : ''
                }`}
              >
                <button onClick={() => toggleTask(todo.id)} className="flex items-center space-x-3 text-left">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      todo.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-400 dark:border-gray-500 group-hover:border-[var(--color-accent)]'
                    }`}
                  >
                    {todo.completed && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={`text-[var(--color-text-primary)] transition-colors ${todo.completed ? 'line-through text-[var(--color-text-secondary)]' : ''}`}>
                    {todo.text}
                  </span>
                </button>
                <button
                  onClick={() => deleteTask(todo.id)}
                  className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Supprimer l'objectif : ${todo.text}`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center p-8">
            <CheckCircleIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
            <h3 className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">Tout est accompli !</h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Ajoutez un nouvel objectif pour commencer.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Objectifs;