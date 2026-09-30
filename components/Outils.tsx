import React from 'react';
import { Page } from '../types';
import { CalculatorIcon, DictionaryIcon, TranslateIcon, ConjugationIcon, FormulaIcon, TableIcon, QuillIcon, BoardIcon, SparklesIcon } from './icons';
import { motion } from 'motion/react';

interface OutilsProps {
  onNavigate: (page: Page) => void;
}

const Outils: React.FC<OutilsProps> = ({ onNavigate }) => {
  const sections = [
    {
      title: "Mathématiques",
      icon: <CalculatorIcon className="w-5 h-5" />,
      items: [
        { id: Page.Calculatrice, label: "Calculatrice", icon: <CalculatorIcon className="w-6 h-6" />, color: "bg-blue-500" },
        { id: Page.FormulesMaths, label: "Formules de maths", icon: <FormulaIcon className="w-6 h-6" />, color: "bg-purple-500" },
        { id: Page.TableMultiplication, label: "Table de multiplication", icon: <TableIcon className="w-6 h-6" />, color: "bg-orange-500" },
      ]
    },
    {
      title: "Sciences",
      icon: <FormulaIcon className="w-5 h-5" />,
      items: [
        { id: Page.FormulesPhysique, label: "Formules Physique-chimie", icon: <FormulaIcon className="w-6 h-6" />, color: "bg-cyan-500" },
      ]
    },
    {
      title: "Langues",
      icon: <TranslateIcon className="w-5 h-5" />,
      items: [
        { id: Page.DictionnaireFrancais, label: "Dictionnaire Français", icon: <DictionaryIcon className="w-6 h-6" />, color: "bg-green-500" },
        { id: Page.DictionnaireFrEn, label: "Français ⇔ Anglais", icon: <TranslateIcon className="w-6 h-6" />, color: "bg-indigo-500" },
        { id: Page.DictionnaireFrFon, label: "Français ⇔ Fon", icon: <TranslateIcon className="w-6 h-6" />, color: "bg-yellow-500" },
        { id: Page.ConjugaisonFr, label: "Art de conjuguer (FR)", icon: <ConjugationIcon className="w-6 h-6" />, color: "bg-red-500" },
        { id: Page.ConjugaisonEn, label: "Art de conjuguer (EN)", icon: <ConjugationIcon className="w-6 h-6" />, color: "bg-pink-500" },
      ]
    },
    {
      title: "Outils de travail",
      icon: <BoardIcon className="w-5 h-5" />,
      items: [
        { id: Page.LivreDictees, label: "Livre de dictées", icon: <QuillIcon className="w-6 h-6" />, color: "bg-teal-500" },
        { id: Page.TableauInteractif, label: "Tableau Interactif", icon: <BoardIcon className="w-6 h-6" />, color: "bg-slate-500" },
      ]
    }
  ];

  return (
    <div className="p-4 bg-[var(--color-bg-primary)] min-h-screen pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center space-x-3 mb-8 px-1">
          <div className="p-2 bg-[var(--color-accent)] rounded-xl text-white shadow-lg shadow-[var(--color-accent)]/20">
            <SparklesIcon className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">Outils & Ressources</h2>
        </div>
        
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="mb-10">
            <div className="flex items-center space-x-2 mb-4 px-1">
              <span className="text-[var(--color-text-secondary)]">{section.icon}</span>
              <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                {section.title}
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="flex flex-col items-center p-4 bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-border)] hover:shadow-md hover:border-[var(--color-accent)] transition-all group text-center"
                >
                  <div className={`p-3 rounded-xl ${item.color} text-white mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold text-[var(--color-text-primary)] leading-tight">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Outils;
