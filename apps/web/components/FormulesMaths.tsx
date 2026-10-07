import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SearchIcon, ChevronDownIcon, ChevronUpIcon, FormulaIcon, RulerIcon, CalculatorIcon, TableIcon, SparklesIcon } from './icons';

interface Formula {
  id: string;
  title: string;
  latex: string;
  description: string;
  figure?: React.ReactNode;
}

interface Category {
  id: string;
  title: string;
  icon: React.ReactNode;
  formulas: Formula[];
}

const mathCategories: Category[] = [
  {
    id: 'algebra',
    title: 'Algèbre',
    icon: <CalculatorIcon className="w-5 h-5" />,
    formulas: [
      {
        id: 'identities',
        title: 'Identités Remarquables',
        latex: '(a + b)² = a² + 2ab + b²\n(a - b)² = a² - 2ab + b²\n(a - b)(a + b) = a² - b²',
        description: 'Formules fondamentales pour le développement et la factorisation d\'expressions algébriques.',
      },
      {
        id: 'quadratic',
        title: 'Équation du Second Degré',
        latex: 'ax² + bx + c = 0\nΔ = b² - 4ac\nx = (-b ± √Δ) / 2a',
        description: 'Résolution d\'équations polynomiales de degré 2. Si Δ > 0, deux solutions réelles distinctes.',
      },
      {
        id: 'logarithms',
        title: 'Logarithmes',
        latex: 'log(ab) = log(a) + log(b)\nlog(a/b) = log(a) - log(b)\nlog(aⁿ) = n log(a)',
        description: 'Propriétés essentielles des fonctions logarithmiques.',
      },
    ],
  },
  {
    id: 'geometry',
    title: 'Géométrie',
    icon: <RulerIcon className="w-5 h-5" />,
    formulas: [
      {
        id: 'pythagoras',
        title: 'Théorème de Pythagore',
        latex: 'a² + b² = c²',
        description: 'Dans un triangle rectangle, le carré de l\'hypoténuse est égal à la somme des carrés des deux autres côtés.',
        figure: (
          <svg viewBox="0 0 100 100" className="w-24 h-24 mx-auto">
            <path d="M 20 80 L 80 80 L 20 20 Z" fill="none" stroke="currentColor" strokeWidth="2" />
            <rect x="20" y="70" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1" />
            <text x="50" y="95" fontSize="10" textAnchor="middle" fill="currentColor">a</text>
            <text x="10" y="50" fontSize="10" textAnchor="middle" fill="currentColor">b</text>
            <text x="55" y="45" fontSize="10" textAnchor="middle" fill="currentColor">c</text>
          </svg>
        ),
      },
      {
        id: 'circle_area',
        title: 'Aire et Périmètre du Cercle',
        latex: 'P = 2πr\nA = πr²',
        description: 'Calcul de la circonférence et de la surface d\'un disque de rayon r.',
        figure: (
          <svg viewBox="0 0 100 100" className="w-24 h-24 mx-auto">
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="50" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="2" strokeDasharray="2" />
            <text x="65" y="45" fontSize="10" textAnchor="middle" fill="currentColor">r</text>
          </svg>
        ),
      },
      {
        id: 'thales',
        title: 'Théorème de Thalès',
        latex: 'AM/AB = AN/AC = MN/BC',
        description: 'Propriété des rapports de longueurs dans des triangles formés par des droites parallèles.',
        figure: (
          <svg viewBox="0 0 100 100" className="w-24 h-24 mx-auto">
            <path d="M 50 10 L 10 90 L 90 90 Z" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="30" y1="50" x2="70" y2="50" stroke="currentColor" strokeWidth="2" />
            <text x="50" y="5" fontSize="8" textAnchor="middle" fill="currentColor">A</text>
            <text x="5" y="95" fontSize="8" textAnchor="middle" fill="currentColor">B</text>
            <text x="95" y="95" fontSize="8" textAnchor="middle" fill="currentColor">C</text>
            <text x="25" y="50" fontSize="8" textAnchor="end" fill="currentColor">M</text>
            <text x="75" y="50" fontSize="8" textAnchor="start" fill="currentColor">N</text>
          </svg>
        ),
      },
    ],
  },
  {
    id: 'trigonometry',
    title: 'Trigonométrie',
    icon: <TableIcon className="w-5 h-5" />,
    formulas: [
      {
        id: 'trig_ratios',
        title: 'Rapports Trigonométriques',
        latex: 'sin(θ) = Opp / Hyp\ncos(θ) = Adj / Hyp\ntan(θ) = Opp / Adj',
        description: 'Définition des fonctions sinus, cosinus et tangente dans un triangle rectangle.',
      },
      {
        id: 'trig_identities',
        title: 'Identités Fondamentales',
        latex: 'cos²(θ) + sin²(θ) = 1\ntan(θ) = sin(θ) / cos(θ)',
        description: 'Relations de base entre les fonctions trigonométriques.',
      },
    ],
  },
  {
    id: 'calculus',
    title: 'Analyse (Calcul)',
    icon: <FormulaIcon className="w-5 h-5" />,
    formulas: [
      {
        id: 'derivatives',
        title: 'Dérivées Usuelles',
        latex: '(xⁿ)\' = nxⁿ⁻¹\n(eˣ)\' = eˣ\n(ln x)\' = 1/x\n(sin x)\' = cos x',
        description: 'Formules de dérivation pour les fonctions de base.',
      },
      {
        id: 'integrals',
        title: 'Intégrales de Base',
        latex: '∫ xⁿ dx = (xⁿ⁺¹)/(n+1) + C\n∫ eˣ dx = eˣ + C\n∫ (1/x) dx = ln|x| + C',
        description: 'Primitives des fonctions élémentaires.',
      },
    ],
  },
  {
    id: 'volumes',
    title: 'Volumes et Surfaces',
    icon: <SparklesIcon className="w-5 h-5" />,
    formulas: [
      {
        id: 'sphere',
        title: 'Sphère',
        latex: 'V = (4/3)πr³\nA = 4πr²',
        description: 'Volume et aire de la surface d\'une sphère.',
        figure: (
          <svg viewBox="0 0 100 100" className="w-24 h-24 mx-auto">
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
            <ellipse cx="50" cy="50" rx="30" ry="10" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2" />
            <line x1="50" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="2" strokeDasharray="2" />
            <text x="65" y="45" fontSize="10" textAnchor="middle" fill="currentColor">r</text>
          </svg>
        ),
      },
      {
        id: 'cylinder',
        title: 'Cylindre',
        latex: 'V = πr²h\nA = 2πrh + 2πr²',
        description: 'Volume et aire totale d\'un cylindre droit.',
        figure: (
          <svg viewBox="0 0 100 100" className="w-24 h-24 mx-auto">
            <ellipse cx="50" cy="20" rx="25" ry="8" fill="none" stroke="currentColor" strokeWidth="2" />
            <ellipse cx="50" cy="80" rx="25" ry="8" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="25" y1="20" x2="25" y2="80" stroke="currentColor" strokeWidth="2" />
            <line x1="75" y1="20" x2="75" y2="80" stroke="currentColor" strokeWidth="2" />
            <line x1="50" y1="80" x2="75" y2="80" stroke="currentColor" strokeWidth="1" strokeDasharray="2" />
            <text x="62" y="75" fontSize="8" textAnchor="middle" fill="currentColor">r</text>
            <text x="85" y="50" fontSize="8" textAnchor="middle" fill="currentColor">h</text>
          </svg>
        ),
      },
    ],
  },
];

