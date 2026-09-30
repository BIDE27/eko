import React, { useState } from 'react';
import { ChevronDownIcon, FunnelIcon } from './icons';

const matieres = ['Toutes les matières', 'Mathématiques', 'Physique-Chimie', 'Biologie', 'Français', 'Anglais', 'Histoire-Géographie', 'Économie', 'Philosophie', 'Culture Générale'];
const niveaux: { [key: string]: string } = {
    'tous': 'Tous les niveaux',
    'primaire': 'Primaire',
    'secondaire': 'Secondaire',
    'lycee': 'Lycée',
    'universitaire': 'Universitaire'
};
const classes: { [key: string]: string[] } = {
    primaire: ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'],
    secondaire: ['6ème', '5ème', '4ème', '3ème'],
    lycee: ['Seconde', 'Première', 'Terminale'],
    universitaire: ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat']
};

interface FilterBarProps {
    selectedMatiere: string;
    onMatiereChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    selectedNiveau: string;
    onNiveauChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    selectedClasse: string;
    onClasseChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const StyledSelect: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    children: React.ReactNode;
}> = ({ id, label, value, onChange, children }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            {label}
        </label>
        <div className="relative">
            <select
                id={id}
                value={value}
                onChange={onChange}
                className="appearance-none w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] py-2.5 pl-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition sm:text-sm"
            >
                {children}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--color-text-secondary)]">
                <ChevronDownIcon className="w-5 h-5" />
            </div>
        </div>
    </div>
);


const FilterBar: React.FC<FilterBarProps> = ({
    selectedMatiere, onMatiereChange,
    selectedNiveau, onNiveauChange,
    selectedClasse, onClasseChange
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const keyNiveau = selectedNiveau as keyof typeof classes;
    const availableClasses = classes[keyNiveau] || [];

    const activeFiltersCount = [
        selectedMatiere !== 'Toutes les matières',
        selectedNiveau !== 'tous',
        selectedClasse !== 'toutes' && availableClasses.length > 0
    ].filter(Boolean).length;
    
    const getSummary = () => {
        if (activeFiltersCount === 0) {
            return 'Filtres';
        }
        const parts = [];
        if (selectedMatiere !== 'Toutes les matières') parts.push(selectedMatiere);
        if (selectedNiveau !== 'tous') parts.push(niveaux[selectedNiveau]);
        if (selectedClasse !== 'toutes' && availableClasses.length > 0) parts.push(selectedClasse);
        return parts.join(' / ');
    };


    return (
        <div className="relative mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls="filter-panel"
                className="w-full flex items-center justify-between bg-[var(--color-card-bg)] p-3 rounded-lg shadow-sm border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] focus:ring-[var(--color-accent)]"
            >
                <div className="flex items-center">
                    <FunnelIcon className="w-5 h-5 mr-3 text-[var(--color-text-secondary)]" />
                    <span className="font-semibold text-[var(--color-text-primary)] text-sm truncate pr-2">{getSummary()}</span>
                    {activeFiltersCount > 0 && (
                        <span className="ml-2 bg-[var(--color-accent)] text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                            {activeFiltersCount}
                        </span>
                    )}
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-[var(--color-text-secondary)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div
                id="filter-panel"
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
            >
                <div className="bg-[var(--color-card-bg)] p-4 rounded-lg shadow-md border border-[var(--color-border)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StyledSelect
                            id="matiere"
                            label="Matière"
                            value={selectedMatiere}
                            onChange={onMatiereChange}
                        >
                            {matieres.map(m => <option key={m} value={m}>{m}</option>)}
                        </StyledSelect>

                        <StyledSelect
                            id="niveau"
                            label="Niveau"
                            value={selectedNiveau}
                            onChange={onNiveauChange}
                        >
                            {Object.entries(niveaux).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                        </StyledSelect>

                        {availableClasses.length > 0 && (
                            <div className="col-span-1 md:col-span-2">
                                <StyledSelect
                                    id="classe"
                                    label="Classe / Année"
                                    value={selectedClasse}
                                    onChange={onClasseChange}
                                >
                                    <option value="toutes">Toutes les classes / années</option>
                                    {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                </StyledSelect>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;