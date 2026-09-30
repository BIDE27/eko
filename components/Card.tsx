import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  borderColor?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', borderColor, ...props }) => {
  const borderClass = borderColor ? `border-t-4 ${borderColor}` : '';

  return (
    <div 
      className={`bg-[var(--color-card-bg)] rounded-lg shadow-md dark:shadow-lg dark:shadow-black/25 p-4 mb-4 w-full ${borderClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;