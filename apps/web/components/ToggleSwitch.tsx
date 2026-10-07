import React from 'react';

interface ToggleSwitchProps {
  label: string;
  description: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, description, enabled, setEnabled }) => {
  return (
    <div
      onClick={() => setEnabled(!enabled)}
      className="flex justify-between items-center cursor-pointer p-4 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
    >
      <div>
        <p className="font-semibold text-[var(--color-text-primary)]">{label}</p>
        <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
      </div>
      <div className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-[var(--color-accent)]' : 'bg-gray-300 dark:bg-gray-600'}`}>
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </div>
    </div>
  );
};

export default ToggleSwitch;
