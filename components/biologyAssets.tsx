import React from 'react';

const RespiratoryV1: React.FC<{ highlights: string[] }> = ({ highlights }) => {
  const isLungsHighlighted = highlights.includes('lungs');
  const highlightFill = 'var(--color-accent-light-bg)';
  const defaultFill = 'var(--color-bg-secondary)';
  const highlightStroke = 'var(--color-accent)';
  const defaultStroke = 'var(--color-text-secondary)';

  return (
    <svg viewBox="0 0 200 200" aria-labelledby="respiratory-title" role="img">
      <title id="respiratory-title">Diagramme simplifié du système respiratoire</title>
      <g id="trachea" stroke={defaultStroke} strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M100 20 V 60" />
      </g>
      <g id="bronchi" stroke={defaultStroke} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M100 60 L80 80" />
        <path d="M100 60 L120 80" />
      </g>
      <g id="lungs" fill={isLungsHighlighted ? highlightFill : defaultFill} stroke={isLungsHighlighted ? highlightStroke : defaultStroke} strokeWidth="2" strokeLinejoin="round">
        <path d="M80 80 C 30 100, 30 160, 80 180 L 95 180 L 95 100 Z" aria-label="Poumon gauche" />
        <path d="M120 80 C 170 100, 170 160, 120 180 L 105 180 L 105 100 Z" aria-label="Poumon droit" />
      </g>
    </svg>
  );
};

export const biologyAssets: { [key: string]: React.FC<{ highlights: string[] }> } = {
  respiratory_v1: RespiratoryV1,
};