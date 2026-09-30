import React from 'react';
import { useCountdown } from '../hooks/useCountdown';

interface CountdownProps {
  targetDate: Date;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate }) => {
  const { days, hours, minutes, seconds } = useCountdown(targetDate);

  const format = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex items-center space-x-1 text-sm font-semibold text-[var(--color-text-primary)]">
      <span className="font-bold text-lg text-[var(--color-accent)]">{format(days)}</span><span className="text-xs">j</span>
      <span className="font-bold text-lg text-[var(--color-accent)]">{format(hours)}</span><span className="text-xs">h</span>
      <span className="font-bold text-lg text-[var(--color-accent)]">{format(minutes)}</span><span className="text-xs">m</span>
      <span className="font-bold text-lg text-[var(--color-accent)]">{format(seconds)}</span><span className="text-xs">s</span>
    </div>
  );
};

export default Countdown;