const FormulesMaths: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(mathCategories.map(c => c.id));

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const filteredCategories = mathCategories.map(category => ({
    ...category,
    formulas: category.formulas.filter(f => 
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.formulas.length > 0);

  return (
    <div className="p-4 bg-[var(--color-bg-primary)] min-h-screen pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8 px-1">
          <div className="p-2 bg-purple-500 rounded-xl text-white shadow-lg shadow-purple-500/20">
            <FormulaIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">Formules de Maths</h2>
            <p className="text-[var(--color-text-secondary)] text-sm">Répertoire complet des formules académiques</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
          <input
            type="text"
            placeholder="Rechercher une formule (ex: Pythagore, Dérivée...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 text-[var(--color-text-primary)] shadow-sm transition-all"
          />
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-[var(--color-card-bg)] rounded-3xl border border-[var(--color-border)] overflow-hidden shadow-sm">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{category.title}</h3>
                  <span className="text-xs font-medium px-2 py-0.5 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] rounded-full border border-[var(--color-border)]">
                    {category.formulas.length}
                  </span>
                </div>
                {expandedCategories.includes(category.id) ? (
                  <ChevronUpIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                )}
              </button>

              <AnimatePresence>
                {expandedCategories.includes(category.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.formulas.map((formula) => (
                        <div key={formula.id} className="p-4 bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] hover:border-purple-500/50 transition-all group">
                          <h4 className="font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-purple-500 transition-colors">{formula.title}</h4>
                          
                          <div className="bg-[var(--color-card-bg)] p-4 rounded-xl mb-3 font-mono text-sm overflow-x-auto whitespace-pre-wrap text-center border border-[var(--color-border)] shadow-inner">
                            {formula.latex}
                          </div>

                          {formula.figure && (
                            <div className="mb-3 p-2 bg-white/50 dark:bg-black/20 rounded-xl border border-[var(--color-border)] text-[var(--color-text-primary)]">
                              {formula.figure}
                            </div>
                          )}

                          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                            {formula.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--color-bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-[var(--color-text-secondary)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Aucune formule trouvée</h3>
              <p className="text-[var(--color-text-secondary)]">Essayez d'autres mots-clés pour votre recherche.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FormulesMaths;
